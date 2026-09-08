import { Alert } from "react-native";
import { useCallback, useEffect, useMemo, useState } from "react";

import type { GameState, RoomSession } from "../types";
import { createInitialGameState, normalizeGameState } from "../utils/gameState";
import { createId } from "../utils/id";
import { supabase, type RoomRow } from "../services/supabase";

const ROOM_QR_TYPE = "courtqueue-room";
const ROOM_CODE_ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
const GUEST_ROOM_EXISTENCE_CHECK_MS = 3000;

type SyncStatus = "idle" | "connecting" | "online" | "saving" | "error";

type RoomQrPayload = {
  type: typeof ROOM_QR_TYPE;
  code: string;
  password: string;
};

function createRoomCode(): string {
  return Array.from({ length: 6 }, () => {
    const index = Math.floor(Math.random() * ROOM_CODE_ALPHABET.length);
    return ROOM_CODE_ALPHABET[index] ?? "2";
  }).join("");
}

function createRoomPassword(): string {
  return String(Math.floor(1000 + Math.random() * 9000));
}

function normalizeRoomCode(code: string): string {
  return code.trim().replace(/\s+/g, "").toUpperCase();
}

function parseRoomQrPayload(value: string): RoomQrPayload | null {
  try {
    const parsed = JSON.parse(value) as Partial<RoomQrPayload>;

    if (
      parsed.type === ROOM_QR_TYPE &&
      typeof parsed.code === "string" &&
      typeof parsed.password === "string"
    ) {
      return {
        type: ROOM_QR_TYPE,
        code: normalizeRoomCode(parsed.code),
        password: parsed.password.trim(),
      };
    }
  } catch {
    return null;
  }

  return null;
}

function showSupabaseSetupAlert(): void {
  Alert.alert(
    "Supabase 설정 필요",
    "rooms 테이블이 아직 없을 수 있습니다. 프로젝트의 supabase/schema.sql 내용을 Supabase SQL Editor에서 먼저 실행해 주세요.",
  );
}

function showSupabaseError(title: string, message: string): void {
  Alert.alert(title, message);
}

function closeDeletedRoomForGuest(): void {
  setTimeout(() => {
    Alert.alert("방 종료", "호스트가 방을 종료했습니다.");
  }, 0);
}

export function useGameRoom() {
  const [session, setSession] = useState<RoomSession | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>("idle");
  const [isBusy, setIsBusy] = useState(false);

  const qrPayload = useMemo(() => {
    if (!session) {
      return "";
    }

    const payload: RoomQrPayload = {
      type: ROOM_QR_TYPE,
      code: session.code,
      password: session.password,
    };

    return JSON.stringify(payload);
  }, [session]);

  useEffect(() => {
    if (!session) {
      return;
    }

    setSyncStatus("connecting");

    const channel = supabase
      .channel(`courtqueue-room-${session.code}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "rooms",
          filter: `code=eq.${session.code}`,
        },
        (payload) => {
          if (payload.eventType === "DELETE") {
            setGameState(null);
            setSession(null);
            setSyncStatus("idle");

            if (session.role === "guest") {
              closeDeletedRoomForGuest();
            }

            return;
          }

          const nextRow = payload.new as RoomRow;
          setGameState(normalizeGameState(nextRow.state));
          setSyncStatus("online");
        },
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          setSyncStatus("online");
          return;
        }

        if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          setSyncStatus("error");
        }
      });

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [session]);

  useEffect(() => {
    if (!session || session.role !== "guest") {
      return;
    }

    let isActive = true;

    const checkRoomExists = async () => {
      const { data, error } = await supabase
        .from("rooms")
        .select("code")
        .eq("code", session.code)
        .eq("password", session.password)
        .maybeSingle();

      if (!isActive || error) {
        return;
      }

      if (!data) {
        setGameState(null);
        setSession(null);
        setSyncStatus("idle");
        closeDeletedRoomForGuest();
      }
    };

    const intervalId = setInterval(
      checkRoomExists,
      GUEST_ROOM_EXISTENCE_CHECK_MS,
    );

    return () => {
      isActive = false;
      clearInterval(intervalId);
    };
  }, [session]);

  const hostRoom = useCallback(async () => {
    setIsBusy(true);
    setSyncStatus("connecting");

    for (let attempt = 0; attempt < 5; attempt += 1) {
      const code = createRoomCode();
      const password = createRoomPassword();
      const hostToken = createId("host");
      const initialState = createInitialGameState();
      const { data, error } = await supabase
        .from("rooms")
        .insert({
          code,
          password,
          host_token: hostToken,
          state: initialState,
        })
        .select()
        .single();

      if (error?.code === "23505") {
        continue;
      }

      if (error) {
        setIsBusy(false);
        setSyncStatus("error");

        if (error.code === "42P01") {
          showSupabaseSetupAlert();
          return;
        }

        showSupabaseError("방 생성 실패", error.message);
        return;
      }

      setGameState(normalizeGameState(data.state));
      setSession({
        code,
        password,
        role: "host",
        hostToken,
      });
      setIsBusy(false);
      return;
    }

    setIsBusy(false);
    setSyncStatus("error");
    Alert.alert("방 생성 실패", "방 코드를 만들지 못했습니다. 다시 시도해 주세요.");
  }, []);

  const joinRoom = useCallback(async (roomCode: string, roomPassword: string) => {
    const code = normalizeRoomCode(roomCode);
    const password = roomPassword.trim();

    if (!code || !password) {
      Alert.alert("게임 참가", "방 코드와 비밀번호를 입력해 주세요.");
      return;
    }

    setIsBusy(true);
    setSyncStatus("connecting");

    const { data, error } = await supabase
      .from("rooms")
      .select()
      .eq("code", code)
      .eq("password", password)
      .maybeSingle();

    setIsBusy(false);

    if (error) {
      setSyncStatus("error");

      if (error.code === "42P01") {
        showSupabaseSetupAlert();
        return;
      }

      showSupabaseError("게임 참가 실패", error.message);
      return;
    }

    if (!data) {
      setSyncStatus("idle");
      Alert.alert("게임 참가", "방 코드나 비밀번호가 맞지 않습니다.");
      return;
    }

    setGameState(normalizeGameState(data.state));
    setSession({
      code: data.code,
      password: data.password,
      role: "guest",
    });
  }, []);

  const joinRoomFromQr = useCallback(
    async (value: string) => {
      const parsedPayload = parseRoomQrPayload(value);

      if (!parsedPayload) {
        Alert.alert("QR 코드", "코트큐 방 QR 코드가 아닙니다.");
        return;
      }

      await joinRoom(parsedPayload.code, parsedPayload.password);
    },
    [joinRoom],
  );

  const saveGameState = useCallback(
    (nextState: GameState) => {
      if (!session) {
        return;
      }

      const normalizedState = normalizeGameState(nextState);
      setSyncStatus("saving");

      void supabase
        .from("rooms")
        .update({
          state: normalizedState,
          updated_at: new Date().toISOString(),
        })
        .eq("code", session.code)
        .then(({ error }) => {
          if (error) {
            setSyncStatus("error");
            showSupabaseError("동기화 실패", error.message);
            return;
          }

          setSyncStatus("online");
        });
    },
    [session],
  );

  const leaveRoom = useCallback(async () => {
    const currentSession = session;

    if (!currentSession) {
      return;
    }

    if (currentSession.role === "host") {
      if (!currentSession.hostToken) {
        Alert.alert("방 종료", "호스트 권한 정보를 찾을 수 없습니다.");
        return;
      }

      setIsBusy(true);

      const { data: wasDeleted, error } = await supabase.rpc("delete_room", {
        room_code: currentSession.code,
        room_host_token: currentSession.hostToken,
      });

      setIsBusy(false);

      if (error) {
        setSyncStatus("error");

        if (error.code === "42883" || error.code === "42P01") {
          showSupabaseSetupAlert();
          return;
        }

        showSupabaseError("방 종료 실패", error.message);
        return;
      }

      if (wasDeleted !== true) {
        setSyncStatus("error");
        Alert.alert(
          "방 종료 실패",
          "DB에서 방이 삭제되지 않았습니다. Supabase SQL을 최신 버전으로 다시 실행한 뒤 시도해 주세요.",
        );
        return;
      }
    }

    setSession(null);
    setGameState(null);
    setSyncStatus("idle");
  }, [session]);

  return {
    session,
    gameState,
    qrPayload,
    syncStatus,
    isBusy,
    hostRoom,
    joinRoom,
    joinRoomFromQr,
    saveGameState,
    leaveRoom,
  };
}

import { Alert } from "react-native";
import * as Speech from "expo-speech";
import { useEffect, useMemo, useRef, useState } from "react";

import type { GameState, Player, PlayerStatus, Team } from "../types";
import {
  createCourt,
  createInitialGameState,
  normalizeGameState,
  renumberWaitingTeams,
} from "../utils/gameState";
import { createId } from "../utils/id";

const TEAM_SIZE = 4;

type UseBadmintonCourtManagerOptions = {
  remoteState?: GameState | null;
  onGameStateChange?: (state: GameState) => void;
};

function hasDuplicateIds(ids: string[]): boolean {
  return new Set(ids).size !== ids.length;
}

function announceCourtAssignment(team: Team, courtNumber: number): void {
  const playerNames = team.players.map((player) => player.name).join(", ");
  const message = `${playerNames} ${courtNumber}번째 코트 들어가세요`;

  Speech.speak(message, {
    language: "ko-KR",
    pitch: 1,
    rate: 0.92,
  });
}

export function useBadmintonCourtManager({
  remoteState,
  onGameStateChange,
}: UseBadmintonCourtManagerOptions = {}) {
  const [gameState, setGameState] = useState<GameState>(() =>
    normalizeGameState(remoteState ?? createInitialGameState()),
  );
  const gameStateRef = useRef(gameState);
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<string[]>([]);
  const [selectedCourtByTeam, setSelectedCourtByTeamState] = useState<
    Record<string, string>
  >({});

  const { players, waitingTeams, courts } = gameState;

  useEffect(() => {
    if (!remoteState) {
      return;
    }

    const nextState = normalizeGameState(remoteState);
    gameStateRef.current = nextState;
    setGameState(nextState);
  }, [remoteState]);

  const playingPlayerIds = useMemo(() => {
    const ids = new Set<string>();
    courts.forEach((court) => {
      court.currentTeam?.players.forEach((player) => ids.add(player.id));
    });
    return ids;
  }, [courts]);

  const waitingPlayerIds = useMemo(() => {
    const ids = new Set<string>();
    waitingTeams.forEach((team) => {
      team.players.forEach((player) => ids.add(player.id));
    });
    return ids;
  }, [waitingTeams]);

  const selectedPlayerIdSet = useMemo(
    () => new Set(selectedPlayerIds),
    [selectedPlayerIds],
  );

  const emptyCourts = useMemo(
    () => courts.filter((court) => court.currentTeam === null),
    [courts],
  );

  useEffect(() => {
    const availablePlayerIds = new Set(players.map((player) => player.id));
    const unavailablePlayerIds = new Set([
      ...Array.from(waitingPlayerIds),
      ...Array.from(playingPlayerIds),
    ]);
    const waitingTeamIds = new Set(waitingTeams.map((team) => team.id));
    const emptyCourtIds = new Set(emptyCourts.map((court) => court.id));

    setSelectedPlayerIds((currentIds) =>
      currentIds.filter(
        (playerId) =>
          availablePlayerIds.has(playerId) && !unavailablePlayerIds.has(playerId),
      ),
    );
    setSelectedCourtByTeamState((currentMap) =>
      Object.fromEntries(
        Object.entries(currentMap).filter(
          ([teamId, courtId]) =>
            waitingTeamIds.has(teamId) && emptyCourtIds.has(courtId),
        ),
      ),
    );
  }, [emptyCourts, players, playingPlayerIds, waitingPlayerIds, waitingTeams]);

  const updateGameState = (updater: (currentState: GameState) => GameState) => {
    const nextState = normalizeGameState(updater(gameStateRef.current));
    gameStateRef.current = nextState;
    setGameState(nextState);
    onGameStateChange?.(nextState);
  };

  const getPlayerStatus = (playerId: string): PlayerStatus => {
    if (playingPlayerIds.has(playerId)) {
      return "playing";
    }

    if (waitingPlayerIds.has(playerId)) {
      return "waiting";
    }

    if (selectedPlayerIdSet.has(playerId)) {
      return "selected";
    }

    return "available";
  };

  const getPlayersByIds = (playerIds: string[]): Player[] | null => {
    const playerMap = new Map(players.map((player) => [player.id, player]));
    const nextPlayers = playerIds
      .map((playerId) => playerMap.get(playerId))
      .filter((player): player is Player => Boolean(player));

    if (nextPlayers.length !== playerIds.length) {
      Alert.alert("선수 확인", "선수 정보를 찾을 수 없습니다.");
      return null;
    }

    return nextPlayers;
  };

  const getBlockedPlayerIdsForEdit = (
    currentTarget:
      | { type: "waiting"; teamId: string }
      | { type: "court"; courtId: string },
  ) => {
    const blockedIds = new Set<string>();

    waitingTeams.forEach((team) => {
      const isCurrentWaitingTeam =
        currentTarget.type === "waiting" && team.id === currentTarget.teamId;

      if (!isCurrentWaitingTeam) {
        team.players.forEach((player) => blockedIds.add(player.id));
      }
    });

    courts.forEach((court) => {
      const isCurrentCourtTeam =
        currentTarget.type === "court" && court.id === currentTarget.courtId;

      if (!isCurrentCourtTeam) {
        court.currentTeam?.players.forEach((player) => blockedIds.add(player.id));
      }
    });

    return blockedIds;
  };

  const validateTeamEdit = (
    newPlayerIds: string[],
    currentTarget:
      | { type: "waiting"; teamId: string }
      | { type: "court"; courtId: string },
  ): Player[] | null => {
    if (newPlayerIds.length !== TEAM_SIZE) {
      Alert.alert("팀 수정", "팀은 반드시 4명이어야 합니다.");
      return null;
    }

    if (hasDuplicateIds(newPlayerIds)) {
      Alert.alert("팀 수정", "같은 선수를 중복으로 넣을 수 없습니다.");
      return null;
    }

    const blockedIds = getBlockedPlayerIdsForEdit(currentTarget);
    const blockedPlayer = newPlayerIds.find((playerId) =>
      blockedIds.has(playerId),
    );

    if (blockedPlayer) {
      Alert.alert(
        "팀 수정",
        "이미 다른 대기 팀이나 게임 중인 코트에 포함된 선수입니다.",
      );
      return null;
    }

    return getPlayersByIds(newPlayerIds);
  };

  const addPlayers = (inputText: string): void => {
    const names = inputText
      .trim()
      .split(/\s+/)
      .map((name) => name.trim())
      .filter(Boolean);

    if (names.length === 0) {
      Alert.alert("참석자 추가", "이름을 입력해 주세요.");
      return;
    }

    const existingNames = new Set(players.map((player) => player.name));
    const batchNames = new Set<string>();
    const duplicateNames: string[] = [];
    const newPlayers: Player[] = [];

    names.forEach((name) => {
      if (existingNames.has(name) || batchNames.has(name)) {
        duplicateNames.push(name);
        return;
      }

      batchNames.add(name);
      newPlayers.push({
        id: createId("player"),
        name,
      });
    });

    if (newPlayers.length === 0) {
      Alert.alert("참석자 추가", "이미 존재하는 이름입니다.");
      return;
    }

    updateGameState((currentState) => ({
      ...currentState,
      players: [...currentState.players, ...newPlayers],
    }));

    if (duplicateNames.length > 0) {
      Alert.alert("참석자 추가", "중복 이름은 제외했습니다.");
    }
  };

  const removePlayer = (playerId: string): void => {
    if (waitingPlayerIds.has(playerId) || playingPlayerIds.has(playerId)) {
      Alert.alert("참석자 삭제", "이미 팀에 포함된 선수는 삭제할 수 없습니다.");
      return;
    }

    updateGameState((currentState) => ({
      ...currentState,
      players: currentState.players.filter((player) => player.id !== playerId),
    }));
    setSelectedPlayerIds((currentIds) =>
      currentIds.filter((selectedId) => selectedId !== playerId),
    );
  };

  const confirmRemovePlayer = (playerId: string): void => {
    const player = players.find((currentPlayer) => currentPlayer.id === playerId);

    if (!player) {
      Alert.alert("참석자 삭제", "참석자를 찾을 수 없습니다.");
      return;
    }

    Alert.alert("참석자 삭제", `${player.name}님을 삭제할까요?`, [
      { text: "취소", style: "cancel" },
      {
        text: "삭제",
        style: "destructive",
        onPress: () => removePlayer(playerId),
      },
    ]);
  };

  const toggleSelectPlayer = (playerId: string): void => {
    const status = getPlayerStatus(playerId);

    if (status === "waiting" || status === "playing") {
      Alert.alert(
        "선수 선택",
        "대기 중이거나 게임 중인 선수는 선택할 수 없습니다.",
      );
      return;
    }

    setSelectedPlayerIds((currentIds) => {
      if (currentIds.includes(playerId)) {
        return currentIds.filter((selectedId) => selectedId !== playerId);
      }

      if (currentIds.length >= TEAM_SIZE) {
        Alert.alert("선수 선택", "4명을 초과해서 선택할 수 없습니다.");
        return currentIds;
      }

      return [...currentIds, playerId];
    });
  };

  const addSelectedPlayersToWaitingQueue = (): void => {
    if (selectedPlayerIds.length !== TEAM_SIZE) {
      Alert.alert("대기열 추가", "정확히 4명을 선택해야 합니다.");
      return;
    }

    const selectedPlayers = getPlayersByIds(selectedPlayerIds);

    if (!selectedPlayers) {
      return;
    }

    const unavailablePlayer = selectedPlayers.find((player) => {
      const status = getPlayerStatus(player.id);
      return status === "waiting" || status === "playing";
    });

    if (unavailablePlayer) {
      Alert.alert(
        "대기열 추가",
        "대기 중이거나 게임 중인 선수가 포함되어 있습니다.",
      );
      return;
    }

    const team: Team = {
      id: createId("team"),
      name: "",
      order: 0,
      players: selectedPlayers,
    };

    updateGameState((currentState) => ({
      ...currentState,
      waitingTeams: renumberWaitingTeams([...currentState.waitingTeams, team]),
    }));
    setSelectedPlayerIds([]);
  };

  const deleteWaitingTeam = (teamId: string): void => {
    updateGameState((currentState) => ({
      ...currentState,
      waitingTeams: renumberWaitingTeams(
        currentState.waitingTeams.filter((team) => team.id !== teamId),
      ),
    }));
    setSelectedCourtByTeamState((currentMap) => {
      const nextMap = { ...currentMap };
      delete nextMap[teamId];
      return nextMap;
    });
  };

  const confirmDeleteWaitingTeam = (teamId: string): void => {
    const team = waitingTeams.find((waitingTeam) => waitingTeam.id === teamId);

    if (!team) {
      Alert.alert("대기 팀 삭제", "대기 팀을 찾을 수 없습니다.");
      return;
    }

    Alert.alert("대기 팀 삭제", `${team.name}를 삭제할까요?`, [
      { text: "취소", style: "cancel" },
      {
        text: "삭제",
        style: "destructive",
        onPress: () => deleteWaitingTeam(teamId),
      },
    ]);
  };

  const setSelectedCourtForTeam = (teamId: string, courtId: string): void => {
    setSelectedCourtByTeamState((currentMap) => ({
      ...currentMap,
      [teamId]: courtId,
    }));
  };

  const assignTeamToCourt = (teamId: string, courtId: string): void => {
    const team = waitingTeams.find((waitingTeam) => waitingTeam.id === teamId);
    const court = courts.find((currentCourt) => currentCourt.id === courtId);

    if (!team) {
      Alert.alert("코트 배정", "대기 팀을 찾을 수 없습니다.");
      return;
    }

    if (!court) {
      Alert.alert("코트 배정", "코트를 찾을 수 없습니다.");
      return;
    }

    if (court.currentTeam) {
      Alert.alert("코트 배정", "이미 게임 중인 코트에는 배정할 수 없습니다.");
      return;
    }

    updateGameState((currentState) => ({
      ...currentState,
      courts: currentState.courts.map((currentCourt) =>
        currentCourt.id === courtId
          ? { ...currentCourt, currentTeam: team, gameStartedAt: Date.now() }
          : currentCourt,
      ),
      waitingTeams: renumberWaitingTeams(
        currentState.waitingTeams.filter(
          (waitingTeam) => waitingTeam.id !== teamId,
        ),
      ),
    }));
    setSelectedCourtByTeamState((currentMap) => {
      const nextMap = { ...currentMap };
      delete nextMap[teamId];
      return nextMap;
    });
    announceCourtAssignment(team, court.number);
  };

  const getAutomaticNextTeamForFinish = (): Team | null => {
    const areAllCourtsPlaying = courts.every(
      (currentCourt) => currentCourt.currentTeam !== null,
    );

    if (!areAllCourtsPlaying) {
      return null;
    }

    return waitingTeams[0] ?? null;
  };

  const finishGame = (courtId: string): void => {
    const court = courts.find((currentCourt) => currentCourt.id === courtId);

    if (!court?.currentTeam) {
      Alert.alert("게임 종료", "비어 있는 코트입니다.");
      return;
    }

    const nextTeam = getAutomaticNextTeamForFinish();
    const nextGameStartedAt = nextTeam ? Date.now() : null;

    updateGameState((currentState) => ({
      ...currentState,
      courts: currentState.courts.map((currentCourt) =>
        currentCourt.id === courtId
          ? {
              ...currentCourt,
              currentTeam: nextTeam,
              gameStartedAt: nextGameStartedAt,
            }
          : currentCourt,
      ),
      waitingTeams: nextTeam
        ? renumberWaitingTeams(
            currentState.waitingTeams.filter(
              (waitingTeam) => waitingTeam.id !== nextTeam.id,
            ),
          )
        : currentState.waitingTeams,
    }));

    if (nextTeam) {
      setSelectedCourtByTeamState((currentMap) => {
        const nextMap = { ...currentMap };
        delete nextMap[nextTeam.id];
        return nextMap;
      });
      announceCourtAssignment(nextTeam, court.number);
    }
  };

  const confirmFinishGame = (courtId: string): void => {
    const court = courts.find((currentCourt) => currentCourt.id === courtId);

    if (!court?.currentTeam) {
      Alert.alert("게임 종료", "비어 있는 코트입니다.");
      return;
    }

    const nextTeam = getAutomaticNextTeamForFinish();
    const message = nextTeam
      ? `정말 게임을 종료할까요?\n종료하면 ${nextTeam.name}이 자동으로 들어갑니다.`
      : "정말 게임을 종료할까요?";

    Alert.alert("게임 종료", message, [
      { text: "취소", style: "cancel" },
      {
        text: "종료",
        style: "destructive",
        onPress: () => finishGame(courtId),
      },
    ]);
  };

  const returnCourtTeamToWaitingQueue = (courtId: string): void => {
    const court = courts.find((currentCourt) => currentCourt.id === courtId);

    if (!court?.currentTeam) {
      Alert.alert("대기열로 내리기", "비어 있는 코트입니다.");
      return;
    }

    const team = court.currentTeam;

    updateGameState((currentState) => ({
      ...currentState,
      waitingTeams: renumberWaitingTeams([...currentState.waitingTeams, team]),
      courts: currentState.courts.map((currentCourt) =>
        currentCourt.id === courtId
          ? { ...currentCourt, currentTeam: null, gameStartedAt: null }
          : currentCourt,
      ),
    }));
  };

  const updateWaitingTeamPlayers = (
    teamId: string,
    newPlayerIds: string[],
  ): void => {
    const team = waitingTeams.find((waitingTeam) => waitingTeam.id === teamId);

    if (!team) {
      Alert.alert("팀 수정", "대기 팀을 찾을 수 없습니다.");
      return;
    }

    const nextPlayers = validateTeamEdit(newPlayerIds, {
      type: "waiting",
      teamId,
    });

    if (!nextPlayers) {
      return;
    }

    updateGameState((currentState) => ({
      ...currentState,
      waitingTeams: renumberWaitingTeams(
        currentState.waitingTeams.map((waitingTeam) =>
          waitingTeam.id === teamId
            ? { ...waitingTeam, players: nextPlayers }
            : waitingTeam,
        ),
      ),
    }));
    setSelectedPlayerIds((currentIds) =>
      currentIds.filter((playerId) => !newPlayerIds.includes(playerId)),
    );
  };

  const updateCourtTeamPlayers = (
    courtId: string,
    newPlayerIds: string[],
  ): void => {
    const court = courts.find((currentCourt) => currentCourt.id === courtId);

    if (!court?.currentTeam) {
      Alert.alert("팀 수정", "게임 중인 코트가 아닙니다.");
      return;
    }

    const nextPlayers = validateTeamEdit(newPlayerIds, {
      type: "court",
      courtId,
    });

    if (!nextPlayers) {
      return;
    }

    updateGameState((currentState) => ({
      ...currentState,
      courts: currentState.courts.map((currentCourt) =>
        currentCourt.id === courtId && currentCourt.currentTeam
          ? {
              ...currentCourt,
              currentTeam: {
                ...currentCourt.currentTeam,
                players: nextPlayers,
              },
            }
          : currentCourt,
      ),
    }));
    setSelectedPlayerIds((currentIds) =>
      currentIds.filter((playerId) => !newPlayerIds.includes(playerId)),
    );
  };

  const updateCourtCount = (count: number): void => {
    if (count < 1) {
      Alert.alert("코트 설정", "코트는 최소 1개 이상이어야 합니다.");
      return;
    }

    if (count === courts.length) {
      return;
    }

    if (count > courts.length) {
      updateGameState((currentState) => ({
        ...currentState,
        courts: [
          ...currentState.courts,
          ...Array.from(
            { length: count - currentState.courts.length },
            (_, index) => createCourt(currentState.courts.length + index + 1),
          ),
        ],
      }));
      return;
    }

    const courtsToRemove = courts.slice(count);
    const hasPlayingCourt = courtsToRemove.some((court) => court.currentTeam);

    if (hasPlayingCourt) {
      Alert.alert("코트 설정", "게임 중인 코트가 있어서 줄일 수 없습니다.");
      return;
    }

    updateGameState((currentState) => ({
      ...currentState,
      courts: currentState.courts.slice(0, count),
    }));
  };

  return {
    players,
    waitingTeams,
    courts,
    emptyCourts,
    selectedPlayerIds,
    selectedCourtByTeam,
    addPlayers,
    removePlayer,
    confirmRemovePlayer,
    getPlayerStatus,
    toggleSelectPlayer,
    addSelectedPlayersToWaitingQueue,
    deleteWaitingTeam,
    confirmDeleteWaitingTeam,
    setSelectedCourtForTeam,
    assignTeamToCourt,
    finishGame,
    confirmFinishGame,
    returnCourtTeamToWaitingQueue,
    updateWaitingTeamPlayers,
    updateCourtTeamPlayers,
    updateCourtCount,
  };
}

export type BadmintonCourtManager = ReturnType<
  typeof useBadmintonCourtManager
>;

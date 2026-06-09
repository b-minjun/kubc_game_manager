import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import type { Player, PlayerStatus } from "../types";

type TeamEditModalProps = {
  visible: boolean;
  title: string;
  players: Player[];
  initialPlayerIds: string[];
  getPlayerStatus: (playerId: string) => PlayerStatus;
  onClose: () => void;
  onSave: (playerIds: string[]) => void;
};

const statusLabel: Record<PlayerStatus, string> = {
  available: "가능",
  selected: "선택",
  waiting: "대기",
  playing: "게임",
};

export function TeamEditModal({
  visible,
  title,
  players,
  initialPlayerIds,
  getPlayerStatus,
  onClose,
  onSave,
}: TeamEditModalProps) {
  const [draftPlayerIds, setDraftPlayerIds] = useState<string[]>([]);
  const initialKey = initialPlayerIds.join("|");

  useEffect(() => {
    if (visible) {
      setDraftPlayerIds(initialPlayerIds);
    }
  }, [visible, initialKey]);

  const originalPlayerIdSet = useMemo(
    () => new Set(initialPlayerIds),
    [initialKey],
  );
  const draftPlayerIdSet = useMemo(
    () => new Set(draftPlayerIds),
    [draftPlayerIds],
  );

  const toggleDraftPlayer = (player: Player) => {
    const isDraftSelected = draftPlayerIdSet.has(player.id);
    const status = getPlayerStatus(player.id);
    const isBlockedByOtherTeam =
      (status === "waiting" || status === "playing") &&
      !originalPlayerIdSet.has(player.id);

    if (isBlockedByOtherTeam) {
      Alert.alert(
        "팀 수정",
        "이미 다른 대기 팀이나 게임 중인 코트에 포함된 선수입니다.",
      );
      return;
    }

    if (isDraftSelected) {
      setDraftPlayerIds((currentIds) =>
        currentIds.filter((playerId) => playerId !== player.id),
      );
      return;
    }

    if (draftPlayerIds.length >= 4) {
      Alert.alert("팀 수정", "팀은 4명까지만 선택할 수 있습니다.");
      return;
    }

    setDraftPlayerIds((currentIds) => [...currentIds, player.id]);
  };

  const handleSave = () => {
    if (draftPlayerIds.length !== 4) {
      Alert.alert("팀 수정", "팀은 반드시 4명이어야 합니다.");
      return;
    }

    onSave(draftPlayerIds);
    onClose();
  };

  return (
    <Modal
      animationType="slide"
      onRequestClose={onClose}
      transparent
      visible={visible}
    >
      <View style={styles.backdrop}>
        <View style={styles.modalCard}>
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.title}>{title}</Text>
              <Text style={styles.countText}>
                현재 선택: {draftPlayerIds.length} / 4
              </Text>
            </View>
            <Pressable onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>닫기</Text>
            </Pressable>
          </View>

          <ScrollView
            contentContainerStyle={styles.playerGrid}
            keyboardShouldPersistTaps="handled"
          >
            {players.map((player) => {
              const status = getPlayerStatus(player.id);
              const isDraftSelected = draftPlayerIdSet.has(player.id);
              const isOriginalPlayer = originalPlayerIdSet.has(player.id);
              const isBlocked =
                (status === "waiting" || status === "playing") &&
                !isOriginalPlayer;

              return (
                <Pressable
                  key={player.id}
                  onPress={() => toggleDraftPlayer(player)}
                  style={[
                    styles.playerChip,
                    status === "available" && styles.availableChip,
                    status === "selected" && styles.selectedElsewhereChip,
                    (status === "waiting" || status === "playing") &&
                      styles.unavailableChip,
                    isDraftSelected && styles.draftSelectedChip,
                    isBlocked && styles.blockedChip,
                  ]}
                >
                  <Text
                    numberOfLines={1}
                    style={[
                      styles.playerName,
                      isBlocked && styles.blockedText,
                      isDraftSelected && styles.draftSelectedText,
                    ]}
                  >
                    {player.name}
                  </Text>
                  <Text
                    style={[
                      styles.statusBadge,
                      isDraftSelected && styles.draftBadge,
                    ]}
                  >
                    {isDraftSelected ? "수정" : statusLabel[status]}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          <View style={styles.footerRow}>
            <Pressable onPress={onClose} style={styles.secondaryButton}>
              <Text style={styles.secondaryButtonText}>취소</Text>
            </Pressable>
            <Pressable onPress={handleSave} style={styles.primaryButton}>
              <Text style={styles.primaryButtonText}>저장</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: "center",
    padding: 18,
    backgroundColor: "rgba(15, 23, 42, 0.45)",
  },
  modalCard: {
    maxHeight: "86%",
    borderRadius: 8,
    backgroundColor: "#ffffff",
    padding: 16,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: "800",
    color: "#111827",
  },
  countText: {
    marginTop: 4,
    fontSize: 14,
    color: "#475569",
  },
  closeButton: {
    minHeight: 42,
    justifyContent: "center",
    borderRadius: 8,
    paddingHorizontal: 14,
    backgroundColor: "#e5e7eb",
  },
  closeButtonText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111827",
  },
  playerGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    paddingVertical: 4,
  },
  playerChip: {
    minHeight: 48,
    minWidth: 132,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    borderWidth: 2,
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  availableChip: {
    borderColor: "#86efac",
    backgroundColor: "#dcfce7",
  },
  selectedElsewhereChip: {
    borderColor: "#93c5fd",
    backgroundColor: "#dbeafe",
  },
  unavailableChip: {
    borderColor: "#fecaca",
    backgroundColor: "#fee2e2",
  },
  draftSelectedChip: {
    borderColor: "#2563eb",
    backgroundColor: "#eff6ff",
  },
  blockedChip: {
    opacity: 0.68,
  },
  playerName: {
    flex: 1,
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
  },
  blockedText: {
    color: "#7f1d1d",
  },
  draftSelectedText: {
    color: "#1d4ed8",
  },
  statusBadge: {
    overflow: "hidden",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: "rgba(255, 255, 255, 0.75)",
    fontSize: 12,
    fontWeight: "800",
    color: "#334155",
  },
  draftBadge: {
    backgroundColor: "#2563eb",
    color: "#ffffff",
  },
  footerRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 14,
  },
  secondaryButton: {
    minHeight: 48,
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    backgroundColor: "#e5e7eb",
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: "800",
    color: "#111827",
  },
  primaryButton: {
    minHeight: 48,
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    backgroundColor: "#2563eb",
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: "800",
    color: "#ffffff",
  },
});

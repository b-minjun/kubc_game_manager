import { useRef, useState } from "react";
import {
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import type { BadmintonCourtManager } from "../hooks/useBadmintonCourtManager";
import type { PlayerStatus } from "../types";

type PlayerSectionProps = {
  manager: BadmintonCourtManager;
  canAddWaitingTeams?: boolean;
  canRemovePlayers?: boolean;
};

const statusLabel: Record<PlayerStatus, string> = {
  available: "가능",
  selected: "선택",
  waiting: "대기",
  playing: "게임",
};

export function PlayerSection({
  manager,
  canAddWaitingTeams = true,
  canRemovePlayers = true,
}: PlayerSectionProps) {
  const [inputText, setInputText] = useState("");
  const ignoreNextPressRef = useRef(false);

  const handleAddPlayers = () => {
    if (!canAddWaitingTeams) {
      return;
    }

    manager.addPlayers(inputText);
    setInputText("");
  };

  const showPlayerOptions = (playerId: string, playerName: string) => {
    ignoreNextPressRef.current = true;
    Alert.alert(playerName, "작업을 선택해 주세요.", [
      { text: "취소", style: "cancel" },
      {
        text: "삭제",
        style: "destructive",
        onPress: () => manager.confirmRemovePlayer(playerId),
      },
    ]);
  };

  const handlePlayerPress = (playerId: string) => {
    if (!canAddWaitingTeams) {
      return;
    }

    if (ignoreNextPressRef.current) {
      ignoreNextPressRef.current = false;
      return;
    }

    manager.toggleSelectPlayer(playerId);
  };

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>참석자 추가</Text>
      <View style={styles.inputRow}>
        <TextInput
          editable={canAddWaitingTeams}
          onChangeText={setInputText}
          onSubmitEditing={handleAddPlayers}
          placeholder="민준 현선 철수 영희"
          placeholderTextColor="#94a3b8"
          returnKeyType="done"
          style={styles.input}
          value={inputText}
        />
        <Pressable
          disabled={!canAddWaitingTeams}
          onPress={handleAddPlayers}
          style={[styles.addButton, !canAddWaitingTeams && styles.disabledButton]}
        >
          <Text style={styles.addButtonText}>추가</Text>
        </Pressable>
      </View>

      <View style={styles.subHeaderRow}>
        <Text style={styles.subTitle}>참석자 목록</Text>
        <Text style={styles.selectedCount}>
          현재 선택: {manager.selectedPlayerIds.length} / 4
        </Text>
      </View>

      {manager.players.length === 0 ? (
        <Text style={styles.emptyText}>참석자를 입력해 주세요.</Text>
      ) : (
        <View style={styles.playerGrid}>
          {manager.players.map((player) => {
            const status = manager.getPlayerStatus(player.id);
            const isLocked = status === "waiting" || status === "playing";

            return (
              <Pressable
                key={player.id}
                delayLongPress={450}
                onLongPress={() => {
                  if (canRemovePlayers) {
                    showPlayerOptions(player.id, player.name);
                  }
                }}
                onPress={() => handlePlayerPress(player.id)}
                style={[
                  styles.playerItem,
                  status === "available" && styles.availableItem,
                  status === "selected" && styles.selectedItem,
                  isLocked && styles.unavailableItem,
                ]}
              >
                <Text numberOfLines={1} style={styles.playerName}>
                  {player.name}
                </Text>
                <Text
                  style={[
                    styles.statusBadge,
                    status === "selected" && styles.selectedBadge,
                    isLocked && styles.unavailableBadge,
                  ]}
                >
                  {statusLabel[status]}
                </Text>
              </Pressable>
            );
          })}
        </View>
      )}

      <Pressable
        disabled={!canAddWaitingTeams || manager.selectedPlayerIds.length !== 4}
        onPress={manager.addSelectedPlayersToWaitingQueue}
        style={[
          styles.queueButton,
          manager.selectedPlayerIds.length !== 4 && styles.disabledButton,
          !canAddWaitingTeams && styles.disabledButton,
        ]}
      >
        <Text style={styles.queueButtonText}>대기열 추가</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    borderRadius: 8,
    padding: 16,
    backgroundColor: "#ffffff",
    borderWidth: 2,
    borderTopWidth: 7,
    borderColor: "#94a3b8",
    borderTopColor: "#16a34a",
    elevation: 4,
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#111827",
  },
  inputRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 12,
  },
  input: {
    minHeight: 50,
    flex: 1,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 8,
    paddingHorizontal: 14,
    backgroundColor: "#f8fafc",
    fontSize: 16,
    color: "#111827",
  },
  addButton: {
    minHeight: 50,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    paddingHorizontal: 18,
    backgroundColor: "#2563eb",
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: "800",
    color: "#ffffff",
  },
  subHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    marginTop: 18,
    marginBottom: 10,
  },
  subTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#111827",
  },
  selectedCount: {
    fontSize: 15,
    fontWeight: "800",
    color: "#2563eb",
  },
  emptyText: {
    paddingVertical: 14,
    color: "#64748b",
    fontSize: 15,
  },
  playerGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  playerItem: {
    minHeight: 54,
    width: "48%",
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    borderWidth: 2,
    borderRadius: 8,
    paddingHorizontal: 10,
  },
  availableItem: {
    borderColor: "#86efac",
    backgroundColor: "#dcfce7",
  },
  selectedItem: {
    borderColor: "#2563eb",
    backgroundColor: "#eff6ff",
  },
  unavailableItem: {
    borderColor: "#fecaca",
    backgroundColor: "#fee2e2",
  },
  playerName: {
    flex: 1,
    fontSize: 15,
    fontWeight: "800",
    color: "#111827",
  },
  statusBadge: {
    overflow: "hidden",
    flexShrink: 0,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: "rgba(255, 255, 255, 0.76)",
    fontSize: 12,
    fontWeight: "800",
    color: "#166534",
  },
  selectedBadge: {
    backgroundColor: "#2563eb",
    color: "#ffffff",
  },
  unavailableBadge: {
    color: "#991b1b",
  },
  queueButton: {
    minHeight: 52,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    marginTop: 14,
    backgroundColor: "#16a34a",
  },
  disabledButton: {
    backgroundColor: "#94a3b8",
  },
  queueButtonText: {
    fontSize: 17,
    fontWeight: "900",
    color: "#ffffff",
  },
});

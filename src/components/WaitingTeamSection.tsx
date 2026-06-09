import { useMemo, useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import type { BadmintonCourtManager } from "../hooks/useBadmintonCourtManager";
import type { Team } from "../types";
import { TeamEditModal } from "./TeamEditModal";

type WaitingTeamSectionProps = {
  manager: BadmintonCourtManager;
  maxListHeight?: number;
};

function playerNames(team: Team): string {
  return team.players.map((player) => player.name).join(" / ");
}

export function WaitingTeamSection({
  manager,
  maxListHeight,
}: WaitingTeamSectionProps) {
  const [editingTeamId, setEditingTeamId] = useState<string | null>(null);

  const editingTeam = useMemo(
    () => manager.waitingTeams.find((team) => team.id === editingTeamId),
    [editingTeamId, manager.waitingTeams],
  );

  const handleAssign = (teamId: string) => {
    const selectedCourtId = manager.selectedCourtByTeam[teamId];

    if (!selectedCourtId) {
      Alert.alert("코트 배정", "배정할 빈 코트를 선택해 주세요.");
      return;
    }

    manager.assignTeamToCourt(teamId, selectedCourtId);
  };

  return (
    <View style={styles.section}>
      <View style={styles.headerRow}>
        <Text style={styles.sectionTitle}>대기 팀 목록</Text>
        <Text style={styles.helperText}>번호는 현재 대기 순서입니다.</Text>
      </View>

      {manager.waitingTeams.length === 0 ? (
        <Text style={styles.emptyText}>대기 중인 팀이 없습니다.</Text>
      ) : (
        <ScrollView
          contentContainerStyle={styles.teamList}
          nestedScrollEnabled
          showsVerticalScrollIndicator
          style={maxListHeight ? { maxHeight: maxListHeight } : undefined}
        >
          {manager.waitingTeams.map((team) => {
            const selectedCourtId = manager.selectedCourtByTeam[team.id];
            const hasEmptyCourt = manager.emptyCourts.length > 0;

            return (
              <View key={team.id} style={styles.teamCard}>
                <View style={styles.teamHeaderRow}>
                  <Text style={styles.teamTitle}>{team.name}</Text>
                  <Text style={styles.orderBadge}>대기 {team.order}</Text>
                </View>
                <Text style={styles.playerText}>{playerNames(team)}</Text>

                <View style={styles.compactControlRow}>
                  <View style={styles.courtColumn}>
                    <Text style={styles.assignLabel}>코트</Text>
                    {hasEmptyCourt ? (
                      <View style={styles.courtChoiceRow}>
                        {manager.emptyCourts.map((court) => {
                          const isSelected = selectedCourtId === court.id;

                          return (
                            <Pressable
                              key={court.id}
                              onPress={() =>
                                manager.setSelectedCourtForTeam(team.id, court.id)
                              }
                              style={[
                                styles.courtChoice,
                                isSelected && styles.selectedCourtChoice,
                              ]}
                            >
                              <Text
                                style={[
                                  styles.courtChoiceText,
                                  isSelected && styles.selectedCourtChoiceText,
                                ]}
                              >
                                {court.number}번
                              </Text>
                            </Pressable>
                          );
                        })}
                      </View>
                    ) : (
                      <Text style={styles.noCourtText}>빈 코트 없음</Text>
                    )}
                  </View>

                  <View style={styles.actionRow}>
                    <Pressable
                      onPress={() => setEditingTeamId(team.id)}
                      style={styles.secondaryButton}
                    >
                      <Text style={styles.secondaryButtonText}>수정</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => manager.confirmDeleteWaitingTeam(team.id)}
                      style={styles.deleteButton}
                    >
                      <Text style={styles.deleteButtonText}>삭제</Text>
                    </Pressable>
                    <Pressable
                      disabled={!hasEmptyCourt}
                      onPress={() => handleAssign(team.id)}
                      style={[
                        styles.assignButton,
                        !hasEmptyCourt && styles.disabledButton,
                      ]}
                    >
                      <Text style={styles.assignButtonText}>넣기</Text>
                    </Pressable>
                  </View>
                </View>
              </View>
            );
          })}
        </ScrollView>
      )}

      {editingTeam ? (
        <TeamEditModal
          getPlayerStatus={manager.getPlayerStatus}
          initialPlayerIds={editingTeam.players.map((player) => player.id)}
          onClose={() => setEditingTeamId(null)}
          onSave={(playerIds) =>
            manager.updateWaitingTeamPlayers(editingTeam.id, playerIds)
          }
          players={manager.players}
          title={`${editingTeam.name} 수정`}
          visible={Boolean(editingTeam)}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    borderRadius: 8,
    padding: 14,
    backgroundColor: "#ffffff",
    borderWidth: 2,
    borderTopWidth: 7,
    borderColor: "#94a3b8",
    borderTopColor: "#ef4444",
    elevation: 4,
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
    gap: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#111827",
  },
  helperText: {
    flexShrink: 1,
    textAlign: "right",
    fontSize: 13,
    color: "#64748b",
  },
  emptyText: {
    paddingTop: 14,
    color: "#64748b",
    fontSize: 15,
  },
  teamList: {
    gap: 8,
    marginTop: 10,
    paddingBottom: 4,
  },
  teamCard: {
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "#94a3b8",
    padding: 10,
    backgroundColor: "#f8fafc",
  },
  teamHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  teamTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: "900",
    color: "#111827",
  },
  orderBadge: {
    overflow: "hidden",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: "#fee2e2",
    fontSize: 12,
    fontWeight: "900",
    color: "#991b1b",
  },
  playerText: {
    marginTop: 5,
    fontSize: 14,
    lineHeight: 19,
    fontWeight: "700",
    color: "#334155",
  },
  compactControlRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 8,
  },
  courtColumn: {
    flex: 1,
    minWidth: 112,
  },
  assignLabel: {
    marginBottom: 5,
    fontSize: 12,
    fontWeight: "800",
    color: "#475569",
  },
  courtChoiceRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 5,
  },
  courtChoice: {
    minHeight: 34,
    justifyContent: "center",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    paddingHorizontal: 9,
    backgroundColor: "#ffffff",
  },
  selectedCourtChoice: {
    borderColor: "#2563eb",
    backgroundColor: "#dbeafe",
  },
  courtChoiceText: {
    fontSize: 13,
    fontWeight: "800",
    color: "#334155",
  },
  selectedCourtChoiceText: {
    color: "#1d4ed8",
  },
  noCourtText: {
    color: "#991b1b",
    fontSize: 14,
    fontWeight: "700",
  },
  actionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 5,
    justifyContent: "flex-end",
  },
  secondaryButton: {
    minHeight: 36,
    minWidth: 54,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    paddingHorizontal: 9,
    backgroundColor: "#e2e8f0",
  },
  secondaryButtonText: {
    fontSize: 13,
    fontWeight: "900",
    color: "#111827",
  },
  deleteButton: {
    minHeight: 36,
    minWidth: 54,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    paddingHorizontal: 9,
    backgroundColor: "#fee2e2",
  },
  deleteButtonText: {
    fontSize: 13,
    fontWeight: "900",
    color: "#991b1b",
  },
  assignButton: {
    minHeight: 36,
    minWidth: 54,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    paddingHorizontal: 10,
    backgroundColor: "#2563eb",
  },
  assignButtonText: {
    fontSize: 13,
    fontWeight: "900",
    color: "#ffffff",
  },
  disabledButton: {
    backgroundColor: "#94a3b8",
  },
});

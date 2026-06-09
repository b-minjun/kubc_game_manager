import { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import type { BadmintonCourtManager } from "../hooks/useBadmintonCourtManager";
import type { Team } from "../types";
import { TeamEditModal } from "./TeamEditModal";

type CourtSectionProps = {
  manager: BadmintonCourtManager;
};

function playerNames(team: Team): string {
  return team.players.map((player) => player.name).join(" / ");
}

export function CourtSection({ manager }: CourtSectionProps) {
  const [editingCourtId, setEditingCourtId] = useState<string | null>(null);

  const editingCourt = useMemo(
    () => manager.courts.find((court) => court.id === editingCourtId),
    [editingCourtId, manager.courts],
  );

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>코트 현황</Text>

      <View style={styles.courtList}>
        {manager.courts.map((court) => {
          const team = court.currentTeam;

          return (
            <View
              key={court.id}
              style={[styles.courtCard, team && styles.playingCourtCard]}
            >
              <View style={styles.courtHeaderRow}>
                <Text style={styles.courtTitle}>{court.number}번 코트</Text>
                <Text
                  style={[
                    styles.statusBadge,
                    team ? styles.playingBadge : styles.emptyBadge,
                  ]}
                >
                  {team ? "게임 중" : "비어 있음"}
                </Text>
              </View>

              {team ? (
                <>
                  <Text style={styles.teamTitle}>경기 팀</Text>
                  <Text style={styles.playerText}>{playerNames(team)}</Text>

                  <View style={styles.actionRow}>
                    <Pressable
                      onPress={() => setEditingCourtId(court.id)}
                      style={styles.secondaryButton}
                    >
                      <Text style={styles.secondaryButtonText}>팀 수정</Text>
                    </Pressable>
                    <Pressable
                      onPress={() =>
                        manager.returnCourtTeamToWaitingQueue(court.id)
                      }
                      style={styles.returnButton}
                    >
                      <Text style={styles.returnButtonText}>
                        대기열로 내리기
                      </Text>
                    </Pressable>
                    <Pressable
                      onPress={() => manager.confirmFinishGame(court.id)}
                      style={styles.finishButton}
                    >
                      <Text style={styles.finishButtonText}>게임 종료</Text>
                    </Pressable>
                  </View>
                </>
              ) : (
                <Text style={styles.emptyText}>
                  대기 팀 카드에서 이 코트를 선택해 배정할 수 있습니다.
                </Text>
              )}
            </View>
          );
        })}
      </View>

      {editingCourt?.currentTeam ? (
        <TeamEditModal
          getPlayerStatus={manager.getPlayerStatus}
          initialPlayerIds={editingCourt.currentTeam.players.map(
            (player) => player.id,
          )}
          onClose={() => setEditingCourtId(null)}
          onSave={(playerIds) =>
            manager.updateCourtTeamPlayers(editingCourt.id, playerIds)
          }
          players={manager.players}
          title={`${editingCourt.number}번 코트 팀 수정`}
          visible={Boolean(editingCourt.currentTeam)}
        />
      ) : null}
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
    borderTopColor: "#2563eb",
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
  courtList: {
    gap: 12,
    marginTop: 12,
  },
  courtCard: {
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "#22c55e",
    padding: 14,
    backgroundColor: "#f0fdf4",
  },
  playingCourtCard: {
    borderColor: "#ef4444",
    backgroundColor: "#fff1f2",
  },
  courtHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  courtTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: "900",
    color: "#111827",
  },
  statusBadge: {
    overflow: "hidden",
    borderRadius: 8,
    paddingHorizontal: 9,
    paddingVertical: 4,
    fontSize: 12,
    fontWeight: "900",
  },
  emptyBadge: {
    backgroundColor: "#dcfce7",
    color: "#166534",
  },
  playingBadge: {
    backgroundColor: "#fee2e2",
    color: "#991b1b",
  },
  teamTitle: {
    marginTop: 12,
    fontSize: 18,
    fontWeight: "900",
    color: "#111827",
  },
  playerText: {
    marginTop: 8,
    fontSize: 16,
    lineHeight: 22,
    fontWeight: "700",
    color: "#334155",
  },
  emptyText: {
    marginTop: 10,
    fontSize: 15,
    color: "#166534",
  },
  actionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 14,
  },
  secondaryButton: {
    minHeight: 46,
    minWidth: 92,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    paddingHorizontal: 14,
    backgroundColor: "#e2e8f0",
  },
  secondaryButtonText: {
    fontSize: 15,
    fontWeight: "900",
    color: "#111827",
  },
  returnButton: {
    minHeight: 46,
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    paddingHorizontal: 14,
    backgroundColor: "#fef3c7",
  },
  returnButtonText: {
    fontSize: 15,
    fontWeight: "900",
    color: "#92400e",
  },
  finishButton: {
    minHeight: 46,
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    paddingHorizontal: 14,
    backgroundColor: "#dc2626",
  },
  finishButtonText: {
    fontSize: 15,
    fontWeight: "900",
    color: "#ffffff",
  },
});

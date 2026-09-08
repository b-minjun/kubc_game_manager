import { useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import type { BadmintonCourtManager } from "../hooks/useBadmintonCourtManager";
import type { Team } from "../types";
import { TeamEditModal } from "./TeamEditModal";

type CourtSectionProps = {
  manager: BadmintonCourtManager;
  canManageCourts?: boolean;
};

const WARNING_ELAPSED_MS = 15 * 60 * 1000;
const DANGER_ELAPSED_MS = 20 * 60 * 1000;

function playerNames(team: Team): string {
  return team.players.map((player) => player.name).join(" / ");
}

function formatElapsedTime(startedAt: number | null, now: number): string {
  if (!startedAt) {
    return "00:00";
  }

  const totalSeconds = Math.max(0, Math.floor((now - startedAt) / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const paddedMinutes = String(minutes).padStart(2, "0");
  const paddedSeconds = String(seconds).padStart(2, "0");

  if (hours > 0) {
    return `${String(hours).padStart(2, "0")}:${paddedMinutes}:${paddedSeconds}`;
  }

  return `${paddedMinutes}:${paddedSeconds}`;
}

export function CourtSection({
  manager,
  canManageCourts = true,
}: CourtSectionProps) {
  const [editingCourtId, setEditingCourtId] = useState<string | null>(null);
  const [now, setNow] = useState(Date.now());

  const editingCourt = useMemo(
    () => manager.courts.find((court) => court.id === editingCourtId),
    [editingCourtId, manager.courts],
  );
  const hasPlayingCourt = manager.courts.some((court) => court.currentTeam);

  useEffect(() => {
    if (!hasPlayingCourt) {
      return;
    }

    const intervalId = setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => clearInterval(intervalId);
  }, [hasPlayingCourt]);

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>코트 현황</Text>

      <View style={styles.courtList}>
        {manager.courts.map((court) => {
          const team = court.currentTeam;
          const isWarning =
            Boolean(team && court.gameStartedAt) &&
            now - Number(court.gameStartedAt) >= WARNING_ELAPSED_MS;
          const isDanger =
            Boolean(team && court.gameStartedAt) &&
            now - Number(court.gameStartedAt) >= DANGER_ELAPSED_MS;

          return (
            <View
              key={court.id}
              style={[
                styles.courtCard,
                team && styles.playingCourtCard,
                isWarning && styles.warningCourtCard,
                isDanger && styles.dangerCourtCard,
              ]}
            >
              <View style={styles.courtHeaderRow}>
                <Text style={styles.courtTitle}>{court.number}번 코트</Text>
                <Text
                  style={[
                    styles.statusBadge,
                    team ? styles.playingBadge : styles.emptyBadge,
                    isWarning && styles.warningStatusBadge,
                    isDanger && styles.dangerStatusBadge,
                  ]}
                >
                  {team
                    ? isDanger
                      ? "20분 초과 😈"
                      : isWarning
                        ? "15분 초과 😡"
                        : "게임 중"
                    : "비어 있음"}
                </Text>
              </View>

              {team ? (
                <>
                  <View style={styles.gameInfoRow}>
                    <Text style={styles.teamTitle}>경기 팀</Text>
                    <Text
                      style={[
                        styles.elapsedBadge,
                        isWarning && styles.warningElapsedBadge,
                        isDanger && styles.dangerElapsedBadge,
                      ]}
                    >
                      경과 {formatElapsedTime(court.gameStartedAt, now)}
                      {isDanger ? " 😈" : isWarning ? " 😡" : ""}
                    </Text>
                  </View>
                  <Text style={styles.playerText}>{playerNames(team)}</Text>

                  {canManageCourts ? (
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
                  ) : null}
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

      {canManageCourts && editingCourt?.currentTeam ? (
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
    padding: 12,
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
    fontSize: 18,
    fontWeight: "800",
    color: "#111827",
  },
  courtList: {
    gap: 8,
    marginTop: 10,
  },
  courtCard: {
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "#22c55e",
    padding: 10,
    backgroundColor: "#f0fdf4",
  },
  playingCourtCard: {
    borderColor: "#ef4444",
    backgroundColor: "#fff1f2",
  },
  warningCourtCard: {
    borderColor: "#dc2626",
    backgroundColor: "#fecaca",
  },
  dangerCourtCard: {
    borderColor: "#6d28d9",
    backgroundColor: "#ddd6fe",
  },
  courtHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  courtTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: "900",
    color: "#111827",
  },
  statusBadge: {
    overflow: "hidden",
    borderRadius: 8,
    paddingHorizontal: 7,
    paddingVertical: 3,
    fontSize: 11,
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
  warningStatusBadge: {
    backgroundColor: "#991b1b",
    color: "#ffffff",
  },
  dangerStatusBadge: {
    backgroundColor: "#6d28d9",
    color: "#ffffff",
  },
  teamTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: "#111827",
  },
  gameInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 6,
    marginTop: 8,
  },
  elapsedBadge: {
    overflow: "hidden",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: "#111827",
    fontSize: 12,
    fontWeight: "900",
    color: "#ffffff",
  },
  warningElapsedBadge: {
    backgroundColor: "#dc2626",
  },
  dangerElapsedBadge: {
    backgroundColor: "#7e22ce",
  },
  playerText: {
    marginTop: 6,
    fontSize: 14,
    lineHeight: 19,
    fontWeight: "700",
    color: "#334155",
  },
  emptyText: {
    marginTop: 8,
    fontSize: 13,
    color: "#166534",
  },
  actionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 5,
    marginTop: 10,
  },
  secondaryButton: {
    minHeight: 36,
    minWidth: 64,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    paddingHorizontal: 8,
    backgroundColor: "#e2e8f0",
  },
  secondaryButtonText: {
    fontSize: 12,
    fontWeight: "900",
    color: "#111827",
  },
  returnButton: {
    minHeight: 36,
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    paddingHorizontal: 8,
    backgroundColor: "#fef3c7",
  },
  returnButtonText: {
    fontSize: 12,
    fontWeight: "900",
    color: "#92400e",
  },
  finishButton: {
    minHeight: 36,
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    paddingHorizontal: 8,
    backgroundColor: "#dc2626",
  },
  finishButtonText: {
    fontSize: 12,
    fontWeight: "900",
    color: "#ffffff",
  },
});

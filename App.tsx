import { useState } from "react";
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";

import { CourtSection } from "./src/components/CourtSection";
import { CourtSettingSection } from "./src/components/CourtSettingSection";
import { JoinRoomScreen } from "./src/components/JoinRoomScreen";
import { LobbyScreen } from "./src/components/LobbyScreen";
import { PlayerSection } from "./src/components/PlayerSection";
import { RoomShareCard } from "./src/components/RoomShareCard";
import { WaitingTeamSection } from "./src/components/WaitingTeamSection";
import { useBadmintonCourtManager } from "./src/hooks/useBadmintonCourtManager";
import { useGameRoom } from "./src/hooks/useGameRoom";

export default function App() {
  const [isJoinScreenOpen, setIsJoinScreenOpen] = useState(false);
  const room = useGameRoom();
  const manager = useBadmintonCourtManager({
    remoteState: room.gameState,
    onGameStateChange: room.saveGameState,
  });
  const { height, width } = useWindowDimensions();
  const isLandscapeTablet = width > height && width >= 840;
  const isCompactMobile = width < 560;
  const shouldStackPlayerSection = isLandscapeTablet && width < 1120;
  const isHost = room.session?.role === "host";
  const roleText = isHost ? "호스트" : "참가자";

  if (!room.session) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="dark-content" backgroundColor="#e2e8f0" />
        {isJoinScreenOpen ? (
          <JoinRoomScreen
            isBusy={room.isBusy}
            onBack={() => setIsJoinScreenOpen(false)}
            onJoin={room.joinRoom}
            onJoinFromQr={room.joinRoomFromQr}
          />
        ) : (
          <LobbyScreen
            isBusy={room.isBusy}
            onHost={room.hostRoom}
            onJoin={() => setIsJoinScreenOpen(true)}
          />
        )}
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />
      <ScrollView
        contentContainerStyle={[
          styles.content,
          isLandscapeTablet && styles.landscapeContent,
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={[styles.header, isLandscapeTablet && styles.compactHeader]}>
          <View
            style={[
              styles.headerTextRow,
              isCompactMobile && styles.compactHeaderTextRow,
            ]}
          >
            <View style={styles.headerTitleGroup}>
              <Text style={styles.title}>코트큐</Text>
              <Text style={styles.summary}>
                {roleText} · 방 {room.session.code} · 참석자{" "}
                {manager.players.length}명 · 대기 {manager.waitingTeams.length}팀
                · 코트 {manager.courts.length}개
              </Text>
            </View>
            <Text
              style={[
                styles.syncBadge,
                room.syncStatus === "online" && styles.onlineSyncBadge,
                room.syncStatus === "error" && styles.errorSyncBadge,
              ]}
            >
              {room.syncStatus === "saving"
                ? "저장 중"
                : room.syncStatus === "online"
                  ? "실시간 연결"
                  : room.syncStatus === "connecting"
                    ? "연결 중"
                    : room.syncStatus === "error"
                      ? "연결 확인"
                      : "대기"}
            </Text>
          </View>
        </View>

        <View
          style={[
            styles.dashboard,
            isLandscapeTablet && styles.landscapeDashboard,
            shouldStackPlayerSection && styles.stackedLandscapeDashboard,
          ]}
        >
          <View
            style={[
              styles.column,
              isLandscapeTablet && styles.playerColumn,
              shouldStackPlayerSection && styles.fullWidthColumn,
            ]}
          >
            <PlayerSection
              canAddWaitingTeams
              canRemovePlayers={isHost}
              manager={manager}
            />
          </View>

          <View
            style={[
              styles.gameColumns,
              isLandscapeTablet && styles.landscapeGameColumns,
              shouldStackPlayerSection && styles.fullWidthColumn,
            ]}
          >
            <View style={[styles.column, isLandscapeTablet && styles.gameColumn]}>
              <WaitingTeamSection
                canAssignTeams={isHost}
                canDeleteTeams={isHost}
                canEditTeams
                manager={manager}
              />
            </View>

            <View style={[styles.column, isLandscapeTablet && styles.gameColumn]}>
              <CourtSection canManageCourts={isHost} manager={manager} />
              {isHost ? (
                <RoomShareCard
                  code={room.session.code}
                  onLeave={room.leaveRoom}
                  password={room.session.password}
                  qrPayload={room.qrPayload}
                  syncStatus={room.syncStatus}
                />
              ) : null}
              {isHost ? <CourtSettingSection manager={manager} /> : null}
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#e2e8f0",
    paddingTop: StatusBar.currentHeight ?? 0,
  },
  content: {
    gap: 12,
    padding: 12,
    paddingBottom: 24,
  },
  landscapeContent: {
    minHeight: "100%",
  },
  header: {
    borderRadius: 8,
    padding: 16,
    backgroundColor: "#111827",
    borderWidth: 2,
    borderColor: "#334155",
  },
  compactHeader: {
    paddingVertical: 12,
  },
  headerTextRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  compactHeaderTextRow: {
    alignItems: "flex-start",
    flexDirection: "column",
  },
  headerTitleGroup: {
    flex: 1,
    minWidth: 0,
  },
  dashboard: {
    gap: 12,
  },
  landscapeDashboard: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  stackedLandscapeDashboard: {
    flexDirection: "column",
  },
  column: {
    gap: 12,
  },
  playerColumn: {
    width: 356,
    flexShrink: 0,
  },
  fullWidthColumn: {
    width: "100%",
  },
  gameColumns: {
    gap: 12,
  },
  landscapeGameColumns: {
    flex: 1,
    flexDirection: "row",
    alignItems: "flex-start",
    minWidth: 0,
  },
  gameColumn: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontSize: 24,
    fontWeight: "900",
    color: "#ffffff",
  },
  summary: {
    marginTop: 8,
    fontSize: 15,
    fontWeight: "700",
    color: "#cbd5e1",
  },
  syncBadge: {
    overflow: "hidden",
    flexShrink: 0,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: "#475569",
    fontSize: 12,
    fontWeight: "900",
    color: "#ffffff",
  },
  onlineSyncBadge: {
    backgroundColor: "#16a34a",
  },
  errorSyncBadge: {
    backgroundColor: "#dc2626",
  },
});

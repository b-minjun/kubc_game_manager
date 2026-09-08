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
import { PlayerSection } from "./src/components/PlayerSection";
import { WaitingTeamSection } from "./src/components/WaitingTeamSection";
import { useBadmintonCourtManager } from "./src/hooks/useBadmintonCourtManager";

export default function App() {
  const manager = useBadmintonCourtManager();
  const { height, width } = useWindowDimensions();
  const isLandscapeTablet = width > height && width >= 840;
  const shouldStackPlayerSection = isLandscapeTablet && width < 1120;

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
          <Text style={styles.title}>배드민턴 코트 현황</Text>
          <Text style={styles.summary}>
            참석자 {manager.players.length}명 · 대기 {manager.waitingTeams.length}
            팀 · 코트 {manager.courts.length}개
          </Text>
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
            <PlayerSection manager={manager} />
          </View>

          <View
            style={[
              styles.gameColumns,
              isLandscapeTablet && styles.landscapeGameColumns,
              shouldStackPlayerSection && styles.fullWidthColumn,
            ]}
          >
            <View style={[styles.column, isLandscapeTablet && styles.gameColumn]}>
              <WaitingTeamSection manager={manager} />
            </View>

            <View style={[styles.column, isLandscapeTablet && styles.gameColumn]}>
              <CourtSection manager={manager} />
              <CourtSettingSection manager={manager} />
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
});

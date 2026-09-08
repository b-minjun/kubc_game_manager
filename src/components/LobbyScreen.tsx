import { Pressable, StyleSheet, Text, View } from "react-native";

type LobbyScreenProps = {
  isBusy: boolean;
  onHost: () => void;
  onJoin: () => void;
};

export function LobbyScreen({ isBusy, onHost, onJoin }: LobbyScreenProps) {
  return (
    <View style={styles.container}>
      <View style={styles.panel}>
        <Text style={styles.appName}>코트큐</Text>
        <Text style={styles.title}>게임을 시작할 방식을 선택하세요</Text>

        <View style={styles.actionRow}>
          <Pressable
            disabled={isBusy}
            onPress={onHost}
            style={[styles.primaryButton, isBusy && styles.disabledButton]}
          >
            <Text style={styles.primaryButtonText}>
              {isBusy ? "방 만드는 중" : "게임 호스팅"}
            </Text>
          </Pressable>
          <Pressable
            disabled={isBusy}
            onPress={onJoin}
            style={[styles.secondaryButton, isBusy && styles.disabledButton]}
          >
            <Text style={styles.secondaryButtonText}>게임 참가</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
  },
  panel: {
    alignSelf: "center",
    width: "100%",
    maxWidth: 620,
    borderRadius: 8,
    borderWidth: 2,
    borderTopWidth: 7,
    borderColor: "#94a3b8",
    borderTopColor: "#16a34a",
    padding: 22,
    backgroundColor: "#ffffff",
  },
  appName: {
    fontSize: 34,
    fontWeight: "900",
    color: "#111827",
    textAlign: "center",
  },
  title: {
    marginTop: 8,
    fontSize: 18,
    fontWeight: "800",
    color: "#475569",
    textAlign: "center",
  },
  actionRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 22,
  },
  primaryButton: {
    minHeight: 58,
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    backgroundColor: "#16a34a",
  },
  primaryButtonText: {
    fontSize: 18,
    fontWeight: "900",
    color: "#ffffff",
  },
  secondaryButton: {
    minHeight: 58,
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "#2563eb",
    backgroundColor: "#eff6ff",
  },
  secondaryButtonText: {
    fontSize: 18,
    fontWeight: "900",
    color: "#1d4ed8",
  },
  disabledButton: {
    opacity: 0.58,
  },
});

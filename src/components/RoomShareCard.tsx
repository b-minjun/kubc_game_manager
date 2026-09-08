import { Pressable, StyleSheet, Text, View } from "react-native";
import QRCode from "react-native-qrcode-svg";

type RoomShareCardProps = {
  code: string;
  password: string;
  qrPayload: string;
  syncStatus: "idle" | "connecting" | "online" | "saving" | "error";
  onLeave: () => void | Promise<void>;
};

const syncStatusLabel: Record<RoomShareCardProps["syncStatus"], string> = {
  idle: "대기",
  connecting: "연결 중",
  online: "실시간 연결",
  saving: "저장 중",
  error: "연결 확인",
};

export function RoomShareCard({
  code,
  password,
  qrPayload,
  syncStatus,
  onLeave,
}: RoomShareCardProps) {
  return (
    <View style={styles.section}>
      <View style={styles.headerRow}>
        <Text style={styles.sectionTitle}>방 초대</Text>
        <Text
          style={[
            styles.statusBadge,
            syncStatus === "online" && styles.onlineBadge,
            syncStatus === "error" && styles.errorBadge,
          ]}
        >
          {syncStatusLabel[syncStatus]}
        </Text>
      </View>

      <View style={styles.bodyRow}>
        <View style={styles.qrBox}>
          <QRCode
            backgroundColor="#ffffff"
            color="#111827"
            ecl="M"
            quietZone={8}
            size={136}
            value={qrPayload || "courtqueue"}
          />
        </View>
        <View style={styles.roomInfo}>
          <Text style={styles.label}>방 코드</Text>
          <Text selectable style={styles.codeText}>
            {code}
          </Text>
          <Text style={styles.label}>방 비밀번호</Text>
          <Text selectable style={styles.passwordText}>
            {password}
          </Text>
        </View>
      </View>

      <Pressable onPress={onLeave} style={styles.leaveButton}>
        <Text style={styles.leaveButtonText}>방 종료</Text>
      </Pressable>
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
    borderTopColor: "#10b981",
    elevation: 4,
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#111827",
  },
  statusBadge: {
    overflow: "hidden",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: "#e2e8f0",
    fontSize: 12,
    fontWeight: "900",
    color: "#334155",
  },
  onlineBadge: {
    backgroundColor: "#dcfce7",
    color: "#166534",
  },
  errorBadge: {
    backgroundColor: "#fee2e2",
    color: "#991b1b",
  },
  bodyRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 12,
  },
  qrBox: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    padding: 8,
    backgroundColor: "#ffffff",
  },
  roomInfo: {
    flex: 1,
    justifyContent: "center",
    minWidth: 0,
  },
  label: {
    marginTop: 8,
    fontSize: 12,
    fontWeight: "900",
    color: "#64748b",
  },
  codeText: {
    marginTop: 2,
    fontSize: 24,
    fontWeight: "900",
    color: "#111827",
  },
  passwordText: {
    marginTop: 2,
    fontSize: 28,
    fontWeight: "900",
    color: "#16a34a",
  },
  leaveButton: {
    minHeight: 42,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    marginTop: 12,
    backgroundColor: "#e5e7eb",
  },
  leaveButtonText: {
    fontSize: 15,
    fontWeight: "900",
    color: "#111827",
  },
});

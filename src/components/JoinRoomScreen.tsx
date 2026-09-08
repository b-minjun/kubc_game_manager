import { useState } from "react";
import {
  Alert,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import {
  CameraView,
  useCameraPermissions,
  type BarcodeScanningResult,
} from "expo-camera";

type JoinRoomScreenProps = {
  isBusy: boolean;
  onBack: () => void;
  onJoin: (code: string, password: string) => Promise<void>;
  onJoinFromQr: (value: string) => Promise<void>;
};

export function JoinRoomScreen({
  isBusy,
  onBack,
  onJoin,
  onJoinFromQr,
}: JoinRoomScreenProps) {
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [scannerVisible, setScannerVisible] = useState(false);
  const [scanned, setScanned] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();

  const openScanner = async () => {
    const nextPermission = permission?.granted
      ? permission
      : await requestPermission();

    if (!nextPermission.granted) {
      Alert.alert("QR 스캔", "카메라 권한이 필요합니다.");
      return;
    }

    setScanned(false);
    setScannerVisible(true);
  };

  const handleBarcodeScanned = async (result: BarcodeScanningResult) => {
    if (scanned) {
      return;
    }

    setScanned(true);
    setScannerVisible(false);
    await onJoinFromQr(result.data);
  };

  return (
    <View style={styles.container}>
      <View style={styles.panel}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>게임 참가</Text>
          <Pressable onPress={onBack} style={styles.backButton}>
            <Text style={styles.backButtonText}>뒤로</Text>
          </Pressable>
        </View>

        <Pressable
          disabled={isBusy}
          onPress={openScanner}
          style={[styles.scanButton, isBusy && styles.disabledButton]}
        >
          <Text style={styles.scanButtonText}>QR 코드 스캔</Text>
        </Pressable>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>방 코드</Text>
          <TextInput
            autoCapitalize="characters"
            editable={!isBusy}
            onChangeText={setCode}
            placeholder="예: 2AB7KQ"
            placeholderTextColor="#94a3b8"
            style={styles.input}
            value={code}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>방 비밀번호</Text>
          <TextInput
            editable={!isBusy}
            keyboardType="number-pad"
            onChangeText={setPassword}
            onSubmitEditing={() => onJoin(code, password)}
            placeholder="4자리"
            placeholderTextColor="#94a3b8"
            style={styles.input}
            value={password}
          />
        </View>

        <Pressable
          disabled={isBusy}
          onPress={() => onJoin(code, password)}
          style={[styles.joinButton, isBusy && styles.disabledButton]}
        >
          <Text style={styles.joinButtonText}>
            {isBusy ? "참가 중" : "입장"}
          </Text>
        </Pressable>
      </View>

      <Modal
        animationType="slide"
        onRequestClose={() => setScannerVisible(false)}
        visible={scannerVisible}
      >
        <View style={styles.scannerContainer}>
          <CameraView
            barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
            onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
            style={styles.camera}
          />
          <View style={styles.scannerFooter}>
            <Text style={styles.scannerTitle}>QR 코드를 화면 안에 맞춰주세요</Text>
            <Pressable
              onPress={() => setScannerVisible(false)}
              style={styles.closeScannerButton}
            >
              <Text style={styles.closeScannerButtonText}>닫기</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
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
    maxWidth: 560,
    borderRadius: 8,
    borderWidth: 2,
    borderTopWidth: 7,
    borderColor: "#94a3b8",
    borderTopColor: "#2563eb",
    padding: 20,
    backgroundColor: "#ffffff",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: "900",
    color: "#111827",
  },
  backButton: {
    minHeight: 42,
    justifyContent: "center",
    borderRadius: 8,
    paddingHorizontal: 14,
    backgroundColor: "#e5e7eb",
  },
  backButtonText: {
    fontSize: 15,
    fontWeight: "800",
    color: "#111827",
  },
  scanButton: {
    minHeight: 54,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    marginTop: 18,
    backgroundColor: "#16a34a",
  },
  scanButtonText: {
    fontSize: 17,
    fontWeight: "900",
    color: "#ffffff",
  },
  inputGroup: {
    marginTop: 14,
  },
  label: {
    marginBottom: 7,
    fontSize: 14,
    fontWeight: "900",
    color: "#334155",
  },
  input: {
    minHeight: 50,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 8,
    paddingHorizontal: 14,
    backgroundColor: "#f8fafc",
    fontSize: 17,
    fontWeight: "800",
    color: "#111827",
  },
  joinButton: {
    minHeight: 54,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    marginTop: 18,
    backgroundColor: "#2563eb",
  },
  joinButtonText: {
    fontSize: 17,
    fontWeight: "900",
    color: "#ffffff",
  },
  disabledButton: {
    opacity: 0.58,
  },
  scannerContainer: {
    flex: 1,
    backgroundColor: "#020617",
  },
  camera: {
    flex: 1,
  },
  scannerFooter: {
    borderTopWidth: 1,
    borderTopColor: "#334155",
    padding: 16,
    backgroundColor: "#0f172a",
  },
  scannerTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: "#ffffff",
    textAlign: "center",
  },
  closeScannerButton: {
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    marginTop: 12,
    backgroundColor: "#e5e7eb",
  },
  closeScannerButtonText: {
    fontSize: 16,
    fontWeight: "900",
    color: "#111827",
  },
});

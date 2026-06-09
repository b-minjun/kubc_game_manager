import { useEffect, useState } from "react";
import {
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import type { BadmintonCourtManager } from "../hooks/useBadmintonCourtManager";

type CourtSettingSectionProps = {
  manager: BadmintonCourtManager;
};

export function CourtSettingSection({ manager }: CourtSettingSectionProps) {
  const [courtCountText, setCourtCountText] = useState(
    String(manager.courts.length),
  );

  useEffect(() => {
    setCourtCountText(String(manager.courts.length));
  }, [manager.courts.length]);

  const applyCourtCount = () => {
    const nextCount = Number.parseInt(courtCountText, 10);

    if (Number.isNaN(nextCount)) {
      Alert.alert("코트 설정", "숫자를 입력해 주세요.");
      return;
    }

    manager.updateCourtCount(nextCount);
  };

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>코트 개수 설정</Text>
      <Text style={styles.currentText}>현재 코트: {manager.courts.length}개</Text>

      <View style={styles.controlRow}>
        <Pressable
          onPress={() => manager.updateCourtCount(manager.courts.length - 1)}
          style={styles.stepButton}
        >
          <Text style={styles.stepButtonText}>-</Text>
        </Pressable>
        <TextInput
          keyboardType="number-pad"
          onChangeText={setCourtCountText}
          onSubmitEditing={applyCourtCount}
          style={styles.input}
          value={courtCountText}
        />
        <Pressable
          onPress={() => manager.updateCourtCount(manager.courts.length + 1)}
          style={styles.stepButton}
        >
          <Text style={styles.stepButtonText}>+</Text>
        </Pressable>
        <Pressable onPress={applyCourtCount} style={styles.applyButton}>
          <Text style={styles.applyButtonText}>적용</Text>
        </Pressable>
      </View>
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
    borderTopColor: "#f59e0b",
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
  currentText: {
    marginTop: 8,
    fontSize: 15,
    fontWeight: "700",
    color: "#475569",
  },
  controlRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 12,
  },
  stepButton: {
    width: 48,
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    backgroundColor: "#e2e8f0",
  },
  stepButtonText: {
    fontSize: 24,
    fontWeight: "900",
    color: "#111827",
  },
  input: {
    minHeight: 48,
    width: 86,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    backgroundColor: "#f8fafc",
    textAlign: "center",
    fontSize: 18,
    fontWeight: "800",
    color: "#111827",
  },
  applyButton: {
    minHeight: 48,
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    paddingHorizontal: 14,
    backgroundColor: "#2563eb",
  },
  applyButtonText: {
    fontSize: 16,
    fontWeight: "900",
    color: "#ffffff",
  },
});

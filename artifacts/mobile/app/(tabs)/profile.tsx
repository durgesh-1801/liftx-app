import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";
import { PR, getUserPRs } from "@/services/workoutService";

function StatBadge({
  label,
  value,
  icon,
  colors,
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <View style={[styles.statBadge, { backgroundColor: colors.card, borderColor: colors.border }]}>
      {icon}
      <Text style={[styles.statValue, { color: colors.foreground }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{label}</Text>
    </View>
  );
}

export default function ProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user, profile, logOut, refreshProfile } = useAuth();
  const [prs, setPrs] = useState<PR[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!user) return;
      try {
        await refreshProfile();
        const prList = await getUserPRs(user.uid);
        setPrs(prList.sort((a, b) => b.weight - a.weight));
      } catch (e) {
        console.warn(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user]);

  const handleLogout = () => {
    Alert.alert("Sign Out", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          await logOut();
        },
      },
    ]);
  };

  const topPad = insets.top + (Platform.OS === "web" ? 67 : 0);
  const initials = (profile?.displayName ?? user?.email ?? "A")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{
        paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 100),
      }}
    >
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad + 24 }]}>
        <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        <Text style={[styles.name, { color: colors.foreground }]}>
          {profile?.displayName ?? "Athlete"}
        </Text>
        <Text style={[styles.email, { color: colors.mutedForeground }]}>{user?.email}</Text>
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <StatBadge
          label="Workouts"
          value={profile?.totalWorkouts ?? 0}
          icon={<MaterialCommunityIcons name="weight-lifter" size={28} color={colors.primary} />}
          colors={colors}
        />
        <StatBadge
          label="Day Streak"
          value={`${profile?.streak ?? 0}🔥`}
          icon={<Ionicons name="flame" size={28} color={colors.warning} />}
          colors={colors}
        />
        <StatBadge
          label="PRs Set"
          value={prs.length}
          icon={<Ionicons name="trophy" size={28} color="#FFD700" />}
          colors={colors}
        />
      </View>

      {/* PRs */}
      <View style={{ paddingHorizontal: 20 }}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Personal Records</Text>
        {loading ? (
          <ActivityIndicator color={colors.primary} />
        ) : prs.length === 0 ? (
          <View style={styles.noData}>
            <Ionicons name="trophy-outline" size={36} color={colors.mutedForeground} />
            <Text style={[styles.noDataText, { color: colors.mutedForeground }]}>
              No PRs yet. Start lifting!
            </Text>
          </View>
        ) : (
          prs.slice(0, 10).map((pr, i) => (
            <View
              key={i}
              style={[styles.prRow, { backgroundColor: colors.card, borderColor: colors.border }]}
            >
              <View style={[styles.prRank, { backgroundColor: `${colors.primary}20` }]}>
                <Ionicons name="barbell" size={16} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.prName, { color: colors.foreground }]}>{pr.exerciseName}</Text>
                <Text style={[styles.prDate, { color: colors.mutedForeground }]}>
                  {new Date(pr.date + "T00:00:00").toLocaleDateString()}
                </Text>
              </View>
              <View style={{ alignItems: "flex-end" }}>
                <Text style={[styles.prWeight, { color: colors.primary }]}>{pr.weight} kg</Text>
                <Text style={[styles.prReps, { color: colors.mutedForeground }]}>× {pr.reps}</Text>
              </View>
            </View>
          ))
        )}
      </View>

      {/* Settings */}
      <View style={{ paddingHorizontal: 20, marginTop: 24 }}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Account</Text>
        <Pressable
          style={[styles.settingRow, { backgroundColor: colors.card, borderColor: colors.border }]}
          onPress={handleLogout}
        >
          <Ionicons name="log-out-outline" size={20} color={colors.destructive} />
          <Text style={[styles.settingText, { color: colors.destructive }]}>Sign Out</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  avatarText: { fontSize: 28, fontFamily: "Inter_700Bold", color: "#fff" },
  name: { fontSize: 24, fontFamily: "Inter_700Bold", marginBottom: 4 },
  email: { fontSize: 14, fontFamily: "Inter_400Regular" },
  statsRow: {
    flexDirection: "row",
    paddingHorizontal: 20,
    marginBottom: 28,
    gap: 10,
  },
  statBadge: {
    flex: 1,
    borderRadius: 16,
    padding: 14,
    alignItems: "center",
    gap: 4,
    borderWidth: 1,
  },
  statValue: { fontSize: 22, fontFamily: "Inter_700Bold" },
  statLabel: { fontSize: 11, fontFamily: "Inter_400Regular", textAlign: "center" },
  sectionTitle: { fontSize: 18, fontFamily: "Inter_700Bold", marginBottom: 12 },
  noData: { alignItems: "center", paddingVertical: 24, gap: 8 },
  noDataText: { fontSize: 14, fontFamily: "Inter_400Regular" },
  prRow: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    gap: 12,
  },
  prRank: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  prName: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  prDate: { fontSize: 12, fontFamily: "Inter_400Regular" },
  prWeight: { fontSize: 16, fontFamily: "Inter_700Bold" },
  prReps: { fontSize: 12, fontFamily: "Inter_400Regular" },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    marginBottom: 8,
  },
  settingText: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
});

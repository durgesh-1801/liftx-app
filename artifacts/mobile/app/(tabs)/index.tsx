import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuth } from "@/context/AuthContext";
import { useWorkout } from "@/context/WorkoutContext";
import { useColors } from "@/hooks/useColors";
import { CompletedWorkout, getWorkoutHistory } from "@/services/workoutService";

function StatCard({
  label,
  value,
  icon,
  colors,
  accent,
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  colors: ReturnType<typeof useColors>;
  accent?: boolean;
}) {
  return (
    <View
      style={[
        styles.statCard,
        {
          backgroundColor: accent ? colors.primary : colors.card,
          borderColor: accent ? colors.primary : colors.border,
          flex: 1,
        },
      ]}
    >
      <View style={styles.statIcon}>{icon}</View>
      <Text
        style={[
          styles.statValue,
          { color: accent ? colors.primaryForeground : colors.foreground },
        ]}
      >
        {value}
      </Text>
      <Text
        style={[
          styles.statLabel,
          { color: accent ? "rgba(255,255,255,0.75)" : colors.mutedForeground },
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

function WorkoutCard({
  workout,
  colors,
}: {
  workout: CompletedWorkout;
  colors: ReturnType<typeof useColors>;
}) {
  const date = new Date(workout.date + "T00:00:00");
  const formatted = date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
  return (
    <View
      style={[
        styles.workoutCard,
        { backgroundColor: colors.card, borderColor: colors.border },
      ]}
    >
      <View style={styles.workoutCardLeft}>
        <Text style={[styles.workoutDate, { color: colors.mutedForeground }]}>{formatted}</Text>
        <Text style={[styles.workoutExercises, { color: colors.foreground }]}>
          {workout.exercises.length} exercises
        </Text>
        <Text style={[styles.workoutSets, { color: colors.mutedForeground }]}>
          {workout.totalSets} sets
        </Text>
      </View>
      <View style={styles.workoutCardRight}>
        <Text style={[styles.workoutVolume, { color: colors.primary }]}>
          {(workout.totalVolume / 1000).toFixed(1)}k
        </Text>
        <Text style={[styles.workoutVolumeLabel, { color: colors.mutedForeground }]}>kg vol</Text>
      </View>
    </View>
  );
}

export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user, profile, refreshProfile } = useAuth();
  const { activeWorkout, startWorkout, routines } = useWorkout();
  const [recentWorkouts, setRecentWorkouts] = useState<CompletedWorkout[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    if (!user) return;
    try {
      const history = await getWorkoutHistory(user.uid, 5);
      setRecentWorkouts(history);
    } catch (e) {
      console.warn("Failed to load history", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshProfile();
    await loadData();
  };

  const handleStartWorkout = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    startWorkout();
    router.push("/(workout)/logger");
  };

  const todayStr = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  const topPad = insets.top + (Platform.OS === "web" ? 67 : 0);

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 100) }}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={colors.primary}
        />
      }
    >
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad + 20, paddingBottom: 16 }]}>
        <View>
          <Text style={[styles.greeting, { color: colors.mutedForeground }]}>{todayStr}</Text>
          <Text style={[styles.username, { color: colors.foreground }]}>
            Hey, {profile?.displayName?.split(" ")[0] ?? user?.email?.split("@")[0] ?? "Athlete"} 👊
          </Text>
        </View>
        <Pressable
          onPress={() => router.push("/(tabs)/leaderboard")}
          style={[styles.trophyBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
        >
          <Ionicons name="trophy" size={20} color={colors.primary} />
        </Pressable>
      </View>

      {/* Active workout banner */}
      {activeWorkout && (
        <Pressable
          onPress={() => router.push("/(workout)/logger")}
          style={[styles.activeBanner, { backgroundColor: colors.primary }]}
        >
          <View style={styles.activeBannerLeft}>
            <View style={styles.pulsingDot} />
            <Text style={[styles.activeBannerText, { color: colors.primaryForeground }]}>
              Workout in progress
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.primaryForeground} />
        </Pressable>
      )}

      {/* Stats row */}
      <View style={styles.statsRow}>
        <StatCard
          label="Streak"
          value={`${profile?.streak ?? 0}d`}
          icon={<Ionicons name="flame" size={22} color={colors.warning} />}
          colors={colors}
          accent={false}
        />
        <View style={{ width: 12 }} />
        <StatCard
          label="Workouts"
          value={profile?.totalWorkouts ?? 0}
          icon={<MaterialCommunityIcons name="weight-lifter" size={22} color={colors.primary} />}
          colors={colors}
        />
      </View>

      {/* Start Workout CTA */}
      {!activeWorkout && (
        <Pressable
          style={[styles.startBtn, { backgroundColor: colors.primary }]}
          onPress={handleStartWorkout}
        >
          <Ionicons name="barbell" size={24} color={colors.primaryForeground} />
          <Text style={[styles.startBtnText, { color: colors.primaryForeground }]}>
            Start Workout
          </Text>
        </Pressable>
      )}

      {/* Quick routines */}
      {routines.length > 0 && (
        <>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Quick Start</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.routinesRow}>
            {routines.slice(0, 5).map((r) => (
              <Pressable
                key={r.id}
                style={[
                  styles.routineChip,
                  { backgroundColor: colors.card, borderColor: colors.border },
                ]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  startWorkout(r);
                  router.push("/(workout)/logger");
                }}
              >
                <Text style={[styles.routineChipText, { color: colors.foreground }]}>{r.name}</Text>
                <Text style={[styles.routineChipSub, { color: colors.mutedForeground }]}>
                  {r.exercises.length} exercises
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </>
      )}

      {/* Recent workouts */}
      <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Recent</Text>
      {loading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 20 }} />
      ) : recentWorkouts.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="barbell-outline" size={40} color={colors.mutedForeground} />
          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
            No workouts yet. Start lifting!
          </Text>
        </View>
      ) : (
        recentWorkouts.map((w) => (
          <WorkoutCard key={w.id} workout={w} colors={colors} />
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingHorizontal: 20,
  },
  greeting: { fontSize: 13, fontFamily: "Inter_400Regular", marginBottom: 4 },
  username: { fontSize: 24, fontFamily: "Inter_700Bold" },
  trophyBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    marginTop: 4,
  },
  activeBanner: {
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  activeBannerLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  pulsingDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#FFFFFF" },
  activeBannerText: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  statsRow: {
    flexDirection: "row",
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  statCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    gap: 4,
  },
  statIcon: { marginBottom: 8 },
  statValue: { fontSize: 28, fontFamily: "Inter_700Bold" },
  statLabel: { fontSize: 13, fontFamily: "Inter_400Regular" },
  startBtn: {
    marginHorizontal: 20,
    borderRadius: 16,
    height: 64,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    marginBottom: 28,
  },
  startBtnText: { fontSize: 18, fontFamily: "Inter_700Bold" },
  sectionTitle: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    marginBottom: 12,
    paddingHorizontal: 20,
  },
  routinesRow: { paddingLeft: 20, marginBottom: 24 },
  routineChip: {
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginRight: 10,
    borderWidth: 1,
    minWidth: 120,
  },
  routineChipText: { fontSize: 14, fontFamily: "Inter_600SemiBold", marginBottom: 2 },
  routineChipSub: { fontSize: 12, fontFamily: "Inter_400Regular" },
  workoutCard: {
    marginHorizontal: 20,
    marginBottom: 10,
    borderRadius: 14,
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
  },
  workoutCardLeft: { gap: 2 },
  workoutCardRight: { alignItems: "flex-end" },
  workoutDate: { fontSize: 12, fontFamily: "Inter_400Regular" },
  workoutExercises: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  workoutSets: { fontSize: 12, fontFamily: "Inter_400Regular" },
  workoutVolume: { fontSize: 24, fontFamily: "Inter_700Bold" },
  workoutVolumeLabel: { fontSize: 12, fontFamily: "Inter_400Regular" },
  emptyState: { alignItems: "center", paddingVertical: 40, gap: 12 },
  emptyText: { fontSize: 15, fontFamily: "Inter_400Regular", textAlign: "center" },
});

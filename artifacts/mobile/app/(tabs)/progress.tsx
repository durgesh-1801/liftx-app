import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";
import {
  PR,
  getStrengthProgress,
  getUserPRs,
  getVolumeByWeek,
} from "@/services/workoutService";

const { width } = Dimensions.get("window");
const CHART_WIDTH = width - 40;
const CHART_HEIGHT = 160;

function BarChart({
  data,
  colors,
}: {
  data: { week: string; volume: number }[];
  colors: ReturnType<typeof useColors>;
}) {
  if (data.length === 0) return null;
  const maxVal = Math.max(...data.map((d) => d.volume), 1);
  return (
    <View style={styles.chartContainer}>
      <View style={{ flexDirection: "row", alignItems: "flex-end", gap: 6, height: CHART_HEIGHT }}>
        {data.slice(-8).map((d, i) => {
          const barH = Math.max(4, (d.volume / maxVal) * CHART_HEIGHT);
          const label = d.week.slice(5);
          return (
            <View key={i} style={{ flex: 1, alignItems: "center" }}>
              <View
                style={{
                  width: "100%",
                  height: barH,
                  backgroundColor: colors.primary,
                  borderRadius: 4,
                  opacity: i === data.slice(-8).length - 1 ? 1 : 0.5,
                }}
              />
              <Text
                style={{ color: colors.mutedForeground, fontSize: 10, marginTop: 4 }}
                numberOfLines={1}
              >
                {label}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

function LineChart({
  data,
  colors,
}: {
  data: { date: string; weight: number }[];
  colors: ReturnType<typeof useColors>;
}) {
  if (data.length < 2) return null;
  const maxVal = Math.max(...data.map((d) => d.weight), 1);
  const minVal = Math.min(...data.map((d) => d.weight));
  const range = maxVal - minVal || 1;
  const pts = data.map((d, i) => ({
    x: (i / (data.length - 1)) * (CHART_WIDTH - 24),
    y: CHART_HEIGHT - ((d.weight - minVal) / range) * (CHART_HEIGHT - 24) - 12,
    weight: d.weight,
    date: d.date,
  }));
  return (
    <View style={[styles.chartContainer, { overflow: "hidden" }]}>
      <View style={{ height: CHART_HEIGHT, position: "relative" }}>
        {pts.map((pt, i) => {
          if (i === 0) return null;
          const prev = pts[i - 1];
          const dx = pt.x - prev.x;
          const dy = pt.y - prev.y;
          const len = Math.sqrt(dx * dx + dy * dy);
          const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
          return (
            <View
              key={i}
              style={{
                position: "absolute",
                left: prev.x + 12,
                top: prev.y + 12,
                width: len,
                height: 2,
                backgroundColor: colors.primary,
                transform: [{ rotate: `${angle}deg` }],
                transformOrigin: "left center",
              }}
            />
          );
        })}
        {pts.map((pt, i) => (
          <View
            key={`dot-${i}`}
            style={{
              position: "absolute",
              left: pt.x + 8,
              top: pt.y + 8,
              width: 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: i === pts.length - 1 ? colors.primary : `${colors.primary}80`,
            }}
          />
        ))}
      </View>
      <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 4 }}>
        <Text style={{ color: colors.mutedForeground, fontSize: 11 }}>
          {data[0].date.slice(5)}
        </Text>
        <Text style={{ color: colors.mutedForeground, fontSize: 11 }}>
          {data[data.length - 1].date.slice(5)}
        </Text>
      </View>
    </View>
  );
}

const BIG_EXERCISES = ["Bench Press", "Squat", "Deadlift", "Overhead Press", "Barbell Row"];

export default function ProgressScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [weeklyVolume, setWeeklyVolume] = useState<{ week: string; volume: number }[]>([]);
  const [prs, setPrs] = useState<PR[]>([]);
  const [strengthData, setStrengthData] = useState<{ date: string; weight: number }[]>([]);
  const [selectedExercise, setSelectedExercise] = useState("Bench Press");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      try {
        const [vol, prList, str] = await Promise.all([
          getVolumeByWeek(user.uid),
          getUserPRs(user.uid),
          getStrengthProgress(user.uid, selectedExercise),
        ]);
        setWeeklyVolume(vol);
        setPrs(prList);
        setStrengthData(str);
      } catch (e) {
        console.warn(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user, selectedExercise]);

  const topPad = insets.top + (Platform.OS === "web" ? 67 : 0);

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{
        padding: 20,
        paddingTop: topPad + 20,
        paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 100),
      }}
    >
      <Text style={[styles.title, { color: colors.foreground }]}>Progress</Text>

      {loading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <>
          {/* Weekly Volume */}
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.cardTitle, { color: colors.foreground }]}>Weekly Volume</Text>
            <Text style={[styles.cardSub, { color: colors.mutedForeground }]}>
              Total kg lifted per week
            </Text>
            {weeklyVolume.length > 0 ? (
              <BarChart data={weeklyVolume} colors={colors} />
            ) : (
              <View style={styles.noDataState}>
                <Ionicons name="bar-chart-outline" size={32} color={colors.mutedForeground} />
                <Text style={[styles.noDataText, { color: colors.mutedForeground }]}>
                  Complete workouts to see data
                </Text>
              </View>
            )}
          </View>

          {/* Strength Progress */}
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.cardTitle, { color: colors.foreground }]}>Strength Progress</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
              {BIG_EXERCISES.map((ex) => (
                <TouchableOpacity
                  key={ex}
                  style={[
                    styles.exTab,
                    {
                      backgroundColor: selectedExercise === ex ? colors.primary : colors.secondary,
                      borderColor: selectedExercise === ex ? colors.primary : colors.border,
                    },
                  ]}
                  onPress={() => setSelectedExercise(ex)}
                >
                  <Text
                    style={[
                      styles.exTabText,
                      { color: selectedExercise === ex ? "#fff" : colors.mutedForeground },
                    ]}
                  >
                    {ex}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            {strengthData.length >= 2 ? (
              <LineChart data={strengthData} colors={colors} />
            ) : (
              <View style={styles.noDataState}>
                <Ionicons name="trending-up-outline" size={32} color={colors.mutedForeground} />
                <Text style={[styles.noDataText, { color: colors.mutedForeground }]}>
                  Log {selectedExercise} to see progress
                </Text>
              </View>
            )}
          </View>

          {/* PRs */}
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.cardTitle, { color: colors.foreground }]}>Personal Records</Text>
            {prs.length === 0 ? (
              <View style={styles.noDataState}>
                <Ionicons name="trophy-outline" size={32} color={colors.mutedForeground} />
                <Text style={[styles.noDataText, { color: colors.mutedForeground }]}>
                  Hit new PRs during workouts
                </Text>
              </View>
            ) : (
              prs
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                .map((pr, i) => (
                  <View
                    key={i}
                    style={[styles.prRow, { borderBottomColor: colors.border }]}
                  >
                    <View>
                      <Text style={[styles.prName, { color: colors.foreground }]}>
                        {pr.exerciseName}
                      </Text>
                      <Text style={[styles.prDate, { color: colors.mutedForeground }]}>
                        {new Date(pr.date + "T00:00:00").toLocaleDateString()}
                      </Text>
                    </View>
                    <View style={styles.prRight}>
                      <Text style={[styles.prWeight, { color: colors.primary }]}>
                        {pr.weight}kg
                      </Text>
                      <Text style={[styles.prReps, { color: colors.mutedForeground }]}>
                        × {pr.reps} reps
                      </Text>
                    </View>
                  </View>
                ))
            )}
          </View>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  title: { fontSize: 32, fontFamily: "Inter_700Bold", marginBottom: 20 },
  card: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    marginBottom: 16,
  },
  cardTitle: { fontSize: 18, fontFamily: "Inter_700Bold", marginBottom: 4 },
  cardSub: { fontSize: 13, fontFamily: "Inter_400Regular", marginBottom: 16 },
  chartContainer: { marginTop: 8 },
  exTab: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
  },
  exTabText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  noDataState: { alignItems: "center", paddingVertical: 24, gap: 8 },
  noDataText: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center" },
  prRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  prName: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  prDate: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  prRight: { alignItems: "flex-end" },
  prWeight: { fontSize: 20, fontFamily: "Inter_700Bold" },
  prReps: { fontSize: 12, fontFamily: "Inter_400Regular" },
});

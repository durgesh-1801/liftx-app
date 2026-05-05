import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Platform,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";
import { LeaderboardEntry, getWeeklyLeaderboard } from "@/services/workoutService";

function RankBadge({ rank, colors }: { rank: number; colors: ReturnType<typeof useColors> }) {
  if (rank === 1) return <Ionicons name="trophy" size={20} color="#FFD700" />;
  if (rank === 2) return <Ionicons name="trophy" size={20} color="#C0C0C0" />;
  if (rank === 3) return <Ionicons name="trophy" size={20} color="#CD7F32" />;
  return (
    <Text style={[styles.rankNum, { color: colors.mutedForeground }]}>#{rank}</Text>
  );
}

function LeaderboardItem({
  entry,
  isMe,
  colors,
}: {
  entry: LeaderboardEntry;
  isMe: boolean;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <View
      style={[
        styles.item,
        {
          backgroundColor: isMe ? `${colors.primary}15` : colors.card,
          borderColor: isMe ? colors.primary : colors.border,
        },
      ]}
    >
      <View style={styles.rankCol}>
        <RankBadge rank={entry.rank} colors={colors} />
      </View>
      <View style={styles.nameCol}>
        <Text style={[styles.name, { color: colors.foreground }]}>
          {entry.displayName}
          {isMe ? " (you)" : ""}
        </Text>
      </View>
      <View style={styles.scoreCol}>
        <Text style={[styles.score, { color: colors.primary }]}>
          {entry.weeklyVolume >= 1000
            ? `${(entry.weeklyVolume / 1000).toFixed(1)}k`
            : entry.weeklyVolume.toLocaleString()}
        </Text>
        <Text style={[styles.scoreLabel, { color: colors.mutedForeground }]}>kg</Text>
      </View>
    </View>
  );
}

export default function LeaderboardScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      const data = await getWeeklyLeaderboard();
      setEntries(data);
    } catch (e) {
      console.warn("Leaderboard error", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { load(); }, []);

  const onRefresh = () => { setRefreshing(true); load(); };

  const topPad = insets.top + (Platform.OS === "web" ? 67 : 0);
  const myRank = entries.find((e) => e.userId === user?.uid);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 20 }]}>
        <Text style={[styles.title, { color: colors.foreground }]}>Leaderboard</Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          Weekly volume · resets Monday
        </Text>
      </View>

      {myRank && (
        <View style={[styles.myRankBanner, { backgroundColor: `${colors.primary}20`, borderColor: colors.primary }]}>
          <MaterialCommunityIcons name="podium" size={20} color={colors.primary} />
          <Text style={[styles.myRankText, { color: colors.primary }]}>
            Your rank: #{myRank.rank} · {myRank.weeklyVolume.toLocaleString()} kg this week
          </Text>
        </View>
      )}

      {loading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
      ) : entries.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="trophy-outline" size={56} color={colors.mutedForeground} />
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No athletes yet</Text>
          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
            Complete a workout this week to appear on the leaderboard
          </Text>
        </View>
      ) : (
        <FlatList
          data={entries}
          keyExtractor={(e) => e.userId}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
          }
          contentContainerStyle={{
            padding: 16,
            paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 100),
            gap: 8,
          }}
          ListHeaderComponent={
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderText, { color: colors.mutedForeground, flex: 0.6 }]}>RANK</Text>
              <Text style={[styles.tableHeaderText, { color: colors.mutedForeground, flex: 2 }]}>ATHLETE</Text>
              <Text style={[styles.tableHeaderText, { color: colors.mutedForeground, textAlign: "right" }]}>VOLUME</Text>
            </View>
          }
          renderItem={({ item }) => (
            <LeaderboardItem entry={item} isMe={item.userId === user?.uid} colors={colors} />
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingBottom: 12 },
  title: { fontSize: 32, fontFamily: "Inter_700Bold" },
  subtitle: { fontSize: 13, fontFamily: "Inter_400Regular", marginTop: 4 },
  myRankBanner: {
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  myRankText: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  tableHeader: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  tableHeaderText: { fontSize: 11, fontFamily: "Inter_600SemiBold", letterSpacing: 0.5 },
  item: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
  },
  rankCol: { width: 36, alignItems: "center" },
  rankNum: { fontSize: 15, fontFamily: "Inter_700Bold" },
  nameCol: { flex: 1, paddingHorizontal: 8 },
  name: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  scoreCol: { alignItems: "flex-end" },
  score: { fontSize: 20, fontFamily: "Inter_700Bold" },
  scoreLabel: { fontSize: 12, fontFamily: "Inter_400Regular" },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32, gap: 12 },
  emptyTitle: { fontSize: 22, fontFamily: "Inter_700Bold" },
  emptyText: { fontSize: 15, fontFamily: "Inter_400Regular", textAlign: "center" },
});

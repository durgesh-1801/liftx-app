import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  FlatList,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuth } from "@/context/AuthContext";
import { Exercise, ExerciseSet, useWorkout } from "@/context/WorkoutContext";
import { useColors } from "@/hooks/useColors";
import { EXERCISES, MUSCLE_GROUPS } from "@/constants/exercises";
import { saveWorkout } from "@/services/workoutService";

function PRCelebration({ exerciseName, weight, onDismiss, colors }: {
  exerciseName: string;
  weight: number;
  onDismiss: () => void;
  colors: ReturnType<typeof useColors>;
}) {
  const scale = useSharedValue(0.5);
  useEffect(() => {
    scale.value = withSpring(1, { damping: 8 });
  }, []);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return (
    <Modal transparent animationType="fade" onRequestClose={onDismiss}>
      <Pressable style={styles.prOverlay} onPress={onDismiss}>
        <Animated.View style={[styles.prCard, { backgroundColor: colors.card, borderColor: colors.primary }, animStyle]}>
          <Text style={styles.prEmoji}>🏆</Text>
          <Text style={[styles.prTitle, { color: colors.primary }]}>Personal Record!</Text>
          <Text style={[styles.prExercise, { color: colors.foreground }]}>{exerciseName}</Text>
          <Text style={[styles.prWeight, { color: colors.foreground }]}>{weight} kg</Text>
          <TouchableOpacity
            style={[styles.prDismiss, { backgroundColor: colors.primary }]}
            onPress={onDismiss}
          >
            <Text style={{ color: "#fff", fontFamily: "Inter_700Bold", fontSize: 16 }}>
              Awesome!
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

function SetRow({
  set,
  index,
  exerciseId,
  colors,
}: {
  set: ExerciseSet;
  index: number;
  exerciseId: string;
  colors: ReturnType<typeof useColors>;
}) {
  const { updateSet, toggleSet } = useWorkout();
  const [reps, setReps] = useState(set.reps.toString());
  const [weight, setWeight] = useState(set.weight.toString());
  const scale = useSharedValue(1);

  const handleToggle = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    updateSet(exerciseId, set.id, parseInt(reps) || 0, parseFloat(weight) || 0);
    toggleSet(exerciseId, set.id);
    scale.value = withSequence(withSpring(1.15, { damping: 4 }), withSpring(1));
  };

  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <View
      style={[
        styles.setRow,
        {
          backgroundColor: set.completed ? `${colors.primary}15` : colors.secondary,
          borderColor: set.completed ? colors.primary : "transparent",
        },
      ]}
    >
      <Text style={[styles.setIndex, { color: colors.mutedForeground }]}>{index + 1}</Text>
      <View style={styles.setInputGroup}>
        <TextInput
          style={[styles.setInput, { color: colors.foreground, borderColor: colors.border }]}
          value={weight}
          onChangeText={setWeight}
          keyboardType="decimal-pad"
          placeholder="0"
          placeholderTextColor={colors.mutedForeground}
          onEndEditing={() => updateSet(exerciseId, set.id, parseInt(reps) || 0, parseFloat(weight) || 0)}
        />
        <Text style={[styles.setUnit, { color: colors.mutedForeground }]}>kg</Text>
      </View>
      <Text style={[styles.setX, { color: colors.mutedForeground }]}>×</Text>
      <View style={styles.setInputGroup}>
        <TextInput
          style={[styles.setInput, { color: colors.foreground, borderColor: colors.border }]}
          value={reps}
          onChangeText={setReps}
          keyboardType="number-pad"
          placeholder="0"
          placeholderTextColor={colors.mutedForeground}
          onEndEditing={() => updateSet(exerciseId, set.id, parseInt(reps) || 0, parseFloat(weight) || 0)}
        />
        <Text style={[styles.setUnit, { color: colors.mutedForeground }]}>reps</Text>
      </View>
      <Animated.View style={animStyle}>
        <Pressable
          onPress={handleToggle}
          style={[
            styles.checkBtn,
            {
              backgroundColor: set.completed ? colors.primary : "transparent",
              borderColor: set.completed ? colors.primary : colors.border,
            },
          ]}
        >
          {set.completed && <Ionicons name="checkmark" size={16} color="#fff" />}
        </Pressable>
      </Animated.View>
    </View>
  );
}

function ExerciseCard({
  exercise,
  colors,
}: {
  exercise: Exercise;
  colors: ReturnType<typeof useColors>;
}) {
  const { addSet, removeExercise } = useWorkout();
  return (
    <Animated.View
      entering={FadeInDown.springify()}
      style={[styles.exerciseCard, { backgroundColor: colors.card, borderColor: colors.border }]}
    >
      <View style={styles.exerciseHeader}>
        <View>
          <Text style={[styles.exerciseName, { color: colors.foreground }]}>{exercise.name}</Text>
          <Text style={[styles.exerciseCategory, { color: colors.mutedForeground }]}>
            {exercise.category}
          </Text>
        </View>
        <Pressable onPress={() => removeExercise(exercise.id)}>
          <Ionicons name="close-circle" size={22} color={colors.mutedForeground} />
        </Pressable>
      </View>
      <View style={styles.setHeader}>
        <Text style={[styles.setHeaderText, { color: colors.mutedForeground, flex: 0.2 }]}>#</Text>
        <Text style={[styles.setHeaderText, { color: colors.mutedForeground, flex: 1 }]}>Weight</Text>
        <Text style={[styles.setHeaderText, { color: colors.mutedForeground, flex: 0.3 }]}></Text>
        <Text style={[styles.setHeaderText, { color: colors.mutedForeground, flex: 1 }]}>Reps</Text>
        <Text style={[styles.setHeaderText, { color: colors.mutedForeground, flex: 0.3 }]}></Text>
      </View>
      {exercise.sets.map((s, i) => (
        <SetRow key={s.id} set={s} index={i} exerciseId={exercise.id} colors={colors} />
      ))}
      <Pressable
        style={[styles.addSetBtn, { borderColor: colors.border }]}
        onPress={() => addSet(exercise.id)}
      >
        <Ionicons name="add" size={16} color={colors.primary} />
        <Text style={[styles.addSetText, { color: colors.primary }]}>Add Set</Text>
      </Pressable>
    </Animated.View>
  );
}

function Timer({ startTime, colors }: { startTime: number; colors: ReturnType<typeof useColors> }) {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [startTime]);
  const h = Math.floor(elapsed / 3600);
  const m = Math.floor((elapsed % 3600) / 60);
  const s = elapsed % 60;
  const fmt = h > 0
    ? `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`
    : `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  return (
    <Text style={[styles.timerText, { color: colors.mutedForeground }]}>
      <Ionicons name="time-outline" size={13} color={colors.mutedForeground} /> {fmt}
    </Text>
  );
}

export default function WorkoutLogger() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { activeWorkout, addExercise, endWorkout } = useWorkout();
  const { user, refreshProfile } = useAuth();
  const [showExercisePicker, setShowExercisePicker] = useState(false);
  const [muscleFilter, setMuscleFilter] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [prNotification, setPrNotification] = useState<{ name: string; weight: number } | null>(null);
  const [finishing, setFinishing] = useState(false);

  const filteredExercises = EXERCISES.filter((e) => {
    const matchesMuscle = !muscleFilter || e.muscleGroup === muscleFilter;
    const matchesSearch = !search || e.name.toLowerCase().includes(search.toLowerCase());
    return matchesMuscle && matchesSearch;
  });

  const handleFinish = async () => {
    if (!activeWorkout || !user) return;
    const completedSets = activeWorkout.exercises.reduce(
      (t, ex) => t + ex.sets.filter((s) => s.completed).length,
      0
    );
    if (completedSets === 0) {
      Alert.alert("No sets completed", "Complete at least one set before finishing.");
      return;
    }
    setFinishing(true);
    try {
      const duration = Math.floor((Date.now() - activeWorkout.startTime) / 1000);
      const workout = endWorkout();
      if (workout) {
        const { newPRs } = await saveWorkout(user.uid, workout, duration);
        await refreshProfile();
        if (newPRs.length > 0) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          setPrNotification({ name: newPRs[0].exerciseName, weight: newPRs[0].weight });
          setTimeout(() => {
            setPrNotification(null);
            router.replace("/(tabs)");
          }, 3000);
          return;
        }
      }
      router.replace("/(tabs)");
    } catch (e) {
      Alert.alert("Error", "Failed to save workout. Try again.");
    } finally {
      setFinishing(false);
    }
  };

  const topPad = insets.top + (Platform.OS === "web" ? 67 : 0);

  if (!activeWorkout) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, paddingTop: topPad + 20 }]}>
        <Text style={[styles.noWorkout, { color: colors.mutedForeground }]}>
          No active workout
        </Text>
        <Pressable
          onPress={() => router.back()}
          style={[styles.backHomeBtn, { backgroundColor: colors.primary }]}
        >
          <Text style={{ color: "#fff", fontFamily: "Inter_600SemiBold" }}>Go Back</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View
        style={[
          styles.header,
          {
            paddingTop: topPad + 16,
            borderBottomColor: colors.border,
            backgroundColor: colors.background,
          },
        ]}
      >
        <Pressable onPress={() => router.back()}>
          <Ionicons name="chevron-down" size={28} color={colors.foreground} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>Workout</Text>
          <Timer startTime={activeWorkout.startTime} colors={colors} />
        </View>
        <Pressable
          style={[styles.finishBtn, { backgroundColor: finishing ? colors.muted : colors.primary }]}
          onPress={handleFinish}
          disabled={finishing}
        >
          <Text style={[styles.finishBtnText, { color: finishing ? colors.mutedForeground : "#fff" }]}>
            Finish
          </Text>
        </Pressable>
      </View>

      <FlatList
        data={activeWorkout.exercises}
        keyExtractor={(ex) => ex.id}
        renderItem={({ item }) => <ExerciseCard exercise={item} colors={colors} />}
        contentContainerStyle={{
          padding: 16,
          paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 120),
          gap: 12,
        }}
        ListFooterComponent={
          <Pressable
            style={[styles.addExerciseBtn, { borderColor: colors.primary }]}
            onPress={() => setShowExercisePicker(true)}
          >
            <Ionicons name="add-circle" size={22} color={colors.primary} />
            <Text style={[styles.addExerciseText, { color: colors.primary }]}>Add Exercise</Text>
          </Pressable>
        }
      />

      {/* Exercise picker modal */}
      <Modal
        visible={showExercisePicker}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowExercisePicker(false)}
      >
        <View style={[styles.modal, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>Add Exercise</Text>
            <Pressable onPress={() => setShowExercisePicker(false)}>
              <Ionicons name="close" size={24} color={colors.foreground} />
            </Pressable>
          </View>
          <View style={[styles.searchRow, { backgroundColor: colors.input, borderColor: colors.border }]}>
            <Ionicons name="search" size={16} color={colors.mutedForeground} />
            <TextInput
              style={[styles.searchInput, { color: colors.foreground }]}
              value={search}
              onChangeText={setSearch}
              placeholder="Search exercises..."
              placeholderTextColor={colors.mutedForeground}
            />
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
            {[null, ...MUSCLE_GROUPS].map((g) => (
              <Pressable
                key={g ?? "all"}
                style={[
                  styles.filterChip,
                  {
                    backgroundColor: muscleFilter === g ? colors.primary : colors.secondary,
                    borderColor: muscleFilter === g ? colors.primary : colors.border,
                  },
                ]}
                onPress={() => setMuscleFilter(g)}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    { color: muscleFilter === g ? "#fff" : colors.mutedForeground },
                  ]}
                >
                  {g ?? "All"}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
          <FlatList
            data={filteredExercises}
            keyExtractor={(e) => e.name}
            renderItem={({ item }) => (
              <Pressable
                style={[styles.exerciseRow, { borderBottomColor: colors.border }]}
                onPress={() => {
                  addExercise(item.name, item.category);
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setShowExercisePicker(false);
                }}
              >
                <View>
                  <Text style={[styles.exerciseRowName, { color: colors.foreground }]}>
                    {item.name}
                  </Text>
                  <Text style={[styles.exerciseRowSub, { color: colors.mutedForeground }]}>
                    {item.muscleGroup} · {item.category}
                  </Text>
                </View>
                <Ionicons name="add" size={22} color={colors.primary} />
              </Pressable>
            )}
          />
        </View>
      </Modal>

      {prNotification && (
        <PRCelebration
          exerciseName={prNotification.name}
          weight={prNotification.weight}
          onDismiss={() => {
            setPrNotification(null);
            router.replace("/(tabs)");
          }}
          colors={colors}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  headerCenter: { alignItems: "center" },
  headerTitle: { fontSize: 17, fontFamily: "Inter_700Bold" },
  timerText: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  finishBtn: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 20,
  },
  finishBtnText: { fontSize: 15, fontFamily: "Inter_700Bold" },
  exerciseCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    gap: 8,
  },
  exerciseHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  exerciseName: { fontSize: 17, fontFamily: "Inter_700Bold" },
  exerciseCategory: { fontSize: 13, fontFamily: "Inter_400Regular" },
  setHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 4,
    marginBottom: 4,
  },
  setHeaderText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  setRow: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 8,
    borderWidth: 1,
  },
  setIndex: { width: 20, fontSize: 13, fontFamily: "Inter_600SemiBold" },
  setInputGroup: { flex: 1, flexDirection: "row", alignItems: "center", gap: 4 },
  setInput: {
    flex: 1,
    textAlign: "center",
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    borderBottomWidth: 1,
    paddingVertical: 2,
  },
  setUnit: { fontSize: 11, fontFamily: "Inter_400Regular" },
  setX: { fontSize: 16, fontFamily: "Inter_400Regular" },
  checkBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  addSetBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderWidth: 1,
    borderRadius: 10,
    marginTop: 4,
    borderStyle: "dashed",
  },
  addSetText: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  addExerciseBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 2,
    borderStyle: "dashed",
    marginTop: 4,
  },
  addExerciseText: { fontSize: 16, fontFamily: "Inter_700Bold" },
  modal: { flex: 1 },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
  },
  modalTitle: { fontSize: 18, fontFamily: "Inter_700Bold" },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    margin: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  searchInput: { flex: 1, fontSize: 15, fontFamily: "Inter_400Regular" },
  filterRow: { paddingLeft: 16, marginBottom: 8 },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
  },
  filterChipText: { fontSize: 13, fontFamily: "Inter_500Medium" },
  exerciseRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  exerciseRowName: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  exerciseRowSub: { fontSize: 13, fontFamily: "Inter_400Regular" },
  prOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.8)",
    alignItems: "center",
    justifyContent: "center",
  },
  prCard: {
    width: 300,
    borderRadius: 24,
    padding: 32,
    alignItems: "center",
    gap: 8,
    borderWidth: 2,
  },
  prEmoji: { fontSize: 56 },
  prTitle: { fontSize: 24, fontFamily: "Inter_700Bold", marginTop: 8 },
  prExercise: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  prWeight: { fontSize: 40, fontFamily: "Inter_700Bold", marginTop: 4 },
  prDismiss: {
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 16,
  },
  noWorkout: { textAlign: "center", fontSize: 16, fontFamily: "Inter_400Regular" },
  backHomeBtn: {
    margin: 20,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
});

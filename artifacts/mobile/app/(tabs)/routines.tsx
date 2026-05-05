import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useState } from "react";
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
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Routine, useWorkout } from "@/context/WorkoutContext";
import { useColors } from "@/hooks/useColors";
import { EXERCISES, MUSCLE_GROUPS } from "@/constants/exercises";

interface SelectedExercise {
  name: string;
  category: string;
  defaultSets: number;
  defaultReps: number;
}

export default function RoutinesScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { routines, saveRoutine, deleteRoutine, startWorkout } = useWorkout();
  const [showBuilder, setShowBuilder] = useState(false);
  const [routineName, setRoutineName] = useState("");
  const [selectedExercises, setSelectedExercises] = useState<SelectedExercise[]>([]);
  const [muscleFilter, setMuscleFilter] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const filteredExercises = EXERCISES.filter((e) => {
    const matchesMuscle = !muscleFilter || e.muscleGroup === muscleFilter;
    const matchesSearch = !search || e.name.toLowerCase().includes(search.toLowerCase());
    return matchesMuscle && matchesSearch;
  });

  const toggleExercise = (name: string, category: string) => {
    const exists = selectedExercises.find((e) => e.name === name);
    if (exists) {
      setSelectedExercises(selectedExercises.filter((e) => e.name !== name));
    } else {
      setSelectedExercises([...selectedExercises, { name, category, defaultSets: 3, defaultReps: 8 }]);
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleSave = () => {
    if (!routineName.trim()) {
      Alert.alert("Name required", "Please give your routine a name");
      return;
    }
    if (selectedExercises.length === 0) {
      Alert.alert("No exercises", "Add at least one exercise");
      return;
    }
    saveRoutine({ name: routineName.trim(), exercises: selectedExercises });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setShowBuilder(false);
    setRoutineName("");
    setSelectedExercises([]);
  };

  const handleDelete = (r: Routine) => {
    Alert.alert("Delete Routine", `Delete "${r.name}"?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => deleteRoutine(r.id),
      },
    ]);
  };

  const topPad = insets.top + (Platform.OS === "web" ? 67 : 0);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 20 }]}>
        <Text style={[styles.title, { color: colors.foreground }]}>Routines</Text>
        <Pressable
          style={[styles.addBtn, { backgroundColor: colors.primary }]}
          onPress={() => setShowBuilder(true)}
        >
          <Ionicons name="add" size={20} color="#fff" />
        </Pressable>
      </View>

      {routines.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="clipboard-outline" size={48} color={colors.mutedForeground} />
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No routines yet</Text>
          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
            Create a routine to speed up your workouts
          </Text>
          <Pressable
            style={[styles.createBtn, { backgroundColor: colors.primary }]}
            onPress={() => setShowBuilder(true)}
          >
            <Text style={{ color: "#fff", fontFamily: "Inter_700Bold", fontSize: 16 }}>
              Create Routine
            </Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={routines}
          keyExtractor={(r) => r.id}
          contentContainerStyle={{
            padding: 16,
            paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 100),
            gap: 12,
          }}
          renderItem={({ item }) => (
            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.cardTop}>
                <View style={styles.cardLeft}>
                  <Text style={[styles.cardName, { color: colors.foreground }]}>{item.name}</Text>
                  <Text style={[styles.cardSub, { color: colors.mutedForeground }]}>
                    {item.exercises.length} exercises
                  </Text>
                </View>
                <Pressable onPress={() => handleDelete(item)}>
                  <Ionicons name="trash-outline" size={20} color={colors.destructive} />
                </Pressable>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 10 }}>
                {item.exercises.map((e, i) => (
                  <View
                    key={i}
                    style={[styles.exChip, { backgroundColor: colors.secondary, borderColor: colors.border }]}
                  >
                    <Text style={[styles.exChipText, { color: colors.foreground }]}>{e.name}</Text>
                  </View>
                ))}
              </ScrollView>
              <Pressable
                style={[styles.startBtn, { backgroundColor: colors.primary }]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                  startWorkout(item);
                  router.push("/(workout)/logger");
                }}
              >
                <Ionicons name="barbell" size={18} color="#fff" />
                <Text style={styles.startBtnText}>Start</Text>
              </Pressable>
            </View>
          )}
        />
      )}

      {/* Builder Modal */}
      <Modal visible={showBuilder} animationType="slide" presentationStyle="pageSheet">
        <View style={[styles.modal, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <Pressable onPress={() => { setShowBuilder(false); setRoutineName(""); setSelectedExercises([]); }}>
              <Ionicons name="close" size={24} color={colors.foreground} />
            </Pressable>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>New Routine</Text>
            <TouchableOpacity onPress={handleSave}>
              <Text style={[styles.saveText, { color: colors.primary }]}>Save</Text>
            </TouchableOpacity>
          </View>

          <View style={{ padding: 16 }}>
            <TextInput
              style={[
                styles.nameInput,
                { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.input },
              ]}
              value={routineName}
              onChangeText={setRoutineName}
              placeholder="Routine name (e.g. Push Day)"
              placeholderTextColor={colors.mutedForeground}
            />
          </View>

          {selectedExercises.length > 0 && (
            <View style={{ paddingHorizontal: 16, marginBottom: 8 }}>
              <Text style={[styles.selectedLabel, { color: colors.mutedForeground }]}>
                Selected ({selectedExercises.length})
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {selectedExercises.map((e) => (
                  <Pressable
                    key={e.name}
                    style={[styles.selectedChip, { backgroundColor: `${colors.primary}20`, borderColor: colors.primary }]}
                    onPress={() => toggleExercise(e.name, e.category)}
                  >
                    <Text style={[styles.selectedChipText, { color: colors.primary }]}>{e.name}</Text>
                    <Ionicons name="close-circle" size={14} color={colors.primary} />
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          )}

          <View style={[styles.searchRow, { backgroundColor: colors.input, borderColor: colors.border, marginHorizontal: 16 }]}>
            <Ionicons name="search" size={16} color={colors.mutedForeground} />
            <TextInput
              style={[styles.searchInput, { color: colors.foreground }]}
              value={search}
              onChangeText={setSearch}
              placeholder="Search exercises..."
              placeholderTextColor={colors.mutedForeground}
            />
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ paddingLeft: 16, marginTop: 8 }}>
            {[null, ...MUSCLE_GROUPS].map((g) => (
              <Pressable
                key={g ?? "all"}
                style={[
                  styles.filterChip,
                  { backgroundColor: muscleFilter === g ? colors.primary : colors.secondary, borderColor: muscleFilter === g ? colors.primary : colors.border },
                ]}
                onPress={() => setMuscleFilter(g)}
              >
                <Text style={[styles.filterChipText, { color: muscleFilter === g ? "#fff" : colors.mutedForeground }]}>
                  {g ?? "All"}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
          <FlatList
            data={filteredExercises}
            keyExtractor={(e) => e.name}
            renderItem={({ item }) => {
              const selected = !!selectedExercises.find((e) => e.name === item.name);
              return (
                <Pressable
                  style={[
                    styles.exerciseRow,
                    {
                      borderBottomColor: colors.border,
                      backgroundColor: selected ? `${colors.primary}10` : "transparent",
                    },
                  ]}
                  onPress={() => toggleExercise(item.name, item.category)}
                >
                  <View>
                    <Text style={[styles.exerciseRowName, { color: colors.foreground }]}>
                      {item.name}
                    </Text>
                    <Text style={[styles.exerciseRowSub, { color: colors.mutedForeground }]}>
                      {item.muscleGroup} · {item.category}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.checkbox,
                      { borderColor: selected ? colors.primary : colors.border, backgroundColor: selected ? colors.primary : "transparent" },
                    ]}
                  >
                    {selected && <Ionicons name="checkmark" size={14} color="#fff" />}
                  </View>
                </Pressable>
              );
            }}
          />
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  title: { fontSize: 32, fontFamily: "Inter_700Bold" },
  addBtn: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32, gap: 12 },
  emptyTitle: { fontSize: 22, fontFamily: "Inter_700Bold" },
  emptyText: { fontSize: 15, fontFamily: "Inter_400Regular", textAlign: "center" },
  createBtn: { paddingHorizontal: 28, paddingVertical: 14, borderRadius: 12, marginTop: 8 },
  card: { borderRadius: 16, padding: 16, borderWidth: 1 },
  cardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  cardLeft: {},
  cardName: { fontSize: 18, fontFamily: "Inter_700Bold" },
  cardSub: { fontSize: 13, fontFamily: "Inter_400Regular" },
  exChip: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5, marginRight: 6, borderWidth: 1 },
  exChipText: { fontSize: 12, fontFamily: "Inter_500Medium" },
  startBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: 12,
    paddingVertical: 12,
    borderRadius: 10,
  },
  startBtnText: { color: "#fff", fontFamily: "Inter_700Bold", fontSize: 15 },
  modal: { flex: 1 },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
  },
  modalTitle: { fontSize: 18, fontFamily: "Inter_700Bold" },
  saveText: { fontSize: 16, fontFamily: "Inter_700Bold" },
  nameInput: {
    height: 48,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 14,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    marginBottom: 4,
  },
  selectedLabel: { fontSize: 12, fontFamily: "Inter_600SemiBold", marginBottom: 8 },
  selectedChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    marginRight: 6,
  },
  selectedChipText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 4,
  },
  searchInput: { flex: 1, fontSize: 15, fontFamily: "Inter_400Regular" },
  filterChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, marginRight: 8, borderWidth: 1 },
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
  checkbox: { width: 24, height: 24, borderRadius: 6, borderWidth: 2, alignItems: "center", justifyContent: "center" },
});

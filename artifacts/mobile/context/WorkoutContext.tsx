import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useState } from "react";

export interface ExerciseSet {
  id: string;
  reps: number;
  weight: number;
  completed: boolean;
}

export interface Exercise {
  id: string;
  name: string;
  sets: ExerciseSet[];
  category: string;
}

export interface ActiveWorkout {
  id: string;
  startTime: number;
  exercises: Exercise[];
  notes: string;
}

export interface Routine {
  id: string;
  name: string;
  exercises: { name: string; category: string; defaultSets: number; defaultReps: number }[];
  createdAt: string;
}

interface WorkoutContextType {
  activeWorkout: ActiveWorkout | null;
  routines: Routine[];
  startWorkout: (routine?: Routine) => void;
  endWorkout: () => ActiveWorkout | null;
  addExercise: (name: string, category: string) => void;
  addSet: (exerciseId: string) => void;
  updateSet: (exerciseId: string, setId: string, reps: number, weight: number) => void;
  toggleSet: (exerciseId: string, setId: string) => void;
  removeExercise: (exerciseId: string) => void;
  saveRoutine: (routine: Omit<Routine, "id" | "createdAt">) => void;
  deleteRoutine: (id: string) => void;
}

const WorkoutContext = createContext<WorkoutContextType | null>(null);

function genId() {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}

export function WorkoutProvider({ children }: { children: React.ReactNode }) {
  const [activeWorkout, setActiveWorkout] = useState<ActiveWorkout | null>(null);
  const [routines, setRoutines] = useState<Routine[]>([]);

  useEffect(() => {
    AsyncStorage.getItem("routines").then((data) => {
      if (data) setRoutines(JSON.parse(data));
    });
    AsyncStorage.getItem("activeWorkout").then((data) => {
      if (data) setActiveWorkout(JSON.parse(data));
    });
  }, []);

  const persistRoutines = (r: Routine[]) => {
    setRoutines(r);
    AsyncStorage.setItem("routines", JSON.stringify(r));
  };

  const persistActiveWorkout = (w: ActiveWorkout | null) => {
    setActiveWorkout(w);
    if (w) AsyncStorage.setItem("activeWorkout", JSON.stringify(w));
    else AsyncStorage.removeItem("activeWorkout");
  };

  const startWorkout = (routine?: Routine) => {
    const exercises: Exercise[] = routine
      ? routine.exercises.map((e) => ({
          id: genId(),
          name: e.name,
          category: e.category,
          sets: Array.from({ length: e.defaultSets }, () => ({
            id: genId(),
            reps: e.defaultReps,
            weight: 0,
            completed: false,
          })),
        }))
      : [];
    persistActiveWorkout({
      id: genId(),
      startTime: Date.now(),
      exercises,
      notes: "",
    });
  };

  const endWorkout = (): ActiveWorkout | null => {
    const w = activeWorkout;
    persistActiveWorkout(null);
    return w;
  };

  const addExercise = (name: string, category: string) => {
    if (!activeWorkout) return;
    const updated = {
      ...activeWorkout,
      exercises: [
        ...activeWorkout.exercises,
        {
          id: genId(),
          name,
          category,
          sets: [{ id: genId(), reps: 8, weight: 0, completed: false }],
        },
      ],
    };
    persistActiveWorkout(updated);
  };

  const addSet = (exerciseId: string) => {
    if (!activeWorkout) return;
    const updated = {
      ...activeWorkout,
      exercises: activeWorkout.exercises.map((ex) => {
        if (ex.id !== exerciseId) return ex;
        const last = ex.sets[ex.sets.length - 1];
        return {
          ...ex,
          sets: [
            ...ex.sets,
            { id: genId(), reps: last?.reps ?? 8, weight: last?.weight ?? 0, completed: false },
          ],
        };
      }),
    };
    persistActiveWorkout(updated);
  };

  const updateSet = (exerciseId: string, setId: string, reps: number, weight: number) => {
    if (!activeWorkout) return;
    const updated = {
      ...activeWorkout,
      exercises: activeWorkout.exercises.map((ex) => {
        if (ex.id !== exerciseId) return ex;
        return {
          ...ex,
          sets: ex.sets.map((s) => (s.id === setId ? { ...s, reps, weight } : s)),
        };
      }),
    };
    persistActiveWorkout(updated);
  };

  const toggleSet = (exerciseId: string, setId: string) => {
    if (!activeWorkout) return;
    const updated = {
      ...activeWorkout,
      exercises: activeWorkout.exercises.map((ex) => {
        if (ex.id !== exerciseId) return ex;
        return {
          ...ex,
          sets: ex.sets.map((s) => (s.id === setId ? { ...s, completed: !s.completed } : s)),
        };
      }),
    };
    persistActiveWorkout(updated);
  };

  const removeExercise = (exerciseId: string) => {
    if (!activeWorkout) return;
    persistActiveWorkout({
      ...activeWorkout,
      exercises: activeWorkout.exercises.filter((ex) => ex.id !== exerciseId),
    });
  };

  const saveRoutine = (routine: Omit<Routine, "id" | "createdAt">) => {
    const newRoutine: Routine = {
      ...routine,
      id: genId(),
      createdAt: new Date().toISOString(),
    };
    persistRoutines([...routines, newRoutine]);
  };

  const deleteRoutine = (id: string) => {
    persistRoutines(routines.filter((r) => r.id !== id));
  };

  return (
    <WorkoutContext.Provider
      value={{
        activeWorkout,
        routines,
        startWorkout,
        endWorkout,
        addExercise,
        addSet,
        updateSet,
        toggleSet,
        removeExercise,
        saveRoutine,
        deleteRoutine,
      }}
    >
      {children}
    </WorkoutContext.Provider>
  );
}

export function useWorkout() {
  const ctx = useContext(WorkoutContext);
  if (!ctx) throw new Error("useWorkout must be used within WorkoutProvider");
  return ctx;
}

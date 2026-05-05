export interface ExerciseTemplate {
  name: string;
  category: string;
  muscleGroup: string;
}

export const EXERCISES: ExerciseTemplate[] = [
  // Chest
  { name: "Bench Press", category: "Barbell", muscleGroup: "Chest" },
  { name: "Incline Bench Press", category: "Barbell", muscleGroup: "Chest" },
  { name: "Decline Bench Press", category: "Barbell", muscleGroup: "Chest" },
  { name: "Dumbbell Fly", category: "Dumbbell", muscleGroup: "Chest" },
  { name: "Incline Dumbbell Press", category: "Dumbbell", muscleGroup: "Chest" },
  { name: "Cable Fly", category: "Cable", muscleGroup: "Chest" },
  { name: "Push-Up", category: "Bodyweight", muscleGroup: "Chest" },
  { name: "Chest Dip", category: "Bodyweight", muscleGroup: "Chest" },

  // Back
  { name: "Deadlift", category: "Barbell", muscleGroup: "Back" },
  { name: "Barbell Row", category: "Barbell", muscleGroup: "Back" },
  { name: "Pull-Up", category: "Bodyweight", muscleGroup: "Back" },
  { name: "Chin-Up", category: "Bodyweight", muscleGroup: "Back" },
  { name: "Lat Pulldown", category: "Cable", muscleGroup: "Back" },
  { name: "Cable Row", category: "Cable", muscleGroup: "Back" },
  { name: "Dumbbell Row", category: "Dumbbell", muscleGroup: "Back" },
  { name: "T-Bar Row", category: "Barbell", muscleGroup: "Back" },

  // Shoulders
  { name: "Overhead Press", category: "Barbell", muscleGroup: "Shoulders" },
  { name: "Dumbbell Shoulder Press", category: "Dumbbell", muscleGroup: "Shoulders" },
  { name: "Lateral Raise", category: "Dumbbell", muscleGroup: "Shoulders" },
  { name: "Front Raise", category: "Dumbbell", muscleGroup: "Shoulders" },
  { name: "Rear Delt Fly", category: "Dumbbell", muscleGroup: "Shoulders" },
  { name: "Cable Lateral Raise", category: "Cable", muscleGroup: "Shoulders" },
  { name: "Arnold Press", category: "Dumbbell", muscleGroup: "Shoulders" },

  // Arms
  { name: "Barbell Curl", category: "Barbell", muscleGroup: "Biceps" },
  { name: "Dumbbell Curl", category: "Dumbbell", muscleGroup: "Biceps" },
  { name: "Hammer Curl", category: "Dumbbell", muscleGroup: "Biceps" },
  { name: "Cable Curl", category: "Cable", muscleGroup: "Biceps" },
  { name: "Preacher Curl", category: "Barbell", muscleGroup: "Biceps" },
  { name: "Tricep Pushdown", category: "Cable", muscleGroup: "Triceps" },
  { name: "Skull Crusher", category: "Barbell", muscleGroup: "Triceps" },
  { name: "Tricep Dip", category: "Bodyweight", muscleGroup: "Triceps" },
  { name: "Overhead Tricep Extension", category: "Dumbbell", muscleGroup: "Triceps" },
  { name: "Close-Grip Bench Press", category: "Barbell", muscleGroup: "Triceps" },

  // Legs
  { name: "Squat", category: "Barbell", muscleGroup: "Quads" },
  { name: "Front Squat", category: "Barbell", muscleGroup: "Quads" },
  { name: "Leg Press", category: "Machine", muscleGroup: "Quads" },
  { name: "Hack Squat", category: "Machine", muscleGroup: "Quads" },
  { name: "Leg Extension", category: "Machine", muscleGroup: "Quads" },
  { name: "Romanian Deadlift", category: "Barbell", muscleGroup: "Hamstrings" },
  { name: "Leg Curl", category: "Machine", muscleGroup: "Hamstrings" },
  { name: "Good Morning", category: "Barbell", muscleGroup: "Hamstrings" },
  { name: "Bulgarian Split Squat", category: "Dumbbell", muscleGroup: "Quads" },
  { name: "Lunge", category: "Bodyweight", muscleGroup: "Quads" },
  { name: "Calf Raise", category: "Machine", muscleGroup: "Calves" },
  { name: "Seated Calf Raise", category: "Machine", muscleGroup: "Calves" },
  { name: "Hip Thrust", category: "Barbell", muscleGroup: "Glutes" },
  { name: "Glute Bridge", category: "Bodyweight", muscleGroup: "Glutes" },

  // Core
  { name: "Plank", category: "Bodyweight", muscleGroup: "Core" },
  { name: "Crunch", category: "Bodyweight", muscleGroup: "Core" },
  { name: "Leg Raise", category: "Bodyweight", muscleGroup: "Core" },
  { name: "Cable Crunch", category: "Cable", muscleGroup: "Core" },
  { name: "Russian Twist", category: "Bodyweight", muscleGroup: "Core" },
  { name: "Ab Wheel Rollout", category: "Bodyweight", muscleGroup: "Core" },
];

export const MUSCLE_GROUPS = [...new Set(EXERCISES.map((e) => e.muscleGroup))].sort();
export const CATEGORIES = [...new Set(EXERCISES.map((e) => e.category))].sort();

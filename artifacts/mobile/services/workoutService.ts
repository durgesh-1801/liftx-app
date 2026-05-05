import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "@/services/firebase";
import { ActiveWorkout } from "@/context/WorkoutContext";

export interface CompletedWorkout {
  id: string;
  userId: string;
  date: string;
  duration: number;
  exercises: {
    name: string;
    category: string;
    sets: { reps: number; weight: number; completed: boolean }[];
  }[];
  totalVolume: number;
  totalSets: number;
}

export interface PR {
  exerciseName: string;
  weight: number;
  reps: number;
  date: string;
}

export interface LeaderboardEntry {
  userId: string;
  displayName: string;
  weeklyVolume: number;
  rank: number;
}

function calcVolume(workout: ActiveWorkout): number {
  return workout.exercises.reduce((total, ex) => {
    return (
      total +
      ex.sets
        .filter((s) => s.completed)
        .reduce((setTotal, s) => setTotal + s.reps * s.weight, 0)
    );
  }, 0);
}

function getWeekStart(): string {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(now.setDate(diff));
  monday.setHours(0, 0, 0, 0);
  return monday.toISOString().split("T")[0];
}

export async function saveWorkout(
  userId: string,
  workout: ActiveWorkout,
  duration: number
): Promise<{ newPRs: PR[] }> {
  const totalVolume = calcVolume(workout);
  const date = new Date().toISOString().split("T")[0];

  const completedWorkout: Omit<CompletedWorkout, "id"> = {
    userId,
    date,
    duration,
    exercises: workout.exercises.map((ex) => ({
      name: ex.name,
      category: ex.category,
      sets: ex.sets.map((s) => ({ reps: s.reps, weight: s.weight, completed: s.completed })),
    })),
    totalVolume,
    totalSets: workout.exercises.reduce(
      (t, ex) => t + ex.sets.filter((s) => s.completed).length,
      0
    ),
  };

  await addDoc(collection(db, "workouts"), {
    ...completedWorkout,
    createdAt: serverTimestamp(),
  });

  // Detect PRs
  const newPRs: PR[] = [];
  for (const ex of workout.exercises) {
    for (const s of ex.sets.filter((s) => s.completed && s.weight > 0)) {
      const prRef = doc(db, "prs", `${userId}_${ex.name.replace(/\s+/g, "_")}`);
      const prSnap = await getDoc(prRef);
      if (!prSnap.exists() || prSnap.data().weight < s.weight) {
        await setDoc(prRef, {
          userId,
          exerciseName: ex.name,
          weight: s.weight,
          reps: s.reps,
          date,
        });
        newPRs.push({ exerciseName: ex.name, weight: s.weight, reps: s.reps, date });
      }
    }
  }

  // Update weekly leaderboard
  const weekStart = getWeekStart();
  const lbRef = doc(db, "leaderboard_weekly", `${userId}_${weekStart}`);
  const lbSnap = await getDoc(lbRef);
  if (lbSnap.exists()) {
    await updateDoc(lbRef, { volume: (lbSnap.data().volume || 0) + totalVolume });
  } else {
    // Get display name
    const userDoc = await getDoc(doc(db, "users", userId));
    const displayName = userDoc.exists() ? userDoc.data().displayName : "Athlete";
    await setDoc(lbRef, {
      userId,
      displayName,
      weekStart,
      volume: totalVolume,
    });
  }

  // Update user stats + streak
  const userRef = doc(db, "users", userId);
  const userSnap = await getDoc(userRef);
  if (userSnap.exists()) {
    const userData = userSnap.data();
    const lastDate = userData.lastWorkoutDate;
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yStr = yesterday.toISOString().split("T")[0];
    const streak =
      lastDate === yStr || lastDate === date
        ? (userData.streak || 0) + (lastDate === date ? 0 : 1)
        : 1;
    await updateDoc(userRef, {
      totalWorkouts: (userData.totalWorkouts || 0) + 1,
      streak,
      lastWorkoutDate: date,
    });
  }

  return { newPRs };
}

export async function getWorkoutHistory(userId: string, limitCount = 20): Promise<CompletedWorkout[]> {
  const q = query(
    collection(db, "workouts"),
    where("userId", "==", userId),
    orderBy("date", "desc"),
    limit(limitCount)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as CompletedWorkout));
}

export async function getUserPRs(userId: string): Promise<PR[]> {
  const q = query(collection(db, "prs"), where("userId", "==", userId));
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data() as PR);
}

export async function getWeeklyLeaderboard(): Promise<LeaderboardEntry[]> {
  const weekStart = getWeekStart();
  const q = query(
    collection(db, "leaderboard_weekly"),
    where("weekStart", "==", weekStart),
    orderBy("volume", "desc"),
    limit(50)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d, i) => ({
    userId: d.data().userId,
    displayName: d.data().displayName,
    weeklyVolume: d.data().volume,
    rank: i + 1,
  }));
}

export async function getVolumeByWeek(
  userId: string
): Promise<{ week: string; volume: number }[]> {
  const q = query(
    collection(db, "leaderboard_weekly"),
    where("userId", "==", userId),
    orderBy("weekStart", "asc"),
    limit(12)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({
    week: d.data().weekStart,
    volume: d.data().volume,
  }));
}

export async function getStrengthProgress(
  userId: string,
  exerciseName: string
): Promise<{ date: string; weight: number }[]> {
  const q = query(
    collection(db, "workouts"),
    where("userId", "==", userId),
    orderBy("date", "asc"),
    limit(30)
  );
  const snap = await getDocs(q);
  const results: { date: string; weight: number }[] = [];
  for (const d of snap.docs) {
    const w = d.data();
    const ex = w.exercises?.find(
      (e: { name: string }) => e.name === exerciseName
    );
    if (ex) {
      const maxWeight = Math.max(...(ex.sets?.map((s: { weight: number }) => s.weight) ?? [0]));
      if (maxWeight > 0) results.push({ date: w.date, weight: maxWeight });
    }
  }
  return results;
}

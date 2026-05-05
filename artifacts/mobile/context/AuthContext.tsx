import React, { createContext, useContext, useEffect, useState } from "react";
import {
  User,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { auth, db } from "@/services/firebase";

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  totalWorkouts: number;
  streak: number;
  lastWorkoutDate: string | null;
  createdAt: string;
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName: string) => Promise<void>;
  logOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (uid: string) => {
    try {
      const snap = await getDoc(doc(db, "users", uid));
      if (snap.exists()) {
        setProfile(snap.data() as UserProfile);
      }
    } catch (e) {
      console.warn("fetchProfile error:", e);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      // Clear loading immediately — don't block on Firestore fetch
      setLoading(false);
      if (firebaseUser) {
        // Fetch profile in background, non-blocking
        fetchProfile(firebaseUser.uid);
      } else {
        setProfile(null);
      }
    });
    return unsubscribe;
  }, []);

  const signIn = async (email: string, password: string) => {
    // Just authenticate — onAuthStateChanged handles the rest
    await signInWithEmailAndPassword(auth, email, password);
  };

  const signUp = async (email: string, password: string, displayName: string) => {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(cred.user, { displayName });
    const userProfile: UserProfile = {
      uid: cred.user.uid,
      email,
      displayName,
      totalWorkouts: 0,
      streak: 0,
      lastWorkoutDate: null,
      createdAt: new Date().toISOString(),
    };
    // Write to Firestore in background — don't block navigation
    setDoc(doc(db, "users", cred.user.uid), {
      ...userProfile,
      createdAt: serverTimestamp(),
    }).catch((e) => console.warn("Failed to write user profile:", e));
    setProfile(userProfile);
  };

  const logOut = async () => {
    await signOut(auth);
    setProfile(null);
  };

  const refreshProfile = async () => {
    if (user) await fetchProfile(user.uid);
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, signIn, signUp, logOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

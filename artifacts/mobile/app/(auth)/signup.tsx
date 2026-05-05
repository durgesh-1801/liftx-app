import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
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

import { useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";

export default function SignupScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { signUp } = useAuth();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleSignup = async () => {
    if (!displayName.trim() || !email.trim() || !password || !confirmPassword) {
      setError("Please fill in all fields");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await signUp(email.trim().toLowerCase(), password, displayName.trim());
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      // Explicitly navigate after signup
      router.replace("/(tabs)");
    } catch (e: unknown) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      if (e instanceof Error) {
        const code = (e as { code?: string }).code ?? "";
        if (code.includes("email-already-in-use")) {
          setError("An account with this email already exists.");
        } else if (code.includes("invalid-email")) {
          setError("Please enter a valid email address.");
        } else if (code.includes("weak-password")) {
          setError("Password is too weak. Use at least 6 characters.");
        } else if (code.includes("network-request-failed")) {
          setError("Network error. Check your connection.");
        } else {
          setError(`Sign-up failed: ${code || e.message}`);
        }
      } else {
        setError("Sign-up failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    inner: {
      paddingHorizontal: 28,
      paddingTop: insets.top + (Platform.OS === "web" ? 67 : 20),
      paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 40),
    },
    backBtn: { marginBottom: 32 },
    title: { fontSize: 32, fontFamily: "Inter_700Bold", color: colors.foreground, marginBottom: 4 },
    subtitle: {
      fontSize: 16,
      fontFamily: "Inter_400Regular",
      color: colors.mutedForeground,
      marginBottom: 36,
    },
    label: {
      fontSize: 13,
      fontFamily: "Inter_600SemiBold",
      color: colors.mutedForeground,
      marginBottom: 8,
      letterSpacing: 0.5,
      textTransform: "uppercase",
    },
    inputRow: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.input,
      borderRadius: colors.radius,
      marginBottom: 16,
      paddingHorizontal: 16,
      borderWidth: 1,
      borderColor: colors.border,
    },
    input: {
      flex: 1,
      height: 52,
      fontSize: 16,
      fontFamily: "Inter_400Regular",
      color: colors.foreground,
    },
    eyeBtn: { padding: 4 },
    error: {
      color: colors.destructive,
      fontSize: 14,
      fontFamily: "Inter_400Regular",
      marginBottom: 16,
      textAlign: "center",
      lineHeight: 20,
    },
    createBtn: {
      backgroundColor: colors.primary,
      borderRadius: colors.radius,
      height: 56,
      alignItems: "center",
      justifyContent: "center",
      marginTop: 8,
    },
    createBtnText: { color: colors.primaryForeground, fontSize: 16, fontFamily: "Inter_700Bold" },
  });

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView keyboardShouldPersistTaps="handled">
        <View style={styles.inner}>
          <Pressable style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={colors.foreground} />
          </Pressable>

          <Text style={styles.title}>Join LiftX</Text>
          <Text style={styles.subtitle}>Start competing today</Text>

          <Text style={styles.label}>Username</Text>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              value={displayName}
              onChangeText={setDisplayName}
              placeholder="YourName"
              placeholderTextColor={colors.mutedForeground}
              autoCapitalize="words"
            />
          </View>

          <Text style={styles.label}>Email</Text>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              placeholderTextColor={colors.mutedForeground}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <Text style={styles.label}>Password</Text>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              placeholderTextColor={colors.mutedForeground}
              secureTextEntry={!showPassword}
            />
            <Pressable style={styles.eyeBtn} onPress={() => setShowPassword(!showPassword)}>
              <Ionicons
                name={showPassword ? "eye-off" : "eye"}
                size={20}
                color={colors.mutedForeground}
              />
            </Pressable>
          </View>

          <Text style={styles.label}>Confirm Password</Text>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="••••••••"
              placeholderTextColor={colors.mutedForeground}
              secureTextEntry={!showPassword}
            />
          </View>

          {!!error && <Text style={styles.error}>{error}</Text>}

          <TouchableOpacity
            style={styles.createBtn}
            onPress={handleSignup}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color={colors.primaryForeground} />
            ) : (
              <Text style={styles.createBtnText}>Create Account</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

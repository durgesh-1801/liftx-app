import { ActivityIndicator, View } from "react-native";
import { Redirect } from "expo-router";
import { useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";

// Root redirect — sends unauthenticated users to login, authenticated to tabs.
// This is the correct Expo Router pattern: one unified Stack in _layout.tsx,
// auth routing handled by a dedicated index screen.
export default function Index() {
  const { user, loading } = useAuth();
  const colors = useColors();

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (user) {
    return <Redirect href="/(tabs)" />;
  }

  return <Redirect href="/(auth)/login" />;
}

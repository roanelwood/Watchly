import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { Stack, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect } from "react";
import "react-native-reanimated";

import { ThemePreferenceProvider } from "@/context/theme-preference";
import { auth } from "@/firebaseConfig";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { onAuthStateChanged } from "firebase/auth";

export const unstable_settings = {
  anchor: "(tabs)",
};

function RootLayoutContent() {
  // Provide navigation theming based on the active light or dark mode.
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen
          name="movie/[id]"
          options={{ headerShown: false, presentation: "card" }}
        />
        <Stack.Screen
          name="watchlist"
          options={{ headerShown: false, presentation: "card" }}
        />
        <Stack.Screen
          name="favourites"
          options={{ headerShown: false, presentation: "card" }}
        />
        <Stack.Screen
          name="modal"
          options={{ presentation: "modal", title: "Modal" }}
        />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  const router = useRouter();

  useEffect(() => {
    // Listen for auth state changes and redirect to login when unauthenticated.
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) {
        // If authenticated, send to the main app
        router.replace("/" as any);
      } else {
        // If not authenticated, send to login
        router.replace("/login" as any);
      }
    });
    return () => unsub();
  }, [router]);

  return (
    <ThemePreferenceProvider>
      <RootLayoutContent />
    </ThemePreferenceProvider>
  );
}

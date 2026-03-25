import { useThemePreference } from "@/context/theme-preference";
import { auth } from "@/firebaseConfig";
import { useRouter } from "expo-router";
import { onAuthStateChanged, signOut } from "firebase/auth";
import React, { useEffect, useState } from "react";
import { StyleSheet, Switch, Text, TouchableOpacity, View } from "react-native";

export default function Page() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  // Light/dark mode
  const { colorScheme, preference, setPreference } = useThemePreference();
  const isDark = colorScheme === "dark";
  const colors = {
    background: isDark ? "#121212" : "#fff",
    text: isDark ? "#fff" : "#111",
    subtext: isDark ? "#aaa" : "#555",
    card: isDark ? "#2a2a2a" : "#eaeaea",
  };

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsub();
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch {
      // ignore
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text }]}>👤 Profile</Text>
      <Text style={[styles.subtitle, { color: colors.subtext }]}>
        {user?.displayName ?? "No username set"}
      </Text>
      <Text style={{ color: colors.subtext, marginTop: 8 }}>{user?.email}</Text>
      <View style={styles.themeRow}>
        <Text style={[styles.themeLabel, { color: colors.text }]}>
          Dark mode
        </Text>
        <Switch
          value={isDark}
          onValueChange={(value) => setPreference(value ? "dark" : "light")}
          trackColor={{ false: "#444", true: "#1E90FF" }}
          thumbColor={isDark ? "#fff" : "#f4f3f4"}
        />
      </View>
      <TouchableOpacity
        onPress={() => setPreference("system")}
        style={styles.systemToggle}
      >
        <Text style={[styles.systemToggleText, { color: colors.subtext }]}>
          Use system setting{preference === "system" ? " (active)" : ""}
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() => router.push("/watchlist")}
        style={[styles.watchlistToggle, { backgroundColor: colors.card }]}
      >
        <Text style={{ color: colors.text }}>View Watchlist</Text>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() => router.push("/favourites")}
        style={[styles.favouritesToggle, { backgroundColor: colors.card }]}
      >
        <Text style={{ color: colors.text }}>View Favourites</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={handleSignOut} style={styles.signout}>
        <Text style={{ color: "#fff" }}>Sign Out</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#121212",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  title: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 10,
  },
  subtitle: {
    color: "#aaa",
    fontSize: 16,
    textAlign: "center",
  },
  themeRow: {
    marginTop: 18,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  themeLabel: {
    color: "#fff",
    fontSize: 16,
  },
  systemToggle: {
    marginTop: 8,
  },
  systemToggleText: {
    color: "#aaa",
    fontSize: 12,
  },
  watchlistToggle: {
    marginTop: 16,
    backgroundColor: "#2a2a2a",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
  },
  favouritesToggle: {
    marginTop: 12,
    backgroundColor: "#2a2a2a",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
  },
  signout: {
    marginTop: 20,
    backgroundColor: "#1E90FF",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
});

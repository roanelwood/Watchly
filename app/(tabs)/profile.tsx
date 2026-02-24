import { auth } from "@/firebaseConfig";
import { useRouter } from "expo-router";
import { onAuthStateChanged, signOut } from "firebase/auth";
import React, { useEffect, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function Page() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);

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
    <View style={styles.container}>
      <Text style={styles.title}>👤 Profile</Text>
      <Text style={styles.subtitle}>
        {user?.displayName ?? "No username set"}
      </Text>
      <Text style={{ color: "#aaa", marginTop: 8 }}>{user?.email}</Text>
      <TouchableOpacity
        onPress={() => router.push("/watchlist")}
        style={styles.watchlistToggle}
      >
        <Text style={{ color: "#fff" }}>View Watchlist</Text>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() => router.push("/favourites")}
        style={styles.favouritesToggle}
      >
        <Text style={{ color: "#fff" }}>View Favourites</Text>
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

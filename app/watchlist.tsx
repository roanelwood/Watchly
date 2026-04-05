import { auth, db } from "@/firebaseConfig";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { onAuthStateChanged } from "firebase/auth";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    Image,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const IMAGE_BASE = "https://image.tmdb.org/t/p/w500";

interface WatchlistItem {
  movieId: number;
  title: string;
  poster_path: string | null;
}

export default function WatchlistScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const colors = {
    background: isDark ? "#121212" : "#fff",
    text: isDark ? "#fff" : "#111",
    subtext: isDark ? "#eee" : "#111",
    muted: isDark ? "#888" : "#666",
    surface: isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.06)",
    poster: isDark ? "#222" : "#e6e6e6",
  };
  const [user, setUser] = useState<any>(auth.currentUser);
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!user) {
      setWatchlist([]);
      setLoading(false);
      return;
    }

    const watchlistRef = collection(db, "users", user.uid, "watchlist");
    const watchlistQuery = query(watchlistRef, orderBy("addedAt", "desc"));
    const unsub = onSnapshot(
      watchlistQuery,
      (snapshot) => {
        const items: WatchlistItem[] = snapshot.docs.map((docSnap) => {
          const data = docSnap.data();
          return {
            movieId: data.movieId,
            title: data.title,
            poster_path: data.poster_path ?? null,
          };
        });
        setWatchlist(items);
        setLoading(false);
      },
      () => {
        setWatchlist([]);
        setLoading(false);
      },
    );

    return () => unsub();
  }, [user]);

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <View style={styles.header}>
        <TouchableOpacity
          style={[styles.backButton, { backgroundColor: colors.surface }]}
          onPress={() => router.back()}
        >
          <Ionicons name="close" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Your Watchlist
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.text} />
        </View>
      ) : (
        <FlatList
          data={watchlist}
          keyExtractor={(item) => item.movieId.toString()}
          numColumns={3}
          columnWrapperStyle={styles.columnWrapper}
          contentContainerStyle={styles.gridContent}
          ListEmptyComponent={
            <Text style={[styles.emptyText, { color: colors.muted }]}>
              No movies added yet.
            </Text>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              onPress={() => router.push(`/movie/${item.movieId}`)}
            >
              <Image
                source={{
                  uri: item.poster_path
                    ? IMAGE_BASE + item.poster_path
                    : undefined,
                }}
                style={[styles.poster, { backgroundColor: colors.poster }]}
              />
              <Text
                style={[styles.cardTitle, { color: colors.subtext }]}
                numberOfLines={2}
              >
                {item.title}
              </Text>
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#121212",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 8,
    marginBottom: 12,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.08)",
  },
  headerTitle: {
    flex: 1,
    color: "#fff",
    fontSize: 20,
    fontWeight: "700",
    textAlign: "center",
  },
  headerSpacer: {
    width: 36,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  gridContent: {
    paddingHorizontal: 10,
    paddingBottom: 24,
  },
  columnWrapper: {
    justifyContent: "flex-start",
  },
  card: {
    flexGrow: 1,
    flexBasis: 0,
    maxWidth: "33.33%",
    paddingHorizontal: 6,
    marginBottom: 12,
  },
  poster: {
    width: "100%",
    height: 150,
    borderRadius: 10,
    backgroundColor: "#222",
  },
  cardTitle: {
    color: "#eee",
    fontSize: 12,
    paddingTop: 6,
    paddingHorizontal: 2,
  },
  emptyText: {
    color: "#888",
    textAlign: "center",
    marginTop: 24,
  },
});

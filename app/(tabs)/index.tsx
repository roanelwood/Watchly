import { auth, db } from "@/firebaseConfig";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useRouter } from "expo-router";
import { onAuthStateChanged } from "firebase/auth";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const apiKey = "5b08fa299e458e98810648d4daac2ba5";
const IMAGE_BASE = "https://image.tmdb.org/t/p/w500";

interface WatchlistItem {
  movieId: number;
  title: string;
  poster_path: string | null;
}

type RowColors = {
  text: string;
  subtext: string;
  poster: string;
};

function MovieRow({
  title,
  genreInfo,
  colors,
}: {
  title: string;
  genreInfo: { id?: number; url: string };
  colors: RowColors;
}) {
  const router = useRouter();
  const [movies, setMovies] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        // Fetch a TMDB row by genre
        let url = "";
        if (genreInfo.id) {
          url = `https://api.themoviedb.org/3/${genreInfo.url}?api_key=${apiKey}&with_genres=${genreInfo.id}&sort_by=popularity.desc&page=1`;
        } else {
          url = `https://api.themoviedb.org/3/${genreInfo.url}?api_key=${apiKey}`;
        }
        const res = await fetch(url);
        const json = await res.json();
        if (!mounted) return;
        setMovies(json.results || []);
      } catch (e: any) {
        setError(String(e?.message || e));
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, [genreInfo]);

  if (loading) {
    return (
      <View style={styles.rowContainer}>
        <Text style={[styles.rowTitle, { color: colors.text }]}>{title}</Text>
        <ActivityIndicator style={{ marginVertical: 12 }} />
      </View>
    );
  }

  return (
    <View style={styles.rowContainer}>
      <Text style={[styles.rowTitle, { color: colors.text }]}>{title}</Text>
      {error ? (
        <Text style={{ color: "red" }}>{error}</Text>
      ) : (
        <FlatList
          data={movies}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.posterContainer}
              activeOpacity={0.8}
              onPress={() => router.push(`/movie/${item.id}` as any)}
            >
              <Image
                source={{
                  uri: item.poster_path
                    ? IMAGE_BASE + item.poster_path
                    : undefined,
                }}
                style={[styles.poster, { backgroundColor: colors.poster }]}
                resizeMode="cover"
              />
              <Text
                style={[styles.posterTitle, { color: colors.text }]}
                numberOfLines={1}
              >
                {item.title || item.name}
              </Text>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}
// display users watchlist on as first row on home page
function WatchlistRow({
  items,
  colors,
}: {
  items: WatchlistItem[];
  colors: RowColors;
}) {
  const router = useRouter();

  // Skip rendering if the watchlist is empty
  if (items.length === 0) return null;

  return (
    <View style={styles.rowContainer}>
      <Text style={[styles.rowTitle, { color: colors.text }]}>
        Your Watchlist
      </Text>
      <FlatList
        data={items}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => String(item.movieId)}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.posterContainer}
            activeOpacity={0.8}
            onPress={() => router.push(`/movie/${item.movieId}` as any)}
          >
            <Image
              source={{
                uri: item.poster_path
                  ? IMAGE_BASE + item.poster_path
                  : undefined,
              }}
              style={[styles.poster, { backgroundColor: colors.poster }]}
              resizeMode="cover"
            />
            <Text
              style={[styles.posterTitle, { color: colors.text }]}
              numberOfLines={1}
            >
              {item.title}
            </Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

export default function HomePage() {
  const [user, setUser] = useState<any>(auth.currentUser);
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [watchlistLoading, setWatchlistLoading] = useState(true);
  // Light or dark mode
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const colors = {
    background: isDark ? "#090909" : "#fff",
    text: isDark ? "#fff" : "#111",
    subtext: isDark ? "#aaa" : "#555",
    muted: isDark ? "#777" : "#666",
    poster: isDark ? "#222" : "#eaeaea",
  };

  useEffect(() => {
    // Keep the local user state in sync with Firebase
    const unsub = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!user) {
      setWatchlist([]);
      setWatchlistLoading(false);
      return;
    }

    // Live watchlist listener to stay updated
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
        setWatchlistLoading(false);
      },
      () => {
        setWatchlist([]);
        setWatchlistLoading(false);
      },
    );

    return () => unsub();
  }, [user]);

  const rows = [
    { title: "Trending", genreInfo: { url: "trending/movie/week" } },
    { title: "Popular", genreInfo: { url: "movie/popular" } },
    { title: "Action", genreInfo: { url: "discover/movie", id: 28 } },
    { title: "Comedy", genreInfo: { url: "discover/movie", id: 35 } },
    { title: "Drama", genreInfo: { url: "discover/movie", id: 18 } },
  ];

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <ScrollView contentContainerStyle={styles.contentContainer}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>
            {user?.displayName
              ? `Welcome, ${user.displayName}!`
              : "Welcome back"}
          </Text>
        </View>

        {!watchlistLoading && watchlist.length > 0 ? (
          <WatchlistRow items={watchlist} colors={colors} />
        ) : null}

        {rows.map((r) => (
          <MovieRow
            key={r.title}
            title={r.title}
            genreInfo={r.genreInfo}
            colors={colors}
          />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const { width } = Dimensions.get("window");
const posterWidth = Math.round(width * 0.28);
const posterHeight = Math.round(posterWidth * 1.5);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#090909" },
  contentContainer: { paddingTop: 8, paddingBottom: 12 },
  header: { paddingHorizontal: 12, paddingVertical: 16 },
  title: { color: "#fff", fontSize: 24, fontWeight: "700" },
  subtitle: { color: "#aaa", marginTop: 6 },
  rowContainer: { marginTop: 12, paddingVertical: 6 },
  rowTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  posterContainer: { width: posterWidth, marginLeft: 12 },
  poster: {
    width: posterWidth,
    height: posterHeight,
    borderRadius: 8,
    backgroundColor: "#222",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  posterTitle: { color: "#fff", marginTop: 6, width: posterWidth },
});

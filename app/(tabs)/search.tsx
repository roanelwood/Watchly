import { useColorScheme } from "@/hooks/use-color-scheme";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const TMDB_API_KEY = process.env.EXPO_PUBLIC_TMDB_API_KEY;
const IMAGE_BASE = "https://image.tmdb.org/t/p/w500";
const OPENAI_API_KEY = process.env.EXPO_PUBLIC_OPENAI_API_KEY;

interface Movie {
  id: number;
  title: string;
  poster_path: string | null;
  release_date: string;
  vote_average: number;
}

// Parse the model output safely, even if it wraps JSON in extra text.
const extractJsonArray = (content: string): string[] => {
  const trimmed = content.trim();
  let parsed: unknown;

  try {
    parsed = JSON.parse(trimmed);
  } catch {
    const arrayRegex = /\[[\s\S]*\]/;
    const match = arrayRegex.exec(trimmed);
    if (!match) return [];

    try {
      parsed = JSON.parse(match[0]);
    } catch {
      return [];
    }
  }

  if (!Array.isArray(parsed)) return [];

  return parsed
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter((item) => item.length > 0)
    .slice(0, 8);
};

const getTmdbSearchUrl = (query: string) => {
  return `https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(
    query,
  )}&page=1`;
};

const fetchMovieByTitle = async (title: string): Promise<Movie | null> => {
  const url = getTmdbSearchUrl(title);
  const response = await fetch(url);
  const data = await response.json();
  const first = data?.results?.[0];
  return first ?? null;
};

const dedupeMovies = (movies: (Movie | null)[]): Movie[] => {
  const valid = movies.filter((movie): movie is Movie => movie !== null);
  return Array.from(new Map(valid.map((movie) => [movie.id, movie])).values());
};

const fetchTmdbMovies = async (query: string): Promise<Movie[]> => {
  const url = getTmdbSearchUrl(query);
  const response = await fetch(url);
  const data = await response.json();
  return data.results || [];
};

// Ask openAI for recommendation titles only. then resolve those titles via TMDB.
const searchWithOpenAI = async (query: string): Promise<string[]> => {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          // Prompt the model to return ONLY a JSON array of movie titles with no extra text or formatting.
          content: `
You are a movie recommendation system.

Return ONLY a valid JSON array of movie titles.

Rules:
- No explanation
- No text before or after
- No markdown
- Just JSON

Example:
["Inception", "The Dark Knight"]
          `,
        },
        {
          role: "user",
          content: query,
        },
      ],
      temperature: 0.7,
    }),
  });

  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content ?? "";
  return extractJsonArray(content);
};

export default function SearchPage() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const colors = {
    background: isDark ? "#090909" : "#fff",
    text: isDark ? "#fff" : "#111",
    subtext: isDark ? "#aaa" : "#555",
    muted: isDark ? "#888" : "#666",
    surface: isDark ? "#1a1a1a" : "#f2f2f2",
    border: isDark ? "#2a2a2a" : "#ddd",
    input: isDark ? "#fff" : "#111",
    placeholder: isDark ? "#666" : "#999",
  };
  const [searchQuery, setSearchQuery] = useState("");
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchMode, setSearchMode] = useState<"tmdb" | "ai">("tmdb");

  const searchMovies = async (query: string) => {
    if (!query.trim()) {
      setMovies([]);
      setHasSearched(false);
      setError(null);
      return;
    }

    setLoading(true);
    setHasSearched(true);
    setError(null);

    try {
      const results = await fetchTmdbMovies(query);
      setMovies(results);
    } catch (error) {
      console.error("Error searching movies:", error);
      setMovies([]);
      setError("Could not search movies right now.");
    } finally {
      setLoading(false);
    }
  };

  const searchWithAI = async (query: string) => {
    if (!query.trim()) {
      setMovies([]);
      setHasSearched(false);
      setError(null);
      return;
    }
    // error handling
    if (!OPENAI_API_KEY) {
      setError(
        "Missing OpenAI key. Set EXPO_PUBLIC_OPENAI_API_KEY in your .env.",
      );
      setMovies([]);
      setHasSearched(true);
      return;
    }

    setLoading(true);
    setHasSearched(true);
    setError(null);

    try {
      // Step 1: get recommendation titles from OpenAI.
      const titles = await searchWithOpenAI(query);

      if (titles.length === 0) {
        setMovies([]);
        setError("AI did not return valid movie titles. Try a clearer prompt.");
        return;
      }

      const found = await Promise.all(
        titles.map((title) => fetchMovieByTitle(title)),
      );
      // Step 2: convert title matches into concrete TMDB movies for rendering/navigation.
      const deduped = dedupeMovies(found);

      setMovies(deduped);
      if (deduped.length === 0) {
        setError("No matching TMDB movies found for AI suggestions.");
      }
    } catch (e) {
      console.error("Error searching with AI:", e);
      try {
        const fallbackResults = await fetchTmdbMovies(query);
        setMovies(fallbackResults);
        setError(
          "AI providers are busy right now. Showing standard search results instead.",
        );
      } catch {
        setMovies([]);
        setError("AI search failed. Check your key, model, and network.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    if (searchMode === "ai") {
      searchWithAI(searchQuery);
      return;
    }
    searchMovies(searchQuery);
  };

  const handleChangeText = (text: string) => {
    setSearchQuery(text);
    setError(null);
    if (searchMode === "ai") return;

    if (text.trim().length > 2) {
      searchMovies(text);
    } else if (text.trim().length === 0) {
      setMovies([]);
      setHasSearched(false);
    }
  };

  const renderMovieItem = ({ item }: { item: Movie }) => {
    const { width } = Dimensions.get("window");
    const posterWidth = Math.round((width - 48) / 3);
    const posterHeight = Math.round(posterWidth * 1.5);

    return (
      <TouchableOpacity
        style={[styles.movieCard, { width: posterWidth }]}
        onPress={() => router.push(`/movie/${item.id}` as any)}
        activeOpacity={0.7}
      >
        <Image
          source={{
            uri: item.poster_path
              ? IMAGE_BASE + item.poster_path
              : "https://via.placeholder.com/300x450/222/666?text=No+Poster",
          }}
          style={[
            styles.moviePoster,
            {
              width: posterWidth,
              height: posterHeight,
              backgroundColor: isDark ? "#222" : "#eaeaea",
            },
          ]}
          resizeMode="cover"
        />
        <Text
          style={[styles.movieTitle, { color: colors.text }]}
          numberOfLines={2}
        >
          {item.title}
        </Text>
        {!!item.release_date && (
          <Text style={styles.movieYear}>
            {new Date(item.release_date).getFullYear()}
          </Text>
        )}
        {item.vote_average > 0 && (
          <View style={styles.ratingContainer}>
            <Ionicons name="star" size={12} color="#FFD700" />
            <Text style={styles.ratingText}>
              {item.vote_average.toFixed(1)}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderResults = () => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6366f1" />
          <Text style={[styles.loadingText, { color: colors.muted }]}>
            Searching...
          </Text>
        </View>
      );
    }

    if (!hasSearched) {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons name="search-outline" size={64} color="#444" />
          <Text style={[styles.emptyText, { color: colors.muted }]}>
            Search for movies
          </Text>
          <Text style={[styles.emptySubtext, { color: colors.placeholder }]}>
            Enter a title to start discovering
          </Text>
        </View>
      );
    }

    if (movies.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons name="film-outline" size={64} color="#444" />
          <Text style={[styles.emptyText, { color: colors.muted }]}>
            No movies found
          </Text>
          <Text style={[styles.emptySubtext, { color: colors.placeholder }]}>
            Try a different search term
          </Text>
        </View>
      );
    }

    return (
      <FlatList
        data={movies}
        renderItem={renderMovieItem}
        keyExtractor={(item) => String(item.id)}
        numColumns={3}
        contentContainerStyle={styles.resultsContainer}
        columnWrapperStyle={styles.row}
        showsVerticalScrollIndicator={false}
      />
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>
          🔎 Search Movies
        </Text>
        <Text style={[styles.subtitle, { color: colors.subtext }]}>
          Discover any film.
        </Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View
          style={[
            styles.modeSwitch,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <TouchableOpacity
            style={[
              styles.modeButton,
              searchMode === "tmdb" && styles.modeButtonActive,
            ]}
            onPress={() => setSearchMode("tmdb")}
          >
            <Text
              style={[
                styles.modeButtonText,
                { color: searchMode === "tmdb" ? "#fff" : colors.subtext },
              ]}
            >
              Standard
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.modeButton,
              searchMode === "ai" && styles.modeButtonActive,
            ]}
            onPress={() => setSearchMode("ai")}
          >
            <Text
              style={[
                styles.modeButtonText,
                { color: searchMode === "ai" ? "#fff" : colors.subtext },
              ]}
            >
              AI Search
            </Text>
          </TouchableOpacity>
        </View>

        <View
          style={[
            styles.searchBar,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <Ionicons
            name="search"
            size={20}
            color={colors.muted}
            style={styles.searchIcon}
          />
          <TextInput
            style={[styles.searchInput, { color: colors.input }]}
            placeholder={
              searchMode === "ai"
                ? "e.g. dark psychological sci-fi thrillers"
                : "Search for movies..."
            }
            placeholderTextColor={colors.placeholder}
            value={searchQuery}
            onChangeText={handleChangeText}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
            autoCapitalize="none"
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => {
                setSearchQuery("");
                setMovies([]);
                setHasSearched(false);
                setError(null);
              }}
              style={styles.clearButton}
            >
              <Ionicons name="close-circle" size={20} color={colors.muted} />
            </TouchableOpacity>
          )}
        </View>

        {searchMode === "ai" && (
          <Text style={[styles.modeHint, { color: colors.subtext }]}>
            AI Search suggests titles first, then Watchly finds matching TMDB
            movies.
          </Text>
        )}

        {error ? <Text style={styles.errorText}>{error}</Text> : null}
      </View>

      {/* Results */}
      {renderResults()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#090909",
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
  },
  title: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 8,
  },
  subtitle: {
    color: "#aaa",
    fontSize: 14,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  modeSwitch: {
    flexDirection: "row",
    borderWidth: 1,
    borderRadius: 10,
    marginBottom: 10,
    overflow: "hidden",
  },
  modeButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
  },
  modeButtonActive: {
    backgroundColor: "#6366f1",
  },
  modeButtonText: {
    fontSize: 13,
    fontWeight: "700",
  },
  modeHint: {
    marginTop: 8,
    fontSize: 12,
  },
  errorText: {
    color: "#ef4444",
    marginTop: 10,
    fontSize: 13,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1a1a1a",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "#2a2a2a",
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: "#fff",
    fontSize: 16,
    padding: 0,
  },
  clearButton: {
    padding: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: "#888",
    marginTop: 12,
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  emptyText: {
    color: "#888",
    fontSize: 20,
    fontWeight: "600",
    marginTop: 16,
  },
  emptySubtext: {
    color: "#666",
    fontSize: 14,
    marginTop: 8,
    textAlign: "center",
  },
  resultsContainer: {
    padding: 16,
    paddingTop: 8,
  },
  row: {
    justifyContent: "space-between",
    marginBottom: 20,
  },
  movieCard: {
    marginBottom: 8,
  },
  moviePoster: {
    borderRadius: 8,
    backgroundColor: "#222",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  movieTitle: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
    marginTop: 8,
    lineHeight: 16,
  },
  movieYear: {
    color: "#888",
    fontSize: 11,
    marginTop: 2,
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
    gap: 4,
  },
  ratingText: {
    color: "#FFD700",
    fontSize: 11,
    fontWeight: "600",
  },
});

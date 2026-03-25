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

const apiKey = "5b08fa299e458e98810648d4daac2ba5";
const IMAGE_BASE = "https://image.tmdb.org/t/p/w500";

interface Movie {
  id: number;
  title: string;
  poster_path: string | null;
  release_date: string;
  vote_average: number;
  overview: string;
}

export default function SearchPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const searchMovies = async (query: string) => {
    // Use the active light/dark mode
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
    if (!query.trim()) {
      setMovies([]);
      setHasSearched(false);
      return;
    }

    setLoading(true);
    setHasSearched(true);

    try {
      const url = `https://api.themoviedb.org/3/search/movie?api_key=${apiKey}&query=${encodeURIComponent(
        query,
      )}&page=1`;
      console.log("Searching movies with URL:", url);

      const response = await fetch(url);
      const data = await response.json();

      console.log("Search results:", data.results?.length || 0, "movies found");
      setMovies(data.results || []);
    } catch (error) {
      console.error("Error searching movies:", error);
      setMovies([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    searchMovies(searchQuery);
  };

  const handleChangeText = (text: string) => {
    setSearchQuery(text);
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
        {item.release_date && (
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

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>🔎 Search Movies</Text>
        <Text style={styles.subtitle}>Discover any film.</Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons
            name="search"
            size={20}
            color="#888"
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search for movies..."
            placeholderTextColor="#666"
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
              }}
              style={styles.clearButton}
            >
              <Ionicons name="close-circle" size={20} color="#888" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Results */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6366f1" />
          <Text style={styles.loadingText}>Searching...</Text>
        </View>
      ) : hasSearched && movies.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="film-outline" size={64} color="#444" />
          <Text style={styles.emptyText}>No movies found</Text>
          <Text style={styles.emptySubtext}>Try a different search term</Text>
        </View>
      ) : !hasSearched ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="search-outline" size={64} color="#444" />
          <Text style={styles.emptyText}>Search for movies</Text>
          <Text style={styles.emptySubtext}>
            Enter a title to start discovering
          </Text>
        </View>
      ) : (
        <FlatList
          data={movies}
          renderItem={renderMovieItem}
          keyExtractor={(item) => String(item.id)}
          numColumns={3}
          contentContainerStyle={styles.resultsContainer}
          columnWrapperStyle={styles.row}
          showsVerticalScrollIndicator={false}
        />
      )}
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

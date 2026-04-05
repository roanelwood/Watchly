import { auth, db } from "@/firebaseConfig";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { deleteDoc, doc, getDoc, setDoc } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const apiKey = "5b08fa299e458e98810648d4daac2ba5";
const IMAGE_BASE = "https://image.tmdb.org/t/p/w500";
const IMAGE_ORIGINAL = "https://image.tmdb.org/t/p/original";
const IMAGE_LOGO = "https://image.tmdb.org/t/p/w92";
const FALLBACK_REGION = "US";
const LIME = "#B7FF3C";

interface MovieDetails {
  id: number;
  title: string;
  overview: string;
  poster_path: string;
  backdrop_path: string;
  vote_average: number;
  release_date: string;
  runtime: number;
  genres: { id: number; name: string }[];
}

interface CastMember {
  id: number;
  name: string;
  character: string;
  profile_path: string | null;
}

interface WatchProvider {
  provider_id: number;
  provider_name: string;
  logo_path: string | null;
}

const getRegionFromLocale = () => {
  try {
    const locale = Intl.DateTimeFormat().resolvedOptions().locale;
    const region = locale.split(/[-_]/)[1];
    return region ? region.toUpperCase() : FALLBACK_REGION;
  } catch {
    return FALLBACK_REGION;
  }
};

export default function MovieDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const colors = {
    background: isDark ? "#090909" : "#fff",
    surface: isDark ? "#1a1a1a" : "#f2f2f2",
    surfaceAlt: isDark ? "#151515" : "#f7f7f7",
    text: isDark ? "#fff" : "#111",
    subtext: isDark ? "#aaa" : "#555",
    muted: isDark ? "#888" : "#666",
    border: isDark ? "#2a2a2a" : "#ddd",
    chipBg: isDark ? "rgba(99, 102, 241, 0.2)" : "rgba(99, 102, 241, 0.12)",
    chipBorder: isDark ? "rgba(99, 102, 241, 0.4)" : "rgba(99, 102, 241, 0.3)",
    chipText: isDark ? "#a5b4fc" : "#4f46e5",
    overlay: isDark ? "rgba(9, 9, 9, 0.85)" : "rgba(255, 255, 255, 0.7)",
    backButtonBg: isDark ? "rgba(0, 0, 0, 0.5)" : "rgba(255, 255, 255, 0.8)",
    backIcon: isDark ? "#fff" : "#111",
    ratingBadge: isDark ? "rgba(255, 215, 0, 0.15)" : "rgba(255, 215, 0, 0.2)",
  };
  const [movie, setMovie] = useState<MovieDetails | null>(null);
  const [cast, setCast] = useState<CastMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [isInWatchlist, setIsInWatchlist] = useState(false);
  const [isfavourite, setIsfavourite] = useState(false);
  const [watchProviders, setWatchProviders] = useState<WatchProvider[]>([]);
  const [watchRegion, setWatchRegion] = useState(FALLBACK_REGION);
  const movieId = Array.isArray(id) ? id[0] : id;

  useEffect(() => {
    async function fetchMovieData() {
      try {
        // Fetch movie details
        const movieResponse = await fetch(
          `https://api.themoviedb.org/3/movie/${id}?api_key=${apiKey}`,
        );
        const movieData = await movieResponse.json();
        setMovie(movieData);

        // Fetch cast
        const creditsResponse = await fetch(
          `https://api.themoviedb.org/3/movie/${id}/credits?api_key=${apiKey}`,
        );
        const creditsData = await creditsResponse.json();
        setCast(creditsData.cast?.slice(0, 10) || []);

        // Get movie providers
        const providersResponse = await fetch(
          `https://api.themoviedb.org/3/movie/${id}/watch/providers?api_key=${apiKey}`,
        );
        const providersData = await providersResponse.json();
        const region = getRegionFromLocale();
        const regionData =
          providersData.results?.[region] ||
          providersData.results?.[FALLBACK_REGION] ||
          null;
        const providers =
          regionData?.flatrate || regionData?.rent || regionData?.buy || [];
        setWatchProviders(providers.slice(0, 3));
        setWatchRegion(regionData ? region : FALLBACK_REGION);
      } catch (error) {
        console.error("Error fetching movie data:", error);
      } finally {
        setLoading(false);
      }
    }

    if (id) {
      fetchMovieData();
    }
  }, [id]);

  useEffect(() => {
    async function fetchWatchlistStatus() {
      const user = auth.currentUser;
      if (!user || !movieId) {
        setIsInWatchlist(false);
        return;
      }

      try {
        const watchlistRef = doc(
          db,
          "users",
          user.uid,
          "watchlist",
          movieId.toString(),
        );
        const snapshot = await getDoc(watchlistRef);
        setIsInWatchlist(snapshot.exists());
      } catch {
        setIsInWatchlist(false);
      }
    }

    fetchWatchlistStatus();
  }, [movieId]);

  useEffect(() => {
    async function fetchFavouriteStatus() {
      const user = auth.currentUser;
      if (!user || !movieId) {
        setIsfavourite(false);
        return;
      }

      try {
        const favouriteRef = doc(
          db,
          "users",
          user.uid,
          "favourites",
          movieId.toString(),
        );
        const snapshot = await getDoc(favouriteRef);
        setIsfavourite(snapshot.exists());
      } catch {
        setIsfavourite(false);
      }
    }

    fetchFavouriteStatus();
  }, [movieId]);

  const toggleWatchlist = async () => {
    const user = auth.currentUser;
    if (!user || !movie || !movieId) {
      return;
    }

    const watchlistRef = doc(
      db,
      "users",
      user.uid,
      "watchlist",
      movieId.toString(),
    );

    try {
      if (isInWatchlist) {
        await deleteDoc(watchlistRef);
        setIsInWatchlist(false);
      } else {
        await setDoc(watchlistRef, {
          movieId: movie.id,
          title: movie.title,
          poster_path: movie.poster_path ?? null,
          backdrop_path: movie.backdrop_path ?? null,
          addedAt: Date.now(),
        });
        setIsInWatchlist(true);
      }
    } catch {
      // ignore
    }
  };

  const togglefavourite = async () => {
    const user = auth.currentUser;
    if (!user || !movie || !movieId) {
      return;
    }

    const favouriteRef = doc(
      db,
      "users",
      user.uid,
      "favourites",
      movieId.toString(),
    );

    try {
      if (isfavourite) {
        await deleteDoc(favouriteRef);
        setIsfavourite(false);
      } else {
        await setDoc(favouriteRef, {
          movieId: movie.id,
          title: movie.title,
          poster_path: movie.poster_path ?? null,
          backdrop_path: movie.backdrop_path ?? null,
          addedAt: Date.now(),
        });
        setIsfavourite(true);
      }
    } catch {
      // ignore
    }
  };

  if (loading) {
    return (
      <View
        style={[
          styles.loadingContainer,
          { backgroundColor: colors.background },
        ]}
      >
        <ActivityIndicator size="large" color={colors.text} />
      </View>
    );
  }

  if (!movie) {
    return (
      <View
        style={[
          styles.loadingContainer,
          { backgroundColor: colors.background },
        ]}
      >
        <Text style={[styles.errorText, { color: colors.text }]}>
          Movie not found
        </Text>
      </View>
    );
  }

  const { width } = Dimensions.get("window");

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      bounces={false}
    >
      {/* Hero Section with Backdrop */}
      <View style={styles.heroSection}>
        <Image
          source={{
            uri: movie.backdrop_path
              ? IMAGE_ORIGINAL + movie.backdrop_path
              : undefined,
          }}
          style={[
            styles.backdrop,
            { width, height: width * 0.6, backgroundColor: colors.surface },
          ]}
          blurRadius={0.5}
        />

        {/* Gradient Overlay */}
        <View style={[styles.gradient, { backgroundColor: colors.overlay }]} />

        {/* Back Button */}
        <TouchableOpacity
          style={[styles.backButton, { backgroundColor: colors.backButtonBg }]}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={28} color={colors.backIcon} />
        </TouchableOpacity>
      </View>

      {/* Content Section */}
      <View style={styles.contentContainer}>
        {/* Movie poster and info */}
        <View style={styles.posterSection}>
          <Image
            source={{
              uri: movie.poster_path
                ? IMAGE_BASE + movie.poster_path
                : undefined,
            }}
            style={[styles.poster, { backgroundColor: colors.surface }]}
            resizeMode="cover"
          />

          <View style={styles.basicInfo}>
            <Text style={[styles.title, { color: colors.text }]}>
              {movie.title}
            </Text>

            <View style={styles.metaRow}>
              <View
                style={[
                  styles.ratingBadge,
                  { backgroundColor: colors.ratingBadge },
                ]}
              >
                <Ionicons name="star" size={16} color="#FFD700" />
                <Text style={styles.ratingText}>
                  {movie.vote_average.toFixed(1)}
                </Text>
              </View>

              <Text style={[styles.metaText, { color: colors.subtext }]}>
                {new Date(movie.release_date).getFullYear()}
              </Text>

              {movie.runtime > 0 && (
                <Text style={[styles.metaText, { color: colors.subtext }]}>
                  {Math.floor(movie.runtime / 60)}h {movie.runtime % 60}m
                </Text>
              )}
            </View>

            {/* Genres */}
            <View style={styles.genresContainer}>
              {movie.genres.map((genre) => (
                <View
                  key={genre.id}
                  style={[
                    styles.genreTag,
                    {
                      backgroundColor: colors.chipBg,
                      borderColor: colors.chipBorder,
                    },
                  ]}
                >
                  <Text style={[styles.genreText, { color: colors.chipText }]}>
                    {genre.name}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[
              styles.actionButton,
              { backgroundColor: colors.surface, borderColor: colors.border },
              isInWatchlist && styles.actionButtonActive,
            ]}
            onPress={toggleWatchlist}
            activeOpacity={0.7}
          >
            <Ionicons
              name={isInWatchlist ? "bookmark" : "bookmark-outline"}
              size={24}
              color={isInWatchlist ? LIME : colors.text}
            />
            <Text
              style={[
                styles.actionButtonText,
                { color: colors.text },
                isInWatchlist && styles.actionButtonTextActive,
              ]}
            >
              Watchlist
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.actionButton,
              { backgroundColor: colors.surface, borderColor: colors.border },
              isfavourite && styles.actionButtonActive,
            ]}
            onPress={togglefavourite}
            activeOpacity={0.7}
          >
            <Ionicons
              name={isfavourite ? "heart" : "heart-outline"}
              size={24}
              color={isfavourite ? LIME : colors.text}
            />
            <Text
              style={[
                styles.actionButtonText,
                { color: colors.text },
                isfavourite && styles.actionButtonTextActive,
              ]}
            >
              favourite
            </Text>
          </TouchableOpacity>
        </View>

        {/* Where to Watch functionality*/}
        {watchProviders.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Where to watch
            </Text>
            <View style={styles.watchRow}>
              <Text style={[styles.watchLabel, { color: colors.subtext }]}>
                Watch on:
              </Text>
              <View style={styles.watchProviders}>
                {watchProviders.map((provider) => (
                  <View
                    key={provider.provider_id}
                    style={[
                      styles.providerChip,
                      {
                        backgroundColor: colors.surface,
                        borderColor: colors.border,
                      },
                    ]}
                  >
                    {provider.logo_path && (
                      <Image
                        source={{ uri: IMAGE_LOGO + provider.logo_path }}
                        style={styles.providerLogo}
                      />
                    )}
                    <Text
                      style={[styles.providerText, { color: colors.text }]}
                      numberOfLines={1}
                    >
                      {provider.provider_name}
                    </Text>
                  </View>
                ))}
              </View>
              <Text style={[styles.watchRegion, { color: colors.muted }]}>
                Region: {watchRegion}
              </Text>
            </View>
          </View>
        )}

        {/* Overview */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Overview
          </Text>
          <Text style={[styles.overview, { color: colors.subtext }]}>
            {movie.overview}
          </Text>
        </View>

        {/* Cast */}
        {cast.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Cast
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.castContainer}
            >
              {cast.map((member) => (
                <View key={member.id} style={styles.castMember}>
                  <Image
                    source={{
                      uri: member.profile_path
                        ? IMAGE_BASE + member.profile_path
                        : "https://via.placeholder.com/150x225/333/666?text=No+Photo",
                    }}
                    style={[
                      styles.castPhoto,
                      { backgroundColor: colors.surface },
                    ]}
                    resizeMode="cover"
                  />
                  <Text
                    style={[styles.castName, { color: colors.text }]}
                    numberOfLines={1}
                  >
                    {member.name}
                  </Text>
                  <Text
                    style={[styles.castCharacter, { color: colors.muted }]}
                    numberOfLines={1}
                  >
                    {member.character}
                  </Text>
                </View>
              ))}
            </ScrollView>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#090909",
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: "#090909",
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    color: "#fff",
    fontSize: 18,
  },
  heroSection: {
    position: "relative",
  },
  backdrop: {
    backgroundColor: "#1a1a1a",
  },
  gradient: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: "rgba(9, 9, 9, 0.85)",
  },
  backButton: {
    position: "absolute",
    top: 50,
    left: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  posterSection: {
    flexDirection: "row",
    marginTop: -60,
    marginBottom: 24,
  },
  poster: {
    width: 120,
    height: 180,
    borderRadius: 12,
    backgroundColor: "#222",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 8,
  },
  basicInfo: {
    flex: 1,
    marginLeft: 16,
    justifyContent: "flex-end",
    paddingBottom: 8,
  },
  title: {
    color: "#fff",
    fontSize: 26,
    fontWeight: "700",
    marginBottom: 12,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
  },
  ratingBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 215, 0, 0.15)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  ratingText: {
    color: "#FFD700",
    fontSize: 14,
    fontWeight: "600",
  },
  metaText: {
    color: "#aaa",
    fontSize: 14,
  },
  genresContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  genreTag: {
    backgroundColor: "rgba(99, 102, 241, 0.2)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "rgba(99, 102, 241, 0.4)",
  },
  genreText: {
    color: "#a5b4fc",
    fontSize: 12,
    fontWeight: "500",
  },
  actionButtons: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 32,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#1a1a1a",
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: "#2a2a2a",
  },
  actionButtonActive: {
    backgroundColor: "rgba(183, 255, 60, 0.18)",
    borderColor: "rgba(183, 255, 60, 0.45)",
  },
  actionButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  actionButtonTextActive: {
    color: LIME,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 16,
  },
  watchRow: {
    gap: 12,
  },
  watchLabel: {
    color: "#bbb",
    fontSize: 14,
    fontWeight: "600",
  },
  watchProviders: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  providerChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1a1a1a",
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
    gap: 8,
    borderWidth: 1,
    borderColor: "#2a2a2a",
    maxWidth: 180,
  },
  providerLogo: {
    width: 22,
    height: 22,
    borderRadius: 4,
    backgroundColor: "#222",
  },
  providerText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
    flexShrink: 1,
  },
  watchRegion: {
    color: "#777",
    fontSize: 12,
  },
  overview: {
    color: "#ccc",
    fontSize: 16,
    lineHeight: 24,
  },
  castContainer: {
    gap: 16,
  },
  castMember: {
    width: 100,
  },
  castPhoto: {
    width: 100,
    height: 150,
    borderRadius: 10,
    backgroundColor: "#222",
    marginBottom: 8,
  },
  castName: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 2,
  },
  castCharacter: {
    color: "#888",
    fontSize: 12,
  },
});

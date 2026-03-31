import { useThemePreference } from "@/context/theme-preference";
import { auth, db } from "@/firebaseConfig";
import { useRouter } from "expo-router";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const IMAGE_BASE = "https://image.tmdb.org/t/p/w500";
const LIME = "#B7FF3C";

type PreviewItem = {
  movieId: number;
  title: string;
  poster_path: string | null;
};

export default function Page() {
  const router = useRouter();
  const [user, setUser] = useState<any>(auth.currentUser);
  const [watchlist, setWatchlist] = useState<PreviewItem[]>([]);
  const [favourites, setFavourites] = useState<PreviewItem[]>([]);
  const [loadingLists, setLoadingLists] = useState(true);

  const { colorScheme, setPreference } = useThemePreference();
  const isDark = colorScheme === "dark";

  const colors = {
    background: isDark ? "#090909" : "#f7f8f5",
    text: isDark ? "#fff" : "#111",
    subtext: isDark ? "#8d8d8d" : "#5e5e5e",
    sectionSurface: isDark ? "#161616" : "#ecefe7",
    cardBorder: isDark ? "#2a2a2a" : "#d6dfca",
    cardBackground: isDark ? "#151515" : "#f2f6ec",
    buttonText: "#111",
  };

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!user) {
      setWatchlist([]);
      setFavourites([]);
      setLoadingLists(false);
      return;
    }

    setLoadingLists(true);

    const watchlistRef = collection(db, "users", user.uid, "watchlist");
    const watchlistQuery = query(watchlistRef, orderBy("addedAt", "desc"));
    const favouritesRef = collection(db, "users", user.uid, "favourites");
    const favouritesQuery = query(favouritesRef, orderBy("addedAt", "desc"));

    let hasWatchlistLoaded = false;
    let hasFavouritesLoaded = false;

    const tryFinishLoading = () => {
      if (hasWatchlistLoaded && hasFavouritesLoaded) {
        setLoadingLists(false);
      }
    };

    const unsubWatchlist = onSnapshot(
      watchlistQuery,
      (snapshot) => {
        const items = snapshot.docs.map((docSnap) => {
          const data = docSnap.data();
          return {
            movieId: data.movieId,
            title: data.title,
            poster_path: data.poster_path ?? null,
          };
        });
        setWatchlist(items);
        hasWatchlistLoaded = true;
        tryFinishLoading();
      },
      () => {
        setWatchlist([]);
        hasWatchlistLoaded = true;
        tryFinishLoading();
      },
    );

    const unsubFavourites = onSnapshot(
      favouritesQuery,
      (snapshot) => {
        const items = snapshot.docs.map((docSnap) => {
          const data = docSnap.data();
          return {
            movieId: data.movieId,
            title: data.title,
            poster_path: data.poster_path ?? null,
          };
        });
        setFavourites(items);
        hasFavouritesLoaded = true;
        tryFinishLoading();
      },
      () => {
        setFavourites([]);
        hasFavouritesLoaded = true;
        tryFinishLoading();
      },
    );

    return () => {
      unsubWatchlist();
      unsubFavourites();
    };
  }, [user]);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch {
      // ignore
    }
  };

  const toggleDarkMode = () => {
    setPreference(isDark ? "light" : "dark");
  };

  const renderRow = (
    title: string,
    items: PreviewItem[],
    onViewFull: () => void,
  ) => {
    return (
      <View style={styles.rowSection}>
        <View style={styles.rowHeader}>
          <Text style={[styles.rowTitle, { color: colors.text }]}>{title}</Text>
          <TouchableOpacity onPress={onViewFull}>
            <Text style={[styles.viewAllText, { color: LIME }]}>View full</Text>
          </TouchableOpacity>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {items.length === 0 ? (
            <View
              style={[
                styles.emptyRow,
                {
                  backgroundColor: colors.sectionSurface,
                  borderColor: colors.cardBorder,
                },
              ]}
            >
              <Text style={[styles.emptyRowText, { color: colors.subtext }]}>
                No movies yet.
              </Text>
            </View>
          ) : (
            items.map((item) => (
              <TouchableOpacity
                key={`${title}-${item.movieId}`}
                style={[
                  styles.previewCard,
                  {
                    backgroundColor: colors.cardBackground,
                    borderColor: colors.cardBorder,
                  },
                ]}
                onPress={() => router.push(`/movie/${item.movieId}` as any)}
                activeOpacity={0.8}
              >
                <Image
                  source={{
                    uri: item.poster_path
                      ? IMAGE_BASE + item.poster_path
                      : undefined,
                  }}
                  style={styles.previewPoster}
                />
                <Text
                  style={[styles.previewTitle, { color: colors.text }]}
                  numberOfLines={2}
                >
                  {item.title}
                </Text>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topHeader}>
          <View style={styles.userBlock}>
            <Text style={[styles.username, { color: colors.text }]}>
              {user?.displayName ?? "Your Account"}
            </Text>
            {!!user?.email && (
              <Text style={[styles.email, { color: colors.subtext }]}>
                {user.email}
              </Text>
            )}
          </View>

          <Image
            source={require("../../assets/images/WatchlyLogo.png")}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>

        {loadingLists ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="large" color={LIME} />
            <Text style={[styles.loadingText, { color: colors.subtext }]}>
              Loading your lists...
            </Text>
          </View>
        ) : (
          <>
            {renderRow("Watchlist", watchlist, () => router.push("/watchlist"))}
            {renderRow("Favourites", favourites, () =>
              router.push("/favourites"),
            )}
          </>
        )}

        <View style={styles.bottomActions}>
          <TouchableOpacity style={styles.limeButton} onPress={toggleDarkMode}>
            <Text style={[styles.limeButtonText, { color: colors.buttonText }]}>
              Dark mode: {isDark ? "On" : "Off"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.limeButton} onPress={handleSignOut}>
            <Text style={[styles.limeButtonText, { color: colors.buttonText }]}>
              Sign out
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#090909",
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 44,
    paddingBottom: 32,
  },
  topHeader: {
    position: "relative",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 0,
    minHeight: 108,
  },
  userBlock: {
    flex: 1,
    paddingRight: 184,
  },
  username: {
    fontSize: 36,
    fontWeight: "800",
    letterSpacing: 0.3,
  },
  email: {
    marginTop: 6,
    fontSize: 14,
  },
  logo: {
    position: "absolute",
    top: -58,
    right: -16,
    width: 168,
    height: 168,
  },
  loadingWrap: {
    marginTop: 26,
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 13,
  },
  rowSection: {
    marginBottom: 22,
  },
  rowHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  rowTitle: {
    fontSize: 22,
    fontWeight: "700",
  },
  viewAllText: {
    fontSize: 13,
    fontWeight: "700",
  },
  previewCard: {
    width: 112,
    marginRight: 12,
    borderRadius: 12,
    borderWidth: 1,
    padding: 8,
  },
  previewPoster: {
    width: "100%",
    height: 152,
    borderRadius: 8,
    backgroundColor: "#232323",
  },
  previewTitle: {
    marginTop: 8,
    fontSize: 12,
    fontWeight: "600",
    lineHeight: 15,
  },
  emptyRow: {
    width: "100%",
    minWidth: 240,
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 20,
    paddingHorizontal: 14,
  },
  emptyRowText: {
    fontSize: 13,
  },
  bottomActions: {
    alignSelf: "flex-start",
    marginTop: 6,
    gap: 10,
    width: 190,
  },
  limeButton: {
    backgroundColor: LIME,
    borderRadius: 12,
    paddingVertical: 11,
    paddingHorizontal: 12,
  },
  limeButtonText: {
    fontSize: 13,
    fontWeight: "800",
    textTransform: "uppercase",
  },
});

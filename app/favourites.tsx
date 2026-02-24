import { auth, db } from "@/firebaseConfig";
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

const IMAGE_BASE = "https://image.tmdb.org/t/p/w500";

interface FavouriteItem {
  movieId: number;
  title: string;
  poster_path: string | null;
}

export default function FavouritesScreen() {
  const router = useRouter();
  const [user, setUser] = useState<any>(auth.currentUser);
  const [favourites, setFavourites] = useState<FavouriteItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!user) {
      setFavourites([]);
      setLoading(false);
      return;
    }

    const favouritesRef = collection(db, "users", user.uid, "favourites");
    const favouritesQuery = query(favouritesRef, orderBy("addedAt", "desc"));
    const unsub = onSnapshot(
      favouritesQuery,
      (snapshot) => {
        const items: FavouriteItem[] = snapshot.docs.map((docSnap) => {
          const data = docSnap.data();
          return {
            movieId: data.movieId,
            title: data.title,
            poster_path: data.poster_path ?? null,
          };
        });
        setFavourites(items);
        setLoading(false);
      },
      () => {
        setFavourites([]);
        setLoading(false);
      },
    );

    return () => unsub();
  }, [user]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="close" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Your Favourites</Text>
        <View style={styles.headerSpacer} />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#fff" />
        </View>
      ) : (
        <FlatList
          data={favourites}
          keyExtractor={(item) => item.movieId.toString()}
          numColumns={3}
          columnWrapperStyle={styles.columnWrapper}
          contentContainerStyle={styles.gridContent}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No movies added yet.</Text>
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
                style={styles.poster}
              />
              <Text style={styles.cardTitle} numberOfLines={2}>
                {item.title}
              </Text>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#121212",
    paddingTop: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
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

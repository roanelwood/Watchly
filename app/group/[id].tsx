import { auth, db } from "@/firebaseConfig";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
} from "firebase/firestore";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

const apiKey = "5b08fa299e458e98810648d4daac2ba5";
const IMAGE_BASE = "https://image.tmdb.org/t/p/w500";

type GroupData = {
  name?: string;
  joinCode?: string;
  memberCount?: number;
};

type GroupMessage = {
  id: string;
  text: string;
  senderId: string;
  createdAt?: any;
};

type GroupPost = {
  id: string;
  title: string;
  movieId?: number;
  posterPath?: string | null;
  year?: number | null;
  note?: string;
  authorId: string;
  createdAt?: any;
};

type MovieResult = {
  id: number;
  title: string;
  poster_path: string | null;
  release_date?: string;
};

export default function GroupDetailPage() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const user = auth.currentUser;
  const groupId = Array.isArray(id) ? id[0] : id;

  const [group, setGroup] = useState<GroupData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"chat" | "feed">("chat");
  const [messages, setMessages] = useState<GroupMessage[]>([]);
  const [posts, setPosts] = useState<GroupPost[]>([]);
  const [messageText, setMessageText] = useState("");
  const [postNote, setPostNote] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<MovieResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [selectedMovie, setSelectedMovie] = useState<MovieResult | null>(null);

  const groupRef = useMemo(() => {
    if (!groupId) return null;
    return doc(db, "groups", String(groupId));
  }, [groupId]);

  useEffect(() => {
    if (!groupRef) {
      setGroup(null);
      setLoading(false);
      return;
    }

    // Live group metadata listener
    const unsub = onSnapshot(
      groupRef,
      (snapshot) => {
        setGroup(snapshot.data() as GroupData);
        setLoading(false);
      },
      () => {
        setGroup(null);
        setLoading(false);
      },
    );

    return () => unsub();
  }, [groupRef]);

  useEffect(() => {
    if (!groupId) return;

    // Subscribe to chat messages in ascending time order
    const messagesRef = collection(db, "groups", String(groupId), "messages");
    const messagesQuery = query(messagesRef, orderBy("createdAt", "asc"));
    const unsub = onSnapshot(messagesQuery, (snapshot) => {
      const items = snapshot.docs.map((docSnap) => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          text: data.text ?? "",
          senderId: data.senderId ?? "",
          createdAt: data.createdAt,
        };
      });
      setMessages(items);
    });

    return () => unsub();
  }, [groupId]);

  useEffect(() => {
    if (!groupId) return;

    // Subscribe to feed posts
    const postsRef = collection(db, "groups", String(groupId), "posts");
    const postsQuery = query(postsRef, orderBy("createdAt", "desc"));
    const unsub = onSnapshot(postsQuery, (snapshot) => {
      const items = snapshot.docs.map((docSnap) => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          title: data.title ?? "",
          movieId: data.movieId ?? null,
          posterPath: data.posterPath ?? null,
          year: data.year ?? null,
          note: data.note ?? "",
          authorId: data.authorId ?? "",
          createdAt: data.createdAt,
        };
      });
      setPosts(items);
    });

    return () => unsub();
  }, [groupId]);

  const sendMessage = async () => {
    if (!groupId || !user) return;
    const trimmed = messageText.trim();
    if (!trimmed) return;

    // Write a single chat message
    setActionLoading(true);
    try {
      const messagesRef = collection(db, "groups", String(groupId), "messages");
      await addDoc(messagesRef, {
        text: trimmed,
        senderId: user.uid,
        createdAt: serverTimestamp(),
      });
      setMessageText("");
    } finally {
      setActionLoading(false);
    }
  };

  const searchMovies = async (queryText: string) => {
    if (!queryText.trim()) {
      setSearchResults([]);
      return;
    }

    // request TMDB for matching movies
    setSearchLoading(true);
    try {
      const url = `https://api.themoviedb.org/3/search/movie?api_key=${apiKey}&query=${encodeURIComponent(
        queryText,
      )}&page=1`;
      const response = await fetch(url);
      const data = await response.json();
      setSearchResults(data.results || []);
    } catch {
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleSearchChange = (text: string) => {
    setSearchQuery(text);
    if (text.trim().length > 2) {
      searchMovies(text);
    } else if (text.trim().length === 0) {
      setSearchResults([]);
    }
  };

  const sharePost = async () => {
    if (!groupId || !user) return;
    if (!selectedMovie) return;

    // create a feed post for the selected movie
    const releaseYear = selectedMovie.release_date
      ? Number(new Date(selectedMovie.release_date).getFullYear())
      : null;

    setActionLoading(true);
    try {
      const postsRef = collection(db, "groups", String(groupId), "posts");
      await addDoc(postsRef, {
        title: selectedMovie.title,
        movieId: selectedMovie.id,
        posterPath: selectedMovie.poster_path ?? null,
        year: releaseYear,
        note: postNote.trim(),
        authorId: user.uid,
        createdAt: serverTimestamp(),
      });
      setSelectedMovie(null);
      setSearchQuery("");
      setSearchResults([]);
      setPostNote("");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator color="#fff" />
      </View>
    );
  }

  if (!group) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Group not found.</Text>
        <Pressable style={styles.primaryButton} onPress={() => router.back()}>
          <Text style={styles.primaryText}>Go back</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.backText}>Back</Text>
        </Pressable>
        <Text style={styles.title}>{group.name ?? "Group"}</Text>
        {group.joinCode && (
          <Text style={styles.metaText}>Join code: {group.joinCode}</Text>
        )}
      </View>

      <View style={styles.tabs}>
        <Pressable
          style={[styles.tabButton, activeTab === "chat" && styles.tabActive]}
          onPress={() => setActiveTab("chat")}
        >
          <Text style={styles.tabText}>Chat</Text>
        </Pressable>
        <Pressable
          style={[styles.tabButton, activeTab === "feed" && styles.tabActive]}
          onPress={() => setActiveTab("feed")}
        >
          <Text style={styles.tabText}>Feed</Text>
        </Pressable>
      </View>

      {activeTab === "chat" ? (
        <View style={styles.content}>
          <FlatList
            data={messages}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
            renderItem={({ item }) => {
              const isMine = item.senderId === user?.uid;
              return (
                <View
                  style={[
                    styles.messageBubble,
                    isMine ? styles.messageMine : styles.messageOther,
                  ]}
                >
                  <Text style={styles.messageText}>{item.text}</Text>
                </View>
              );
            }}
          />
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              placeholder="Write a message"
              placeholderTextColor="#666"
              value={messageText}
              onChangeText={setMessageText}
            />
            <Pressable
              style={styles.sendButton}
              onPress={sendMessage}
              disabled={actionLoading}
            >
              <Text style={styles.sendText}>Send</Text>
            </Pressable>
          </View>
        </View>
      ) : (
        <View style={styles.content}>
          <View style={styles.panel}>
            <Text style={styles.panelTitle}>Share a movie</Text>
            <TextInput
              style={styles.input}
              placeholder="Search for a movie"
              placeholderTextColor="#666"
              value={searchQuery}
              onChangeText={handleSearchChange}
            />
            {searchLoading ? (
              <ActivityIndicator color="#fff" style={{ marginBottom: 8 }} />
            ) : null}
            {selectedMovie ? (
              <View style={styles.selectedMovie}>
                <Image
                  source={{
                    uri: selectedMovie.poster_path
                      ? IMAGE_BASE + selectedMovie.poster_path
                      : "https://via.placeholder.com/120x180/222/666?text=No+Poster",
                  }}
                  style={styles.selectedPoster}
                />
                <View style={styles.selectedInfo}>
                  <Text style={styles.selectedTitle}>
                    {selectedMovie.title}
                  </Text>
                  {selectedMovie.release_date ? (
                    <Text style={styles.selectedMeta}>
                      {new Date(selectedMovie.release_date).getFullYear()}
                    </Text>
                  ) : null}
                  <Pressable
                    style={styles.clearSelection}
                    onPress={() => setSelectedMovie(null)}
                  >
                    <Text style={styles.clearSelectionText}>Change</Text>
                  </Pressable>
                </View>
              </View>
            ) : (
              <FlatList
                data={searchResults}
                keyExtractor={(item) => String(item.id)}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.searchList}
                renderItem={({ item }) => (
                  <Pressable
                    style={styles.searchCard}
                    onPress={() => setSelectedMovie(item)}
                  >
                    <Image
                      source={{
                        uri: item.poster_path
                          ? IMAGE_BASE + item.poster_path
                          : "https://via.placeholder.com/120x180/222/666?text=No+Poster",
                      }}
                      style={styles.searchPoster}
                    />
                    <Text style={styles.searchTitle} numberOfLines={2}>
                      {item.title}
                    </Text>
                  </Pressable>
                )}
              />
            )}
            <TextInput
              style={[styles.input, styles.inputMultiline]}
              placeholder="Add a note (optional)"
              placeholderTextColor="#666"
              value={postNote}
              onChangeText={setPostNote}
              multiline
            />
            <Pressable
              style={styles.primaryButton}
              onPress={sharePost}
              disabled={actionLoading || !selectedMovie}
            >
              <Text style={styles.primaryText}>Share</Text>
            </Pressable>
          </View>
          <FlatList
            data={posts}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
            renderItem={({ item }) => (
              <View style={styles.postCard}>
                <View style={styles.postHeader}>
                  <Image
                    source={{
                      uri: item.posterPath
                        ? IMAGE_BASE + item.posterPath
                        : "https://via.placeholder.com/80x120/222/666?text=No+Poster",
                    }}
                    style={styles.postPoster}
                  />
                  <View style={styles.postInfo}>
                    <Text style={styles.postTitle}>{item.title}</Text>
                    {item.year ? (
                      <Text style={styles.postMeta}>{item.year}</Text>
                    ) : null}
                  </View>
                </View>
                {item.note ? (
                  <Text style={styles.postNote}>{item.note}</Text>
                ) : null}
                <Text style={styles.postMeta}>{item.authorId}</Text>
              </View>
            )}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#121212",
    paddingTop: 24,
  },
  header: {
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  backText: {
    color: "#8bbdff",
    marginBottom: 8,
  },
  title: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "700",
  },
  metaText: {
    color: "#777",
    marginTop: 6,
  },
  tabs: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  tabButton: {
    flex: 1,
    backgroundColor: "#1c1c1c",
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
  },
  tabActive: {
    backgroundColor: "#2b2b2b",
  },
  tabText: {
    color: "#fff",
    fontWeight: "600",
  },
  content: {
    flex: 1,
  },
  list: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  messageBubble: {
    padding: 12,
    borderRadius: 12,
    marginBottom: 10,
    maxWidth: "80%",
  },
  messageMine: {
    backgroundColor: "#1E90FF",
    alignSelf: "flex-end",
  },
  messageOther: {
    backgroundColor: "#1f1f1f",
    alignSelf: "flex-start",
  },
  messageText: {
    color: "#fff",
  },
  inputRow: {
    flexDirection: "row",
    gap: 10,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#1f1f1f",
  },
  input: {
    flex: 1,
    backgroundColor: "#111",
    borderWidth: 1,
    borderColor: "#2a2a2a",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: "#fff",
  },
  inputMultiline: {
    minHeight: 80,
    textAlignVertical: "top",
  },
  sendButton: {
    backgroundColor: "#1E90FF",
    borderRadius: 10,
    paddingHorizontal: 14,
    justifyContent: "center",
  },
  sendText: {
    color: "#fff",
    fontWeight: "600",
  },
  panel: {
    backgroundColor: "#1a1a1a",
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
  },
  panelTitle: {
    color: "#fff",
    fontWeight: "600",
    marginBottom: 10,
  },
  searchList: {
    paddingBottom: 8,
  },
  searchCard: {
    width: 110,
    marginRight: 12,
  },
  searchPoster: {
    width: 110,
    height: 165,
    borderRadius: 8,
    marginBottom: 6,
  },
  searchTitle: {
    color: "#ddd",
    fontSize: 12,
  },
  selectedMovie: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 12,
  },
  selectedPoster: {
    width: 90,
    height: 135,
    borderRadius: 8,
  },
  selectedInfo: {
    flex: 1,
    justifyContent: "center",
  },
  selectedTitle: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
  selectedMeta: {
    color: "#888",
    marginTop: 4,
  },
  clearSelection: {
    marginTop: 10,
    backgroundColor: "#2a2a2a",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    alignSelf: "flex-start",
  },
  clearSelectionText: {
    color: "#fff",
    fontSize: 12,
  },
  primaryButton: {
    backgroundColor: "#1E90FF",
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 6,
  },
  primaryText: {
    color: "#fff",
    fontWeight: "600",
  },
  postCard: {
    backgroundColor: "#1a1a1a",
    padding: 14,
    borderRadius: 12,
    marginBottom: 12,
  },
  postHeader: {
    flexDirection: "row",
    gap: 12,
  },
  postPoster: {
    width: 60,
    height: 90,
    borderRadius: 6,
  },
  postInfo: {
    flex: 1,
    justifyContent: "center",
  },
  postTitle: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
  postNote: {
    color: "#bbb",
    marginTop: 6,
  },
  postMeta: {
    color: "#666",
    marginTop: 8,
    fontSize: 12,
  },
});

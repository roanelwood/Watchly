import { auth, db } from "@/firebaseConfig";
import { useRouter } from "expo-router";
import {
  collection,
  doc,
  getDocs,
  increment,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  where,
} from "firebase/firestore";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

type UserGroup = {
  id: string;
  name: string;
  role: string;
  joinedAt?: any;
};

export default function Page() {
  const router = useRouter();
  const user = auth.currentUser;
  const [groups, setGroups] = useState<UserGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<"create" | "join" | null>(null);
  const [groupName, setGroupName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const groupsRef = useMemo(() => {
    if (!user) return null;
    return collection(db, "users", user.uid, "groups");
  }, [user]);

  useEffect(() => {
    if (!groupsRef) {
      setGroups([]);
      setLoading(false);
      return;
    }

    // Live listener for the user's groups, newest membership first.
    const groupsQuery = query(groupsRef, orderBy("joinedAt", "desc"));
    const unsub = onSnapshot(
      groupsQuery,
      (snapshot) => {
        const items = snapshot.docs.map((docSnap) => {
          const data = docSnap.data();
          return {
            id: docSnap.id,
            name: data.name ?? "Group",
            role: data.role ?? "member",
            joinedAt: data.joinedAt,
          };
        });
        setGroups(items);
        setLoading(false);
      },
      () => {
        setGroups([]);
        setLoading(false);
      },
    );

    return () => unsub();
  }, [groupsRef]);

  // generates 6 digit alphabetic code
  const generateJoinCode = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let code = "";
    for (let i = 0; i < 6; i += 1) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  // Creates the group and membership records
  const handleCreateGroup = async () => {
    if (!user) {
      setError("You must be signed in to create a group.");
      return;
    }

    const trimmedName = groupName.trim();
    if (!trimmedName) {
      setError("Group name is required.");
      return;
    }

    setActionLoading(true);
    setError(null);

    try {
      const joinCodeValue = generateJoinCode();
      const groupRef = doc(collection(db, "groups"));
      await runTransaction(db, async (tx) => {
        // Create group and membersship
        tx.set(groupRef, {
          name: trimmedName,
          ownerId: user.uid,
          joinCode: joinCodeValue,
          memberCount: 1,
          createdAt: serverTimestamp(),
        });
        const memberRef = doc(db, "groups", groupRef.id, "members", user.uid);
        tx.set(memberRef, {
          userId: user.uid,
          role: "owner",
          joinedAt: serverTimestamp(),
        });
        const userGroupRef = doc(db, "users", user.uid, "groups", groupRef.id);
        tx.set(userGroupRef, {
          groupId: groupRef.id,
          name: trimmedName,
          role: "owner",
          joinedAt: serverTimestamp(),
        });
      });

      setGroupName("");
      setMode(null);
      router.push(`/group/${groupRef.id}` as any);
    } catch (e: any) {
      setError(String(e?.message || e));
    } finally {
      setActionLoading(false);
    }
  };

  // joins an existing group by code and updates membership counts
  const handleJoinGroup = async () => {
    if (!user) {
      setError("You must be signed in to join a group.");
      return;
    }

    const normalizedCode = joinCode.trim().toUpperCase();
    if (!normalizedCode) {
      setError("Join code is required.");
      return;
    }

    setActionLoading(true);
    setError(null);

    try {
      const groupsQuery = query(
        collection(db, "groups"),
        where("joinCode", "==", normalizedCode),
      );
      const groupSnap = await getDocs(groupsQuery);
      if (groupSnap.empty) {
        setError("No group found with that code.");
        return;
      }

      const groupDoc = groupSnap.docs[0];
      const groupRef = groupDoc.ref;
      const groupData = groupDoc.data();

      await runTransaction(db, async (tx) => {
        const memberRef = doc(db, "groups", groupRef.id, "members", user.uid);
        const memberSnap = await tx.get(memberRef);
        if (memberSnap.exists()) return;

        tx.set(memberRef, {
          userId: user.uid,
          role: "member",
          joinedAt: serverTimestamp(),
        });
        tx.update(groupRef, {
          memberCount: increment(1),
        });
        const userGroupRef = doc(db, "users", user.uid, "groups", groupRef.id);
        tx.set(userGroupRef, {
          groupId: groupRef.id,
          name: groupData.name ?? "Group",
          role: "member",
          joinedAt: serverTimestamp(),
        });
      });

      setJoinCode("");
      setMode(null);
      router.push(`/group/${groupRef.id}` as any);
    } catch (e: any) {
      setError(String(e?.message || e));
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Groups</Text>
        <Text style={styles.subtitle}>Create a group or join with a code.</Text>
      </View>

      <View style={styles.actions}>
        <Pressable
          style={[
            styles.actionButton,
            mode === "create" && styles.actionActive,
          ]}
          onPress={() => setMode(mode === "create" ? null : "create")}
        >
          <Text style={styles.actionText}>Create group</Text>
        </Pressable>
        <Pressable
          style={[styles.actionButton, mode === "join" && styles.actionActive]}
          onPress={() => setMode(mode === "join" ? null : "join")}
        >
          <Text style={styles.actionText}>Join with code</Text>
        </Pressable>
      </View>

      {/* Toggle between create/join panels based on active mode. */}
      {mode === "create" && (
        <View style={styles.panel}>
          <Text style={styles.panelTitle}>New group</Text>
          <TextInput
            style={styles.input}
            placeholder="Group name"
            placeholderTextColor="#666"
            value={groupName}
            onChangeText={setGroupName}
            autoCapitalize="words"
          />
          <Pressable
            style={styles.primaryButton}
            onPress={handleCreateGroup}
            disabled={actionLoading}
          >
            {actionLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.primaryText}>Create</Text>
            )}
          </Pressable>
        </View>
      )}

      {mode === "join" && (
        <View style={styles.panel}>
          <Text style={styles.panelTitle}>Join a group</Text>
          <TextInput
            style={styles.input}
            placeholder="Join code"
            placeholderTextColor="#666"
            value={joinCode}
            onChangeText={setJoinCode}
            autoCapitalize="characters"
          />
          <Pressable
            style={styles.primaryButton}
            onPress={handleJoinGroup}
            disabled={actionLoading}
          >
            {actionLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.primaryText}>Join</Text>
            )}
          </Pressable>
        </View>
      )}

      {error && <Text style={styles.errorText}>{error}</Text>}

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Your groups</Text>
      </View>

      {/* Loading or empty or content states for the user's groups list */}
      {loading ? (
        <ActivityIndicator color="#fff" style={{ marginTop: 20 }} />
      ) : groups.length === 0 ? (
        <Text style={styles.emptyText}>No groups yet.</Text>
      ) : (
        <FlatList
          data={groups}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <Pressable
              style={styles.groupCard}
              onPress={() => router.push(`/group/${item.id}` as any)}
            >
              <Text style={styles.groupName}>{item.name}</Text>
              <Text style={styles.groupMeta}>{item.role}</Text>
            </Pressable>
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
    paddingHorizontal: 20,
    paddingTop: 32,
  },
  header: {
    marginBottom: 16,
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
  },
  actions: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  actionButton: {
    flex: 1,
    backgroundColor: "#222",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  actionActive: {
    backgroundColor: "#2a2a2a",
  },
  actionText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  panel: {
    backgroundColor: "#1a1a1a",
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  panelTitle: {
    color: "#fff",
    fontWeight: "600",
    marginBottom: 10,
  },
  input: {
    backgroundColor: "#111",
    borderWidth: 1,
    borderColor: "#2a2a2a",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: "#fff",
    marginBottom: 12,
  },
  primaryButton: {
    backgroundColor: "#1E90FF",
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
  },
  primaryText: {
    color: "#fff",
    fontWeight: "600",
  },
  errorText: {
    color: "#ff6b6b",
    marginBottom: 8,
  },
  sectionHeader: {
    marginTop: 8,
    marginBottom: 8,
  },
  sectionTitle: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
  emptyText: {
    color: "#777",
    marginTop: 12,
  },
  list: {
    paddingBottom: 40,
  },
  groupCard: {
    backgroundColor: "#1a1a1a",
    padding: 14,
    borderRadius: 12,
    marginBottom: 12,
  },
  groupName: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  groupMeta: {
    color: "#888",
    marginTop: 4,
  },
});

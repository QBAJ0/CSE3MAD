import Ionicons from "@expo/vector-icons/Ionicons";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { timeAgo } from "../../utils/formatting";
import { isFirebaseConfigured as isConfigured } from "@/src/firebase";
import {
  CloudSyncError,
  fetchComments,
  postComment,
} from "../../services/leaderboard";
import { Comment } from "../../types";

interface Props {
  challengeId: number;
  teamName: string;
  discriminator: string;
}

export function CommentsSection({ challengeId, teamName, discriminator }: Props) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    if (!isConfigured) {
      setLoading(false);
      return;
    }
    fetchComments(challengeId)
      .then((data) => setComments(data))
      .catch((e) => {
        const reason = e instanceof CloudSyncError ? e.reason : "unknown";
        setFetchError(
          reason === "offline"
            ? "You're offline. Comments are unavailable."
            : reason === "permission"
              ? "Comments aren't available right now."
              : "Couldn't load comments. Try again later.",
        );
      })
      .finally(() => setLoading(false));
  }, [challengeId]);

  const handlePost = async () => {
    const trimmed = text.trim();
    if (!trimmed || trimmed.length < 3) return;
    setPosting(true);
    const newComment: Omit<Comment, "id"> = {
      activityId: "",
      challengeId,
      teamName,
      discriminator,
      text: trimmed,
      createdAt: new Date().toISOString(),
    };
    const ok = await postComment(newComment);
    if (ok) {
      setComments((prev) => [
        { ...newComment, id: Date.now().toString() },
        ...prev,
      ]);
      setText("");
    } else {
      Alert.alert("Couldn't post", "Check your connection and try again.");
    }
    setPosting(false);
  };

  if (!isConfigured) {
    return (
      <View style={styles.card}>
        <View style={styles.titleRow}>
          <Ionicons name="chatbubbles-outline" size={16} color="#12343B" />
          <Text style={styles.title}>Team Comments</Text>
        </View>
        <View style={styles.offlineBox}>
          <Ionicons name="cloud-offline-outline" size={20} color="#94A3B8" />
          <Text style={styles.offlineText}>
            Configure Firebase to enable community comments.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.card}>
        <View style={styles.titleRow}>
          <Ionicons name="chatbubbles-outline" size={16} color="#12343B" />
          <Text style={styles.title}>Team Comments</Text>
          {comments.length > 0 && (
            <View style={styles.countBadge}>
              <Text style={styles.countText}>{comments.length}</Text>
            </View>
          )}
        </View>

        {/* Input row */}
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            placeholder="Share what you discovered…"
            placeholderTextColor="#94A3B8"
            value={text}
            onChangeText={setText}
            multiline
            maxLength={280}
          />
          <TouchableOpacity
            style={[styles.postBtn, (!text.trim() || posting) && styles.postBtnDisabled]}
            onPress={handlePost}
            disabled={!text.trim() || posting}
          >
            {posting ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <Ionicons name="send" size={18} color="#FFF" />
            )}
          </TouchableOpacity>
        </View>

        {/* Comments list */}
        {loading ? (
          <ActivityIndicator
            size="small"
            color="#2F80ED"
            style={{ marginTop: 12 }}
          />
        ) : fetchError ? (
          <View style={styles.fetchErrorBox}>
            <Ionicons name="cloud-offline-outline" size={18} color="#F97316" />
            <Text style={styles.fetchErrorText}>{fetchError}</Text>
          </View>
        ) : comments.length === 0 ? (
          <Text style={styles.emptyText}>
            No comments yet — be the first!
          </Text>
        ) : (
          <ScrollView
            style={styles.list}
            nestedScrollEnabled
            showsVerticalScrollIndicator={false}
          >
            {comments.map((c) => (
              <View key={c.id} style={styles.commentItem}>
                <View style={styles.commentHeader}>
                  <Text style={styles.commentTeam}>
                    {c.teamName}
                    <Text style={styles.commentDisc}> #{c.discriminator}</Text>
                  </Text>
                  <Text style={styles.commentTime}>{timeAgo(c.createdAt)}</Text>
                </View>
                <Text style={styles.commentText}>{c.text}</Text>
              </View>
            ))}
          </ScrollView>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 14,
  },
  title: { fontSize: 16, fontWeight: "800", color: "#12343B", flex: 1 },
  countBadge: {
    backgroundColor: "#2F80ED",
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  countText: { color: "#FFF", fontSize: 11, fontWeight: "700" },
  offlineBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#F1F5F9",
    borderRadius: 12,
    padding: 14,
  },
  offlineText: { color: "#64748B", fontSize: 13, flex: 1 },
  inputRow: {
    flexDirection: "row",
    gap: 10,
    alignItems: "flex-end",
    marginBottom: 14,
  },
  input: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    padding: 10,
    fontSize: 14,
    color: "#12343B",
    backgroundColor: "#F8FAFC",
    minHeight: 44,
    maxHeight: 100,
  },
  postBtn: {
    backgroundColor: "#2F80ED",
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  postBtnDisabled: { backgroundColor: "#CBD5E1" },
  emptyText: {
    textAlign: "center",
    color: "#94A3B8",
    fontSize: 13,
    paddingVertical: 12,
  },
  list: { maxHeight: 300 },
  fetchErrorBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#FFF7ED",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "#FDBA74",
  },
  fetchErrorText: { color: "#C2410C", fontSize: 13, flex: 1 },
  commentItem: {
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    paddingTop: 12,
    marginTop: 4,
  },
  commentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  commentTeam: { fontSize: 13, fontWeight: "700", color: "#12343B" },
  commentDisc: { color: "#94A3B8", fontWeight: "400" },
  commentTime: { fontSize: 11, color: "#94A3B8" },
  commentText: { fontSize: 14, color: "#334155", lineHeight: 20 },
});

import Ionicons from "@expo/vector-icons/Ionicons";
import { useEffect, useMemo, useState } from "react";
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
import { isFirebaseConfigured } from "@/src/firebase";
import {
  CloudSyncError,
  fetchComments,
  postComment,
} from "../../services/leaderboard";
import type { ColorTokens } from "../../theme/colors";
import { useTheme } from "../../theme/themeContext";
import { Comment } from "../../types";

interface Props {
  challengeId: number;
  teamName: string;
  discriminator: string;
}

export function CommentsSection({ challengeId, teamName, discriminator }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    if (!isFirebaseConfigured) {
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

  if (!isFirebaseConfigured) {
    return (
      <View style={styles.card}>
        <View style={styles.titleRow}>
          <Ionicons name="chatbubbles-outline" size={16} color={colors.text} />
          <Text style={styles.title}>Team Comments</Text>
        </View>
        <View style={styles.offlineBox}>
          <Ionicons name="cloud-offline-outline" size={20} color={colors.textMuted} />
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
          <Ionicons name="chatbubbles-outline" size={16} color={colors.text} />
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
            placeholderTextColor={colors.textMuted}
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
            color={colors.info}
            style={{ marginTop: 12 }}
          />
        ) : fetchError ? (
          <View style={styles.fetchErrorBox}>
            <Ionicons name="cloud-offline-outline" size={18} color={colors.warning} />
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

function createStyles(c: ColorTokens) {
  return StyleSheet.create({
    card: {
      backgroundColor: c.surface,
      borderRadius: 20,
      padding: 20,
      marginHorizontal: 20,
      marginBottom: 14,
      borderWidth: 1,
      borderColor: c.borderFaint,
    },
    titleRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      marginBottom: 14,
    },
    title: { fontSize: 16, fontWeight: "800", color: c.text, flex: 1 },
    countBadge: {
      backgroundColor: c.info,
      borderRadius: 10,
      paddingHorizontal: 8,
      paddingVertical: 2,
    },
    countText: { color: "#FFF", fontSize: 11, fontWeight: "700" },
    offlineBox: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      backgroundColor: c.backgroundSecondary,
      borderRadius: 12,
      padding: 14,
    },
    offlineText: { color: c.textSecondary, fontSize: 13, flex: 1 },
    inputRow: {
      flexDirection: "row",
      gap: 10,
      alignItems: "flex-end",
      marginBottom: 14,
    },
    input: {
      flex: 1,
      borderWidth: 1.5,
      borderColor: c.inputBorder,
      borderRadius: 12,
      padding: 10,
      fontSize: 14,
      color: c.text,
      backgroundColor: c.backgroundSecondary,
      minHeight: 44,
      maxHeight: 100,
    },
    postBtn: {
      backgroundColor: c.info,
      width: 44,
      height: 44,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
    },
    postBtnDisabled: { backgroundColor: c.border },
    emptyText: {
      textAlign: "center",
      color: c.textMuted,
      fontSize: 13,
      paddingVertical: 12,
    },
    list: { maxHeight: 300 },
    fetchErrorBox: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      backgroundColor: c.warningLight,
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: 10,
      borderWidth: 1,
      borderColor: c.warning,
    },
    fetchErrorText: { color: c.cta, fontSize: 13, flex: 1 },
    commentItem: {
      borderTopWidth: 1,
      borderTopColor: c.borderFaint,
      paddingTop: 12,
      marginTop: 4,
    },
    commentHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: 4,
    },
    commentTeam: { fontSize: 13, fontWeight: "700", color: c.text },
    commentDisc: { color: c.textMuted, fontWeight: "400" },
    commentTime: { fontSize: 11, color: c.textMuted },
    commentText: { fontSize: 14, color: c.textSecondary, lineHeight: 20 },
  });
}

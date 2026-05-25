// app/(onboarding)/register.tsx
// Screen where students create a new team.

import Ionicons from "@expo/vector-icons/Ionicons";
import { router } from "expo-router";
import { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useTeam } from "../../src/context/TeamContext";
import { ensureFirebaseAuth } from "../../src/services/authSession";

const YEAR_OPTIONS = ["Year 5", "Year 6", "Year 7", "Year 8", "Year 9", "Year 10"];

const AVATAR_COLORS = ["#0F766E", "#2563EB", "#FED7AA", "#F97316", "#0F766E", "#2563EB"];

type Member = {
  name: string;
  year: string;
  grade: string;
};

export default function RegisterScreen() {
  const { setTeamData } = useTeam();

  const [teamName, setTeamName] = useState("");
  const [members, setMembers] = useState<Member[]>([
    { name: "", year: "", grade: "Year 7" },
  ]);
  const [isCreating, setIsCreating] = useState(false);

  const [discriminator] = useState(
    () => "#" + Math.floor(1000 + Math.random() * 9000)
  );

  const updateMember = (index: number, field: keyof Member, value: string) => {
    setMembers((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const addMember = () => {
    if (members.length >= 6) {
      Alert.alert("Max Members", "Teams can have up to 6 members.");
      return;
    }
    setMembers((prev) => [...prev, { name: "", year: "", grade: "Year 7" }]);
  };

  const removeMember = (index: number) => {
    if (members.length <= 1) {
      Alert.alert("Minimum Members", "You need at least one team member.");
      return;
    }
    setMembers((prev) => prev.filter((_, i) => i !== index));
  };

  const handleCreate = async () => {
    const trimmedName = teamName.trim();

    if (!trimmedName) {
      Alert.alert("Missing Team Name", "Please give your team a name!");
      return;
    }

    const filledMembers = members.filter((m) => m.name.trim());
    if (filledMembers.length === 0) {
      Alert.alert("No Members", "Add at least one team member to continue.");
      return;
    }

    setIsCreating(true);
    await setTeamData({
      teamName: trimmedName,
      discriminator,
      members: filledMembers,
    });
    void ensureFirebaseAuth().catch(() => {});
    router.push("/(onboarding)/team-confirmation");
    setIsCreating(false);
  };

  const canCreate =
    teamName.trim().length > 0 && members.some((m) => m.name.trim());

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ── */}
        <View style={styles.header}>
          <Ionicons name="rocket" size={32} color="#FED7AA" style={styles.headerIcon} />
          <Text style={styles.headerTitle}>Create Your Team</Text>
          <Text style={styles.headerSubtitle}>
            Gather your squad and start the adventure!
          </Text>
        </View>

        {/* ── Team Name section ── */}
        <View style={styles.section}>
          <View style={styles.sectionTitleRow}>
            <Ionicons name="pricetag-outline" size={18} color="#0F766E" />
            <Text style={styles.sectionTitle}>Team Name</Text>
          </View>

          <TextInput
            style={[styles.input, teamName.trim() ? styles.inputFilled : null]}
            placeholder="e.g. STEM Stars"
            placeholderTextColor="#94A3B8"
            value={teamName}
            onChangeText={setTeamName}
            returnKeyType="next"
            maxLength={30}
          />

          {teamName.trim().length > 0 && (
            <View style={styles.teamIdBox}>
              <Text style={styles.teamIdLabel}>YOUR TEAM ID</Text>
              <Text style={styles.teamIdCode}>{discriminator}</Text>
              <Text style={styles.teamIdNote}>
                Share this code so others can join your team
              </Text>
            </View>
          )}
        </View>

        {/* ── Members section ── */}
        <View style={styles.section}>
          <View style={styles.sectionRow}>
            <View style={styles.sectionTitleRow}>
              <Ionicons name="people-outline" size={18} color="#0F766E" />
              <Text style={styles.sectionTitle}>Team Members</Text>
            </View>
            <View style={styles.countBadge}>
              <Text style={styles.countBadgeText}>{members.length}/6</Text>
            </View>
          </View>

          {members.map((member, index) => (
            <View
              key={index}
              style={[
                styles.memberCard,
                { borderLeftColor: AVATAR_COLORS[index % AVATAR_COLORS.length] },
              ]}
            >
              <View style={styles.memberCardHeader}>
                <View
                  style={[
                    styles.avatar,
                    { backgroundColor: AVATAR_COLORS[index % AVATAR_COLORS.length] },
                  ]}
                >
                  <Text style={styles.avatarText}>
                    {member.name.trim()
                      ? member.name.charAt(0).toUpperCase()
                      : String(index + 1)}
                  </Text>
                </View>
                <Text style={styles.memberLabel}>Member {index + 1}</Text>
                {index > 0 && (
                  <Pressable
                    onPress={() => removeMember(index)}
                    style={styles.removeBtn}
                  >
                    <Ionicons name="close" size={12} color="#DC2626" />
                    <Text style={styles.removeBtnText}>Remove</Text>
                  </Pressable>
                )}
              </View>

              <TextInput
                style={[
                  styles.input,
                  member.name.trim() ? styles.inputFilled : null,
                ]}
                placeholder="First name"
                placeholderTextColor="#94A3B8"
                value={member.name}
                onChangeText={(v) => updateMember(index, "name", v)}
                maxLength={30}
              />

              <TextInput
                style={[styles.input, styles.inputSmall]}
                placeholder="Age or year (optional)"
                placeholderTextColor="#94A3B8"
                value={member.year}
                onChangeText={(v) => updateMember(index, "year", v)}
                maxLength={10}
              />

              <Text style={styles.gradeLabel}>YEAR LEVEL</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.gradeRow}
              >
                {YEAR_OPTIONS.map((grade) => {
                  const isSelected = member.grade === grade;
                  return (
                    <TouchableOpacity
                      key={grade}
                      style={[
                        styles.gradeChip,
                        isSelected && styles.gradeChipSelected,
                      ]}
                      onPress={() => updateMember(index, "grade", grade)}
                      activeOpacity={0.75}
                    >
                      <Text
                        style={[
                          styles.gradeChipText,
                          isSelected && styles.gradeChipTextSelected,
                        ]}
                      >
                        {grade}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          ))}

          {members.length < 6 && (
            <TouchableOpacity style={styles.addBtn} onPress={addMember}>
              <Text style={styles.addBtnText}>+  Add Another Member</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* ── Create button ── */}
        <View style={styles.footer}>
          <Pressable
            style={[
              styles.createBtn,
              !canCreate && styles.createBtnDisabled,
            ]}
            onPress={handleCreate}
            disabled={!canCreate || isCreating}
          >
            {isCreating ? (
              <Text style={styles.createBtnText}>Creating...</Text>
            ) : (
              <View style={styles.createBtnRow}>
                <Ionicons name="rocket" size={18} color="#FFFFFF" />
                <Text style={styles.createBtnText}>Create Team & Start</Text>
              </View>
            )}
          </Pressable>

          <TouchableOpacity
            style={styles.backLink}
            onPress={() => router.back()}
          >
            <Text style={styles.backLinkText}>Back to Welcome</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// --- Styles ---
const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#FFF7ED",
  },
  content: {
    paddingBottom: 48,
  },

  header: {
    backgroundColor: "#0F766E",
    paddingTop: 56,
    paddingBottom: 32,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    marginBottom: 24,
    alignItems: "flex-start",
    gap: 6,
  },
  headerIcon: {
    marginBottom: 4,
  },
  headerTitle: {
    fontSize: 30,
    fontWeight: "900",
    color: "#FFFFFF",
  },
  headerSubtitle: {
    fontSize: 15,
    color: "rgba(255,255,255,0.85)",
    lineHeight: 22,
  },

  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
    gap: 12,
  },
  sectionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#0F766E",
  },
  countBadge: {
    backgroundColor: "#FED7AA",
    borderWidth: 1,
    borderColor: "#F97316",
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
  },
  countBadgeText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#0F766E",
  },

  input: {
    borderWidth: 1.5,
    borderColor: "#FFF7ED",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: "#0F766E",
    backgroundColor: "#FFFFFF",
  },
  inputFilled: {
    borderColor: "#2563EB",
    backgroundColor: "#FFFFFF",
  },
  inputSmall: {
    marginTop: 8,
  },

  teamIdBox: {
    backgroundColor: "#FED7AA",
    borderRadius: 12,
    padding: 16,
    gap: 4,
    borderWidth: 1.5,
    borderColor: "#F97316",
  },
  teamIdLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: "#0F766E",
    letterSpacing: 1.5,
  },
  teamIdCode: {
    fontSize: 28,
    fontWeight: "900",
    color: "#F97316",
  },
  teamIdNote: {
    fontSize: 12,
    color: "#0F766E",
    opacity: 0.75,
  },

  memberCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    borderLeftWidth: 4,
    borderTopWidth: 1,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderTopColor: "#FFF7ED",
    borderRightColor: "#FFF7ED",
    borderBottomColor: "#FFF7ED",
    gap: 10,
  },
  memberCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 4,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 15,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  memberLabel: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0F766E",
    flex: 1,
  },
  removeBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: "#FEE2E2",
    borderWidth: 1,
    borderColor: "#FCA5A5",
  },
  removeBtnText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#DC2626",
  },

  gradeLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: "#94A3B8",
    letterSpacing: 1.5,
  },
  gradeRow: {
    flexDirection: "row",
    gap: 8,
    paddingVertical: 4,
  },
  gradeChip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 12,
    backgroundColor: "#FFF7ED",
    borderWidth: 1.5,
    borderColor: "#FFF7ED",
  },
  gradeChipSelected: {
    backgroundColor: "#F97316",
    borderColor: "#F97316",
  },
  gradeChipText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#0F766E",
  },
  gradeChipTextSelected: {
    color: "#FFFFFF",
    fontWeight: "700",
  },

  addBtn: {
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: "#0F766E",
    alignItems: "center",
    backgroundColor: "#FFF7ED",
  },
  addBtnText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0F766E",
  },

  footer: {
    paddingHorizontal: 20,
    gap: 12,
  },
  createBtn: {
    backgroundColor: "#F97316",
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: "center",
  },
  createBtnRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  createBtnDisabled: {
    backgroundColor: "#CBD5E1",
  },
  createBtnText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "800",
  },
  backLink: {
    alignItems: "center",
    paddingVertical: 10,
  },
  backLinkText: {
    fontSize: 14,
    color: "#94A3B8",
    fontWeight: "600",
  },
});

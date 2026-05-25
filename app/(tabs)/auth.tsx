import Ionicons from "@expo/vector-icons/Ionicons";
import { onAuthStateChanged, type User } from "firebase/auth";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { auth, isFirebaseConfigured } from "@/src/firebase";
import {
  registerWithEmail,
  signInWithEmail,
  signOutUser,
} from "@/src/services/authEmail";

export default function AuthScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [user, setUser] = useState<User | null>(null);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!auth) {
      setUser(null);
      return;
    }
    return onAuthStateChanged(auth, setUser);
  }, []);

  const onRegister = async () => {
    setBusy(true);
    setMessage("");
    try {
      await registerWithEmail(email.trim(), password);
      setMessage("Account created.");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Could not register.");
    } finally {
      setBusy(false);
    }
  };

  const onSignIn = async () => {
    setBusy(true);
    setMessage("");
    try {
      await signInWithEmail(email.trim(), password);
      setMessage("Signed in.");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Could not sign in.");
    } finally {
      setBusy(false);
    }
  };

  const onSignOut = async () => {
    setBusy(true);
    setMessage("");
    try {
      await signOutUser();
      setMessage("Signed out.");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Could not sign out.");
    } finally {
      setBusy(false);
    }
  };

  if (!isFirebaseConfigured) {
    return (
      <ScrollView contentContainerStyle={styles.container}>
        <HeaderCard
          icon="cloud-offline-outline"
          title="Email sign-in"
          subtitle="Copy .env.example to .env, add your Firebase web app keys, then restart Expo with cache clear."
        />
      </ScrollView>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <HeaderCard
        icon="shield-checkmark-outline"
        title="Email sign-in"
        subtitle="Save cloud leaderboard progress with your team account."
      />

      <View style={styles.formCard}>
        <Text style={styles.label}>Email</Text>
        <TextInput
          style={styles.input}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
          placeholder="you@school.edu"
          placeholderTextColor="#94A3B8"
        />

        <Text style={styles.label}>Password</Text>
        <TextInput
          style={styles.input}
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          placeholder="At least 6 characters"
          placeholderTextColor="#94A3B8"
        />

        <View style={styles.row}>
          <Pressable
            style={[styles.button, busy && styles.buttonDisabled]}
            onPress={onSignIn}
            disabled={busy}
          >
            {busy ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="log-in-outline" size={17} color="#FFFFFF" />
                <Text style={styles.buttonLabel}>Sign in</Text>
              </>
            )}
          </Pressable>
          <Pressable
            style={[styles.buttonSecondary, busy && styles.buttonDisabled]}
            onPress={onRegister}
            disabled={busy}
          >
            <Ionicons name="person-add-outline" size={17} color="#0F766E" />
            <Text style={styles.buttonSecondaryLabel}>Register</Text>
          </Pressable>
        </View>
      </View>

      {user ? (
        <View style={styles.card}>
          <View style={styles.cardTitleRow}>
            <Ionicons name="checkmark-circle" size={18} color="#0F766E" />
            <Text style={styles.cardTitle}>Signed in</Text>
          </View>
          <Text style={styles.mono}>{user.uid}</Text>
          <Text style={styles.mono}>{user.email ?? ""}</Text>
          <Pressable
            style={[styles.buttonOutline, busy && styles.buttonDisabled]}
            onPress={onSignOut}
            disabled={busy}
          >
            <Text style={styles.buttonOutlineLabel}>Sign out</Text>
          </Pressable>
        </View>
      ) : (
        <View style={styles.statusPill}>
          <Ionicons name="ellipse-outline" size={13} color="#F97316" />
          <Text style={styles.subtle}>Not signed in</Text>
        </View>
      )}

      {message ? <Text style={styles.message}>{message}</Text> : null}
    </ScrollView>
  );
}

function HeaderCard({
  icon,
  title,
  subtitle,
}: {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  title: string;
  subtitle: string;
}) {
  return (
    <View style={styles.hero}>
      <View style={styles.heroIcon}>
        <Ionicons name={icon} size={30} color="#FED7AA" />
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.hint}>{subtitle}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    paddingTop: 56,
    gap: 14,
    backgroundColor: "#FFF7ED",
  },
  hero: {
    backgroundColor: "#0F766E",
    borderRadius: 24,
    padding: 20,
    gap: 8,
  },
  heroIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(255,255,255,0.14)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  hint: {
    fontSize: 14,
    color: "rgba(255,255,255,0.82)",
    lineHeight: 20,
  },
  formCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: "#FED7AA",
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0F766E",
    marginTop: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: "#FED7AA",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    backgroundColor: "#FFFBF7",
    color: "#0F172A",
  },
  row: {
    flexDirection: "row",
    gap: 10,
    marginTop: 12,
  },
  button: {
    flex: 1,
    backgroundColor: "#F97316",
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 6,
  },
  buttonSecondary: {
    flex: 1,
    backgroundColor: "#FED7AA",
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 6,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonLabel: {
    color: "#FFFFFF",
    fontWeight: "800",
    fontSize: 16,
  },
  buttonSecondaryLabel: {
    color: "#0F766E",
    fontWeight: "800",
    fontSize: 16,
  },
  card: {
    marginTop: 16,
    padding: 16,
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#BFDBFE",
    gap: 8,
  },
  cardTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  cardTitle: {
    fontWeight: "800",
    fontSize: 16,
    color: "#0F766E",
  },
  mono: {
    fontFamily: "monospace",
    fontSize: 12,
    color: "#334155",
  },
  statusPill: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#FFEDD5",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  subtle: {
    color: "#0F766E",
    fontWeight: "700",
  },
  message: {
    marginTop: 8,
    color: "#F97316",
    fontWeight: "700",
  },
  buttonOutline: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: "#0F766E",
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  buttonOutlineLabel: {
    color: "#0F766E",
    fontWeight: "800",
  },
});

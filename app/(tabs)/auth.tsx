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
import { onAuthStateChanged, type User } from "firebase/auth";
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
        <Text style={styles.title}>Email sign-in</Text>
        <Text style={styles.hint}>
          Copy .env.example to .env, add your Firebase web app keys, then restart
          Expo with cache clear (npx expo start -c).
        </Text>
      </ScrollView>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Email sign-in</Text>
      <Text style={styles.label}>Email</Text>
      <TextInput
        style={styles.input}
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
        placeholder="you@school.edu"
      />
      <Text style={styles.label}>Password</Text>
      <TextInput
        style={styles.input}
        secureTextEntry
        value={password}
        onChangeText={setPassword}
        placeholder="At least 6 characters"
      />
      <View style={styles.row}>
        <Pressable
          style={[styles.button, busy && styles.buttonDisabled]}
          onPress={onSignIn}
          disabled={busy}
        >
          {busy ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonLabel}>Sign in</Text>
          )}
        </Pressable>
        <Pressable
          style={[styles.buttonSecondary, busy && styles.buttonDisabled]}
          onPress={onRegister}
          disabled={busy}
        >
          <Text style={styles.buttonSecondaryLabel}>Register</Text>
        </Pressable>
      </View>
      {user ? (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Signed in</Text>
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
        <Text style={styles.subtle}>Not signed in</Text>
      )}
      {message ? <Text style={styles.message}>{message}</Text> : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingTop: 56,
    gap: 10,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 4,
  },
  hint: {
    fontSize: 14,
    color: "#555",
    lineHeight: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    marginTop: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  row: {
    flexDirection: "row",
    gap: 10,
    marginTop: 12,
  },
  button: {
    flex: 1,
    backgroundColor: "#2563eb",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  buttonSecondary: {
    flex: 1,
    backgroundColor: "#e2e8f0",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonLabel: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
  buttonSecondaryLabel: {
    color: "#0f172a",
    fontWeight: "600",
    fontSize: 16,
  },
  card: {
    marginTop: 16,
    padding: 14,
    backgroundColor: "#f1f5f9",
    borderRadius: 10,
    gap: 8,
  },
  cardTitle: {
    fontWeight: "700",
    fontSize: 16,
  },
  mono: {
    fontFamily: "monospace",
    fontSize: 12,
  },
  subtle: {
    marginTop: 12,
    color: "#64748b",
  },
  message: {
    marginTop: 8,
    color: "#b45309",
  },
  buttonOutline: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: "#2563eb",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  buttonOutlineLabel: {
    color: "#2563eb",
    fontWeight: "600",
  },
});

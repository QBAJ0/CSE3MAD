import React from "react";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Pressable, StyleSheet, Text, View } from "react-native";

type Props = { children: React.ReactNode };
type State = { hasError: boolean; error?: Error };

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("[ErrorBoundary]", error.message, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <Ionicons name="alert-circle" size={48} color="#DC2626" />
          <Text style={styles.title}>Something went wrong</Text>
          <Text style={styles.message}>{this.state.error?.message}</Text>
          <Pressable
            style={styles.button}
            onPress={() => this.setState({ hasError: false, error: undefined })}
          >
            <Text style={styles.buttonText}>Try again</Text>
          </Pressable>
        </View>
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
    backgroundColor: "#F8FAFC",
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    color: "#12343B",
    marginBottom: 10,
    textAlign: "center",
    marginTop: 16,
  },
  message: {
    fontSize: 14,
    color: "#64748B",
    textAlign: "center",
    marginBottom: 28,
  },
  button: {
    backgroundColor: "#2F80ED",
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 16,
  },
  buttonText: { color: "#FFF", fontWeight: "700", fontSize: 15 },
});

import React, { useState, useEffect, useRef } from "react";
import { View, Text, TextInput, Button, StyleSheet, Alert, TouchableOpacity, ActivityIndicator } from "react-native";
// @ts-ignore - types for expo-web-browser may not be available in this environment
import * as WebBrowser from "expo-web-browser";
import { useNavigation } from "@react-navigation/native";

export default function LoginPage() {
  const navigation = useNavigation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  // UI state for OAuth polling
  const [isPolling, setIsPolling] = useState(false);
  const [pollingMessage, setPollingMessage] = useState("");
  const [pollingSession, setPollingSession] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

//here i will need to call the db from curl http://localhost:8080/api/users



const API_BASE = "http://localhost:8080";
// const API_BASE = "https://cst438-project2-group11-63cc69e04d99.herokuapp.com";
const handleLogin = async () => {
    try {
      try {
        const res = await fetch(`${API_BASE}/api/users/login`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json"
          },
          body: JSON.stringify({ email, password })
        });
    
        if (!res.ok) {
          if (res.status === 401) throw new Error("Incorrect email or password");
          throw new Error(`Server error (${res.status})`);
        }
    
        const user = await res.json();
        (navigation as any).navigate("LandingPage", { userID: user.userId });

    
      } catch (err) {
        const msg = (err as any)?.message || String(err);
        Alert.alert("Login Failed", msg || "An unknown error occurred");
      }
  }catch (error) {
      Alert.alert("Error", "An error occurred during login. Please try again.");
      console.error("Login error:", error);
    }
};

// OAuth polling state
const OAuthPolling = {
  intervalMs: 1500,
  timeoutMs: 5 * 60 * 1000, // 5 minutes
};

const handleOAuth = async () => {
  // local state inside the function to control polling lifecycle
  let polling = true;
  try {
    const res = await fetch(`${API_BASE}/oauth/start`);
    if (!res.ok) {
      throw new Error(`OAuth start failed (${res.status})`);
    }
    const session = await res.json();
    if (!session || !session.sessionId || !session.authUrl) {
      throw new Error("Invalid OAuth start response");
    }

    // set global UI state
    setIsPolling(true);
    setPollingMessage("Opening browser to authorize...");
    setPollingSession(session.sessionId);

    // Open the GitHub authorize URL in external browser (expo-web-browser)
    await WebBrowser.openBrowserAsync(session.authUrl);

    const startTs = Date.now();

    const poll = async () => {
      try {
        setPollingMessage("Waiting for authorization...");
        const r = await fetch(`${API_BASE}/oauth/status?session=${encodeURIComponent(session.sessionId)}`);
        if (!r.ok) {
          // transient; retry
          return;
        }
        const s = await r.json();
        if (!s) return;
        if (s.status === "SUCCESS" || s.status === "ERROR") {
          polling = false;
          if (pollRef.current) {
            clearInterval(pollRef.current);
            pollRef.current = null;
          }
          setIsPolling(false);
          setPollingSession(null);
          if (s.status === "SUCCESS") {
            Alert.alert("OAuth Success", "GitHub sign-in succeeded.");
            (navigation as any).navigate("LandingPage", { oauth: true, accessToken: s.accessToken });
          } else {
            Alert.alert("OAuth Failed", s.error || "Unknown error during OAuth");
          }
        }
      } catch (e) {
        // ignore and retry
      }
    };

    pollRef.current = setInterval(() => {
      if (!polling) {
        if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
        return;
      }
      if (Date.now() - startTs > OAuthPolling.timeoutMs) {
        // timed out
        polling = false;
        if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
        setIsPolling(false);
        setPollingSession(null);
        Alert.alert("OAuth Timeout", "OAuth did not complete in time. Please try again.");
        return;
      }
      poll();
    }, OAuthPolling.intervalMs);

  } catch (err) {
    const msg = (err as any)?.message || String(err);
    setIsPolling(false);
    setPollingSession(null);
    Alert.alert("OAuth Error", msg || "An error occurred starting OAuth");
    // ensure any interval cleaned up
  }
};

// cancel polling and cleanup
const cancelPolling = () => {
  if (pollRef.current) {
    clearInterval(pollRef.current);
    pollRef.current = null;
  }
  setIsPolling(false);
  setPollingSession(null);
  setPollingMessage("");
};

useEffect(() => {
  return () => {
    // cleanup on unmount
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  };
}, []);


  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome Back!</Text>
      <TextInput style={styles.input} placeholder="User Name" value={email} onChangeText={setEmail} />
      <TextInput style={styles.input} placeholder="Password" secureTextEntry value={password} onChangeText={setPassword} />
      <Button title="Log In" onPress={handleLogin} color="#FF5733" />
      <View style={{ height: 12 }} />
      <Button title="Sign in with GitHub" onPress={handleOAuth} color="#24292e" disabled={isPolling} />
      {isPolling && (
        <View style={{ marginTop: 12, alignItems: "center" }}>
          <ActivityIndicator size="large" color="#24292e" />
          <Text style={{ marginTop: 8 }}>{pollingMessage || "Waiting for authorization..."}</Text>
          <View style={{ height: 8 }} />
          <Button title="Cancel" onPress={cancelPolling} color="#888" />
        </View>
      )}
      <TouchableOpacity onPress={() => (navigation as any).navigate("ForgotPassword")}> 
        <Text style={{ color: "blue", marginTop: 10 }}>Forgot/Reset Password?</Text> 
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#adba95",
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
  },
  input: {
    width: "80%",
    height: 40,
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 10,
    marginBottom: 10,
  },
});



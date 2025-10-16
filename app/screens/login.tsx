import React, { useState, useEffect } from "react";
import { View, Text, TextInput, Button, StyleSheet, Alert, TouchableOpacity, ActivityIndicator } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useSQLiteContext } from "expo-sqlite";

import { signIn, getUserInfo, isAuthenticated } from '../auth/auth';

export default function LoginPage() {
  const navigation = useNavigation();
  const db = useSQLiteContext();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  // Check if user is already authenticated on component mount
  useEffect(() => {
    checkAuthentication();
  }, []);

  const checkAuthentication = async () => {
    try {
      const authenticated = await isAuthenticated();
      if (authenticated) {
        // User is already logged in, navigate to landing page
        navigation.navigate("LandingPage");
      }
    } catch (error) {
      console.log("Authentication check failed", error);
    } finally {
      setCheckingAuth(false);
    }
  };

  // OAuth Login with GitHub
  const handleOAuthLogin = async () => {
    setLoading(true);
    try {
      const tokens = await signIn();
      
      // Get user info from GitHub
      const userInfo = await getUserInfo(tokens.accessToken);
      
      // Check if user exists in local database, if not create them
      const userData = await db.getFirstAsync(
        "SELECT * FROM users WHERE email = ?", 
        [userInfo.email || `${userInfo.login}@github.com`]
      );

      let userId;
      if (!userData) {
        // Create new user in local database
        const result = await db.runAsync(
          "INSERT INTO users (email, username, password) VALUES (?, ?, ?)",
          [userInfo.email || `${userInfo.login}@github.com`, userInfo.login, 'oauth_user']
        );
        userId = result.lastInsertRowId;
        Alert.alert("Success", "Account created and logged in!");
      } else {
        userId = userData.userID;
        Alert.alert("Success", "Logged in successfully!");
      }

      // Navigate to landing page
      navigation.navigate("LandingPage", { userID: userId, userName: userInfo.name || userInfo.login });
    } catch (error: any) {
      console.error("OAuth login error:", error);
      Alert.alert("Login Failed", error.message || "Failed to login with GitHub");
    } finally {
      setLoading(false);
    }
  };

  // Traditional email/password login
  const handleTraditionalLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please enter both email and password");
      return;
    }

    setLoading(true);
    try {
      const userData = await db.getFirstAsync("SELECT * FROM users WHERE email = ?", [email]);
      if (!userData) {
        Alert.alert("Login Failed", "User not found.");
        setLoading(false);
        return;
      }

      const validUser = await db.getFirstAsync("SELECT * FROM users WHERE email = ? AND password = ?", [email, password]);
      if (validUser) {
        Alert.alert("Success", "Logged in successfully!");
        navigation.navigate("LandingPage", { userID: validUser.userID });
      } else {
        Alert.alert("Login Failed", "Incorrect password.");
      }
    } catch (error: any) {
      Alert.alert("Login Failed", error.message || "An unknown error occurred");
    } finally {
      setLoading(false);
    }
  };

  if (checkingAuth) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#FF5733" />
        <Text style={styles.loadingText}>Checking authentication...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome Back!</Text>
      
      {/* OAuth Login Button */}
      <TouchableOpacity 
        style={styles.oauthButton} 
        onPress={handleOAuthLogin}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.oauthButtonText}>🔐 Sign in with GitHub</Text>
        )}
      </TouchableOpacity>

      <View style={styles.divider}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>OR</Text>
        <View style={styles.dividerLine} />
      </View>

      {/* Traditional Login */}
      <TextInput 
        style={styles.input} 
        placeholder="Email" 
        value={email} 
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        editable={!loading}
      />
      <TextInput 
        style={styles.input} 
        placeholder="Password" 
        secureTextEntry 
        value={password} 
        onChangeText={setPassword}
        editable={!loading}
      />
      <Button 
        title={loading ? "Logging in..." : "Log In"} 
        onPress={handleTraditionalLogin} 
        color="#FF5733"
        disabled={loading}
      />
      <TouchableOpacity onPress={() => navigation.navigate("ForgotPassword")} disabled={loading}> 
        <Text style={styles.linkText}>Forgot/Reset Password?</Text> 
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
    backgroundColor: "#fff",
  },
  oauthButton: {
    width: "80%",
    height: 45,
    backgroundColor: "#24292e",
    borderRadius: 5,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 15,
  },
  oauthButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  divider: {
    width: "80%",
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 15,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#ccc",
  },
  dividerText: {
    marginHorizontal: 10,
    color: "#666",
    fontWeight: "600",
  },
  linkText: {
    color: "blue",
    marginTop: 10,
  },
  loadingText: {
    marginTop: 10,
    color: "#666",
  },
});



import React, { useState, useEffect } from "react";
import { View, Text, TextInput, Button, StyleSheet, Alert } from "react-native";
import { useNavigation } from "@react-navigation/native";

export default function CreateAccount() {
  const navigation = useNavigation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [securityQuestion, setSecurityQuestion] = useState("");
  const [securityAnswer, setSecurityAnswer] = useState("");

  // Switch this when deploying
  const API_BASE = "http://localhost:8080";
  // const API_BASE = "https://cst438-project2-group11-63cc69e04d99.herokuapp.com";

  useEffect(() => {
    navigation.setOptions?.({ headerBackTitle: "Back" });
  }, [navigation]);

  const handleSignUp = async () => {
    if (!email || !password || !securityQuestion || !securityAnswer) {
      Alert.alert("Error", "All fields are required.");
      return;
    }

    try {
      // 1) Create the user
      const res = await fetch(`${API_BASE}/api/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ email, password, securityQuestion, securityAnswer }),
      });

      if (!res.ok) {
        const msg = await res.text().catch(() => "");
        Alert.alert("Sign Up Failed", msg || `Server error (${res.status})`);
        return;
      }

      const user = await res.json(); // should include userId (per your entity)
      const userId = user?.userId;

      // 2) Create default list if backend DOESN'T auto-create it
      // If you implemented Option A in the backend, you can delete this block.
      if (userId) {
        await fetch(`${API_BASE}/api/lists`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify({ userId, listName: "Vocab Word History" }),
        });
      }

      Alert.alert("Sign Up Successful", "You can now log in.");
      navigation.navigate("LoginPage");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      Alert.alert("Sign Up Failed", msg || "An unknown error occurred");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create Account</Text>
      <TextInput style={styles.input} placeholder="User Name" value={email} onChangeText={setEmail} />
      <TextInput style={styles.input} placeholder="Password" secureTextEntry value={password} onChangeText={setPassword} />
      <TextInput style={styles.input} placeholder="Security Question" value={securityQuestion} onChangeText={setSecurityQuestion} />
      <TextInput style={styles.input} placeholder="Answer to Security Question" value={securityAnswer} onChangeText={setSecurityAnswer} />
      <Button title="Sign Up" onPress={handleSignUp} color="#FF5733" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#71a2a8",
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


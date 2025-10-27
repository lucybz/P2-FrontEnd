import React, { useState } from "react";
import { View, Text, TextInput, Button, Alert, StyleSheet } from "react-native";
import { useNavigation } from "@react-navigation/native";

export default function ForgotPassword() {
  const navigation = useNavigation();
  const [email, setEmail] = useState("");

  const BASE = "https://cst438-project2-group11-63cc69e04d99.herokuapp.com";
  const LOCAL = "http://localhost:8080"; // switch between these when testing

  const handleNext = async () => {
    try {
      if (!email.trim()) {
        Alert.alert("Error", "Please enter your email.");
        return;
      }

      const res = await fetch(`${LOCAL}/api/users/security-question?email=${encodeURIComponent(email)}`);
      if (res.status === 404) {
        Alert.alert("Error", "No account found with this email.");
        return;
      }
      if (!res.ok) {
        throw new Error(`Server returned ${res.status}`);
      }

      const data = await res.json();
      (navigation as any).navigate("VerifySecurityAnswer", {
        email,
        securityQuestion: data.securityQuestion as string,
      });       
    } catch (err) {
      console.error("Error fetching security question:", err);
      Alert.alert("Error", "Something went wrong. Please try again later.");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Enter your email to reset your password</Text>
      <TextInput
        style={styles.input}
        placeholder="Email"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      <Button title="Next" onPress={handleNext} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
    backgroundColor: "#fff",
  },
  label: {
    fontSize: 18,
    marginBottom: 10,
    textAlign: "center",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
    padding: 10,
    marginBottom: 15,
  },
});

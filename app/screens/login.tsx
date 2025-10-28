import React, { useState } from "react";
import { View, Text, TextInput, Button, StyleSheet, Alert, TouchableOpacity } from "react-native";
import { useNavigation } from "@react-navigation/native";

export default function LoginPage() {
  const navigation = useNavigation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

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
        Alert.alert("Login Failed", err?.message || "An unknown error occurred");
      }
  }catch (error) {
      Alert.alert("Error", "An error occurred during login. Please try again.");
      console.error("Login error:", error);
    }
};


  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome Back!</Text>
      <TextInput style={styles.input} placeholder="User Name" value={email} onChangeText={setEmail} />
      <TextInput style={styles.input} placeholder="Password" secureTextEntry value={password} onChangeText={setPassword} />
      <Button title="Log In" onPress={handleLogin} color="#FF5733" />
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



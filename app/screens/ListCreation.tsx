import React, { useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Alert,
} from "react-native";
import { SafeAreaView, SafeAreaProvider } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";

export default function ListCreation({ route }) {
  const [listName, setListName] = useState("");
  const navigation = useNavigation();
  const { userID } = route.params;

  const API_BASE = "http://localhost:8080";
  // const API_BASE = "https://cst438-project2-group11-63cc69e04d99.herokuapp.com";

  const handleListCreation = async () => {
    try {
      if (!listName.trim()) {
        Alert.alert("Error", "Please enter a list name.");
        return;
      }


      const response = await fetch(`${API_BASE}/api/lists`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          userId: userID,
          listName: listName.trim(),
        }),
      });

      if (!response.ok) {
        const msg = await response.text().catch(() => "");
        Alert.alert("Error", msg || `Server returned ${response.status}`);
        return;
      }

      const createdList = await response.json();
      console.log("Created list:", createdList);
      Alert.alert("Success", `List "${createdList.listName}" created!`);
      navigation.goBack();
    } catch (error) {
      console.error("Error creating list:", error);
      Alert.alert(
        "Network Error",
        "Could not reach the server. Make sure it's running."
      );
    }
  };

  return (
    <SafeAreaProvider>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() =>
            (navigation as any).navigate("LandingPage", { userID })
          }
        >
          <Text style={styles.backButtonText}>&#8249; Back</Text>
        </TouchableOpacity>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>Create a New Vocab List</Text>
        </View>
        <View style={styles.rightContent} />
      </View>

      <SafeAreaView style={styles.container}>
        <View style={{ gap: 20, marginVertical: 20 }}>
          <TextInput
            placeholder="Enter Vocab List Name"
            value={listName}
            onChangeText={(text) => setListName(text)}
            style={styles.textInput}
          />
        </View>

        <View style={{ flexDirection: "row", gap: 20 }}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={[styles.button, { backgroundColor: "red" }]}
          >
            <Text style={styles.buttonText}>Cancel</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleListCreation}
            style={[styles.button, { backgroundColor: "blue" }]}
          >
            <Text style={styles.buttonText}>Create List</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    backgroundColor: "white",
    borderBottomColor: "#ddd",
    justifyContent: "space-between",
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    color: "blue",
  },
  titleContainer: {
    flex: 1,
    alignItems: "center",
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
  },
  rightContent: {
    width: 50,
    alignItems: "flex-end",
  },
  container: {
    flex: 1,
    alignItems: "center",
  },
  textInput: {
    borderWidth: 1,
    padding: 10,
    width: 300,
    borderRadius: 5,
    borderColor: "slategray",
  },
  button: {
    height: 40,
    width: 100,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 5,
  },
  buttonText: {
    fontWeight: "bold",
    color: "white",
  },
});
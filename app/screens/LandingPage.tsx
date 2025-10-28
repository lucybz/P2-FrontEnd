import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, ImageBackground, Alert } from "react-native";
import wordList from "../../assets/advanced_words.json";
import { useNavigation } from "@react-navigation/native";

const LandingScreen = ({ route }) => {
  const [dailyWord, setDailyWord] = useState<string | null>(null);
  const [definition, setDefinition] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [vocabHistoryID, setVocabHistoryID] = useState<number | null>(null);

  const navigation = useNavigation();
  const { userID } = route.params;

  // switch this when deploying
  const API_BASE = "http://localhost:8080";
  // const API_BASE = "https://cst438-project2-group11-63cc69e04d99.herokuapp.com";

  useEffect(() => {
    fetchDailyWord();
    getVocabHistoryID();
  }, []);

  const fetchDailyWord = async () => {
    setLoading(true);
    try {
      const randomWord = wordList[Math.floor(Math.random() * wordList.length)];
      const API_KEY = "9c3b1721-9b03-4686-954c-91e9137bf51a";
      const API_URL = `https://www.dictionaryapi.com/api/v3/references/collegiate/json/${randomWord}?key=${API_KEY}`;
      const response = await fetch(API_URL);

      if (!response.ok) throw new Error(`Failed to fetch definition for ${randomWord}`);

      const data = await response.json();
      const fetchedDefinition = data[0]?.shortdef?.[0] || "Definition not available.";

      setDailyWord(randomWord);
      setDefinition(fetchedDefinition);
    } catch (error) {
      console.error("Error fetching daily word:", error);
      setDailyWord("No word available");
      setDefinition("Definition not available.");
    } finally {
      setLoading(false);
    }
  };

  const getVocabHistoryID = async () => {
    try {
    console.log("Fetching vocab history ID for user:", userID);
    
      const res = await fetch(`${API_BASE}/api/lists/user/${userID}/vocab-history`, {
        headers: { Accept: "application/json" },
      });
      if (!res.ok) throw new Error(`status ${res.status}`);
      const data = await res.json();
      setVocabHistoryID(data.listId);
    } catch (error) {
      console.error("Error fetching user's vocab history ID:", error);
    }
  };

  const saveWordToHistory = async () => {
    if (!dailyWord || !definition || !vocabHistoryID) return;

    try {
      const res = await fetch(`${API_BASE}/api/words`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          userId: userID,
          listId: vocabHistoryID,
          word: dailyWord,
          definition,
        }),
      });

      if (res.status === 200 || res.status === 201) {
        console.log(`Saved '${dailyWord}' to vocabHistory`);
        Alert.alert("Success", "Word saved to history!");
        return;
      }

      if (res.status === 400) {
        const msg = await res.text().catch(() => "Bad Request");
        if (msg.toLowerCase().includes("already exists")) {
          Alert.alert("Duplicate", "This word is already in your history!");
          return;
        }
        Alert.alert("Error", msg || "Bad request.");
        return;
      }

      throw new Error(`HTTP ${res.status}`);
    } catch (error) {
      console.error("Error saving word:", error);
      Alert.alert("Network Error", "Could not reach the server. Is your backend running?");
    }
  };

  return (
    <ImageBackground
      source={require("../../assets/images/LP_background.png")}
      style={styles.background}
    >
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.logoutButton} onPress={() => (navigation as any).navigate("HomePage")}>
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>

        <Text style={styles.sectionTitle}>Random Vocabulary Word: </Text>

        {loading ? (
          <ActivityIndicator size="large" color="#4CAF50" />
        ) : (
          <View style={styles.textBox}>
            <Text style={styles.dailyWord}>{dailyWord || "No word available"}</Text>
            <Text style={styles.definition}>{definition || "Definition not available."}</Text>
          </View>
        )}

        <TouchableOpacity style={styles.refreshButton} onPress={fetchDailyWord}>
          <Text style={styles.refreshButtonText}>Refresh Word</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.saveButton} onPress={saveWordToHistory}>
          <Text style={styles.saveButtonText}>Save Word to History</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.saveButton}
          onPress={() =>
            (navigation as any).navigate("PickList", { userID, vocabHistoryID, dailyWord, definition })
          }
          accessibilityLabel="Save Word to Vocab List"
        >
          <Text style={styles.refreshButtonText}>Save to Existing Vocab List</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.createListButton}
          onPress={() => (navigation as any).navigate("ListCreation", { userID })}
          accessibilityLabel="Create New List"
        >
          <Text style={styles.createListText}>✨ Create New List</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.vocabListButton}
          onPress={() => (navigation as any).navigate("VocabListPage", { userID, vocabHistoryID })}
        >
          <Text style={styles.vocabListText}>View Vocab Lists</Text>
        </TouchableOpacity>
      </View>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  background: { flex: 1, resizeMode: "cover", width: "100%", height: "100%" },
  overlay: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "rgba(255, 255, 255, 0.3)", padding: 20 },
  logoutButton: { position: "absolute", top: 40, right: 20, backgroundColor: "#d9534f", paddingVertical: 8, paddingHorizontal: 16, borderRadius: 8 },
  logoutText: { fontSize: 16, color: "#fff", fontWeight: "bold" },
  createListButton: { backgroundColor: "#77afdd", paddingVertical: 10, paddingHorizontal: 20, borderRadius: 8, marginTop: 10 },
  createListText: { fontSize: 16, color: "#fff", fontWeight: "bold" },
  vocabListButton: { backgroundColor: "#FFA500", paddingVertical: 10, paddingHorizontal: 20, borderRadius: 8, marginTop: 10 },
  vocabListText: { fontSize: 16, color: "#fff", fontWeight: "bold" },
  sectionTitle: { fontSize: 16, fontWeight: "bold", color: "#222222", marginBottom: 10 },
  textBox: { backgroundColor: "rgba(255, 255, 255, 0.62)", padding: 15, borderRadius: 10, borderWidth: 2, borderColor: "#FFA500", marginVertical: 10, alignItems: "center" },
  dailyWord: { fontSize: 22, fontWeight: "bold", color: "#4CAF50", marginBottom: 5 },
  definition: { fontSize: 18, fontStyle: "italic", fontWeight: "bold", color: "#222222", textAlign: "center", paddingHorizontal: 10 },
  refreshButton: { backgroundColor: "#FFA500", paddingVertical: 10, paddingHorizontal: 20, borderRadius: 8, marginTop: 10 },
  refreshButtonText: { fontSize: 16, color: "#fff", fontWeight: "bold" },
  saveButton: { backgroundColor: "#4CAF50", paddingVertical: 10, paddingHorizontal: 20, borderRadius: 8, marginTop: 10 },
  saveButtonText: { fontSize: 16, color: "#fff", fontWeight: "bold" },
});

export default LandingScreen;

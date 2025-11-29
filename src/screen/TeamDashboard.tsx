import React, { useEffect, useState } from "react";
import { View, Text, ActivityIndicator, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { db } from "../config/firebase";
import { doc, getDoc } from "firebase/firestore";

export default function TeamDashboard({ route }) {
  const { teamId } = route.params || {};
  const [team, setTeam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!teamId) {
      setError("No team ID provided");
      setLoading(false);
      return;
    }

    const loadTeam = async () => {
      try {
        const snap = await getDoc(doc(db, "teams", teamId));

        if (!snap.exists()) {
          setError("Team not found");
        } else {
          setTeam(snap.data());
        }
      } catch (err) {
        setError("Failed to load team");
      } finally {
        setLoading(false);
      }
    };

    loadTeam();
  }, [teamId]);

  if (loading) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size="large" />
        <Text style={{ marginTop: 15 }}>Loading team…</Text>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.centered}>
        <Text style={styles.error}>{error}</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>{team.name}</Text>

      <View style={styles.infoBox}>
        <Text style={styles.label}>Team Color</Text>
        <Text style={styles.value}>{team.color}</Text>
      </View>

      <View style={styles.infoBox}>
        <Text style={styles.label}>Symbol</Text>
        <Text style={styles.value}>{team.symbol}</Text>
      </View>

      <View style={styles.infoBox}>
        <Text style={styles.label}>Created By</Text>
        <Text style={styles.value}>{team.createdBy}</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },

  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  title: {
    fontSize: 26,
    fontWeight: "700",
    marginBottom: 20,
  },

  infoBox: {
    marginBottom: 15,
  },

  label: {
    fontSize: 14,
    color: "#666",
  },

  value: {
    fontSize: 18,
    fontWeight: "600",
  },

  error: {
    fontSize: 18,
    fontWeight: "600",
    color: "red",
  },
});
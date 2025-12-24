import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { db, auth } from "../config/firebase";
import {
  collection,
  addDoc,
  getDoc,
  updateDoc,
  doc,
  query,
  where,
  getDocs,
  serverTimestamp,
} from "firebase/firestore";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";

// Assets
const symbolsData = [
  { id: 1, uri: require("../assets/ball.png") },
  { id: 2, uri: require("../assets/medal.png") },
  { id: 3, uri: require("../assets/Vector3.png") },
  { id: 4, uri: require("../assets/soccer.png") },
  { id: 5, uri: require("../assets/trophy.png") },
  { id: 6, uri: require("../assets/gloves.png") },
];

const shapesData = [
  { id: 1, uri: require("../assets/circle.png") },
  { id: 2, uri: require("../assets/Vector.png") },
  { id: 3, uri: require("../assets/Vector1.png") },
];

const colorsData = [
  "rgba(43, 43, 43, 1)",
  "rgba(252, 210, 31, 1)",
  "rgba(27, 74, 173, 1)",
  "rgba(232, 63, 83, 1)",
  "rgba(193, 214, 48, 1)",
  "rgba(46, 100, 23, 1)",
];

export default function Team() {
  const [loading, setLoading] = useState(true);
  const [teams, setTeams] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [players, setPlayers] = useState([]);
  const [isInputFocused, setIsInputFocused] = useState(false);

  const navigation = useNavigation();

  // Team creation states
  const [teamName, setTeamName] = useState("");
  const [selectedColor, setSelectedColor] = useState(colorsData[2]);
  const [selectedSymbol, setSelectedSymbol] = useState(symbolsData[0]);
  const [shapeIndex, setShapeIndex] = useState(0);

  const selectedShape = shapesData[shapeIndex];
  const leftShape = shapesData[(shapeIndex - 1 + shapesData.length) % shapesData.length];
  const rightShape = shapesData[(shapeIndex + 1) % shapesData.length];

  // Fetch teams
  useEffect(() => {
    const fetchTeams = async () => {
      const user = auth.currentUser;
      if (!user) return setLoading(false);

      try {
        const q = query(collection(db, "teams"), where("createdBy", "==", user.uid));
        const snapshot = await getDocs(q);
        const allTeams = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setTeams(allTeams);

        if (allTeams.length > 0) setSelectedTeam(allTeams[0]);
      } catch (err) {
        console.log(err);
      } finally {
        setLoading(false);
      }
    };

    fetchTeams();
  }, []);

  // Fetch updated team data
  useFocusEffect(
    React.useCallback(() => {
      if (!selectedTeam) return;
      const fetchUpdatedTeam = async () => {
        try {
          const docSnap = await getDoc(doc(db, "teams", selectedTeam.id));
          if (docSnap.exists()) {
            setSelectedTeam({ id: docSnap.id, ...docSnap.data() });
          }
        } catch (err) {
          console.log(err);
        }
      };
      fetchUpdatedTeam();
    }, [selectedTeam?.id])
  );

  // Fetch players - handle both old (string UID) and new (object {uid, position}) members
  useEffect(() => {
    if (!selectedTeam?.members?.length) {
      setPlayers([]);
      return;
    }

    const fetchMembers = async () => {
      try {
        const membersData = await Promise.all(
          selectedTeam.members.map(async (member) => {
            const uid = typeof member === "object" ? member.uid : member;
            const position = typeof member === "object" ? member.position : null;

            const docSnap = await getDoc(doc(db, "users", uid));
            if (docSnap.exists()) {
              return {
                uid,
                position, // Position from team members array
                ...docSnap.data(),
                isOwner: uid === selectedTeam.createdBy,
              };
            }
            return null;
          })
        );

        const filtered = membersData.filter(Boolean);

        // Sort: Owner first
        const sortedPlayers = filtered.sort((a, b) => {
          if (a.isOwner && !b.isOwner) return -1;
          if (!a.isOwner && b.isOwner) return 1;
          return 0;
        });

        setPlayers(sortedPlayers);
      } catch (err) {
        console.log(err);
      }
    };

    fetchMembers();
  }, [selectedTeam]);

  const handleNext = () => setShapeIndex(prev => (prev + 1) % shapesData.length);
  const handlePrev = () => setShapeIndex(prev => (prev - 1 + shapesData.length) % shapesData.length);

  const handleCreateTeam = async () => {
    const user = auth.currentUser;
    if (!user || !teamName.trim()) return;

    setLoading(true);
    try {
      const docRef = await addDoc(collection(db, "teams"), {
        name: teamName,
        color: selectedColor,
        symbol: selectedSymbol.id,
        shape: selectedShape.id,
        createdBy: user.uid,
        members: [user.uid],
        createdAt: serverTimestamp(),
      });

      await updateDoc(docRef, { teamId: docRef.id });
      const snap = await getDoc(docRef);
      const newTeam = { id: docRef.id, ...snap.data() };

      setTeams(prev => [...prev, newTeam]);
      setSelectedTeam(newTeam);
      setTeamName("");
    } catch (err) {
      console.log(err);
      alert("Failed to create team");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <LinearGradient
        colors={["#0E1828", "#040506"]}
        style={styles.centered}
      >
        <ActivityIndicator size="large" color="#C2D430" />
      </LinearGradient>
    );
  }

  // Dashboard View
  if (selectedTeam) {
    return (
      <LinearGradient
        colors={["#0E1828", "#040506"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={{ alignItems: "center", gap: 24, paddingBottom: 40 }}
        >
          <Text style={styles.dashboardTitle}>Plantilla Equipo</Text>

          <View style={styles.teamInfoRow}>
            <View style={styles.crest}>
              <View style={{ width: 40, height: 40, alignItems: "center", justifyContent: "center", position: "relative" }}>
                <Image
                  source={shapesData.find(s => s.id === selectedTeam.shape)?.uri}
                  style={{ width: 40, height: 40, tintColor: selectedTeam.color }}
                  resizeMode="contain"
                />
                <Image
                  source={symbolsData.find(s => s.id === selectedTeam.symbol)?.uri}
                  style={{ width: 22, height: 22, tintColor: "white", position: "absolute" }}
                  resizeMode="contain"
                />
              </View>
            </View>

            <View style={styles.teamInfoText}>
              <Text style={styles.teamName}>{selectedTeam.name}</Text>
            </View>
          </View>

          <View style={styles.top}>
            <Text style={styles.sectionTitle}>Plantilla</Text>

            <TouchableOpacity
              style={[styles.playerRow, { padding: 8, justifyContent: "center" }]}
              onPress={() => navigation.navigate("AddPlayer", { teamId: selectedTeam.id })}
            >
              <Text style={{ color: "rgba(255, 255, 255, 1)", fontWeight: "600" }}>+ Jugador</Text>
            </TouchableOpacity>
          </View>

          <View style={{ alignItems: "center", gap: 1}}>
            {players.map(player => (
              <View key={player.uid} style={styles.playerRows}>
                <Image source={require("../assets/skill.png")} style={styles.playerAvatar} />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={[styles.playerName, { color: "rgba(255, 255, 255, 1)" }]}>
                    {player.name || "Sin nombre"}
                  </Text>
                  <Text style={styles.playerRole}>
                    {player.isOwner 
                      ? "Dueño" 
                      : player.position 
                        ? player.position.charAt(0).toUpperCase() + player.position.slice(1).toLowerCase()
                        : "Jugador"}
                  </Text>
                </View>
                <Text style={styles.playerAge}>
                  {player.dob ? new Date().getFullYear() - new Date(player.dob).getFullYear() : "-"}
                </Text>
              </View>
            ))}
          </View>
        </ScrollView>
      </LinearGradient>
    );
  }

  // Team Creation View
  return (
    <LinearGradient
      colors={["#0E1828", "#040506"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={styles.container}
    >
      <Text style={styles.title}>Crear Equipo</Text>

      <Text style={styles.subtitle}>Escudo</Text>

      <View style={styles.topShapesContainer}>
        <TouchableOpacity onPress={handlePrev}>
          <Image source={leftShape.uri} style={{ width: 60, height: 60 }} resizeMode="contain" />
        </TouchableOpacity>

        <View style={{ width: 80, height: 80, justifyContent: "center", alignItems: "center" }}>
          <Image source={selectedShape.uri} style={{ width: 80, height: 80, tintColor: selectedColor }} resizeMode="contain" />
          <Image source={selectedSymbol.uri} style={{ width: 40, height: 40, position: "absolute" }} resizeMode="contain" />
        </View>

        <TouchableOpacity onPress={handleNext}>
          <Image source={rightShape.uri} style={{ width: 60, height: 60 }} resizeMode="contain" />
        </TouchableOpacity>
      </View>

      <View style={styles.bottomCirclesContainer}>
        {colorsData.map((color, index) => (
          <TouchableOpacity
            key={index}
            onPress={() => setSelectedColor(color)}
            style={[styles.colorCircle, { backgroundColor: color, borderWidth: selectedColor === color ? 2 : 0, borderColor: "#C2D430" }]}
          />
        ))}
      </View>

      <Text style={styles.symbolsLabel}>Símbolos</Text>
      <View style={styles.symbolsContainer}>
        {symbolsData.map(symbol => (
          <TouchableOpacity
            key={symbol.id}
            onPress={() => setSelectedSymbol(symbol)}
            style={[styles.symbol, { borderWidth: selectedSymbol.id === symbol.id ? 2 : 0, borderColor: "#C2D430", backgroundColor: selectedSymbol.id === symbol.id ? "#333333" : "transparent" }]}
          >
            <Image source={symbol.uri} style={{ width: 24, height: 24, resizeMode: "contain" }} />
          </TouchableOpacity>
        ))}
      </View>

      <View style={[
        styles.inputContainer,
        {
          borderRadius: 12,
          borderWidth: 2,
          borderColor: isInputFocused ? "rgba(194, 212, 48, 1)" : "#636B70",
        }
      ]}>
        <View style={[
          styles.inputIcon,
          {
            borderRadius: 12,
            borderWidth: 2,
            borderColor: isInputFocused ? selectedColor : "#636B70",
          }
        ]}>
          <Image
            source={selectedSymbol.uri}
            style={{ width: 20, height: 20, resizeMode: "contain", tintColor: selectedColor }}
          />
        </View>

        <TextInput
          style={styles.inputText}
          placeholder="Nombre del Equipo"
          placeholderTextColor="#7B7878"
          value={teamName}
          onChangeText={setTeamName}
          onFocus={() => setIsInputFocused(true)}
          onBlur={() => setIsInputFocused(false)}
        />
      </View>

      {teamName.trim().length > 0 && (
        <TouchableOpacity style={styles.button} onPress={handleCreateTeam}>
          <Text style={styles.buttonText}>Crear Equipo</Text>
        </TouchableOpacity>
      )}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 40,
    paddingBottom: 40,
    paddingHorizontal: 16,
    alignItems: "center",
    gap: 24,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 22,
    fontWeight: "600",
    color: "#fff",
    textAlign: "center",
    lineHeight: 28,
  },
  subtitle: {
    width: "100%",
    fontSize: 16,
    fontWeight: "400",
    color: "#fff",
    marginBottom: 12,
  },
  topShapesContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 24,
    paddingVertical: 12,
  },
  bottomCirclesContainer: {
    flexDirection: "row",
    gap: 20,
    justifyContent: "center",
    alignItems: "center",
    marginVertical: 12,
  },
  colorCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  symbolsLabel: {
    width: "100%",
    fontSize: 16,
    fontWeight: "400",
    color: "#fff",
    marginBottom: 12,
  },
  symbolsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 24,
  },
  symbol: {
    width: 40,
    height: 40,
    borderRadius: 100,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  inputContainer: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    padding: 6,
    paddingHorizontal: 12,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    gap: 6,
  },
  inputIcon: {
    width: 40,
    height: 40,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
  },
  inputText: {
    flex: 1,
    fontSize: 16,
    fontWeight: "500",
    color: "#fff",
    paddingVertical: 10,
  },
  button: {
    marginTop: 16,
    backgroundColor: "#C2D430",
    paddingVertical: 12,
    paddingHorizontal: 130,
    borderRadius: 6,
    width: 361,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    color: "#0E1828",
    fontWeight: "500",
    fontSize: 16,
  },
  // Dashboard Styles
  dashboardTitle: {
    fontSize: 22,
    fontWeight: "600",
    color: "#fff",
    textAlign: "left",
    marginVertical: 24,
    paddingTop: 60,
  },
  teamInfoRow: {
    width: "100%",
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  crest: {
    width: 40,
    height: 40,
    borderRadius: 6,
  },
  teamInfoText: {
    flex: 1,
    justifyContent: "center",
    paddingLeft: 10,
  },
  teamName: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "700",
  },
  top: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
    marginBottom: 12,
  },
  playerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    
  },
  playerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  playerName: {
    fontSize: 14,
    fontWeight: "700",
  },
  playerRole: {
    fontSize: 12,
    color: "#fff",
  },
  playerAge: {
    fontSize: 14,
    fontWeight: "700",
    color: "#fff",
  },
  playerRows: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    width: "100%",
    backgroundColor: "transparent",
    padding: 12,
   
  },
});
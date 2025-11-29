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
  "rgba(231, 24, 30, 1)",
  "rgba(193, 214, 48, 1)",
  "rgba(46, 100, 23, 1)",
];

export default function Team() {
  const [loading, setLoading] = useState(true);
  const [teams, setTeams] = useState([]); // All teams of the user
  const [selectedTeam, setSelectedTeam] = useState(null); // Team currently selected for dashboard
  const [players, setPlayers] = useState([]);

  const navigation = useNavigation();

  // Team creation states
  const [teamName, setTeamName] = useState("");
  const [selectedColor, setSelectedColor] = useState(colorsData[2]);
  const [selectedSymbol, setSelectedSymbol] = useState(symbolsData[0]);
  const [shapeIndex, setShapeIndex] = useState(0);

  const selectedShape = shapesData[shapeIndex];
  const leftShape = shapesData[(shapeIndex - 1 + shapesData.length) % shapesData.length];
  const rightShape = shapesData[(shapeIndex + 1) % shapesData.length];

  // Fetch all teams of the current user
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

  // Fetch members of the selected team
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
  useEffect(() => {
    if (!selectedTeam?.members?.length) return;
  
    const fetchMembers = async () => {
      try {
        const membersData = await Promise.all(
          selectedTeam.members.map(async (uid) => {
            const docSnap = await getDoc(doc(db, "users", uid));
            return docSnap.exists() ? { uid, ...docSnap.data() } : null;
          })
        );
        setPlayers(membersData.filter(Boolean));
      } catch (err) {
        console.log(err);
      }
    };
  
    fetchMembers();
  }, [selectedTeam]);
  // Shape selector
  const handleNext = () => setShapeIndex(prev => (prev + 1) % shapesData.length);
  const handlePrev = () => setShapeIndex(prev => (prev - 1 + shapesData.length) % shapesData.length);

  // Create a new team
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
      const newTeam = snap.data();

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
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  // Dashboard view
  if (selectedTeam) {
    return (
      <ScrollView
        style={{ flex: 1, backgroundColor: "#767676", padding: 16 }}
        contentContainerStyle={{ alignItems: "center", gap: 24, paddingBottom: 40 }}
      >
        <Text style={styles.dashboardTitle}>Equipo Dashboard</Text>

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
            <Text style={{ color: "#fff", fontWeight: "600" }}>+ Jugador</Text>
          </TouchableOpacity>
        </View>

        <View style={{ alignItems: "center", gap: 12 }}>
          {players.map(player => (
            <View key={player.uid} style={styles.playerRow}>
              <Image source={require("../assets/skill.png")} style={styles.playerAvatar} />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={[styles.playerName, { color: selectedTeam.color }]}>{player.name}</Text>
                <Text style={styles.playerRole}>{player.isOwner ? "Dueño" : player.additionalInfo || "Jugador"}</Text>
              </View>
              <Text style={styles.playerAge}>
                {player.dob ? new Date().getFullYear() - new Date(player.dob).getFullYear() : "-"}
              </Text>
            </View>
          ))}
        </View>
      </ScrollView>
    );
  }

  // Team creation view
  return (
    <View style={styles.container}>
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
            style={[styles.colorCircle, { backgroundColor: color, borderWidth: selectedColor === color ? 2 : 0, borderColor: "white" }]}
          />
        ))}
      </View>

      <Text style={styles.symbolsLabel}>Símbolos</Text>
      <View style={styles.symbolsContainer}>
        {symbolsData.map(symbol => (
          <TouchableOpacity
            key={symbol.id}
            onPress={() => setSelectedSymbol(symbol)}
            style={[styles.symbol, { borderWidth: selectedSymbol.id === symbol.id ? 2 : 0, borderColor: "white", backgroundColor: selectedSymbol.id === symbol.id ? "#333333" : "transparent" }]}
          >
            <Image source={symbol.uri} style={{ width: 24, height: 24, resizeMode: "contain" }} />
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.inputContainer}>
        <View style={[styles.inputIcon, { backgroundColor: "white", borderRadius: 12 }]}>
          <Image source={selectedSymbol.uri} style={{ width: 20, height: 20, resizeMode: "contain", tintColor: selectedColor }} />
        </View>
        <TextInput
          style={styles.inputText}
          placeholder="Nombre del Equipo"
          placeholderTextColor="#7B7878"
          value={teamName}
          onChangeText={setTeamName}
        />
      </View>

      {teamName.trim().length > 0 && (
        <TouchableOpacity style={styles.button} onPress={handleCreateTeam}>
          <Text style={styles.buttonText}>Crear Equipo</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 40,
    paddingBottom: 40,
    paddingHorizontal: 16,
    backgroundColor: "#767676",
    alignItems: "center",
    gap: 24,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  // Titles
  titleContainer: {
    width: "100%",
    alignItems: "center",
    marginBottom: 6,
    marginTop: 50,
  },
  title: {
    fontSize: 22,
    fontWeight: "600",
    color: "black",
    textAlign: "center",
    lineHeight: 28,
  },
  subtitle: {
    width: "100%",
    fontSize: 16,
    fontWeight: "400",
    color: "white",
    marginBottom: 12,
  },
  // Dashboard
  dashboardTitle: {
    fontSize: 22,
    fontWeight: "600",
    color: "#000",
    textAlign: "center",
    marginVertical: 24,
    paddingTop: 60,
  },
  teamInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
    
  },
  teamIcon: {
    width: 50,
    height: 50,
    borderRadius: 8,
  },
  
  teamPoints: {
    fontSize: 12,
    color: "#fff",
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
    color: "#fff",
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
  // Shapes
  topShapesContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 24,
    paddingVertical: 12,
  },
  topShapes: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  shapeImage: {
    width: 60,
    height: 60,
  },
  middleShape: {
    width: 80,
    height: 80,
    justifyContent: "center",
    alignItems: "center",
  },
  innerSymbol: {
    width: 40,
    height: 40,
    position: "absolute",
  },
  // Colors
  bottomCirclesContainer: {
    flexDirection: "row",
    gap: 20,
    justifyContent: "center",
    alignItems: "center",
    marginVertical: 12,
  },
  colorRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 12,
    marginBottom: 16,
  },
  colorCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  circle: {
    width: 30,
    height: 30,
    borderRadius: 100,
    justifyContent: "center",
    alignItems: "center",
  },
  innerCircle: {
    width: 24.38,
    height: 24.38,
  },
  // Symbols
  symbolsLabel: {
    width: "100%",
    fontSize: 16,
    fontWeight: "400",
    color: "white",
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
  // Input
  inputContainer: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    padding: 6,
    paddingHorizontal: 12,
    backgroundColor: "white",
    borderRadius: 6,
    borderWidth: 0.6,
    borderColor: "#636B70",
    gap: 6,
  },
  inputIcon: {
    width: 24,
    height: 24,
    resizeMode: "contain",
  },
  inputText: {
    flex: 1,
    fontSize: 16,
    fontWeight: "500",
    color: "rgba(123, 120, 120, 1)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  input: {
    backgroundColor: "#fff",
    borderRadius: 6,
    padding: 12,
    marginBottom: 16,
  },
  // Button
  button: {
    marginTop: 16,
    backgroundColor: "rgba(0, 0, 0, 1)",
    paddingVertical: 12,
    paddingHorizontal: 130,
    borderRadius: 6,
    width: 361,
    height: 42,
  },
  buttonText: {
    color: "rgba(255, 255, 255, 1)",
    fontWeight: "500",
    fontSize: 16,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center",
  },
  teamInfoRow: {
    width: "120%",
    paddingVertical: 12,
    paddingLeft: 35,
    backgroundColor: "#242424",
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  
  crest: {
    width: 34.76,
    height: 40,
    borderRadius: 6,
  },
  
  middleIcons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  
  iconBig: {
    width: 20,
    height: 14,
    tintColor: "#FFFFFF",
  },
  
  iconSmall: {
    width: 9,
    height: 6,
    tintColor: "#FFFFFF",
  },
  
  teamInfoText: {
    flex: 1,
    justifyContent: "center",
    paddingLeft: 10,
  },
  
  teamName: {
    color: "white",
    fontSize: 22,
    fontWeight: "700",
  },
});
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Platform,
  Modal,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { db, auth } from "../config/firebase";
import { collection, query, where, getDocs, setDoc, doc, getDoc} from "firebase/firestore";
import * as Calendar from "expo-calendar";
import DropDownPicker from "react-native-dropdown-picker";

export default function AddPlayerScreen( {route }) {
  const navigation = useNavigation();
  const { teamId } = route.params || {};
  const [name, setName] = useState("");
  const [nameExists, setNameExists] = useState(true); // assume name is valid initially
  const [age, setAge] = useState("");
  const [confirmAge, setConfirmAge] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [tempDate, setTempDate] = useState(new Date(2008, 0, 1));

  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState("");
  const [items, setItems] = useState([
    { label: "Delantero", value: "Delantero" },
    { label: "Defensa", value: "Defensa" },
    { label: "Volante", value: "Volante" },
    { label: "Arquero", value: "Arquero" },
  ]);

  // Check if name exists whenever the user types
  useEffect(() => {
    const checkNameExists = async () => {
      if (!name.trim()) {
        setNameExists(true);
        return;
      }
      const q = query(collection(db, "users"), where("name", "==", name.trim()));
      const snap = await getDocs(q);
      setNameExists(!snap.empty); // true if exists, false if not
    };
    checkNameExists();
  }, [name]);

  const handleDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === "android") setShowDatePicker(false);
    if (selectedDate) {
      setTempDate(selectedDate);
      const birthYear = selectedDate.getFullYear();
      const currentYear = new Date().getFullYear();
      setAge(String(currentYear - birthYear));
    }
  };

  const addEventToCalendar = async (
    playerName: string,
    position: string,
    age: string,
    creationDate: Date
  ) => {
    try {
      const { status } = await Calendar.requestCalendarPermissionsAsync();
      if (status !== "granted") return;

      let calendarId: string | null = null;
      if (Platform.OS === "android") {
        const defaultCalendar = await Calendar.getDefaultCalendarAsync();
        calendarId = defaultCalendar?.id ?? null;
      } else {
        const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
        const writableCalendar = calendars.find((cal) => cal.allowsModifications);
        calendarId = writableCalendar?.id ?? null;
      }

      if (!calendarId) return;

      const endDate = new Date(creationDate);
      endDate.setHours(endDate.getHours() + 1);

      await Calendar.createEventAsync(calendarId, {
        title: `Nuevo jugador añadido: ${playerName}`,
        startDate: creationDate,
        endDate: endDate,
        notes: `Posición: ${position}, Edad: ${age}`,
        alarms: [{ relativeOffset: 0 }],
      });
    } catch (error) {
      console.error("Failed to add event to calendar:", error);
    }
  };

  const handleCreatePlayer = async () => {
    if (!name || !position || !age || !confirmAge) {
      alert("Por favor completa todos los campos.");
      return;
    }
  
    if (!teamId) return alert("No se encontró el equipo."); 
  
    try {
      // 1️⃣ Check if user exists by name
      const q = query(collection(db, "users"), where("name", "==", name.trim()));
      const snap = await getDocs(q);
  
      if (snap.empty) {
        alert("No existe un usuario con ese nombre.");
        return;
      }
  
      const userDoc = snap.docs[0]; // pick the first matching user
      const userId = userDoc.id;
  
      // 2️⃣ Add user UID to team's members array
      const teamRef = doc(db, "teams", teamId);
      const teamSnap = await getDoc(teamRef);
  
      if (!teamSnap.exists()) {
        alert("Equipo no encontrado.");
        return;
      }
  
      const currentMembers = teamSnap.data()?.members || [];
      if (!currentMembers.includes(userId)) {
        currentMembers.push(userId);
        await setDoc(teamRef, { members: currentMembers }, { merge: true });
      }
  
      alert("Jugador añadido al equipo exitosamente!");
      navigation.goBack();
  
    } catch (err) {
      console.error(err);
      alert("Error añadiendo jugador.");
    }
  };
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={28} color="#000" />
        </TouchableOpacity>
        <Text style={styles.title}>Crear Jugador</Text>
      </View>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Nombre*"
          placeholderTextColor="#7B7878"
          value={name}
          onChangeText={setName}
        />
        {!nameExists && <Text style={styles.errorText}>Este nombre no existe en la base de datos</Text>}
      </View>

      <DropDownPicker
        open={open}
        value={position}
        items={items}
        setOpen={setOpen}
        setValue={setPosition}
        setItems={setItems}
        placeholder="Selecciona posición..."
        modalMode="ios"
        modalProps={{ animationType: "slide" }}
        zIndex={1000}
      />

      <TouchableOpacity style={styles.inputContainer} onPress={() => setShowDatePicker(true)}>
        <Text style={styles.input}>{age ? `Edad: ${age}` : "Seleccionar fecha de nacimiento*"}</Text>
      </TouchableOpacity>

      {showDatePicker && Platform.OS === "android" && (
        <DateTimePicker
          value={tempDate}
          mode="date"
          display="default"
          maximumDate={new Date()}
          onChange={handleDateChange}
        />
      )}

      {Platform.OS === "ios" && showDatePicker && (
        <Modal transparent animationType="slide" visible={showDatePicker}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <DateTimePicker
                value={tempDate}
                mode="date"
                display="spinner"
                maximumDate={new Date()}
                onChange={handleDateChange}
              />
              <TouchableOpacity style={styles.modalButton} onPress={() => setShowDatePicker(false)}>
                <Text style={styles.modalButtonText}>Listo</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}

      <TouchableOpacity style={styles.checkboxContainer} onPress={() => setConfirmAge(!confirmAge)}>
        <View style={[styles.checkbox, confirmAge && styles.checkboxChecked]}>
          {confirmAge && <Ionicons name="checkmark" size={18} color="#fff" />}
        </View>
        <Text style={styles.checkboxText}>Confirmo Jugador +16 años</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.createButton} onPress={handleCreatePlayer}>
        <Text style={styles.createButtonText}>Crear Jugador</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, backgroundColor: "#fff", gap: 20, alignItems: "stretch" },
  header: { width: "100%", marginTop: Platform.OS === "ios" ? 60 : 30, marginBottom: 10, alignItems: "center", justifyContent: "center", position: "relative" },
  backButton: { position: "absolute", left: 0, top: 0, padding: 4 },
  title: { fontSize: 22, fontWeight: "600", color: "#000", fontFamily: "Red Hat Display" },
  inputContainer: { width: "100%", borderWidth: 1, borderColor: "#636B70", borderRadius: 6, paddingHorizontal: 12, paddingVertical: 14 },
  input: { fontSize: 16, fontFamily: "Montserrat", color: "#000" },
  errorText: { color: "red", marginTop: 4, fontSize: 14 },
  checkboxContainer: { flexDirection: "row", alignItems: "center", marginTop: 5 },
  checkbox: { width: 24, height: 24, borderWidth: 1, borderColor: "#000", marginRight: 8, borderRadius: 4, alignItems: "center", justifyContent: "center" },
  checkboxChecked: { backgroundColor: "#000" },
  checkboxText: { fontSize: 17, fontFamily: "Montserrat" },
  createButton: { marginTop: 20, backgroundColor: "#000", width: "100%", paddingVertical: 14, borderRadius: 6, alignItems: "center" },
  createButtonText: { color: "#fff", fontSize: 16, fontWeight: "500", fontFamily: "Montserrat" },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center" },
  modalContent: { backgroundColor: "transparent", borderRadius: 12, padding: 20, width: "90%", alignItems: "center" },
  modalButton: { marginTop: 15, backgroundColor: "#000", paddingHorizontal: 30, paddingVertical: 12, borderRadius: 8 },
  modalButtonText: { color: "#fff", fontWeight: "600" },
});
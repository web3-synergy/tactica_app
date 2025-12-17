import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  Alert,
  ImageBackground,
  ActivityIndicator,
  Modal,
  TextInput,
  Animated,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { collection, query, where, getDocs, doc, getDoc, runTransaction, addDoc, serverTimestamp} from "firebase/firestore";
import { useRoute, useNavigation } from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { db, auth } from "../config/firebase"; // <- adjust path if your config lives elsewhere

const MAX_USERS = 15;

export default function BookingScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { marketId, scheduleIndex } = route.params || {}; // scheduleIndex optional
  const [selectedTimeValue, setSelectedTimeValue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [market, setMarket] = useState(null);
  const [timePickerVisible, setTimePickerVisible] = useState(false);
  const [selectedTimeIndex, setSelectedTimeIndex] = useState(null);
  const [localSchedules, setLocalSchedules] = useState([]);
  const [bookingInProgress, setBookingInProgress] = useState(false);
  const [overlayVisible, setOverlayVisible] = useState(false);
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);
  const [couponVisible, setCouponVisible] = useState(false);
  const [couponEnabled, setCouponEnabled] = useState(false);
const [coupon, setCoupon] = useState("");
const [enabled, setEnabled] = useState(false);
const [discountedPrice, setDiscountedPrice] = useState(market?.price ?? 0);
const [discountPercent, setDiscountPercent] = useState(0);
const [totalToPay, setTotalToPay] = useState(market?.price || 0);
const [successVisible, setSuccessVisible] = useState(false);
  const toggleAnim = useState(new Animated.Value(0))[0]; // animation for knob
  useEffect(() => {
    if (market?.price != null) {
      setDiscountedPrice(market.price);
      setTotalToPay(market.price);
    }
  }, [market]);
  const toggleSwitch = async () => {
    const newState = !enabled;
    setEnabled(newState);
  
    if (newState && coupon) {
      await applyCoupon(coupon);
    } else {
      setDiscountedPrice(market?.price ?? 0);
      setDiscountPercent(0);
      setTotalToPay(market?.price ?? 0);
    }
  
    Animated.timing(toggleAnim, {
      toValue: newState ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  };

  const knobPosition = toggleAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [2, 22],
  });

  const applyCoupon = async (code) => {
    if (!code || !market) return;
  
    try {
      const codesRef = collection(db, "Codes");
      const q = query(codesRef, where("number", "==", code));
      const querySnap = await getDocs(q);
  
      if (querySnap.empty) {
        Alert.alert("Cupón inválido", "El cupón ingresado no existe.");
        return;
      }
  
      const data = querySnap.docs[0].data();
  
      // Check if coupon is active and not expired
      
      const expireAt = data.expireAt?.toDate ? data.expireAt.toDate() : new Date(0);
      const now = new Date();
if (data.status !== "active" || expireAt < now) {
  Alert.alert("Cupón inválido", "El cupón ha expirado o está desactivado.");
  return;
}
      const percent = Number(data.percent) || 0;
      const price = market.price ?? 0;
      const discountAmount = (price * percent) / 100;
      const newTotal = price - discountAmount;
  
      setCoupon(code);
      setDiscountPercent(percent);
      setTotalToPay(newTotal);
  
      Alert.alert("Cupón aplicado", `Se aplicó un ${percent}% de descuento.`);
    } catch (err) {
      console.error("applyCoupon error:", err);
      Alert.alert("Error", "No se pudo aplicar el cupón.");
    }
  };

  const userId = auth.currentUser?.uid;

  useEffect(() => {
    if (!marketId) {
      Alert.alert("Error", "marketId missing");
      navigation.goBack();
      return;
    }

    const fetchMarket = async () => {
      setLoading(true);
      try {
        const ref = doc(db, "markets", marketId);
        const snap = await getDoc(ref);
        if (!snap.exists()) {
          Alert.alert("Not found", "Market not found");
          navigation.goBack();
          return;
        }
        const data = snap.data();
        // normalize schedules/times like you did earlier
        const schedules = (data.schedules || []).map((s) => ({
          ...s,
          times: (s.times || []).map((t) =>
            typeof t === "string" ? { time: t, bookedUsers: [] } : t
          ),
        }));
        setMarket({ id: snap.id, ...data });
        setLocalSchedules(schedules);
        // if route provided a scheduleIndex and a single slot, preselect first available
        if (typeof scheduleIndex === "number" && schedules[scheduleIndex]) {
          setSelectedTimeIndex(null); // user picks which time inside selected schedule below
        }
      } catch (e) {
        console.error("fetchMarket", e);
        Alert.alert("Error", "Failed to load market");
        navigation.goBack();
      } finally {
        setLoading(false);
      }
    };

    fetchMarket();
  }, [marketId]);

  const handleSelectTime = (time, selKey) => {
    setSelectedTimeIndex(selKey);
    setSelectedTimeValue(time);
  };
  

  const parseSel = (sel) => {
    if (!sel) return { s: -1, t: -1 };
    const [s, t] = String(sel).split(":").map(Number);
    return { s, t };
  };

  const handleConfirmBooking = async () => {
    if (!userId) {
      Alert.alert("Login required", "You must be logged in to book");
      return;
    }
    const { s, t } = parseSel(selectedTimeIndex);
    if (s < 0 || t < 0) {
      Alert.alert("Pick a time", "Please select a time slot first");
      return;
    }

    setBookingInProgress(true);

    try {
      const ref = doc(db, "markets", market.id);

      await runTransaction(db, async (tx) => {
        const snap = await tx.get(ref);
        if (!snap.exists()) throw new Error("Market not found in transaction");

        const schedules = snap.data().schedules || [];
        const slot = schedules[s].times[t];

        // normalize if slot representation is string
        const slotObj = typeof slot === "string" ? { time: slot, bookedUsers: [] } : slot;

        if (!slotObj.bookedUsers) slotObj.bookedUsers = [];

        if (slotObj.bookedUsers.includes(userId)) throw new Error("AlreadyBooked");
        if (slotObj.bookedUsers.length >= MAX_USERS) throw new Error("Full");

        slotObj.bookedUsers.push(userId);
        // write back
        schedules[s].times[t] = slotObj;
        tx.update(ref, { schedules });
      });
      try {
        // create a flattened BookedGames entry (so Game screen can query easily)
        await addDoc(collection(db, "BookedGames"), {
          marketId: market.id,
          userId,
          date: scheduleDate.toISOString(),     // scheduleDate computed earlier
          time: selectedTimeValue,
          stadium: market.stadium ?? null, // only use stadium name, leave null if missing
          address: market.address ?? null, 
          price: market.price ?? null,
          status: "booked",
          createdAt: serverTimestamp(),
          slotKey: `${s}:${t}`, // optional: reference to schedule/time indices
        });
      } catch (err) {
        console.warn("Could not create BookedGames doc:", err);
      }
      

      // update local UI instantly
      setLocalSchedules((prev) =>
        prev.map((sch, si) => {
          if (si !== parseInt(parseInt(String(selectedTimeIndex).split(":")[0], 10), 10)) {
            // no-op; keep as-is
            return sch;
          }
          const newTimes = sch.times.map((tm, ti) =>
            ti !== parseInt(String(selectedTimeIndex).split(":")[1], 10)
              ? tm
              : { ...tm, bookedUsers: [...(tm.bookedUsers || []), userId] }
          );
          return { ...sch, times: newTimes };
        })
      );

      setSuccessVisible(true);
      // go back or navigate to a success screen
      
    } catch (err) {
      console.error("Booking error:", err);
      if (err.message === "AlreadyBooked") {
        Alert.alert("Already booked", "You already booked that slot.");
      } else if (err.message === "Full") {
        Alert.alert("Full", "This slot is full.");
      } else {
        Alert.alert("Error", "Booking failed. Try again.");
      }
    } finally {
      setBookingInProgress(false);
    }
  };

  if (loading || !market) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" />
        <StatusBar style="dark" />
      </View>
    );
  }
  const scheduleDateStr = market.schedules?.[0]?.date; // "2025-11-20T23:00:00.000Z"
  const scheduleDate = scheduleDateStr ? new Date(scheduleDateStr) : new Date();
  
  // Format: "Domingo, 20 Noviembre"
  const formattedScheduleDate = format(scheduleDate, "EEEE, d MMMM", { locale: es });
  
  // find today's schedules. For the booking screen we assume scheduleIndex provided or use first schedule
  const schedulesToRender =
    typeof scheduleIndex === "number" && localSchedules[scheduleIndex]
      ? [localSchedules[scheduleIndex]]
      : localSchedules;
      
  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      
    {/* Top header with back button and centered title */}
<View style={styles.headerTop}>
  <TouchableOpacity onPress={() => navigation.goBack()}>
    <Ionicons name="arrow-back" size={28} color="#111" />
  </TouchableOpacity>
  <Text style={styles.up}>Información del partido</Text>
  <View style={{ width: 28 }} />
</View>

{/* Banner image */}
<View style={styles.banner}>
  <Image
    source={require("../assets/field.png")}
    style={styles.bannerImage}
  />
  <View style={styles.bannerOverlay}>
    <Text style={styles.bannerDate}>
    {formattedScheduleDate}
    </Text>
    <Text style={styles.bannerTitle}>
      {market.stadium || market.address || "Cancha"}
    </Text>
  </View>
</View>

{/* Info Row */}
<View style={styles.infoRow}>
  <View style={styles.infoItem}>
    <Image source={require("../assets/femedal.png")} style={styles.infoIcon} />
    <Text style={styles.infoText}>{market.category ?? "Individual"}</Text>
  </View>
  <View style={styles.infoItem}>
    <Image source={require("../assets/soccers.png")} style={styles.infoIcon} />
    <Text style={styles.infoText}>{market.numberOfPlayers ?? "5 vs 5"}</Text>
  </View>
  <View style={styles.infoItem}>
    <Image source={require("../assets/time.png")} style={styles.infoIcon} />
    <Text style={styles.infoText}>1h 30min</Text>
  </View>
  <View style={styles.infoItem}>
    <Image source={require("../assets/address.png")} style={styles.infoIcon} />
    <Text style={styles.infoText}>mapa</Text>
  </View>
</View>

      {/* Description */}
      

      {/* Select hour header */}
      {/* Select hour header */}
<View style={styles.sectionHeader}>
  <Text style={styles.sectionTitle}>Información</Text>
</View>
<Text style={styles.address}>{market.address }</Text>
<Text style={styles.address}>
  <Text style={{ fontWeight: "700" }}>Precio: </Text>
  {market.price}.00 Cop x Persona
</Text>

<View style={styles.description}>
  <Text style={styles.descriptionText}>
    {market.description
      ? market.description
      : "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley."}
  </Text>
</View>

      
      <ScrollView style={styles.schedulesContainer}>
        {schedulesToRender.map((s, si) => (
          <View key={si} style={styles.scheduleBlock}>
            {/* schedule date */}
            
            <Text style={styles.timetext}>Selecciona Hora de juego</Text>
            <View style={{backgroundColor: "rgba(238, 238, 238, 1)"}}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ paddingHorizontal: 16, paddingVertical: 12 }}>
  {s.times.map((t, ti) => {
    const bookedCount = (t.bookedUsers || []).length;
    const isFull = bookedCount >= MAX_USERS;
    const selKey = `${si}:${ti}`;
    const selected = selectedTimeIndex === selKey;

    return (
      <View key={ti} style={{ flexDirection: "column", alignItems: "center", marginRight: 16 }}>
        {/* Booked count */}
        <Text style={{ fontSize: 12, fontWeight: "500", color: "rgba(104, 104, 104, 1)" }}>
          Cupos <Text style={{ color: "#E83F53" }}>{bookedCount}</Text>/{MAX_USERS}
        </Text>

        {/* Time box */}
        <TouchableOpacity
          style={{
            marginTop: 4,
            paddingHorizontal: 8,
            paddingVertical: 4,
            borderRadius: 4,
            backgroundColor: selected ? "#111" : "transparent",
            borderWidth: 1,
            borderColor: "#000",
            justifyContent: "center",
            alignItems: "center",
            minWidth: 60,
          }}
          onPress={() => handleSelectTime(t.time, selKey)}
          activeOpacity={0.8}
        >
          <Text style={{ color: selected ? "#fff" : "#000", fontSize: 12, fontWeight: "500" }}>
            {t.time}
          </Text>
        </TouchableOpacity>
      </View>
    );
  })}
</ScrollView>
          </View>
          </View>
        ))}
      </ScrollView>
      
      <Modal
  visible={confirmModalVisible}
  animationType="fade"
  transparent
  onRequestClose={() => setConfirmModalVisible(false)}
>
  <View style={styles.overlay}>
  <TouchableOpacity
      style={styles.topOverlay}
      onPress={() => setConfirmModalVisible(false)}
      activeOpacity={0.7}
    >
      <Text style={styles.topX}>✕</Text>
    </TouchableOpacity>
    <View style={styles.modalContainer}>
      {/* Header */}
      <View style={styles.modalHeader}>
        <Text style={styles.modalHeaderText}>Reservar Partido</Text>
      </View>

      {/* Fields */}
      <View style={styles.field}>
        <Text style={styles.fieldLabel}>Nombre</Text>
        <View style={styles.fieldBox}>
        <Image source={require("../assets/Person.png")} style={styles.Icon} />
          <Text style={styles.fieldValue}>{auth.currentUser?.displayName ?? "Usuario"}</Text>
        </View>
      </View>

      <View style={styles.field}>
        <Text style={styles.fieldLabel}>Lugar</Text>
        <View style={styles.fieldBox}>
        <Image source={require("../assets/Pin.png")} style={styles.Icon} />
          <Text style={styles.fieldValue}>{market?.stadium || market?.address || "Cancha"}</Text>
        </View>
      </View>

      <View style={styles.field}>
  <Text style={styles.fieldLabel}>Fecha y Hora</Text>

  <TouchableOpacity
    style={styles.fieldBox}
    onPress={() => setTimePickerVisible(true)}
    activeOpacity={0.7}
  >
    <Image source={require("../assets/Clock.png")} style={styles.Icon} />
    <Text style={styles.fieldValue}>
      {formattedScheduleDate} | {selectedTimeValue ?? ""}
    </Text>
    <Image source={require("../assets/arrow.png")} style={styles.arrowIcon} />
  </TouchableOpacity>
</View>

      <View style={styles.field}>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
    <Text style={styles.fieldLabel}>Total a pagar</Text>
    {discountPercent > 0 && (
      <Text style={{ color: "#E83F53", fontWeight: "600" }}>
        -{discountPercent}% OFF
      </Text>
    )}
  </View>
        <View style={styles.fieldBox}>
        <Image source={require("../assets/Money.png")} style={styles.Icon} />
        <Text style={styles.fieldValue}>${totalToPay}.00 COP</Text>
        </View>
      </View>
      <View style={styles.row}>
      <Text style={styles.label}>Cupón</Text>
      <TouchableOpacity onPress={toggleSwitch} activeOpacity={0.8}>
        <View style={[styles.toggle, enabled && styles.toggleEnabled]}>
          <Animated.View style={[styles.knob, { left: knobPosition }]} />
        </View>
      </TouchableOpacity>
    </View>
    {enabled && (
  <KeyboardAvoidingView
    behavior={Platform.OS === "ios" ? "padding" : undefined}
    style={{ width: "100%" }}
  >
    <View style={styles.couponBox}>
    <Image source={require("../assets/pep.png")} style={styles.Icon} />
      <TextInput
        style={styles.couponInput}
        placeholder="Ingrese su cupón"
        value={coupon}
        onChangeText={setCoupon}
        onSubmitEditing={() => applyCoupon(coupon)}
        returnKeyType="done"
      />
    </View>
  </KeyboardAvoidingView>
)}
    

      {/* Reserve Button */}
      <TouchableOpacity
        style={styles.reserveBtn}
        onPress={() => {
          handleConfirmBooking();
          setConfirmModalVisible(false);
        }}
      >
        <Text style={styles.reserveBtnText}>Reservar</Text>
      </TouchableOpacity>
    </View>
  </View>
</Modal>
      {/* Confirm button */}
      <View style={styles.footer}>
  {/* Left info block */}
  <View style={styles.footerInfo}>
    {/* Date & Time */}
    <View style={styles.footerDateTime}>
      <Text style={styles.footerDate}>{formattedScheduleDate} </Text>
      <Text style={{color: "white"}}> • </Text>
      <Text style={styles.footerTime}>{selectedTimeValue ?? "Selecciona Hora"}</Text>
    </View>
    {/* Card info */}
    <View style={styles.footerCardInfo}>
      <Text style={styles.footerCardText}>Mastercard *** 9805</Text>
      <Text style={styles.footerCardChange}>Cambiar</Text>
    </View>
  </View>

  {/* Reserve button */}
  <TouchableOpacity
  style={styles.footerButton}
  onPress={() => {
    if (!selectedTimeValue) {
      Alert.alert("Selecciona Hora", "Por favor selecciona un horario antes de reservar.");
      return;
    }
    setConfirmModalVisible(true);
  }}
  disabled={bookingInProgress}
>
  <Text style={styles.footerButtonText}>Reservar</Text>
</TouchableOpacity>
</View>

<Modal
  visible={timePickerVisible}
  transparent
  animationType="fade"
  onRequestClose={() => setTimePickerVisible(false)}
>
  {/* Dimmed backdrop */}
  <TouchableOpacity
    style={styles.backdrop}
    activeOpacity={1}
    onPress={() => setTimePickerVisible(false)}
  />

  {/* Dropdown container */}
  <View style={styles.dropdownContainerIOS}>
    <ScrollView>
      {localSchedules[0]?.times?.map((t, i) => (
        <TouchableOpacity
          key={i}
          style={styles.dropdownItem}
          onPress={() => {
            setSelectedTimeValue(t.time);
            setTimePickerVisible(false);
          }}
        >
          <Text style={styles.dropdownText}>{t.time}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  </View>
</Modal>
<Modal visible={successVisible} transparent animationType="slide">
  <View style={styles.successOverlay}>
  <TouchableOpacity
      style={styles.topOverlays}
      onPress={() => setSuccessVisible(false)}
      activeOpacity={0.7}
    >
      <Text style={styles.topX}>✕</Text>
      </TouchableOpacity>

    <View style={styles.successSheet}>

      {/* Top Section */}
      <View style={styles.successTop}>
        
        <View style={styles.successCheckWrap}>
        <Image source={require("../assets/green.png")}  />
        </View>

        <Text style={styles.successTitle}>Reserva Completada!</Text>

        {/* Close icon top right */}
        <TouchableOpacity
          style={styles.successCloseBtn}
          onPress={() => {
            setSuccessVisible(false);
            navigation.goBack();
          }}
        >
          <View style={styles.successCloseDot}></View>
        </TouchableOpacity>
      </View>

      {/* Details */}
      <View style={styles.successDetails}>
        
        {/* Name */}
        <View style={styles.successRow}>
          <View style={styles.iconBox}>
          <Image source={require("../assets/Person.png")} style={styles.Icon} />
          </View>
          <Text style={styles.successRowText}>Javier Mora</Text>
        </View>

        {/* Stadium */}
        <View style={styles.successRow}>
          <View style={styles.iconBox}>
          <Image source={require("../assets/Pin.png")} style={styles.Icon} />
          </View>
          <Text style={styles.successRowText}>{market.stadium}</Text>
        </View>

        {/* Date */}
        <View style={styles.successRow}>
          <View style={styles.iconBox}>
          <Image source={require("../assets/Clock.png")} style={styles.Icon} />
          </View>
          <Text style={styles.successRowText}>{formattedScheduleDate} | {selectedTimeValue ?? ""}</Text>
        </View>

      </View>

      {/* Button */}
      <TouchableOpacity
        style={styles.successButton}
        onPress={() => {
          setSuccessVisible(false);
          navigation.goBack();
        }}
      >
        <Text style={styles.successButtonText}>Ir al Inicio</Text>
      </TouchableOpacity>

    </View>
  </View>
</Modal>
</View>
  );
}

const styles = StyleSheet.create({
  loader: { flex: 1, justifyContent: "center", alignItems: "center" },
  container: { flex: 1, backgroundColor: "#fff" },
  
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  infoItem: { flex: 1, alignItems: "center", justifyContent: "center", },
  infoLabel: { fontSize: 12, color: "#666" },
  infoValue: { fontSize: 14, fontWeight: "600", color: "#111" },
  infoIcon: {
    width: 28,
    height: 28,
    marginBottom: 4,
    resizeMode: "contain",
  },
  infoText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#111",
    textAlign: "center",
  },
  description: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  descriptionText: { color: "#666" },

  sectionHeader: { paddingHorizontal: 16, paddingVertical: 8 },
  sectionTitle: { fontSize: 16, fontWeight: "700" },

  schedulesContainer: { flex: 1, paddingHorizontal: 8 },
  scheduleBlock: { marginBottom: 12 },
  scheduleDate: { paddingLeft: 8, paddingBottom: 6, color: "#444", fontWeight: "600" },

  timesScroll: { paddingLeft: 8 , },
  timeCard: {
    width: 104,
    minHeight: 10,
    backgroundColor: "none",
    borderRadius: 4,
    marginRight: 12,
    padding: 4,
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,        
  borderColor: "rgba(0, 0, 0, 1)",
  },
  timeCardSelected: {
    borderWidth: 2,
    backgroundColor: "rgba(0, 0, 0, 1)",
    color: "rgba(255, 255, 255, 1)",
    
  },
  timeCardFull: {
    opacity: 0.6,
  },
  cuposTextTop: { fontSize: 12, color: "#333" },
  timeTextLarge: {
    fontSize: 12,
    fontWeight: "500",
    color: "rgba(0, 0, 0, 1)",
    textAlign: "center",
},
  formatBlock: { alignItems: "center" },
  formatSmall: { fontSize: 12, color: "#666" },
  priceSmall: { fontSize: 14, fontWeight: "700", color: "#111" },

  
  confirmButton: {
    backgroundColor: "#0E1828",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  confirmButtonDisabled: { opacity: 0.6 },
  confirmText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 0,
    marginTop: 45,
    backgroundColor: "#fff", 
  },
  up: {
    fontSize: 22,
    fontWeight: "700",
    color: "rgba(36, 40, 27, 1)",
    lineHeight: 39,
    textAlign: "center",
    flex: 1,
  },
  banner: {
    height: 220,
    width: "100%",
    position: "relative",
  },
  bannerImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  bannerOverlay: {
    position: "absolute",
    bottom: 12,
    left: 16,
    right: 16,
  },
  bannerDate: {
    color: "#fff",
    fontSize: 12,
    marginBottom: 4,
  },
  bannerTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "700",
  },
  Image: {
    alignItems: "center",
    display: "flex",
    justifyContent: "center",
  },
  address: {
    alignItems: "center",
    display: "flex",
    justifyContent: "center",
    paddingHorizontal: 16,
    paddingBottom: 12,
    color: "rgba(0, 0, 0, 1)",
  },
  timetext: {
    alignItems: "center",
    display: "flex",
    justifyContent: "center",
    paddingHorizontal: 16,
    paddingBottom: 12,
    color: "rgba(0, 0, 0, 1)",
    fontWeight: "600",
    fontSize: 20,
    marginTop: 130,
    fontFamily: "Montserrat_600SemiBold",
  },
  footer: {
    width: '100%',
    paddingTop: 24,
    paddingBottom: 36,
    paddingHorizontal: 16,
    backgroundColor: '#242424',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
  },
  footerInfo: {
    flex: 1,
    justifyContent: 'flex-start',
    gap: 6,
  },
  footerDateTime: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  footerDate: {
    color: 'white',
    fontSize: 14,
    fontFamily: 'Montserrat',
    fontWeight: '400',
    lineHeight: 18.9,
  },
  footerTime: {
    color: 'white',
    fontSize: 14,
    fontFamily: 'Montserrat',
    fontWeight: '700',
  },
  footerCardInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  footerCardText: {
    color: 'white',
    fontSize: 14,
    fontFamily: 'Montserrat',
    fontWeight: '400',
  },
  footerCardChange: {
    color: 'white',
    fontSize: 14,
    fontFamily: 'Montserrat',
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  footerButton: {
    minHeight: 28,
    paddingHorizontal: 12,
    paddingVertical: 5,
    backgroundColor: 'white',
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  footerButtonText: {
    color: 'black',
    fontSize: 14,
    fontFamily: 'Montserrat',
    fontWeight: '500',
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-end",
    position: "relative",
  },
  modalContainer: {
    width: "100%",
    height: 660,            
    backgroundColor: "#fff",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
    justifyContent: "space-between", 
  },
  modalHeader: {
    marginBottom: 16,
    alignItems: "center",
  },
  modalHeaderText: {
    fontSize: 22,
    fontWeight: "700",
    color: "#111",
    fontFamily: "Montserrat_600SemiBold",
  },
  
  fieldLabel: {
    fontSize: 18,
    fontWeight: "600",
    color: "rgba(0, 0, 0, 1)",
    marginBottom: 4,
    fontFamily: "Montserrat_600SemiBold",
  },
  fieldBox: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ddd",
    backgroundColor: "#f9f9f9",
    flexDirection: "row",
    alignItems: "center",
  },
  fieldValue: {
    fontSize: 17,
    color: "rgba(0, 0, 0, 1)",
    fontFamily: "Montserrat_400Regular",
    flexShrink: 1,
  },
  reserveBtn: {
    marginTop: 2,
    backgroundColor: "#111",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  reserveBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  topOverlay: {
    position: "absolute",
    bottom: 598 + 75, 
    alignSelf: "center",
    width: 40,
    height: 40,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
  
  topDot: {
    width: 10.5,
    height: 10.5,
    borderWidth: 1.5,
    borderColor: "white",
    borderRadius: 5.25,
  },
  topX: {
    fontSize: 20,
    color: "white",
    fontWeight: "700",
  },
  Icon: {
    width: 18,
    height: 18,
    resizeMode: "contain",
    marginRight: 8, 
  },
  dropdownContainer: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    maxHeight: 300, 
    width: "90%",
    alignSelf: "center",
    marginBottom: 20,
  },
  backdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.4)",
    zIndex: 10,
  },
  
  dropdownContainerIOS: {
    position: "absolute",
    top: 320, 
    left: 16,
    right: 16,
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingVertical: 8,
    maxHeight: 250,
    zIndex: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  
  dropdownItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  
  dropdownText: {
    fontSize: 16,
    color: "#111",
  },
  
  arrowIcon: {
    width: 20,
    height: 20,
    tintColor: "rgba(0, 0, 0, 1)",
    marginLeft: "auto",
  },
  couponRow: {
    width: "100%",
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  
  couponLabel: {
    fontSize: 17,
    color: "rgba(0, 0, 0, 1)",
    fontFamily: "Montserrat_400Regular",
    flexShrink: 1,
  },
  
  couponBox: {
    height: 48, // fixed height for both platforms
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ddd",
    backgroundColor: "#f9f9f9",
    flexDirection: "row",
    alignItems: "center",
  },
  
  
  
  couponBoxActive: {
    backgroundColor: "#111",
    borderColor: "#111",
  },
  couponInner: {
    width: 10,
    height: 10,
    backgroundColor: "#9FA2AF",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  
  couponModal: {
    width: "85%",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
  },
  
  couponModalTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 12,
  },
  
  
  
  applyBtn: {
    marginTop: 14,
    backgroundColor: "#111",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  label: {
    fontSize: 18,
    fontWeight: "500",
    fontFamily: "Montserrat",
    color: "#000",
  },
  toggle: {
    width: 44,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#ccc",
    justifyContent: "center",
  },
  toggleEnabled: {
    backgroundColor: "rgba(0, 0, 0, 1)",
  },
  knob: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#fff",
    position: "absolute",
    top: 2,
  },
  successOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  
  successSheet: {
    width: "100%",
    backgroundColor: "#fff",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingBottom: 40,
  },
  
  successTop: {
    alignItems: "center",
    paddingTop: 32,
    paddingBottom: 12,
    position: "relative",
  },
  
  successCheckWrap: {
    padding: 12.5,
    borderRadius: 999,
    justifyContent: "center",
    alignItems: "center",
  },
  
  successCheckInner: {
    width: 25,
    height: 25,
    backgroundColor: "#00983E",
    borderRadius: 4,
  },
  
  successTitle: {
    fontSize: 22,
    fontWeight: "600",
    fontFamily: "Montserrat",
    color: "#000",
    marginTop: 12,
  },
  
  successCloseBtn: {
    position: "absolute",
    top: 20,
    right: 20,
    padding: 12,
  },
  
  successCloseDot: {
    width: 10.5,
    height: 10.5,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: "#fff",
  },
  
  successDetails: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  
  successRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    paddingHorizontal: 13,
    borderRadius: 100,
    gap: 8,
  },
  
  
  
  iconStadium: {
    width: 7,
    height: 16,
    backgroundColor: "#2F2E2F",
  },
  
  iconCalendar: {
    width: 16,
    height: 16,
    backgroundColor: "#2F2E2F",
  },
  
  successRowText: {
    fontSize: 17,
    fontFamily: "Montserrat",
    fontWeight: "400",
    color: "#000",
  },
  
  successButton: {
    marginTop: 30,
    marginHorizontal: 16,
    height: 42,
    borderRadius: 6,
    backgroundColor: "#242424",
    justifyContent: "center",
    alignItems: "center",
  },
  
  successButtonText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "500",
    fontFamily: "Montserrat",
  },
  topOverlays: {
    position: "absolute",
    bottom: 400, 
    alignSelf: "center",
    width: 40,
    height: 40,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
});
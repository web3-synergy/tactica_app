import React, { useEffect, useState, useMemo } from "react";
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
Linking,
SafeAreaView,
} from "react-native";
import * as WebBrowser from "expo-web-browser";
import { Ionicons } from "@expo/vector-icons";
import { collection, query, where, getDocs, doc, getDoc, runTransaction, addDoc, serverTimestamp} from "firebase/firestore";
import { useRoute, useNavigation } from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { LinearGradient } from "expo-linear-gradient";
import { db, auth } from "../config/firebase";


const MAX_USERS = 15;
const MAX_TEAMS = 2;

export default function BookingScreen() {
const route = useRoute();
const navigation = useNavigation();
const { marketId, scheduleIndex } = route.params || {};
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
const toggleAnim = useState(new Animated.Value(0))[0];
const [userTeam, setUserTeam] = useState(null);
const [bookedTeams, setBookedTeams] = useState([]);

// Symbol and shape mappings for team logos
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

const getCategoryColor = (category?: string) => {
if (!category) return "#9CA3AF";


switch (category.toLowerCase()) {
  case "versus":
    return "rgba(7, 146, 173, 1)";
  case "individual":
    return "rgba(250, 211, 1, 1)";
  default:
    return "rgba(7, 146, 173, 1)";
}


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

// Fetch user’s team on mount
useEffect(() => {
const fetchUserTeam = async () => {
if (!userId) return;


  try {
    const teamsRef = collection(db, "teams");
    const q = query(teamsRef, where("members", "array-contains", userId));
    const querySnap = await getDocs(q);
    
    if (!querySnap.empty) {
      const teamData = querySnap.docs[0].data();
      setUserTeam({
        id: querySnap.docs[0].id,
        name: teamData.name,
        color: teamData.color || "rgba(43, 43, 43, 1)",
        shape: teamData.shape || 1,
        symbol: teamData.symbol || 1,
      });
    }
  } catch (error) {
    console.error("Error fetching user team:", error);
  }
};

fetchUserTeam();


}, [userId]);

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
    const schedules = (data.schedules || []).map((s) => ({
      ...s,
      times: (s.times || []).map((t) =>
        typeof t === "string" ? { time: t, bookedUsers: [], bookedTeams: [] } : t
      ),
    }));
    setMarket({ id: snap.id, ...data });
    setLocalSchedules(schedules);
    if (typeof scheduleIndex === "number" && schedules[scheduleIndex]) {
      setSelectedTimeIndex(null);
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
const isTeamGame = market?.category?.toLowerCase() === "equipos";

const handlePayAndBook = async () => {
  if (!selectedTimeValue) {
    Alert.alert("Selecciona Hora");
    return;
  }

  const { s, t } = parseSel(selectedTimeIndex);
  if (s < 0 || t < 0) {
    Alert.alert("Error", "Selecciona un horario válido");
    return;
  }

  try {
    setBookingInProgress(true);

    const reference = `booking_${market.id}_${s}_${t}_${userId}_${Date.now()}`;

    // Save pending booking
    const pendingBookingData: any = {
      reference,
      marketId: market.id,
      userId,
      scheduleIndex: s,
      timeIndex: t,
      time: selectedTimeValue,
      date: scheduleDateStr,
      stadium: market.stadium,
      address: market.address,
      price: totalToPay,
      category: market.category,
      status: "pending",
      createdAt: serverTimestamp(),
    };
    
    if (isTeamGame) {
      if (!userTeam) {
        throw new Error("TeamRequired");
      }
    
      pendingBookingData.teamId = userTeam.id;
      pendingBookingData.teamName = userTeam.name;
      pendingBookingData.teamColor = userTeam.color;
      pendingBookingData.teamShape = userTeam.shape;
      pendingBookingData.teamSymbol = userTeam.symbol;
    }
    
    await addDoc(collection(db, "pendingBookings"), pendingBookingData);

    const res = await fetch(
      "https://us-central1-dobbymarkets-4c444.cloudfunctions.net/createWompiTransaction",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: Math.max(totalToPay * 100, 150000), // Ensure minimum
          currency: "COP",
          customerEmail: auth.currentUser.email,
          reference,
        }),
      }
    );

    const data = await res.json();

    if (!data.checkoutUrl) {
      throw new Error(data.details || data.error || "No checkout URL");
    }

    setConfirmModalVisible(false);

    // Open in WebBrowser instead of external browser
    const result = await WebBrowser.openBrowserAsync(data.checkoutUrl, {
      presentationStyle: WebBrowser.WebBrowserPresentationStyle.FULL_SCREEN,
    });

    // When user closes the browser, check payment status
    if (result.type === 'cancel' || result.type === 'dismiss') {
      // User closed the payment screen
      await checkPendingPayment(reference);
    }

  } catch (err) {
    console.error(err);
    Alert.alert("Error", err.message || "No se pudo iniciar el pago");
  } finally {
    setBookingInProgress(false);
  }
};

// Add function to check payment after user returns
const checkPendingPayment = async (reference) => {
  try {
    // Wait a moment for webhook to process
    await new Promise(resolve => setTimeout(resolve, 2000));

    const paymentDoc = await getDoc(doc(db, "payments", reference));
    
    if (paymentDoc.exists()) {
      const status = paymentDoc.data().status;
      
      if (status === "APPROVED") {
        setSuccessVisible(true);
      } else if (status === "DECLINED" || status === "ERROR") {
        Alert.alert("Pago fallido", "El pago no se completó correctamente");
      } else {
        Alert.alert(
          "Verificando pago",
          "Tu pago está siendo procesado. Recibirás una confirmación pronto."
        );
      }
    }
  } catch (err) {
    console.error("Error checking payment:", err);
  }
};



const handleSelectTime = (time, selKey) => {
setSelectedTimeIndex(selKey);
setSelectedTimeValue(time);


// Fetch teams for this time slot
const { s, t } = parseSel(selKey);
if (s >= 0 && t >= 0) {
  const slot = localSchedules[s].times[t];
  const slotObj = typeof slot === "string" ? { time: slot, bookedTeams: [] } : slot;
  setBookedTeams(slotObj.bookedTeams || []);
}


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


// Check if user has a team ONLY for "Versus" category
if (market?.category?.toLowerCase() === "versus" && !userTeam) {
  Alert.alert("Equipo requerido", "Necesitas estar en un equipo para reservar partidos de Versus. Por favor, crea o únete a un equipo primero.");
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

    const slotObj = typeof slot === "string" ? { time: slot, bookedUsers: [], bookedTeams: [] } : slot;

    if (!slotObj.bookedUsers) slotObj.bookedUsers = [];
    if (!slotObj.bookedTeams) slotObj.bookedTeams = [];

    if (slotObj.bookedUsers.includes(userId)) throw new Error("AlreadyBooked");
    
    // Only check team restrictions for "Versus" category
    if (market?.category?.toLowerCase() === "versus") {
      if (slotObj.bookedTeams.some(team => team.teamId === userTeam.id)) {
        throw new Error("TeamAlreadyBooked");
      }
      
      if (slotObj.bookedTeams.length >= MAX_TEAMS) {
        throw new Error("MaxTeamsReached");
      }

      // Add team info for Versus games
      slotObj.bookedTeams.push({
        teamId: userTeam.id,
        teamName: userTeam.name,
        color: userTeam.color,
        shape: userTeam.shape,
        symbol: userTeam.symbol,
      });
    } else {
      // For Individual games, check user limit
      if (slotObj.bookedUsers.length >= MAX_USERS) throw new Error("Full");
    }

    slotObj.bookedUsers.push(userId);
    
    schedules[s].times[t] = slotObj;
    tx.update(ref, { schedules });
  });
  
  try {
    const bookingData = {
      marketId: market.id,
      userId,
      date: scheduleDate.toISOString(),
      time: selectedTimeValue,
      stadium: market.stadium ?? null,
      address: market.address ?? null, 
      price: market.price ?? null,
      status: "booked",
      createdAt: serverTimestamp(),
      slotKey: `${s}:${t}`,
      category: market.category,
    };

    // Add team info only for Versus games
    if (market?.category?.toLowerCase() === "equipos" && userTeam) {
      bookingData.teamId = userTeam.id;
      bookingData.teamName = userTeam.name;
      bookingData.teamColor = userTeam.color;
      bookingData.teamShape = userTeam.shape;
      bookingData.teamSymbol = userTeam.symbol;
    }

    await addDoc(collection(db, "BookedGames"), bookingData);
  } catch (err) {
    console.warn("Could not create BookedGames doc:", err);
  }

  setLocalSchedules((prev) =>
    prev.map((sch, si) => {
      if (si !== parseInt(parseInt(String(selectedTimeIndex).split(":")[0], 10), 10)) {
        return sch;
      }
      const newTimes = sch.times.map((tm, ti) => {
        if (ti !== parseInt(String(selectedTimeIndex).split(":")[1], 10)) {
          return tm;
        }
        
        const updatedSlot = { 
          ...tm, 
          bookedUsers: [...(tm.bookedUsers || []), userId],
        };

        // Add team info only for Versus
        if (market?.category?.toLowerCase() === "equipos" && userTeam) {
          const updatedTeams = [...(tm.bookedTeams || []), {
            teamId: userTeam.id,
            teamName: userTeam.name,
            color: userTeam.color,
            shape: userTeam.shape,
            symbol: userTeam.symbol,
          }];
          updatedSlot.bookedTeams = updatedTeams;
        }

        return updatedSlot;
      });
      return { ...sch, times: newTimes };
    })
  );
  
  if (market?.category?.toLowerCase() === "equipos" && userTeam) {
    setBookedTeams(prev => [...prev, {
      teamId: userTeam.id,
      teamName: userTeam.name,
      color: userTeam.color,
      shape: userTeam.shape,
      symbol: userTeam.symbol,
    }]);
  }

  setSuccessVisible(true);
  
} catch (err) {
  console.error("Booking error:", err);
  if (err.message === "AlreadyBooked") {
    Alert.alert("Already booked", "You already booked that slot.");
  } else if (err.message === "TeamAlreadyBooked") {
    Alert.alert("Equipo ya reservado", "Tu equipo ya reservó este horario.");
  } else if (err.message === "MaxTeamsReached") {
    Alert.alert("Horario lleno", "Este horario ya tiene 2 equipos reservados.");
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
<ActivityIndicator size="large" color="rgba(194, 212, 48, 1)" />
</View>
);
}

const scheduleDateStr = market.schedules?.[0]?.date;
const scheduleDate = scheduleDateStr ? new Date(scheduleDateStr) : new Date();
const formattedScheduleDate = format(scheduleDate, "EEEE, d MMMM", { locale: es });

const schedulesToRender =
typeof scheduleIndex === "number" && localSchedules[scheduleIndex]
? [localSchedules[scheduleIndex]]
: localSchedules;

return (
<View style={styles.container}>
<LinearGradient
colors={["#0E1828", "#040506"]}
start={{ x: 0, y: 0 }}
end={{ x: 0, y: 1 }}
style={StyleSheet.absoluteFillObject}
>


  <View style={styles.headerTop}>
    <TouchableOpacity onPress={() => navigation.goBack()}>
      <Ionicons name="arrow-back" size={28} color="#fff" />
    </TouchableOpacity>
    <Text style={styles.up}>Información del partido</Text>
    <View style={{ width: 28 }} />
  </View>

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

  <View style={styles.infoRow}>
    <View style={styles.infoItem}>
      <Image source={require("../assets/femedal.png")} style={[styles.infoIcons, { tintColor: getCategoryColor(market.category)}]} />
      <Text style={[styles.infoTexts, { color: getCategoryColor(market.category)}]}>{market.category ?? "Individual"}</Text>
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

  <View style={styles.sectionHeader}>
    <Text style={styles.sectionTitle}>Información</Text>
  </View>
  <Text style={styles.address}>{market.address}</Text>
  <Text style={styles.address}>
    <Text style={{ fontWeight: "700", color: "rgba(255, 255, 255, 1)" }}>Precio: </Text>
    {market.price}.00 Cop x Persona
  </Text>

  <View style={styles.description}>
    <Text style={styles.descriptionText}>
      {market.info
        
        ?? "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley."}
    </Text>
  </View>

  <ScrollView style={styles.schedulesContainer}>
    {schedulesToRender.map((s, si) => (
      <View key={si} style={styles.scheduleBlock}>
        <Text style={styles.timetext}>Selecciona Hora de juego</Text>
        <View style={{backgroundColor: "transparent"}}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ paddingHorizontal: 16, paddingVertical: 12 }}>
            {s.times.map((t, ti) => {
              const bookedCount = (t.bookedUsers || []).length;
              const bookedTeamsCount = (t.bookedTeams || []).length;
              
              // For Versus: check teams, for Individual: check users
              const isEquipos = market?.category?.toLowerCase() === "equipos";
              const isTeamsFull = isEquipos && bookedTeamsCount >= MAX_TEAMS;
              const isUsersFull = !isEquipos && bookedCount >= MAX_USERS;
              const isFull = isTeamsFull || isUsersFull;
              
              const selKey = `${si}:${ti}`;
              const selected = selectedTimeIndex === selKey;

              return (
                <View key={ti} style={{ flexDirection: "column", alignItems: "center", marginRight: 16 }}>
                  <Text style={{ fontSize: 12, fontWeight: "500", color: "rgba(255, 255, 255, 1)" }}>
                    {isEquipos ? (
                      <>Equipos <Text style={{ color: "#E83F53" }}>{bookedTeamsCount}</Text>/{MAX_TEAMS}</>
                    ) : (
                      <>Cupos <Text style={{ color: "#E83F53" }}>{bookedCount}</Text>/{MAX_USERS}</>
                    )}
                  </Text>

                  <TouchableOpacity
                    style={{
                      marginTop: 4,
                      paddingHorizontal: 8,
                      paddingVertical: 4,
                      borderRadius: 4,
                      backgroundColor: selected ? "rgba(194, 212, 48, 1)" : "transparent",
                      borderWidth: 1,
                      borderColor: selected ? "" : "rgba(255, 255, 255, 1)",
                      justifyContent: "center",
                      alignItems: "center",
                      minWidth: 104,
                      opacity: isFull ? 0.5 : 1,
                    }}
                    onPress={() => !isFull && handleSelectTime(t.time, selKey)}
                    activeOpacity={isFull ? 1 : 0.8}
                    disabled={isFull}
                  >
                    <Text style={{ color: selected ? "rgba(14, 24, 40, 1)" : "rgba(255, 255, 255, 1)", fontSize: 12, fontWeight: "500" }}>
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
        <View style={styles.modalHeader}>
          <Text style={styles.modalHeaderText}>Reservar Partido</Text>
        </View>

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

        <TouchableOpacity
          style={styles.reserveBtn}
          onPress={() => {
            setConfirmModalVisible(false);
            handlePayAndBook();
          }}
        >
          <Text style={styles.reserveBtnText}>Reservar</Text>
        </TouchableOpacity>
      </View>
    </View>
  </Modal>

  <View style={styles.footer}>
    <View style={styles.footerInfo}>
      <View style={styles.footerDateTime}>
        <Text style={styles.footerDate}>{formattedScheduleDate} </Text>
        <Text style={{color: "white"}}> • </Text>
        <Text style={styles.footerTime}>{selectedTimeValue ?? "Selecciona Hora"}</Text>
      </View>
      <View style={styles.footerCardInfo}>
        <Text style={styles.footerCardText}>Mastercard *** 9805</Text>
        <Text style={styles.footerCardChange}>Cambiar</Text>
      </View>
    </View>

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
    <TouchableOpacity
      style={styles.backdrop}
      activeOpacity={1}
      onPress={() => setTimePickerVisible(false)}
    />

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
        <View style={styles.successTop}>
          <View style={styles.successCheckWrap}>
            <Image source={require("../assets/green2.png")} style={styles.suIcon} />
          </View>

          <Text style={styles.successTitle}>Reserva Completada!</Text>

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

        {/* Team Logo Section - Only show if category is "Versus" and user has a team */}
        {market?.category?.toLowerCase() === "equipos" && userTeam && (
          <View style={styles.teamsContainer}>
            
            <View style={styles.teamsLogos}>
              <View style={styles.teamLogoWrapper}>
                <View style={[styles.teamLogoContainer, {/*{ backgroundColor: userTeam.color }*/}]}>
                  <Image 
                    source={shapesData[userTeam.shape - 1]?.uri} 
                    style={[styles.teamShape, {tintColor: userTeam.color}]}
                  />
                  <Image 
                    source={symbolsData[userTeam.symbol - 1]?.uri} 
                    style={styles.teamSymbol}
                  />
                </View>
                <Text style={styles.teamName}>{userTeam.name}</Text>
              </View>
            </View>
          </View>
        )}

        <View style={styles.successDetails}>
          <View style={styles.successRow}>
            <View style={styles.iconBox}>
              <Image source={require("../assets/Person.png")} style={styles.Icon} />
```
          
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
</LinearGradient>
</View>
  );
}

const styles = StyleSheet.create({
  loader: { flex: 1, justifyContent: "center", alignItems: "center", },
  container: { flex: 1,  },
  
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "rgba(100, 107, 128, 0.2)",
  },
  infoItem: { flex: 1, alignItems: "center", justifyContent: "center", },
  infoLabel: { fontSize: 12, color: "rgba(255, 255, 255, 1)" },
  infoValue: { fontSize: 14, fontWeight: "600", color: "rgba(255, 255, 255, 1)" },
  infoIcon: {
    width: 28,
    height: 28,
    marginBottom: 4,
    resizeMode: "contain",
    tintColor: "rgba(255, 255, 255, 1)",
  },
  infoText: {
    fontSize: 12,
    fontWeight: "600",
    color: "rgba(255, 255, 255, 1)",
    textAlign: "center",
  },
  infoIcons: {
    width: 28,
    height: 28,
    marginBottom: 4,
    resizeMode: "contain",
    tintColor: "rgba(250, 211, 1, 1)",
  },
  infoTexts: {
    fontSize: 12,
    fontWeight: "600",
    color: "rgba(250, 211, 1, 1)",
    textAlign: "center",
  },
  description: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  descriptionText: { color: "rgba(255, 255, 255, 1)" },

  sectionHeader: { paddingHorizontal: 16, paddingVertical: 8 },
  sectionTitle: { fontSize: 20, fontWeight: "700", color:"rgba(255, 255, 255, 1)" },

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
    backgroundColor: "transparent", 
  },
  up: {
    fontSize: 22,
    fontWeight: "700",
    color: "rgba(255, 255, 255, 1)",
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
    color: "rgba(255, 255, 255, 1)",
  },
  timetext: {
    alignItems: "center",
    display: "flex",
    justifyContent: "center",
    paddingHorizontal: 16,
    paddingBottom: 12,
    color: "rgba(255, 255, 255, 1)",
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
    backgroundColor: 'rgba(14, 24, 40, 1)',
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
    backgroundColor: 'rgba(194, 212, 48, 1)',
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
    backgroundColor: "rgba(14, 24, 40, 1)",
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
    color: "rgba(255, 255, 255, 1)",
    fontFamily: "Montserrat_600SemiBold",
  },
  
  fieldLabel: {
    fontSize: 18,
    fontWeight: "600",
    color: "rgba(255, 255, 255, 1)",
    marginBottom: 4,
    fontFamily: "Montserrat_600SemiBold",
  },
  fieldBox: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    
    backgroundColor: "rgba(100, 107, 128, 0.2)",
    flexDirection: "row",
    alignItems: "center",
  },
  fieldValue: {
    fontSize: 17,
    color: "rgba(255, 255, 255, 1)",
    fontFamily: "Montserrat_400Regular",
    flexShrink: 1,
  },
  reserveBtn: {
    marginTop: 2,
    backgroundColor: "rgba(194, 212, 48, 1)",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  reserveBtnText: {
    color: "rgba(14, 24, 40, 1)",
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
    tintColor: "rgba(100, 107, 128, 1)",
  },
  dropdownContainer: {
    backgroundColor: "rgba(100, 107, 128, 0.2)",
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
    color: "rgba(255, 255, 255, 1)",
    fontFamily: "Montserrat_400Regular",
    flexShrink: 1,
  },
  
  couponBox: {
    height: 48, // fixed height for both platforms
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    
    backgroundColor: "rgba(100, 107, 128, 0.2)",
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
    color: "rgba(255, 255, 255, 1)",
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
    backgroundColor: "rgba(14, 24, 40, 1.0)",
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
    color: "rgba(255, 255, 255, 1)",
    marginTop: 12,
  },
  
  successCloseBtn: {
    position: "absolute",
    top: 20,
    right: 20,
    padding: 12,
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
    color: "rgba(255, 255, 255, 1)",
  },
  
  successButton: {
    marginTop: 30,
    marginHorizontal: 16,
    height: 42,
    borderRadius: 6,
    backgroundColor: "rgba(194, 212, 48, 1)",
    justifyContent: "center",
    alignItems: "center",
  },
  
  successButtonText: {
    color: "rgba(14, 24, 40, 1)",
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
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  useColorScheme,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import * as Location from "expo-location";
import { db, auth } from "../config/firebase";
import { collection, getDocs, doc, runTransaction } from "firebase/firestore";
import { useNavigation } from "@react-navigation/native";
import Icon from 'react-native-vector-icons/MaterialIcons';
import { LinearGradient } from 'expo-linear-gradient';


const MAX_USERS = 15;

export default function HomeScreen() {
  const months = [
    "Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre",
  ];
  const weekdays = ["Dom","Lun","Mar","Mie","Jue","Vie","Sab"];
  const theme = useColorScheme();
  const isDark = theme === "dark";
  const [selectedDay, setSelectedDay] = useState(new Date());
  const [markets, setMarkets] = useState([]);
  const [userLocation, setUserLocation] = useState(null);
  const navigation = useNavigation();
  const loggedUser = auth.currentUser?.uid;
  const getDaysInMonth = (year, month) =>
    new Date(year, month + 1, 0).getDate();

  // GET USER LOCATION
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") return;
      const location = await Location.getCurrentPositionAsync({});
      setUserLocation(location.coords);
    })();
  }, []);
 
  const getCategoryColor = (category?: string) => {
    if (!category) return "#9CA3AF";
  
    switch (category.toLowerCase()) {
      case "Versus":
        return "rgba(7, 146, 173, 1)";
      case "individual":
        return "rgba(250, 211, 1, 1)";
      default:
        return "rgba(7, 146, 173, 1)";
    }
  };

  const getDistanceKm = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const toRad = (x) => (x * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(lat1)) *
        Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) ** 2;
    return (R * 2 * Math.asin(Math.sqrt(a))).toFixed(2);
  };
  const availableDays = new Set();

  markets.forEach((m) => {
    m.schedules.forEach((s) => {
      const d = new Date(s.date);
      if (
        d.getFullYear() === selectedDay.getFullYear() &&
        d.getMonth() === selectedDay.getMonth()
      ) {
        availableDays.add(d.getDate());
      }
    });
  });
  // FETCH MARKETS
  useEffect(() => {
    const fetchMarkets = async () => {
      const snapshot = await getDocs(collection(db, "markets"));
      const data = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      }));

      const withDistance = data.map((item) => {
        if (userLocation && item.location) {
          return {
            ...item,
            distanceKm: getDistanceKm(
              userLocation.latitude,
              userLocation.longitude,
              item.location.lat,
              item.location.lon
            ),
          };
        }
        return item;
      });

      const normalized = withDistance.map((item) => ({
        ...item,
        schedules:
          item.schedules?.map((sch) => ({
            ...sch,
            times: sch.times.map((t) =>
              typeof t === "string" ? { time: t, bookedUsers: [] } : t
            ),
          })) || [],
      }));

      setMarkets(normalized);
    };

    fetchMarkets();
  }, [userLocation]);

  const bookTimeSlot = async (marketId, scheduleIndex, timeIndex) => {
    if (!loggedUser) return alert("You must be logged in.");

    try {
      const ref = doc(db, "markets", marketId);

      await runTransaction(db, async (tx) => {
        const snap = await tx.get(ref);
        if (!snap.exists()) throw "Not found";

        const schedules = snap.data().schedules;
        const slot = schedules[scheduleIndex].times[timeIndex];

        if (slot.bookedUsers.length >= MAX_USERS) throw "Full";
        if (slot.bookedUsers.includes(loggedUser)) throw "Already booked";

        slot.bookedUsers.push(loggedUser);
        tx.update(ref, { schedules });
      });

      setMarkets((prev) =>
        prev.map((m) => {
          if (m.id !== marketId) return m;
          const updatedSchedules = m.schedules.map((s, si) => {
            if (si !== scheduleIndex) return s;
            const updatedTimes = s.times.map((t, ti) =>
              ti !== timeIndex ? t : { ...t, bookedUsers: [...t.bookedUsers, loggedUser] }
            );
            return { ...s, times: updatedTimes };
          });
          return { ...m, schedules: updatedSchedules };
        })
      );

      alert("Booked!");
    } catch (err) {
      alert(err);
    }
  };
  
  const hasDataForDay = (day) => {
    return markets.some(m =>
      m.schedules.some(s => {
        const d = new Date(s.date);
        return (
          d.getDate() === day &&
          d.getMonth() === selectedDay.getMonth() &&
          d.getFullYear() === selectedDay.getFullYear()
        );
      })
    );
  };

  const daysInMonth = new Date(
    selectedDay.getFullYear(),
    selectedDay.getMonth() + 1,
    0
  ).getDate();

  return (
    <View style={[styles.container, ]}>
      <LinearGradient
                colors={["#0E1828", "#040506"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                
                style={StyleSheet.absoluteFillObject}
              >
      <View style={styles.header}>
              <Text style={styles.titles}>Proximos Partidos</Text>
              <TouchableOpacity style={styles.editBtn}>
                <Text style={styles.editText}>Todos</Text>
                <Icon name="arrow-drop-down" size={20} color="white" />
              </TouchableOpacity>
            </View>
      {/* FIXED CALENDAR */}
      <View
  style={[
    styles.fixedCalendar,
    
  ]}
>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ paddingLeft: 16 }}>
          {months.map((m, i) => (
            <TouchableOpacity key={i} onPress={() => {
              const year = selectedDay.getFullYear();
              const maxDays = getDaysInMonth(year, i);
              const safeDay = Math.min(selectedDay.getDate(), maxDays);
            
              setSelectedDay(new Date(year, i, safeDay));
            }} style={{ marginRight: 76 }}>
             <Text
  style={[
    styles.monthText,
    selectedDay.getMonth() === i
      ? { fontWeight: "700", color: "rgba(194, 212, 48, 1)" }   
      : { color: "rgba(159, 162, 175, 1)" }                     
  ]}
>
  {m}
</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        <View style={styles.weekdaysRow}>
          {weekdays.map((d) => (<Text key={d} style={styles.weekdayText}>{d}</Text>))}
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ paddingLeft: 16 }}>
  {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
    const hasData = hasDataForDay(day);
    const isSelected = selectedDay.getDate() === day;

    return (
      <TouchableOpacity
        key={day}
        disabled={!hasData}
        onPress={() =>
          setSelectedDay(
            new Date(
              selectedDay.getFullYear(),
              selectedDay.getMonth(),
              day
            )
          )
        }
        style={[
          styles.dayCell,
          isSelected && {
            backgroundColor:  "rgba(194, 212, 48, 1)",
          },
          !hasData && { backgroundColor: "rgba(255, 255, 255, 0.05)",borderColor: "transparent", borderWidth: 0.5  },
        ]}
        activeOpacity={hasData ? 0.6 : 1}
      >
        <Text
          style={[
            styles.dayText,
            isSelected && { color: "black", fontWeight: "700" },
            !hasData && { color: "rgba(255, 255, 255, 1)" }
          ]}
        >
          {day}
        </Text>
      </TouchableOpacity>
    );
  })}
</ScrollView>
      </View>

      {/* MARKETS LIST */}
      <ScrollView style={styles.marketScroll}>
        {markets.map((m) => {
          const todaySchedules = m.schedules.filter((s) => {
            const d = new Date(s.date);
            return (
              d.getDate() === selectedDay.getDate() &&
              d.getMonth() === selectedDay.getMonth() &&
              d.getFullYear() === selectedDay.getFullYear()
            );
          });
          if (!todaySchedules.length) return null;

          return (
            <View
  key={m.id}
  style={{
    ...styles.card,
    backgroundColor: "rgba(100, 107, 128, 0.2)",
    borderColor: "#ccc",
  }}
>
              {todaySchedules.map((s, si) => (
                <View key={si} style={{ marginBottom: 12 }}>
                  <View style={styles.dateRow}>
                    <Text style={[styles.dateText, ]}>{new Date(s.date).toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" })}</Text>
                    <View style={styles.formatoTitle}>
                    <Text style={{color: "rgba(255, 255, 255, 1)"}}>Formato</Text>
                    <View style={styles.formatBox}>
                     
                      <Text style={styles.formatText}>{m.numberOfPlayers}</Text>
                    </View>
                    </View>
                  </View>

                  {/* MARKET INFO */}
                  <View style={styles.marketInfo}>
                    <Image source={m.image ? { uri: m.image } : require("../assets/email.png")} style={styles.image} />
                    <View style={styles.infoText}>
                    <View style={styles.titleRow}>
  <Text style={[styles.title, ]}>{m.address}</Text>

  <View style={styles.iconPlaceholder}>
    <Image
      source={require("../assets/location.png")}
      style={styles.followIcon}
    />
    <Text style={[styles.distanceText, ]}>{m.distanceKm ?? "2"} km</Text>
  </View>
</View>
                      <View style={styles.subRow}>
                        <Text style={[styles.addressText,]}>{m.neighborhood}</Text>
                        {m.distanceKm && <Text style={styles.distanceText}>{m.distanceKm} km</Text>}
                      </View>
                    </View>
                  </View>

                  
                  {/* TIME SLOTS */}
{/* TIME SLOTS */}
<ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 10 }}>
  {s.times.map((t, ti) => (
    <View key={ti} style={styles.timeSlot}>
      {/* Cupos on top */}
      <Text style={[styles.cuposText,  ]}>{t.bookedUsers.length}/{MAX_USERS} Cupos</Text>
      {/* Time */}
      <View style={styles.timeBox}>
      <Text style={[styles.timeText,  ]}>{t.time}</Text>
      </View>
    </View>
  ))}
</ScrollView>

{/* Single Ingresar Button under all time slots */}
<View style={[styles.ingresarButtonContainer, { backgroundColor: isDark ? "transparent" : "transparent"}]}>

  {/* Left: Format & Price */}
  <View style={styles.leftColumn}>
    <View style={styles.Column}>
      <Text style={[styles.formatLabel,  ]}>Precio</Text>
      <View style={[styles.inbox, { borderColor: getCategoryColor(m.category)}]}>
       <Text style={[styles.formatValue, { color: getCategoryColor(m.category) }]}>
        
  {m.category}
</Text>
</View>
    </View>
    <Text style={[styles.priceText,  ]}>${m.price} cupos</Text>
  </View>

  {/* Middle: Time */}
  <View style={styles.middleColumn}>
    <Text style={[styles.timeLabel,  ]}>Tiempo</Text>
    <Text style={[styles.timeValue,  ]}>1H 30min</Text>
  </View>

  {/* Right: ONLY THIS IS A BUTTON */}
  <TouchableOpacity
    onPress={() =>
      navigation.navigate("BookingScreen", {
        marketId: m.id,
        scheduleIndex: si,
      })
    }
    style={[styles.ingresarButton, { backgroundColor: "rgba(194, 212, 48, 1)",}]}
  >
    <Text style={[styles.actionText, ]} >Ingresar</Text>
  </TouchableOpacity>

</View>


</View>
              ))}
            </View>
          );
        })}
      </ScrollView>

      
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  
  container: { flex: 1,  },
  title: { fontSize: 22, fontWeight: "700", marginBottom: 12, color: "rgba(255, 255, 255, 1)" },
  monthText: { marginRight: 18, fontSize: 15, marginTop: 15, gap: 4, },
  
  weekdaysRow: { flexDirection: "row", justifyContent: "space-between", marginHorizontal: 20, marginTop: 8 },
  weekdayText: { width: 40, textAlign: "center", color: "#999" },
  dayCell: { width: 40, height: 40, backgroundColor: "rgba(255,255,255,0.05)", marginTop: 20, borderRadius: 8, alignItems: "center", justifyContent: "center", marginRight: 8,borderColor: "rgba(194, 212, 48, 1)", borderWidth: 0.5 },
  selectedDayCell: { backgroundColor: "#000" },
  dayText: { color: "rgba(194, 212, 48, 1)" },
  selectedDayText: { color: "#fff", fontWeight: "700" },
  marketScroll: { width: "100%", marginTop: 10 },
  cuposText: { color: "rgba(255, 255, 255, 1)", fontSize: 10,fontWeight: "500"},

  /* CARD STYLES */
  card: { width: 362,height: 222,backgroundColor: "rgba(100, 107, 128, 0.2)", borderRadius: 8,  marginBottom: 12, alignSelf: "center", shadowColor: "rgba(0, 0, 0, 0.08)", shadowOpacity: 0.08, shadowOffset: { width: 0, height: 4 }, shadowRadius: 4, elevation: 2,paddingHorizontal: 12,paddingVertical: 10,borderColor: "rgba(100, 107, 128, 1)", borderWidth: 0.4,  },
  dateRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 6 },
  dateText: { color: "rgba(255, 255, 255, 1)", fontSize: 14, fontWeight: "500" },
  formatBox: { paddingHorizontal: 4,  borderRadius: 2, borderWidth: 0.6, borderColor: "rgba(250, 211, 1, 1)", justifyContent: "center", alignItems: "center", height: 24 },
  inbox: { paddingHorizontal: 4,  borderRadius: 4, borderWidth: 0.6, justifyContent: "center", alignItems: "center" },
  formatText: { color: "rgba(250, 211, 1, 1)", fontSize: 14, fontWeight: "500" },
  marketInfo: { flexDirection: "row", alignItems: "center", gap: 6, paddingVertical: 6 },
  image: { width: 40, height: 40, borderRadius: 5, backgroundColor: "#D9D9D9" },
  infoText: { flex: 1, flexDirection: "column", gap: 4 },
  titleRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 8 },
  
  iconPlaceholder: {
    flexDirection: "column",
    alignItems: "center",
    gap: 4, // small spacing between icon and text
  },
  subRow: { flexDirection: "row",justifyContent: "space-between",  },
  addressText: { fontSize: 12, color: "rgba(255, 255, 255, 1)" },
  distanceText: { fontSize: 12, color: "rgba(255, 255, 255, 1)" },
  timeRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 8 },
  bookButton: { backgroundColor: "#000", padding: 6, borderRadius: 6 },
  bookButtonDisabled: { backgroundColor: "#666" },
  bookButtonText: { color: "#fff" },
  followIcon: {
    width: 16,
    height: 16,
    resizeMode: "contain",
    tintColor: "rgba(255, 255, 255, 1)",
  },
  
  fixedCalendar: { width: "100%", height: 135, backgroundColor: "transparent", zIndex: 100, paddingBottom: 10, borderBottomWidth: 1,  },
  
  timeText: { fontSize: 12, color: "rgba(255, 255, 255, 1)", fontWeight: "500" },
  bookedRow: { alignItems: "center" },
  bookedText: { fontSize: 12, color: "#7B7878" },
  rowButton: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginBottom: 8,
    borderRadius: 6,
    backgroundColor: "#D1D1D1",
  },
  rowButtonDisabled: {
    backgroundColor: "#A5A5A5",
  },
  leftColumn: {
    flex: 1,
    flexDirection: "column",
    gap: 2,
  },
  formatLabel: { fontSize: 12, fontWeight: "700", color: "rgba(255, 255, 255, 1)", fontFamily:  "Montserrat_500Medium" },
  formatValue: { fontSize: 12, fontWeight: "500", color: "#2190FF" },
  priceText: { fontSize: 14, fontWeight: "600", color: "rgba(255, 255, 255, 1)", marginTop: 2 },
  
  middleColumn: {
    width: 100,
    flexDirection: "column",
    gap: 2,
    alignItems: "flex-start",
  },
  timeLabel: { fontSize: 12, fontWeight: "700", color: "rgba(255, 255, 255, 1)" },
  timeValue: { fontSize: 12, fontWeight: "400", color: "rgba(255, 255, 255, 1)" },
  
  rightColumn: {
    paddingVertical: 4,
    paddingHorizontal: 9,
    backgroundColor: "#D1D1D1",
    borderRadius: 4,
    justifyContent: "center",
    alignItems: "center",
    width: 77,
    height: 30,
  },
  actionText: { fontSize: 14, fontWeight: "500", color: "#000" },
  
  Column: {
    flexDirection: "row",
    gap: 6,
  },
  timeBox: {
    paddingVertical: 2,
    paddingHorizontal: 5,
    borderRadius: 4,
    justifyContent: "center",
    alignItems: "center",
    
    height: 24,
   
    borderWidth: 1,
  borderColor: "rgba(255, 255, 255, 1)",
  },
  timeSlot: {
    flexDirection: "column",
    alignItems: "center",
    gap: 8,        
    marginRight: 12,
  },
  ingresarButtonContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 12,
    
  },
  
  ingresarButton: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    backgroundColor: "rgba(209, 209, 209, 1)",
    borderRadius: 6,
  },
  formatoTitle: {
    flexDirection: "row",
    gap: 6,
  },
  header: {
    width: "100%",
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 35,
  },
  titles: { color: "rgba(255, 255, 255, 1)", fontSize: 22, fontWeight: "700" },
  editBtn: { paddingHorizontal: 10, paddingVertical: 6, backgroundColor: "rgba(255, 255, 255, 0.08)", borderRadius: 4 , flexDirection: "row"},
  editText: { color: "white", fontSize: 14, fontWeight: "500" },
});
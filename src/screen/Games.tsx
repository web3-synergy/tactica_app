import React, { useEffect, useState, useCallback } from "react";  
import {  
  View,  
  Text,  
  FlatList,  
  Image,  
  TouchableOpacity,  
  StyleSheet,  
  ActivityIndicator,  
  RefreshControl,  
} from "react-native";  
import { collection, query, where, orderBy, onSnapshot, getDocs } from "firebase/firestore";  
import { db, auth } from "../config/firebase";  
import { useNavigation } from "@react-navigation/native";  
import Icon from 'react-native-vector-icons/MaterialIcons';

const MAX_USERS = 15;


export default function Game() {  
  const [games, setGames] = useState([]);  
  const [loading, setLoading] = useState(true);  
  const [refreshing, setRefreshing] = useState(false);  
  const navigation = useNavigation(); 
  const user = auth.currentUser;

  useEffect(() => {  
    
      const q = query(
        collection(db, "BookedGames"),
        where("userId", "==", user.uid),
        where("status", "==", "booked"),
        orderBy("createdAt", "desc")
      
    );  

    const unsub = onSnapshot(  
      q,  
      (snap) => {  
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));  
        setGames(list);  
        setLoading(false);  
      },  
      (err) => {  
        console.error("BookedGames onSnapshot error:", err);  
        setLoading(false);  
      }  
    );  

    return () => unsub();  
  }, []);  

  const onRefresh = useCallback(async () => {  
    setRefreshing(true);  
    try {  
      const q = query(  
        collection(db, "BookedGames"),
        where("userId", "==", user.uid),
        where("status", "==", "booked"),
        orderBy("createdAt", "desc") 
      );  
      const snap = await getDocs(q);  
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));  
      setGames(list);  
    } catch (err) {  
      console.error("refresh BookedGames:", err);  
    } finally {  
      setRefreshing(false);  
    }  
  }, []);  
  // fallback to 1 if undefined
  const renderItem = ({ item }) => {  
    const dateStr = item.date
    ? new Date(item.date).toLocaleDateString("en-GB", { 
        day: "2-digit", 
        month: "long", 
        year: "numeric" 
      })
    : "Date";
    const bookedCount = item.bookedUsers?.length ?? 1;
    return ( 
      <View style={styles.upTime}>
       
        <View style={styles.dateContainers}> 
        <Image
                    source={require("../assets/emoji.png")} 
                    style={{ width: 20, height: 20 }}
                  />
       
            <Text style={styles.dateText}>{dateStr}</Text>  
          </View>
      
      <View style={styles.card}> 
       
        {/* Date + Format Row */}  
        <View style={styles.row}>  
          <View style={styles.dateContainer}>  
            <Text style={styles.dateText}>{dateStr}</Text>  
          </View>  
          <View style={styles.formatBox}>  
            <Text style={styles.formatText}>5 vs 5</Text>  
          </View>  
        </View>  

        {/* Market Info Row */}  
        <View style={styles.rowMarket}>  
          <Image  
            source={item.image ? { uri: item.image } : require("../assets/email.png")}  
            style={styles.image}  
          />  
          <View style={styles.marketInfo}>  
            <View style={styles.titleRow}>  
              <Text style={styles.title}>{item.stadium ?? "Ballon D’Or"}</Text>  
              <View style={styles.locationBox}>  
                 
              <Image
                    source={require("../assets/location.png")} 
                    style={{ width: 16, height: 16 }}
                  />
                <Text style={styles.distance}>{item.distanceKm ?? "2km"}</Text>  
              </View>  
            </View>  
            <View style={styles.addressRow}>  
              <Text style={styles.address}>{item.address ?? "Calle 118 #89,510, Cedritos , 760031"}</Text>  
              {item.distanceKm && (
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  
                  <Text style={styles.distance}>{item.distanceKm} km</Text>
                </View>
              )} 
            </View>  
          </View>  
        </View> 
        <View style={{ flexDirection: "column", justifyContent: "center", alignItems: "flex-start", gap: 8, marginBottom: 8 }}>
    {/* Booked Slots */}
    <View
    style={{
      flexDirection: "column",
      justifyContent: "center",
      alignItems: "flex-start",
      gap: 8,
      marginBottom: 8,
    }}
  >
    {/* Booked Slots */}
    <View
      style={{ width: 55, justifyContent: "center", alignItems: "center" }}
    >
      <Text
        style={{
          fontSize: 14,
          fontFamily: "Montserrat",
          fontWeight: "500",
          lineHeight: 14,
          textAlign: "center",
        }}
      >
        <Text style={{ color: "#E83F53" }}>{bookedCount}</Text>/{MAX_USERS}
      </Text>
    </View>

    {/* Time Box */}
    <View
      style={{
        paddingHorizontal: 4,
        paddingVertical: 2,
        backgroundColor: "#C8C8C8",
        borderRadius: 4,
        borderWidth: 1,
        borderColor: "black",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Text
        style={{
          color: "black",
          fontSize: 12,
          fontFamily: "Montserrat",
          fontWeight: "500",
          lineHeight: 20,
          textAlign: "center",
        }}
      >
        {item.time ?? "00:00"}
      </Text>
    </View>
  </View>
  </View>
        

        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 6, gap: 6 }}>
  {/* Left Column: Tiempo */}
  <View style={{ flexDirection: "column", justifyContent: "flex-start", alignItems: "flex-start", gap: 6,  }}>
    <View style={{ justifyContent: "center", alignItems: "center", gap: 6 }}>
      <View style={{ flexDirection: "column", justifyContent: "flex-start", alignItems: "flex-start", gap: 2 }}>
        <View style={{ flexDirection: "row", justifyContent: "flex-start", alignItems: "flex-start", gap: 6 }}>
          <Text style={{ color: "black", fontSize: 12, fontFamily: "Montserrat", fontWeight: "700", lineHeight: 16, letterSpacing: 0.24 }}>
          Tiempo
          </Text>
        </View>
      </View>
    </View>
    <Text style={{ color: "black", fontSize: 12, fontFamily: "Montserrat", fontWeight: "400", lineHeight: 16, letterSpacing: 0.24 }}>
      1H 30min
    </Text>
  </View>

  {/* Right Column: Confirmado */}
  <View style={{ paddingHorizontal: 9, paddingVertical: 4, backgroundColor: "#D1D1D1", borderRadius: 4, justifyContent: "center", alignItems: "center",}}>
    <Text style={{ color: "black", fontSize: 14, fontFamily: "Montserrat", fontWeight: "500", lineHeight: 20, textAlign: "center" }}>
      Confirmado
    </Text>
  </View>
</View>
      </View>  
      </View> 
    );  
  };  

  if (loading) {  
    return (  
      <View style={styles.loader}>  
        <ActivityIndicator size="large" />  
      </View>  
    );  
  }  

  if (!games.length) {  
    return (  
      <View style={styles.empty}>  
        <Text style={styles.emptyText}>No hay partidos disponibles por ahora.</Text>  
        <TouchableOpacity style={styles.reloadBtn} onPress={onRefresh}>  
          <Text style={styles.reloadText}>Refrescar</Text>  
        </TouchableOpacity>  
      </View>  
    );  
  }  

  return (  
    <View style={{ flex: 1 }}>  
      {/* Fixed header at top */}  
      <View style={styles.header}>  
        <Text style={styles.headerTitle}>Mis Juegos</Text>  
        <View style={styles.headerButton}>  
          <Text style={styles.headerButtonText}>Todos</Text>  
          <Icon name="arrow-drop-down" size={20} color="white" />
        </View>  
      </View>  

      <FlatList  
        data={games}  
        keyExtractor={(i) => i.id}  
        renderItem={renderItem}  
        contentContainerStyle={{ padding: 16, paddingTop: 0 }}  
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}  
      />  
    </View>  
  );  
}  

const styles = StyleSheet.create({  
  loader: { flex: 1, justifyContent: "center", alignItems: "center" },  
  empty: { flex: 1, justifyContent: "center", alignItems: "center", padding: 20 },  
  emptyText: { color: "#666", fontSize: 16, marginBottom: 12 },  
  reloadBtn: { backgroundColor: "#111", paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8 },  
  reloadText: { color: "#fff", fontWeight: "600" },  

  header: {  
    width: "100%",  
    paddingHorizontal: 16,  
    paddingVertical: 4,  
    flexDirection: "row",  
    justifyContent: "space-between",  
    alignItems: "center",  
     paddingTop: 50,
    
   
  },  
  headerTitle: { fontSize: 22, fontWeight: "700", color: "#24281B" },  
  headerButton: {  
    minHeight: 28,  
    width: 66,
    paddingVertical: 5,  
    paddingHorizontal: 6,  
    backgroundColor: "black",  
    borderRadius: 4,  
    justifyContent: "center",  
    alignItems: "center",
    flexDirection: "row"  
  },  
  headerButtonText: { fontSize: 14, fontWeight: "500", color: "white" },  

  card: {  
    width: "100%",  
    padding: 8,  
    backgroundColor: "white",  
    borderRadius: 8,  
    shadowColor: "#000",  
    shadowOpacity: 0.08,  
    shadowOffset: { width: 0, height: 4 },  
    shadowRadius: 4,  
    elevation: 2,  
    flexDirection: "column",  
    gap: 4,  
    marginBottom: 12,  
    
  },  
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 6 },  
  dateContainer: { flex: 1, justifyContent: "center",  },  
  dateText: { fontSize: 16, fontWeight: "500", fontFamily: "Montserrat_500Medium", color: "#000" },  
  formatBox: { paddingHorizontal: 4, paddingVertical: 2, borderWidth: 0.6, borderColor: "#7B7878", borderRadius: 4, justifyContent: "center", alignItems: "center" },  
  formatText: { fontSize: 14, fontWeight: "500", color: "#000" },  

  rowMarket: { flexDirection: "row", alignItems: "center", width: "100%", paddingVertical: 6, gap: 6 },  
  image: { width: 40, height: 40, borderRadius: 5, backgroundColor: "#D9D9D9" },  
  marketInfo: { flex: 1, flexDirection: "column", gap: 4 },  
  titleRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },  
  title: { fontSize: 16, fontWeight: "600", color: "#262626" },  
  locationBox: { flexDirection: "column", alignItems: "center", gap: 4 },  
  locationIcon: { width: 12, height: 16, },  
  distance: { fontSize: 12, color: "#7B7878" },  
  addressRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },  
  address: { fontSize: 12, color: "#7B7878" },  
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
  upTime: {
   
    gap: 8,
    marginBottom: 12,
    },
    dateContainers: {  gap: 4, flexDirection: "row", },
});  
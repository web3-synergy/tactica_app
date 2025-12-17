import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Image,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { auth, db } from "../config/firebase";
import { collection, query, where, orderBy, getDocs } from "firebase/firestore";

interface StatItemProps {
  label: string;
  value: string;
  last?: boolean;
}

interface HistoryItemProps {
  n: string;
  name: string;
  date: string;
  dark?: boolean;
}

export default function ProfileScreen() {
  const [matches, setMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMatches = async () => {
      try {
        const user = auth.currentUser;
        if (!user) return;

        const q = query(
          collection(db, "BookedGames"),
          where("userId", "==", user.uid),
          orderBy("date", "desc")
        );

        const snapshot = await getDocs(q);
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setMatches(data);
      } catch (err) {
        console.error("Error fetching matches:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchMatches();
  }, []);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      {/* HEADER */}
      <View style={styles.header}>
        <Text style={styles.title}>Perfil</Text>
        <TouchableOpacity style={styles.editBtn}>
          <Text style={styles.editText}>Editar</Text>
        </TouchableOpacity>
      </View>

      {/* TOP SECTION */}
      <View style={styles.topSection}>
        <Image style={styles.avatar} source={require("../assets/skill.png")} />
        <View style={styles.nameBlock}>
          <Text style={styles.name}>Ezekiel Valtierra</Text>
          <Text style={styles.nickname}>El Bichito</Text>
        </View>
        <Text style={styles.memberSince}>Miembro desde Noviembre 2025</Text>

        <View style={styles.statsRow}>
          <StatItem label="Partidos" value={matches.length.toString()} />
          <StatItem label="Edad" value="24 Años" />
          <StatItem label="Ciudad" value="Bogota" last />
        </View>
      </View>

      {/* HISTORY SECTION */}
      <View style={styles.historySection}>
        <View style={styles.historyHeader}>
          <Text style={styles.historyTitle}>Historial Partidos</Text>
          <Text style={styles.paymentTitle}>Metodos de Pago</Text>
        </View>

        {/* FILTER ROW */}
        <View style={styles.filterRow}>
          <View style={styles.filterLeft}>
            <Text style={styles.filterLabel}>Juegos</Text>
            <Image source={require("../assets/arrow2.png")} style={styles.filterDot} />
            <Text style={styles.filterLabel}>Recientes</Text>
          </View>
          <Text style={styles.filterLabel}>Fecha</Text>
        </View>

        {/* HISTORY ITEMS */}
        {loading ? (
          <ActivityIndicator size="large" color="#8AB1FF" />
        ) : matches.length === 0 ? (
          <Text style={{ color: "white", textAlign: "center", marginTop: 20 }}>
            No hay partidos reservados
          </Text>
        ) : (
          matches.map((match, index) => (
            <HistoryItem
  key={match.id}
  n={(matches.length - index).toString()}
  name={match.stadium}
  date={
    match.date.toDate // Firestore Timestamp
      ? match.date.toDate().toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        })
      : new Date(match.date).toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        })
  }
  dark={index % 2 === 0}
/>
          ))
        )}
      </View>
    </ScrollView>
  );
}

/* ---------------- COMPONENTS ---------------- */

function StatItem({ label, value, last }: StatItemProps) {
  return (
    <View style={[styles.statItem, !last && styles.statDivider]}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

function HistoryItem({ n, name, date, dark }: HistoryItemProps) {
  return (
    <View style={[styles.historyItem, dark && styles.historyItemDark]}>
      <Text style={styles.historyIndex}>{n}</Text>
      <View style={styles.historyLeft}>
        <Image source={require("../assets/Vector4.png")} style={styles.historyIcon} />
        <Text style={styles.historyName}>{name}</Text>
      </View>
      <Text style={styles.historyDate}>{date}</Text>
    </View>
  );
}

/* ---------------- STYLES ---------------- */

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "rgba(48, 48, 48, 1)" },
  scrollContent: { paddingBottom: 40 },
  header: {
    width: "100%",
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#fff",
    paddingTop: 50,
  },
  title: { color: "#24281B", fontSize: 22, fontWeight: "700" },
  editBtn: { paddingHorizontal: 10, paddingVertical: 6, backgroundColor: "black", borderRadius: 4 },
  editText: { color: "white", fontSize: 14, fontWeight: "500" },
  topSection: { width: "100%", backgroundColor: "white", alignItems: "center", paddingTop: 16, paddingBottom: 20, gap: 12 },
  avatar: { width: 120, height: 120, borderRadius: 120 },
  nameBlock: { alignItems: "center", gap: 4 },
  name: { fontSize: 22, fontWeight: "600", color: "black" },
  nickname: { fontSize: 17, color: "black" },
  memberSince: { fontSize: 12, fontWeight: "600", color: "rgba(0,0,0,0.40)" },
  statsRow: { flexDirection: "row", width: "100%", justifyContent: "center" },
  statItem: { flex: 1, paddingVertical: 8, alignItems: "center", gap: 4 },
  statDivider: { borderRightWidth: 1, borderColor: "#A6A6A6" },
  statLabel: { fontSize: 14, fontWeight: "700", color: "black" },
  statValue: { fontSize: 12, color: "black" },
  historySection: { width: "100%", padding: 16, backgroundColor: "rgba(48, 48, 48, 1)" },
  historyHeader: { marginBottom: 12, flexDirection: "row", justifyContent: "space-between" },
  historyTitle: { color: "#8AB1FF", fontSize: 16, fontWeight: "600" },
  paymentTitle: { color: "white", fontSize: 16, fontWeight: "600" },
  filterRow: { padding: 6, backgroundColor: "black", borderRadius: 4, flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  filterLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
  filterDot: { width: 18, height: 18 },
  filterLabel: { color: "white", fontSize: 14, fontWeight: "600" },
  historyItem: { padding: 6, borderRadius: 4, flexDirection: "row", alignItems: "center", marginBottom: 6 },
  historyItemDark: { backgroundColor: "rgba(255,255,255,0.08)" },
  historyIndex: { width: 30, fontSize: 17, color: "white", fontWeight: "600" },
  historyLeft: { flex: 1, flexDirection: "row", alignItems: "center", gap: 6 },
  historyIcon: { width: 24, height: 24 },
  historyName: { color: "white", fontSize: 13, fontWeight: "600" },
  historyDate: { color: "rgba(255,255,255,0.70)", fontSize: 12 },
});
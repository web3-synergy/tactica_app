import React from "react";
import {
  View,
  Text,
  Image,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

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
  return (
    <SafeAreaView style={styles.container}>

      {/* FIXED HEADER */}
      <View style={styles.header}>
        <Text style={styles.title}>Perfil</Text>

        <TouchableOpacity style={styles.editBtn}>
          <Text style={styles.editText}>Editar</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* TOP SECTION */}
        <View style={styles.topSection}>
          <Image
            style={styles.avatar}
            source={require("../assets/skill.png")}
          />

          <View style={styles.nameBlock}>
            <Text style={styles.name}>Ezekiel Valtierra</Text>
            <Text style={styles.nickname}>El Bichito</Text>
          </View>

          <Text style={styles.memberSince}>
            Miembro desde Noviembre 2025
          </Text>

          <View style={styles.statsRow}>
            <StatItem label="Partidos" value="4" />
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
              <View style={styles.filterDot} />
              <Text style={styles.filterLabel}>Recientes</Text>
            </View>
            <Text style={styles.filterLabel}>Fecha</Text>
          </View>

          {/* HISTORY ITEMS */}
          <HistoryItem n="4" name="La Bombonera" date="Noviembre 2 2025" dark />
          <HistoryItem n="3" name="Ballon D’Or" date="Octubre 25 2025" />
          <HistoryItem n="2" name="La Bombonera" date="Octubre 05 2025" dark />
          <HistoryItem n="1" name="Los Mochos" date="Agosto 16 2025" />
        </View>
      </ScrollView>
    </SafeAreaView>
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
        <View style={styles.historyIcon} />
        <Text style={styles.historyName}>{name}</Text>
      </View>

      <Text style={styles.historyDate}>{date}</Text>
    </View> 
  );
}

/* ---------------- STYLES ---------------- */

const styles = StyleSheet.create({
  container: {
    flex: 1,
   
  },

  header: {
    width: "100%",
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#fff",
    display: "flex",
  },

  title: {
    color: "#24281B",
    fontSize: 22,
    fontWeight: "700",
    fontFamily: "Montserrat",
  },

  editBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: "black",
    borderRadius: 4,
  },

  editText: {
    color: "white",
    fontSize: 14,
    fontWeight: "500",
    fontFamily: "Montserrat",
  },

  scrollContent: {
    alignItems: "center",
    paddingBottom: 40,
    width: "100%",
    
  },

  topSection: {
    width: "100%",
    backgroundColor: "white",
    alignItems: "center",
    paddingTop: 16,
    paddingBottom: 20,
    gap: 12,
  },

  avatar: {
    width: 120,
    height: 120,
    borderRadius: 120,
  },

  nameBlock: { alignItems: "center", gap: 4 },

  name: {
    fontSize: 22,
    fontWeight: "600",
    color: "black",
    fontFamily: "Montserrat",
  },

  nickname: {
    fontSize: 17,
    color: "black",
    fontFamily: "Montserrat",
  },

  memberSince: {
    fontSize: 12,
    fontWeight: "600",
    color: "rgba(0,0,0,0.40)",
    fontFamily: "Montserrat",
  },

  statsRow: {
    flexDirection: "row",
    width: "100%",
    justifyContent: "center",
  },

  statItem: {
    flex: 1,
    paddingVertical: 8,
    alignItems: "center",
    gap: 4,
  },

  statDivider: {
    borderRightWidth: 1,
    borderColor: "#A6A6A6",
  },

  statLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: "black",
    fontFamily: "Montserrat",
  },

  statValue: {
    fontSize: 12,
    color: "black",
    fontFamily: "Montserrat",
  },

  historySection: {
    width: "100%",
    padding: 16,
    backgroundColor: "#303030",
  },

  historyHeader: {
    marginBottom: 12,
    flexDirection: "row",
    justifyContent: "space-between",
  },

  historyTitle: {
    color: "#8AB1FF",
    fontSize: 16,
    fontWeight: "600",
    fontFamily: "Montserrat",
  },

  paymentTitle: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
    fontFamily: "Montserrat",
  },

  filterRow: {
    padding: 6,
    backgroundColor: "black",
    borderRadius: 4,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },

  filterLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  filterDot: {
    width: 18,
    height: 18,
    backgroundColor: "white",
  },

  filterLabel: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
    fontFamily: "Montserrat",
  },

  historyItem: {
    padding: 6,
    borderRadius: 4,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },

  historyItemDark: {
    backgroundColor: "rgba(255,255,255,0.08)",
  },

  historyIndex: {
    width: 30,
    fontSize: 17,
    color: "white",
    fontWeight: "600",
  },

  historyLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  historyIcon: {
    width: 24,
    height: 24,
    backgroundColor: "rgba(255,255,255,0.19)",
  },

  historyName: {
    color: "white",
    fontSize: 13,
    fontWeight: "600",
    fontFamily: "Montserrat",
  },

  historyDate: {
    color: "rgba(255,255,255,0.70)",
    fontSize: 12,
    fontFamily: "Montserrat",
  },
});
import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Pressable,
  Image,
} from "react-native";
import { signOut } from "firebase/auth";
import { auth } from "../config/firebase";
import { LinearGradient } from "expo-linear-gradient";

const MENU_WIDTH = 280;

export default function Menu({ visible, onClose }) {
  const slideAnim = useRef(new Animated.Value(MENU_WIDTH)).current; // Start off-screen to the right

  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: visible ? 0 : MENU_WIDTH, // 0 = visible (from right), MENU_WIDTH = hidden
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [visible]);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      console.log("Logged out");
    } catch (err) {
      console.log("Sign-out error:", err);
    }
  };

  if (!visible) return null;

  return (
    <View style={styles.overlay}>
      {/* Backdrop to close menu */}
      <Pressable style={styles.backdrop} onPress={onClose} />

      {/* Sliding Menu from the RIGHT */}
      <Animated.View
        style={[
          styles.menuContainer,
          {
            transform: [{ translateX: slideAnim }],
          },
        ]}
      >
        <LinearGradient
          colors={["#0E1828", "#040506"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={styles.gradient}
        >
          {/* Header with Logo + Close Button */}
          <View style={styles.header}>
            <Image
              source={require("../assets/logo5.png")}
              style={styles.logo}
              resizeMode="contain"
            />
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Image
                source={require("../assets/mage.png")}
                style={styles.closeIcon}
                resizeMode="contain"
              />
            </TouchableOpacity>
          </View>

          {/* Menu Items */}
          <View style={styles.menuItems}>
            <TouchableOpacity style={styles.menuItem}>
              <Image
                source={require("../assets/support.png")}
                style={styles.icons}
              />
              <Text style={styles.menuTexts}>App Feedbacks (abre)Email</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem}>
              <Image
                source={require("../assets/jam.png")}
                style={styles.icons}
              />
              <Text style={styles.menuTexts}>Términos y Condiciones</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem} onPress={handleSignOut}>
              <Image
                source={require("../assets/sesion.png")}
                style={styles.icon}
              />
              <Text style={styles.menuText}>Cerrar Sesión</Text>
            </TouchableOpacity>

            <Text style={styles.copyright}>Tactica - Copyrights 2025</Text>
          </View>
        </LinearGradient>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 999,
    flexDirection: "row",
    justifyContent: "flex-end", // Aligns menu to the right
  },
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
  },
  menuContainer: {
    width: MENU_WIDTH,
    height: "100%",
    backgroundColor: "transparent",
    shadowColor: "#000",
    shadowOffset: { width: -5, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 20,
  },
  gradient: {
    flex: 1,
    borderTopLeftRadius: 20, // Rounded on the left (since it opens from right)
    borderBottomLeftRadius: 20,
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 30,
  },
  logo: {
    width: 140,
    height: 60,
  },
  closeButton: {
    padding: 8,
  },
  closeIcon: {
    width: 32,
    height: 32,
  },
  menuItems: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 500,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    gap: 12,
  },
  icon: {
    width: 28,
    height: 28,
    tintColor: "rgba(232, 63, 83, 1)",
  },
  icons: {
    width: 28,
    height: 28,
    tintColor: "#ffffff",
  },
  menuText: {
    color: "rgba(232, 63, 83, 1)",
    fontSize: 16,
    fontWeight: "500",
  },
  menuTexts: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "500",
  },
  copyright: {
    color: "rgba(255, 255, 255, 0.6)",
    fontSize: 12,
    textAlign: "center",
    marginTop: "auto",
    paddingBottom: 40,
  },
});
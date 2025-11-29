import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Dimensions,
  Pressable,
  Image,
} from "react-native";

const { width } = Dimensions.get("window");

export default function Menu({ visible, onClose, onSignOut }) {
  const slideAnim = useRef(new Animated.Value(width)).current; 
  const handleSignOut = async () => {
    await auth().signOut(); // or your Firebase logout
  };

  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: visible ? 0 : width, // Move into view (0), out (width)
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [visible]);

  if (!visible) return null; // Prevent overlay from blocking touches when closed

  return (
    <View style={styles.overlay}>
      {/* OUTSIDE AREA CLOSES MENU */}
      <Pressable style={styles.backdrop} onPress={onClose} />

      {/* SLIDING PANEL */}
      <Animated.View style={[styles.menuContainer, { right: slideAnim }]}>
        <View style={styles.header}>
          
          <Image
              source={require("../assets/logo5.png")}
              style={styles.text}
                      />

          {/* CLOSE BUTTON */}
          <TouchableOpacity onPress={onClose}>
          <Image
              source={require("../assets/mage.png")}
              style={styles.text}
                      />
          </TouchableOpacity>
        </View>

        {/* ADD MENU ITEMS BELOW */}
        <View style={{ marginTop: 550, gap: 30, }}>
          <View style={styles.support}>
            <Image
              source={require("../assets/support.png")}
              style={styles.supportIcon}
              />
              <Text style={{ color: "rgba(255, 255, 255, 1)", fontSize: 14, fontWeight: "400",}}>App Feedbacks (abre)Email</Text>
          </View>
          <View style={styles.support}>
            <Image
              source={require("../assets/jam.png")}
              style={styles.supportIcon}
              />
              <Text style={{ color: "rgba(255, 255, 255, 1)", fontSize: 14, fontWeight: "400",}}>Terminos y Condiciones</Text>
          </View>
          <TouchableOpacity style={styles.support} onPress={onSignOut}>
  <Image
    source={require("../assets/exit.png")}
    style={styles.supportIcon}
  />
  <Text
    style={{
      color: "rgba(255, 255, 255, 1)",
      fontSize: 14,
      fontWeight: "400",
    }}
  >
    Cerrar Sesión
  </Text>
</TouchableOpacity>
<Text style={styles.copyright}>Tactica - Copyrights 2025</Text>
        </View>
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
    
  },
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)", // dim background
  },
  menuContainer: {
    
    width: 280,
    backgroundColor: "rgba(36,36,36,1)",
    padding: 20,
    height: "100%",
    position: "absolute",
    top: 0,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 50,
  },
  close: {
    color: "white",
    fontSize: 22,
    fontWeight: "bold",
  },
  text: {
    color: "white",
    fontSize: 24,
    fontWeight: "bold",
  },
  support: {
    flexDirection: "row",
    gap: 6,
    display: "flex",
    alignItems: "center",
  },
  copyright: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 12,
    fontWeight: "400",
    color: "rgba(255, 255, 255, 1)",
    paddingLeft: 50,
    marginTop: 20,
  }
});
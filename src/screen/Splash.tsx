import React, { useEffect, useRef } from "react";
import { View, StyleSheet, Animated, Image } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

const logo = require("../assets/logo7.png");

export default function Splash({ navigation }) {
  const scale = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale, { toValue: 1, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 1, duration: 800, useNativeDriver: true }),
    ]).start();

    const timeout = setTimeout(() => {
      navigation.replace("Welcome");
    }, 3600); // 3.6 seconds 

    return () => clearTimeout(timeout);
  }, []);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["#0E1828", "#040506"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      >
        <View style={styles.centerContainer}>
          <Animated.Image
            source={logo}
            style={[
              styles.logo,
              {
                transform: [{ scale }],
                opacity,
              },
            ]}
            resizeMode="contain"
          />
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0E1828", // Fallback matches gradient top
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",    
    alignItems: "center",       
  },
  logo: {
    width: 393,
    height: 153.06,
  },
});
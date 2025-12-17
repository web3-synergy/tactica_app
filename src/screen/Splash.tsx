import React, { useEffect, useRef } from "react";
import { View, StyleSheet, Animated, Image } from "react-native";
const logo = require("../assets/logo3.png"); 

export default function Splash({ navigation }: any) {
  const scale = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Animate logo
    Animated.parallel([
      Animated.spring(scale, { toValue: 1, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 1, duration: 800, useNativeDriver: true }),
    ]).start();

    const timeout = setTimeout(() => {
      navigation.replace("Welcome"); 
    }, 3600);

    return () => clearTimeout(timeout);
  }, []);

  return (
    <View style={styles.container}>
      <Animated.Image
        source={logo}
        style={{
          width: 393,
          height: 153.06,
          transform: [{ scale }],
          opacity,
        }}
        resizeMode="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
  },
});
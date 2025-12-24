import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Image,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Alert,
} from "react-native";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../config/firebase";
import {  Eye, EyeOff } from "lucide-react-native";
import { LinearGradient } from 'expo-linear-gradient';


export default function Login({ navigation }: any) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const isDisabled = loading || !email || !password;

  const handleLogin = async () => {
    if (!email || !password) return Alert.alert("Error", "Please fill all fields");

    try {
      setLoading(true);
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      Alert.alert("Success", `Logged in as ${user.email}`);
      
    } catch (error: any) {
      console.error("Login error:", error);
      Alert.alert("Login Failed", error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#000" }}>
         <LinearGradient
        colors={['#0E1828', '#040506']} 
        style={{ flex: 1 }}
      >
  <ScrollView 
    contentContainerStyle={styles.container}
    keyboardShouldPersistTaps="handled"
  >
      {/* Header */}
      <View style={styles.header}>
        
        <Text style={styles.logoText}>TACTICA</Text>
      </View>

      <Text style={styles.title}>Inicio de Sesión</Text>

      {/* Email input */}
      <View
  style={[
    styles.inputContainer,
    { borderColor: isFocused ? "rgba(194, 212, 48, 1)" : "rgba(99, 107, 112, 1)" },
  ]}
>
  <Image
    source={require("../assets/email.png")}
    style={styles.socialIcon}
  />
  <TextInput
    placeholder="myemail@email.com"
    placeholderTextColor="#7B7878"
    style={styles.input}
    value={email}
    onChangeText={setEmail}
    keyboardType="email-address"
    autoCapitalize="none"
    onFocus={() => setIsFocused(true)}
    onBlur={() => setIsFocused(false)}
  />
</View>

      {/* Password input */}
      <View style={[
    styles.inputContainer,
    { borderColor: passwordFocused ? "rgba(194, 212, 48, 1)" : "rgba(99, 107, 112, 1)" },
  ]}>
  <Image
    source={require("../assets/password.png")}
    style={styles.socialIcon}
  />

  <TextInput
    placeholder="Enter password"
    placeholderTextColor="#7B7878"
    secureTextEntry={!showPassword}
    style={[styles.input, { flex: 1 }]}
    value={password}
    onChangeText={setPassword}
    onFocus={() => setPasswordFocused(true)}
    onBlur={() => setPasswordFocused(false)}
  />

<TouchableOpacity
  onPress={() => setShowPassword(!showPassword)}
  hitSlop={10}
>
  {showPassword ? (
    <EyeOff
      size={18}
      color={
        passwordFocused
          ? "rgba(194, 212, 48, 1)"
          : "rgba(192, 192, 192, 1)"
      }
    />
  ) : (
    <Eye
      size={18}
      color={
        passwordFocused
          ? "rgba(194, 212, 48, 1)"
          : "rgba(192, 192, 192, 1)"
      }
    />
  )}
</TouchableOpacity>
</View>

      {/* Login button */}
      <TouchableOpacity
  style={[
    styles.loginButton,
    {
      backgroundColor: isDisabled
        ? "rgba(99, 107, 112, 0.4)" // disabled color
        : "rgba(194, 212, 48, 1)",  // active color
    },
  ]}
  onPress={handleLogin}
  disabled={loading || !email || !password}
>
  <Text style={styles.loginText}>
    {loading ? "Logging in..." : "Ingresar"}
  </Text>
</TouchableOpacity>


</ScrollView> 
</LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    backgroundColor: "transparent",
    
    alignItems: "center",
    gap: 24,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 99,
    marginBottom: 24,
  },
  logoBox: {
    width: 40,
    height: 40,
    borderRadius: 6,
    backgroundColor: "#0E1828",
    position: "relative",
  },
  logoSquare: { ...StyleSheet.absoluteFillObject },
  logoShape: { position: "absolute", backgroundColor: "#909090" },
  logoText: {
    color: "rgba(194, 212, 48, 1)",
    fontSize: 40,
    fontWeight: "700",
    fontFamily: "agressive",
    lineHeight: 40,
    letterSpacing: -3,
  },
  title: {
    fontSize: 22,
    fontWeight: "500",
    color: "rgba(255, 255, 255, 1)",
    textAlign: "center",
  },
  inputContainer: {
    width: "100%",
    height: 42, // Fixed height = same on Android + iOS
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderColor: "#636B70",
    borderWidth: 0.6,
    borderRadius: 6,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontWeight: "500",
    color: "rgba(255, 255, 255, 1)",
    paddingVertical: 0, // VERY IMPORTANT for Android
  },
  socialIcon: {
    width: 20,
    height: 20,
    resizeMode: "contain",
  },
  eyeIcon: {
    width: 20,
    height: 20,
    tintColor: "#7B7878",
    resizeMode: "contain",
  },
  loginButton: {
    width: "100%",
    height: 42,
    backgroundColor: "rgba(194, 212, 48, 1)",
    borderRadius: 6,
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 100,
  },
  loginText: {
    color: "rgba(14, 24, 40, 1)",
    fontSize: 16,
    fontWeight: "600",
  },
  linkText: {
    color: "#7A7A7A",
    fontSize: 14,
    marginTop: 20,
  },
  socialIcon: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    top: 2,
    
  },
  eyeIcon: {
    width: 20,
    height: 20,
    tintColor: "#7B7878",
    top: 3,
  },
});
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

export default function Login({ navigation }: any) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) return Alert.alert("Error", "Please fill all fields");

    try {
      setLoading(true);
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      Alert.alert("Success", `Logged in as ${user.email}`);
      navigation.replace("Main"); // or wherever your main screen is
    } catch (error: any) {
      console.error("Login error:", error);
      Alert.alert("Login Failed", error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#FFF" }}>
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
      <View style={styles.inputContainer}>
        <Image source={require("../assets/email.png")} style={styles.socialIcon} />
        <TextInput
          placeholder="myemail@email.com"
          placeholderTextColor="#7B7878"
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
      </View>

      {/* Password input */}
      <View style={styles.inputContainer}>
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
  />

  <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
    <Image
      source={require("../assets/eye.png")}
      style={styles.eyeIcon}
    />
  </TouchableOpacity>
</View>
      {/* Login button */}
      <TouchableOpacity
  style={[
    styles.loginButton,
    (loading || !email || !password) && { opacity: 0.2 },
  ]}
  onPress={handleLogin}
  disabled={loading || !email || !password}
>
  <Text style={styles.loginText}>
    {loading ? "Logging in..." : "Ingresar"}
  </Text>
</TouchableOpacity>


</ScrollView> 
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    backgroundColor: "#FFF",
    
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
    color: "rgba(144, 144, 144, 1)",
    fontSize: 40,
    fontWeight: "700",
    fontFamily: "agressive",
    lineHeight: 40,
    letterSpacing: -3,
  },
  title: {
    fontSize: 22,
    fontWeight: "500",
    color: "#000",
    textAlign: "center",
  },
  inputContainer: {
    width: "100%",
    minHeight: 42,
    backgroundColor: "#FFF",
    borderColor: "#636B70",
    borderWidth: 0.6,
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
  },
  input: {
    fontSize: 16,
    fontWeight: "500",
    color: "#000",
    
  },
  loginButton: {
    width: 361,
    height: 42,
    backgroundColor: "#7A7A7A",
    borderRadius: 6,
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 100,
  },
  loginText: {
    color: "#FFF",
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
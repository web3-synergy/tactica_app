import React, { useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Linking,
} from "react-native";

import * as WebBrowser from "expo-web-browser";
import * as Google from "expo-auth-session/providers/google";
import * as Facebook from "expo-auth-session/providers/facebook";

import { auth } from "../config/firebase";
import {
  GoogleAuthProvider,
  FacebookAuthProvider,
  signInWithCredential,
} from "firebase/auth";
import { StatusBar } from 'expo-status-bar';

WebBrowser.maybeCompleteAuthSession();

export default function Welcome({ navigation }) {
  // ------------------ GOOGLE ------------------
  const [googleRequest, googleResponse, googlePrompt] =
    Google.useAuthRequest({
      expoClientId: "YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com",
      iosClientId: "YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com",
      androidClientId: "YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com",
    });

  useEffect(() => {
    if (googleResponse?.type === "success") {
      const { id_token } = googleResponse.params;
      const credential = GoogleAuthProvider.credential(id_token);
      signInWithCredential(auth, credential)
        .then(() => navigation.replace("Main"))
        .catch((err) => console.log("Google Error:", err));
    }
  }, [googleResponse]);

  // ------------------ FACEBOOK ------------------
  const [fbRequest, fbResponse, fbPrompt] = Facebook.useAuthRequest({
    clientId: "YOUR_FACEBOOK_APP_ID",
  });

  useEffect(() => {
    if (fbResponse?.type === "success") {
      const token = fbResponse.authentication.accessToken;
      const credential = FacebookAuthProvider.credential(token);
      signInWithCredential(auth, credential)
        .then(() => navigation.replace("Main"))
        .catch((err) => console.log("Facebook Error:", err));
    }
  }, [fbResponse]);

  return (
    <View style={styles.container}>
      {/* Logo */}
      <Image source={require("../assets/logo4.png")} style={styles.logoIcon} />
      <StatusBar style="dark" />

      

      {/* Buttons */}
      <View style={styles.buttons}>
        {/* Login / Signup */}
        <View style={styles.row}>
          <TouchableOpacity
            style={styles.btnOutline}
            onPress={() => navigation.replace("Login")}
          >
            <Text style={styles.btnOutlineText}>Ingresar</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.btnSolid}
            onPress={() => navigation.navigate("Signup")}
          >
            <Text style={styles.btnSolidText}>Crear Cuenta</Text>
          </TouchableOpacity>
        </View>

        {/* Divider */}
        <View style={styles.dividerContainer}>
          <View style={styles.line} />
          <Text style={styles.registerText}>Registrarse con</Text>
          <View style={styles.line} />
        </View>

        {/* Social Buttons */}
        <View style={styles.socialRow}>
          <TouchableOpacity
            style={styles.socialButton}
            onPress={() => googlePrompt()}
          >
            <Image
              source={require("../assets/google.png")}
              style={styles.socialIcon}
            />
            <Text style={styles.socialText}>Google</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.socialButton}
            onPress={() => fbPrompt()}
          >
            <Image
              source={require("../assets/facebook.png")}
              style={styles.socialIcon}
            />
            <Text style={styles.socialText}>Facebook</Text>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.condition}>
          <Text style={styles.term}>Términos & Condiciones</Text>

          <View style={styles.follow}>
            <Text style={styles.followTitle}>Síguenos</Text>

            <View style={styles.socialLinks}>
              <TouchableOpacity
                onPress={() => Linking.openURL("https://instagram.com/yourpage")}
                style={styles.socialColumn}
              >
                <Image
                  source={require("../assets/instagram.png")}
                  style={styles.followIcon}
                />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => Linking.openURL("https://twitter.com/yourpage")}
                style={styles.socialColumn}
              >
                <Image
                  source={require("../assets/tiktok.png")}
                  style={styles.followIcon}
                />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFF",
    justifyContent: "flex-start",
    alignItems: "center",
    paddingVertical: 80,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 100,
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
    color: "#909090",
    fontSize: 34,
    fontWeight: "700",
  },
  textSection: {
    alignItems: "center",
    marginTop: 50,
    marginBottom: 100,
  },
  title: {
    fontSize: 22,
    fontWeight: "500",
    color: "#000",
    lineHeight: 36,
  },
  subtitle: {
    fontSize: 16,
    color: "#7A7A7A",
    lineHeight: 24,
  },
  buttons: {
    width: "90%",
    marginTop: 89,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  btnOutline: {
    width: 160,
    height: 42,
    backgroundColor: "#FFF",
    borderColor: "#000",
    borderWidth: 1,
    borderRadius: 6,
    justifyContent: "center",
    alignItems: "center",
  },
  btnSolid: {
    width: 160,
    height: 42,
    backgroundColor: "#7A7A7A",
    borderRadius: 6,
    paddingVertical: 12,
    alignItems: "center",
  },
  btnOutlineText: {
    color: "#000",
    fontSize: 16,
    fontWeight: "500",
  },
  btnSolidText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "500",
  },
  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 20,
    width: "100%",
  },
  
  line: {
    flex: 1,
    height: 1,
    backgroundColor: "rgba(0, 0, 0, 1)",
    marginHorizontal: 10,
  },
  
  registerText: {
    fontSize: 14,
    color: "rgba(0, 0, 0, 1)",
    fontWeight: "500",
  },
  socialRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  socialButton: {
    flex: 1,
    width: 168.5,
    height: 46,
    backgroundColor: "#E3EEF3",
    borderRadius: 6,
    paddingVertical: 11,
    marginHorizontal: 6,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  socialIcon: {
    width: 24,
    height: 24,
    resizeMode: "contain",
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "flex-end",
    marginRight: 35,
    
  },
  socialText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#000",
    paddingRight: 30,
    
  },
  condition: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 80,
    marginTop: 200,
  },
  follow: {
    display: "flex",
    flexDirection: "row",
    gap: 20,
  },
  term: {
    color: "rgba(0, 0, 0, 1)",
    fontSize: 14,
    fontWeight: "500",
    lineHeight: 20,
  },
  socialLinks: {
    flexDirection: "row",
    gap: 10,
  },
  logoIcon: {
    marginTop: 100.5,
  }
  
  

});
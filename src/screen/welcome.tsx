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
import { StatusBar } from "expo-status-bar";
import { LinearGradient } from "expo-linear-gradient";

WebBrowser.maybeCompleteAuthSession();

export default function Welcome({ navigation }) {
  // Google Auth
  const [googleRequest, googleResponse, googlePrompt] = Google.useAuthRequest({
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

  // Facebook Auth
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
      <StatusBar style="light" />
      <LinearGradient
        colors={["#0E1828", "#040506"]} 
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      >
        <View style={styles.content}>
          {/* Logo */}
          <Image
            source={require("../assets/logo6.png")}
            style={styles.logo}
            resizeMode="contain"
          />

          {/* Main Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.button, styles.loginButton]}
              onPress={() => navigation.navigate("Login")}
            >
              <Text style={styles.buttonText}>Ingresar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.signupButton]}
              onPress={() => navigation.navigate("Signup")}
            >
              <Text style={styles.buttonTexts}>Crear Cuenta</Text>
            </TouchableOpacity>
          </View>

          {/* Or Divider */}
          <View style={styles.dividerContainer}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>Registrarse con</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Social Buttons */}
          <View style={styles.socialButtons}>
            <TouchableOpacity
              style={[styles.socialButton, styles.googleButton]}
              onPress={() => googlePrompt()}
            >
              <Image
                source={require("../assets/google.png")}
                style={styles.socialIcon}
              />
              <Text style={styles.socialText}> Google</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.socialButton, styles.facebookButton]}
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
                  source={require("../assets/instagram1.png")}
                  style={styles.followIcon}
                />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => Linking.openURL("https://twitter.com/yourpage")}
                style={styles.socialColumn}
              >
                <Image
                  source={require("../assets/tiktok1.png")}
                  style={styles.followIcon}
                />
              </TouchableOpacity>
            </View>
          </View>
          </View>
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  logo: {
    
    marginBottom: 80,
  },
  actionButtons: {
    width: "100%",
    maxWidth: 360,
    marginBottom: 32,
    flexDirection: "row",
    gap: 24,
  },
  button: {
    width: 160,
    height: 42,
    borderRadius: 6,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  loginButton: {
    backgroundColor: "#C2D430", // Professional green
  },
  signupButton: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#C2D430",
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#0A1328",
  },
  buttonTexts: {
    fontSize: 16,
    fontWeight: "600",
    color: "rgba(194, 212, 48, 1)",
  },
  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    maxWidth: 360,
    marginBottom: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
  },
  dividerText: {
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: 14,
    marginHorizontal: 16,
  },
  socialButtons: {
    width: "100%",
    maxWidth: 360,
    marginBottom: 48,
    flexDirection: "row",
    gap: 24,
  },
  socialButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    width: 168.5,
    height: 42,
    borderRadius: 6,
    marginBottom: 12,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    borderWidth: 1,
    
  },
  
  socialIcon: {
    width: 24,
    height: 24,
    marginRight: 12,
  },
  socialText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#0A1328",
  },
  footer: {
    position: "absolute",
    bottom: 40,
    alignItems: "center",
    width: "100%",
    flexDirection: "row",
    gap: 24,
  },
  termText: {
    fontSize: 13,
    color: "rgba(255, 255, 255, 0.7)",
    textAlign: "center",
    marginBottom: 24,
  },
  linkText: {
    color: "#C2D430",
    fontWeight: "600",
  },
  followContainer: {
    alignItems: "center",
    flexDirection: "row",
    gap: 5,
  },

  
  socialFollowIcon: {
    width: 32,
    height: 32,
  },
  condition: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 80,
    marginTop: 100,
  },
  follow: {
    display: "flex",
    flexDirection: "row",
    gap: 20,
  },
  term: {
    color: "rgba(255, 255, 255, 1)",
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
  },
  followTitle: {
    color: "rgba(255, 255, 255, 1)",
  }
});
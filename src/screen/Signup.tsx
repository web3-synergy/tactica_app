import React, { useState, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Image,
  ScrollView,
  
} from "react-native";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "../config/firebase";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "react-native/Libraries/NewAppScreen";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";

export default function SignupScreen({ navigation }: any) {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [additionalInfo, setAdditionalInfo] = useState("");
  const [dob, setDob] = useState("");
  const [city, setCity] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [loading, setLoading] = useState(false);

  const inputRefs = useRef([]);

  const handleNext = async () => {

    if (step === 1) {
      const emailRegex = /\S+@\S+\.\S+/;
      if (!emailRegex.test(email)) return alert("Ingresa un correo válido");
      setStep(2);
      return;
    }
  
    if (step === 2) {
      if (!name || !additionalInfo || !dob)
        return alert("Rellena todos los campos");
      setStep(3);
      return;
    }
  
    if (step === 3) {
      if (!city || !whatsapp) return alert("Rellena todos los campos");
      setStep(4); // now go to code step
      return;
    }
  
    // ✅ Step 4 = CODE
    if (step === 4) {
      if (code.length !== 6) return alert("Ingresa el código completo");
      setStep(5); // now move to password
      return;
    }
  
    // Step 5 = PASSWORD
if (step === 5) {
    if (!password) return alert("Ingresa una contraseña");
    setStep(6); // move to Terms & Conditions
    return;
  }
  
  // Step 6 = TERMS
  if (step === 6) {
    if (!acceptedTerms) return alert("Debes aceptar los términos y condiciones");
    
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
const user = userCredential.user;


await setDoc(doc(db, "users", user.uid), {
  email,
  name,
  additionalInfo,
  dob,
  city,
  whatsapp,
  createdAt: serverTimestamp(),
  teamId: null, 
});

alert("Cuenta creada!");

    } catch (error: any) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  }
  };

  const handleCodeChange = (text, index) => {
    const updated = code.split("");
    updated[index] = text;
    setCode(updated.join(""));

    if (text && index < 5) {
      inputRefs.current[index + 1].focus();
    }
  };
  const isButtonActive =
  (step === 1 && email.length > 5) ||
  (step === 2 && name && additionalInfo && dob) ||
  (step === 3 && city && whatsapp) ||
  (step === 4 && code.length === 6) ||
  (step === 5 && password.length >= 6) ||
  (step === 6 && acceptedTerms);

  const handleKeyPress = (key, index) => {
    if (key === "Backspace" && index > 0 && !code[index]) {
      inputRefs.current[index - 1].focus();
    }
  };

  const renderStep = () => {
    if (step === 1)
      return (
        <>
          <Text style={styles.subtitle}>Ingresa tu correo electrónico</Text>
          <View style={styles.inputContainer}>
            <Image
              source={require("../assets/email2.png")}
              style={styles.socialIcon}
            />
            <TextInput
              placeholder="Email"
              placeholderTextColor="rgba(123, 120, 120, 1)"
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>
        </>
      );

    if (step === 2)
      return (
        <View style={{ width: "100%", alignItems: "center", gap: 16 }}>
          <Text style={styles.subtitle}>Ultimos detalles antes de empezar</Text>

          <View style={styles.inputContainer}>
            <Image
              source={require("../assets/ecos.png")}
              style={styles.socialIcon}
            />
            <TextInput
              placeholder="Nombre Completo"
              placeholderTextColor="rgba(123, 120, 120, 1)"
              style={styles.input}
              value={name}
              onChangeText={setName}
            />
          </View>

          <View style={styles.inputContainer}>
            <Image
              source={require("../assets/running.png")}
              style={styles.socialIcon}
            />
            <TextInput
              placeholder="Apodo"
              placeholderTextColor="rgba(123, 120, 120, 1)"
              style={styles.input}
              value={additionalInfo}
              onChangeText={setAdditionalInfo}
            />
          </View>

          <View style={styles.inputContainer}>
            <Image
              source={require("../assets/date.png")}
              style={styles.socialIcon}
            />
            <TextInput
              placeholder="Fecha de Nacimiento"
              placeholderTextColor="rgba(123, 120, 120, 1)"
              style={styles.input}
              value={dob}
              onChangeText={setDob}
              keyboardType="numeric"
            />
          </View>
        </View>
      );

    if (step === 3)
      return (
        <>
          <Text style={styles.subtitle}>Ultimos detalles antes de empezar</Text>

          <View style={styles.inputContainer}>
            <Image
              source={require("../assets/email2.png")}
              style={styles.socialIcon}
            />
            <TextInput
              placeholder="Ciudad"
              placeholderTextColor="rgba(123, 120, 120, 1)"
              style={styles.input}
              value={city}
              onChangeText={setCity}
            />
          </View>

          <View style={styles.inputContainer}>
            <Image
              source={require("../assets/email2.png")}
              style={styles.socialIcon}
            />
            <TextInput
              placeholder="WhatsApp"
              placeholderTextColor="rgba(123, 120, 120, 1)"
              style={styles.input}
              value={whatsapp}
              onChangeText={setWhatsapp}
              keyboardType="numeric"
            />
          </View>
        </>
      );

    
if (step === 4)
    return (
      <>
        <Text style={styles.subtitle}>
        Te hemos enviado un código de seguridad 
        </Text>
  
        <View style={styles.codeContainer}>
          {[0, 1, 2, 3, 4, 5].map((index) => (
            <TextInput
              key={index}
              ref={(ref) => (inputRefs.current[index] = ref)}
              style={styles.codeBox}
              keyboardType="numeric"
              maxLength={1}
              onChangeText={(text) => handleCodeChange(text, index)}
              onKeyPress={({ nativeEvent }) =>
                handleKeyPress(nativeEvent.key, index)
              }
            />
          ))}
        </View>
      </>
    );
  
  
  if (step === 5)
    return (
      <>
        <Text style={styles.subtitle}>Protege cuenta</Text>
        <View style={styles.inputContainer}>
            <Image
              source={require("../assets/email2.png")}
              style={styles.socialIcon}
            />
            <TextInput
              placeholder="Contraseña"
              placeholderTextColor="rgba(123, 120, 120, 1)"
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              
            />
          </View>
          <View style={styles.inputContainer}>
            <Image
              source={require("../assets/email2.png")}
              style={styles.socialIcon}
            />
            <TextInput
              placeholder="Repetir Contraseña"
              placeholderTextColor="rgba(123, 120, 120, 1)"
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              
            />
          </View>
      </>
    );
    if (step === 6)
        return (
          <View style={{ width: "100%", alignItems: "center", gap: 16 }}>
            <Image
              source={require("../assets/terms.png")}
              style={styles.socialIcon}
            />
            <Text style={styles.subtitle}>Tratamiento de Datos</Text>
            <View style={{
          height: 200,
          padding: 12,
          borderWidth: 0.6,
          borderColor: "#ccc",
          marginBottom: 16,
        }} >
              <Text style={{ fontSize: 16, color: "rgba(0, 0, 0, 1)", lineHeight: 22, }}>
              Confirmo soy mayor de +18 años. Como sabemos que tu seguridad y tus activos son algo muy importante para ti. Nuestro sistema de verificación y seguridad proporciona un alto nivel de protección y manejo de datos sensible. Ver Términos
              </Text> 
            </View>
      
            <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
  <TouchableOpacity
    onPress={() => setAcceptedTerms(!acceptedTerms)}
    style={{
      width: 24,
      height: 24,
      borderWidth: 1,
      borderColor: "#636B70",
      borderRadius: 4,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: acceptedTerms ? "#fff" : "#FFF", 
    }}
  >
    {acceptedTerms && (
      <Ionicons name="checkmark" size={20} color="green" />
    )}
  </TouchableOpacity>
  <Text>Acepto los términos y condiciones</Text>
</View>
          </View>
        );
  };

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity
  style={styles.closeButton}
  onPress={() => {
    if (step > 1) {
      setStep(step - 1); // previous form step
    } else {
      navigation.navigate("Welcome"); // first step
    }
  }}
>
  {step === 1 ? (
    <Ionicons name="close" size={29} color="#000" />
  ) : (
    <Ionicons name="arrow-back" size={29} color="#000" />
  )}
</TouchableOpacity>

 <Text style={styles.followIcon}>TACTICA</Text>

      {step !== 6 && (
  <Text style={styles.title}>
    {step === 1
      ? "Crear Cuenta"
      : step === 2
      ? "Información Personal"
      : step === 3
      ? "Información de Contacto"
      : step === 4
      ? "Verificar Whatsapp"
      : "Crear Contraseña"}
  </Text>
)}
      {renderStep()}

      <TouchableOpacity
  style={[
    styles.button,
    isButtonActive ? styles.buttonActive : styles.buttonDisabled
  ]}
  onPress={handleNext}
  disabled={!isButtonActive || loading}
>
  <Text style={styles.buttonText}>
    {loading ? "Cargando..." : "Continuar"}
  </Text>
</TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", padding: 16, backgroundColor: "#FFF", gap: 24, },
  title: { fontSize: 22, fontWeight: "600",  },
  subtitle: { fontSize: 16, color: "#636B70", marginBottom: 10, textAlign: "center" },
  button: { width: "90%", height: 42, borderRadius: 6,  justifyContent: "center", alignItems: "center",   },
  buttonText: { color: "#FFF", fontWeight: "600", fontSize: 16, },
  followIcon: { marginTop: 70, fontSize: 40, },
  closeButton: {
    position: "absolute",
    top: 120,
    left: 20,
    zIndex: 999,
  },
  back: {gap: 6},
  
  inputContainer: {
    width: "90%",
    minHeight: 48,
    backgroundColor: "#FFF",
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
    color: "#000",
  },
  codeContainer: {
    flexDirection: "row",
    gap: 12,
    justifyContent: "center",
    marginBottom: 20,
  },
  
  codeBox: {
    width: 55,
    height: 55,
    borderWidth: 1,
    borderColor: "#636B70",
    borderRadius: 8,
    textAlign: "center",
    fontSize: 20,
    fontWeight: "600",
    color: "#000",
  },
  
  
  buttonActive: {
    backgroundColor: "#000", 
  },
  
  buttonDisabled: {
    backgroundColor: "rgba(0,0,0,0.2)", 
  },
});
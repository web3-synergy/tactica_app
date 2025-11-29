import React, { useState } from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { View, TouchableOpacity, Text} from "react-native";
import { useNavigation } from "@react-navigation/native";
import HomeScreen from "../screen/Home";
import ProfileScreen from "../screen/Profile";
import Games from "../screen/Games";
import Team from "../screen/Team";
import Menu from "../screen/Menu";
import { Ionicons } from "@expo/vector-icons";
import { auth } from "../config/firebase";
import { signOut } from "firebase/auth";

const Tab = createBottomTabNavigator();

export default function BottomTabs() {
  const [menuOpen, setMenuOpen] = useState(false);
  const navigation = useNavigation();

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      console.log("User signed out");
      navigation.replace("Login"); // if using React Navigation
    } catch (error) {
      console.log("Sign out error:", error);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarStyle: {
            backgroundColor: "rgba(0, 0, 0, 0.8)",
            borderTopWidth: 0,
            elevation: 0, 
            height: 96,
          },
          tabBarActiveTintColor: "white",
          tabBarInactiveTintColor: "rgba(159, 162, 175, 1)",
          tabBarIcon: ({ color, size }) => {
            let iconName;
            switch (route.name) {
              case "Inicio":
                iconName = "football";
                break;
              case "Perfil":
                iconName = "person";
                break;
              case "Juegos":
                iconName = "game-controller";
                break;
              case "Equipo":
                iconName = "people";
                break;
              case "Menu":
                iconName = "menu";
                break;
            }
            return <Ionicons name={iconName} size={22} color={color} />;
          },
        })}
      >
        <Tab.Screen name="Inicio" component={HomeScreen} />
        <Tab.Screen name="Perfil" component={ProfileScreen} />
        <Tab.Screen name="Juegos" component={Games} />
        <Tab.Screen name="Equipo" component={Team} />

        <Tab.Screen
  name="Menu"
  component={() => null} // no screen, only triggers overlay
  options={{
    tabBarButton: (props) => (
      <TouchableOpacity
        {...props} 
        onPress={() => setMenuOpen(true)}
        style={{
          alignItems: "center",
          justifyContent: "center",
          marginTop: 5,
        }}
      >
        <Ionicons name="menu" size={22} color={props.accessibilityState?.selected ? "white" : "rgba(159,162,175,1)"} />
        <Text style={{
          color: props.accessibilityState?.selected ? "white" : "rgba(159,162,175,1)",
          fontSize: 12,
          marginTop: 2
        }}>
          Menu
        </Text>
      </TouchableOpacity>
    ),
  }}
/>
      </Tab.Navigator>

      {/* Slide-in menu overlay */}
      <Menu
        visible={menuOpen}
        onClose={() => setMenuOpen(false)}
        onSignOut={handleSignOut}
      />
    </View>
  );
}
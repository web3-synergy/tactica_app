import React, { useState, useEffect } from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { View, TouchableOpacity, Text, Image } from "react-native";
import HomeScreen from "../screen/Home";
import ProfileScreen from "../screen/Profile";
import Games from "../screen/Games";
import Team from "../screen/Team";
import Menu from "../screen/Menu";
import { auth } from "../config/firebase";
import { signOut } from "firebase/auth";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "../config/firebase";

const Tab = createBottomTabNavigator();

export default function BottomTabs() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [gamesCount, setGamesCount] = useState(0);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;
  
    const q = query(
      collection(db, "BookedGames"),
      where("status", "==", "booked"),
      where("userId", "==", user.uid)
    );
  
    const unsub = onSnapshot(q, (snap) => setGamesCount(snap.docs.length));
    return () => unsub();
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.log("Sign out error:", error);
    }
  };

  const icons = {
    "Inicio": require("../assets/home.png"),
    "Perfil": require("../assets/profile.png"),
    "Juegos": require("../assets/game.png"),
    "Equipo": require("../assets/team.png"),
    "Menu": require("../assets/menu.png"),
  };

  return (
    <View style={{ flex: 1 }}>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarStyle: {
            backgroundColor: "rgba(13, 25, 40, 1)",
            borderTopWidth: 1,
            borderTopColor: "rgba(194, 212, 48, 1)", 
            elevation: 0,
            height: 96,
            
          },
          tabBarLabelStyle: {
            fontSize: 14,
            fontWeight: "600",
            marginTop: 4,
          },
          tabBarActiveTintColor: "rgba(194, 212, 48, 1)",
          tabBarInactiveTintColor: "rgba(100, 107, 128, 1)",
          tabBarIcon: ({ color, size }) => {
            if (route.name === "Juegos") {
              return (
                <View style={{ width: 30, height: 30, alignItems: "center", justifyContent: "center" }}>
                  <Image
                    source={icons[route.name]}
                    style={{ width: 22, height: 22, tintColor: color }}
                  />
                  {gamesCount > 0 && (
                    <View style={{
                      position: 'absolute',
                      left: -9,
                      top: 10,
                      backgroundColor: 'rgba(194, 212, 48, 1)',
                      borderRadius: 12,
                      paddingHorizontal: 5,
                      paddingVertical: 2.5,
                      minWidth: 18,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                      <Text style={{
                        color: 'rgba(14, 24, 40, 1)',
                        fontSize: 12,
                        fontWeight: '600',
                        textAlign: 'center',
                      }}>
                        {gamesCount}
                      </Text>
                    </View>
                  )}
                </View>
              );
            }
            return <Image source={icons[route.name]} style={{ width: 22, height: 22, tintColor: color }} />;
          },
        })}
      >
        <Tab.Screen name="Inicio" component={HomeScreen} />
        <Tab.Screen name="Perfil" component={ProfileScreen} />
        <Tab.Screen name="Juegos" component={Games} />
        <Tab.Screen name="Equipo" component={Team} />
        <Tab.Screen
          name="Menu"
          component={() => null}
          options={{
            tabBarButton: (props) => (
              <TouchableOpacity
                {...props}
                onPress={() => setMenuOpen(true)}
                style={{ alignItems: "center", justifyContent: "center", marginTop: 10 }}
              >
                <Image
                  source={icons["Menu"]}
                  style={{
                    width: 22,
                    height: 22,
                    tintColor: "rgba(159,162,175,1)",
                  }}
                />
                <Text
                  style={{
                    color: "rgba(100, 107, 128, 1)",
                    fontSize: 14,
                    marginTop: 5,
                  }}
                >
                  Menu
                </Text>
              </TouchableOpacity>
            ),
          }}
        />
      </Tab.Navigator>

      <Menu visible={menuOpen} onClose={() => setMenuOpen(false)} onSignOut={handleSignOut} />
    </View>
  );
}
import React, { useEffect, useState } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { auth } from "../config/firebase";
import { onAuthStateChanged } from "firebase/auth";
import Home from "../screen/Home";
import Login from "../screen/Login";
import Signup from "../screen/Signup";

import Splash from "../screen/Splash";
import Welcome from "../screen/welcome";
import BottomTabs from "../components/Button";
import BookingScreen from "../screen/BookingScreen";
import TeamDashboard from "../screen/TeamDashboard";
import AddPlayerScreen from "../screen/AddPlayerScreen";

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

 

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {user ? (
          // logged-in user
          <>
            <Stack.Screen name="Main" component={BottomTabs} />
            
            <Stack.Screen name="BookingScreen" component={BookingScreen} />
            <Stack.Screen name="TeamDashboard" component={TeamDashboard} />
            <Stack.Screen name="AddPlayer" component={AddPlayerScreen} />
          </>
        ) : (
          // not logged-in
          <>
          <Stack.Screen name="splash" component={Splash} />
          
            <Stack.Screen name="Welcome" component={Welcome} />
            <Stack.Screen name="Login" component={Login} />
            <Stack.Screen name="Signup" component={Signup} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
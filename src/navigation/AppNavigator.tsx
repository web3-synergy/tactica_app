import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import Login from "../screen/Login";
import Signup from "../screen/Signup";
import Home from "../screen/Home";
import Splash from "../screen/Splash";
import Welcome from "../screen/welcome";
import BottomTabs from "../components/Button";
import BookingScreen from "../screen/BookingScreen";
import TeamDashboard from "../screen/TeamDashboard";
import AddPlayerScreen from "../screen/AddPlayerScreen";

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  return (
    <NavigationContainer>
    <Stack.Navigator initialRouteName="Splash" screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Splash" component={Splash} />
      <Stack.Screen name="Welcome" component={Welcome} />
      <Stack.Screen name="Login" component={Login} />
      <Stack.Screen name="Signup" component={Signup} />
      <Stack.Screen name="Main" component={BottomTabs} />
      <Stack.Screen name="Home" component={Home} />
      <Stack.Screen name="BookingScreen" component={BookingScreen} />
      <Stack.Screen name="TeamDashboard" component={TeamDashboard} />
      <Stack.Screen name="AddPlayer" component={AddPlayerScreen} />
    </Stack.Navigator>
    </NavigationContainer>
  );
}
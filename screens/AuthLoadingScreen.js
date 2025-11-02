import React, { useEffect } from "react";
import { View, ActivityIndicator } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function AuthLoadingScreen({ navigation }) {

  useEffect(() => {
    const checkLoginStatus = async () => {
      const user = await AsyncStorage.getItem("authUser");
      if (user) {
        // navigation.replace("Welcome");
      } else {
        // navigation.replace("Login");
      }
    };

    checkLoginStatus();
  }, []);

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <ActivityIndicator size="large" />
    </View>
  );
}

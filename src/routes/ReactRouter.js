import React from "react";
import {
  AuthLoadingScreen,
  LoginScreen,
  SignUpScreen,
  VehicleScreen,
  PassengerHomeScreen,
  SearchScreen,
  DriverHomeScreen
} from "../navigations";
import {
  createStackNavigator,
  createSwitchNavigator,
  createDrawerNavigator,
  createBottomTabNavigator,
  StackNavigator,
  DrawerNavigator,
  SwitchNavigator,
  DrawerItems,
  DrawerView
} from "react-navigation";
import { TouchableOpacity, AsyncStorage, Dimensions } from "react-native";
import Icon from "react-native-vector-icons/Feather";
import { colors } from "../styles/styles";

const { width } = Dimensions.get("screen");

const AuthRouter = StackNavigator(
  {
    Login: LoginScreen,
    SignUp: SignUpScreen,
    Vehicle: VehicleScreen,
  },
  {
    initialRouteName: "Login",
    headerMode: "none",
    cardStyle: {
      backgroundColor: "transparent",
      opacity: 1
    },
    transitionConfig: () => ({
      transitionSpec: {
        duration: 0
      }
    })
  }
);

const PassengerRouter = StackNavigator(
  {
    PassengerHome: PassengerHomeScreen,
    Search: SearchScreen
  },
  {
    initialRouteName: "PassengerHome",
    headerMode: "none",
    mode: "modal",
    cardStyle: {
      backgroundColor: "transparent",
      opacity: 1
    }
  }
);

const DriverRouter = StackNavigator(
  {
    DriverHome: DriverHomeScreen
  },
  {
    initialRouteName: "DriverHome",
    headerMode: "none",
    mode: "modal",
    cardStyle: {
      backgroundColor: "transparent",
      opacity: 1
    }
  }
);

const AppRouter = SwitchNavigator(
  {
    AuthLoading:AuthLoadingScreen,
    Auth: AuthRouter,
    Passenger: PassengerRouter,
    Driver: DriverRouter
  },
  {
    initialRouteName: "AuthLoading",
    headerMode: "none",
    cardStyle: {
      backgroundColor: "transparent",
      opacity: 1
    }
  }
);

export default AppRouter;

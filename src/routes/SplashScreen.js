import React, { Component } from "react";
import { View, Text, StatusBar, Image, StyleSheet } from "react-native";
import { MainScreen } from "../components";
import { LogoIcon } from "../utils/variables";
import { fonts, colors } from "../styles/styles";

const styles = StyleSheet.create({
  logo_wrapper: {
    height: "100%",
    width: "100%",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center"
  },
  logo_icon: {
    resizeMode: "contain",
    alignSelf: "center",
    width: 150,
    height: 150,
    marginBottom: 20
  },
  logo_title: {
    fontSize: 30,
    textAlign: "center",
    fontWeight: "bold",
    color: colors.yellow
  }
});

class SplashScreen extends Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <View style={styles.logo_wrapper}>
        <Image style={styles.logo_icon} source={LogoIcon} />
        <Text style={styles.logo_title}>TAXIKINI</Text>
      </View>
    );
  }
}

export default SplashScreen;

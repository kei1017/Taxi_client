import React, { Component } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  AsyncStorage,
  ActivityIndicator,
  StyleSheet,
  Dimensions,
  PermissionsAndroid
} from "react-native";
import { MainScreen } from "../../components";
import { validate } from "../../utils/validation";
import { NormalMarker, DRIVER_TYPE, PASSENGER_TYPE } from "../../utils/variables";
import styles, { fonts, colors } from "../../styles/styles";
import MapView from "react-native-maps";
import firebase from "react-native-firebase";
import Toast from "react-native-easy-toast";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import Geolocation from 'react-native-geolocation-service';
import requestLocationPermission from "../../utils/requestLocationPermission";

const { width, height } = Dimensions.get("window");
const ASPECT_RATIO = width / height;
const LATITUDE_DELTA = 0.15;
const LONGITUDE_DELTA = ASPECT_RATIO * LATITUDE_DELTA;
const LATITUDE = 3.9654811;
const LONGITUDE = 102.3700989;

class LoginScreen extends Component {
  isCancelled = false;

  constructor(props) {
    super(props);
    this.state = {
      waiting: false,
      region: {
        latitude: LATITUDE,
        longitude: LONGITUDE,
        latitudeDelta: LATITUDE_DELTA,
        longitudeDelta: LONGITUDE_DELTA
      },
      email: "",
      password: ""
    };

    this.loginUser = this.loginUser.bind(this);
  }

  async componentWillMount() {
    this.isCancelled = false;
    let self = this;
    await requestLocationPermission()

    Geolocation.getCurrentPosition(
      position => {
        self.updateCurrentLocation(position);
      },
      error => alert(error.message),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
    );
  }

  componentDidMount() {
    let self = this;

    this.watchID = Geolocation.watchPosition(
      position => {
        self.updateCurrentLocation(position);
      },
      error => console.log(error),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
    );
  }

  componentWillUnmount() {
    Geolocation.clearWatch(this.watchID);
    this.isCancelled = true;
  }

  updateCurrentLocation(position) {
    this.setState({
      region: {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        latitudeDelta: LATITUDE_DELTA,
        longitudeDelta: LONGITUDE_DELTA
      }
    });
  }

  loginUser = () => {
    const self = this;
    let { email, password } = this.state;

    let emailError = validate("email", email);
    let passwordError = validate("password", password);

    if (emailError || passwordError) {
      this.refs.toast.show("Error happened. Please check your input fields again.");
      return;
    }

    this.setState({
      waiting: true
    });

    firebase
      .auth()
      .signInWithEmailAndPassword(email, password)
      .then((res) => {

        if (!res.user.emailVerified) {
          self.setState({
            waiting: false
          });
          res.user.sendEmailVerification();
          self.refs.toast.show("Email is not verified. Please Verify your Email.");
          return;
        }

        firebase
          .firestore()
          .collection("users")
          .doc(res.user.uid)
          .get()
          .then(async user => {
            var userInfo = user.data();
            userInfo["uid"] = res.user.uid;

            await AsyncStorage.setItem("userInfo", JSON.stringify(userInfo));
            self.setState({
              waiting: false
            });

            if (user.data().type === PASSENGER_TYPE)
              self.props.navigation.navigate("Passenger");
            else
              self.props.navigation.navigate("Driver");
          })
          .catch(error => {
            self.setState({
              waiting: false
            });
            self.refs.toast.show(error.message);
          });

      })
      .catch(error => {
        self.setState({
          waiting: false
        });
        self.refs.toast.show(error.message);
      });
  };

  render() {
    const { waiting, region } = this.state;

    return (
      <MainScreen waiting={waiting}>
        <MapView
          provider={MapView.PROVIDER_GOOGLE}
          style={styles.map_view}
          showsUserLocation={true}
          region={region}
        />
        <View style={styles.scroll_container_wrapper}>
          <KeyboardAwareScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scroll_container}
          >
            <View style={styles.content_bg}>
              <View style={styles.content_container}>
                <View style={styles.top_bar}>
                  <Text style={styles.top_bar_title}>LOGIN</Text>
                </View>
                <View style={styles.content_body}>
                  <Image
                    source={NormalMarker}
                    style={[styles.avatar_image, { width: 60, height: 60 }]}
                  />
                  <Text style={styles.taxi_status_text}>TAXIKINI</Text>
                  <TextInput
                    style={styles.inputs}
                    placeholderTextColor={colors.placeholderColor}
                    placeholder="Email"
                    keyboardType="email-address"
                    onChangeText={value => this.setState({ email: value })}
                    value={this.state.email}
                  />
                  <TextInput
                    style={styles.inputs}
                    placeholderTextColor={colors.placeholderColor}
                    placeholder="Password"
                    secureTextEntry
                    onChangeText={value => this.setState({ password: value })}
                    value={this.state.password}
                  />
                  <TouchableOpacity
                    style={styles.button}
                    onPress={this.loginUser}
                  >
                    <Text style={styles.button_text}>LOG IN</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.button}
                    onPress={() => this.props.navigation.navigate("SignUp")}
                  >
                    <Text style={styles.button_text}>CREATE ACCOUNT</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </KeyboardAwareScrollView>
        </View>
        <Toast ref="toast" style={{ maxWidth: "80%" }} />
      </MainScreen>
    );
  }
}

export default LoginScreen;

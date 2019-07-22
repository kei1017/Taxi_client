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
  Dimensions
} from "react-native";
import { MainScreen } from "../../components";
import { AvatarIcon, PASSENGER_TYPE, DRIVER_TYPE } from "../../utils/variables";
import styles, { fonts, colors } from "../../styles/styles";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import MapView from "react-native-maps";
import firebase from "react-native-firebase";
import Toast from "react-native-easy-toast";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { validate } from "../../utils/validation";
import ImagePicker from "react-native-image-picker";
import { default as SimpleToast } from 'react-native-simple-toast';
import Geolocation from 'react-native-geolocation-service';

var RNFS = require("react-native-fs");

const { width, height } = Dimensions.get("window");
const ASPECT_RATIO = width / height;
const LATITUDE_DELTA = 0.15;
const LONGITUDE_DELTA = ASPECT_RATIO * LATITUDE_DELTA;
const LATITUDE = 3.9654811;
const LONGITUDE = 102.3700989;

class SignUpScreen extends Component {
  isCancelled = false;

  constructor(props) {
    super(props);
    this.state = {
      waiting: false,
      selectedType: 0,
      region: {
        latitude: LATITUDE,
        longitude: LONGITUDE,
        latitudeDelta: LATITUDE_DELTA,
        longitudeDelta: LONGITUDE_DELTA
      },
      name: "",
      email: "",
      password: "",
      passwordConfirmation: "",
      mobile: "",
      pickedImage: ""
    };

    this.registerUser = this.registerUser.bind(this);
  }

  componentWillMount() {
    this.isCancelled = false;
    let self = this;

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

  pickImageHandler = () => {
    const self = this;
    ImagePicker.showImagePicker(
      { title: "Pick an Image", maxWidth: 800, maxHeight: 600 },
      async res => {
        if (res.didCancel) {
          console.log("User cancelled!");
        } else if (res.error) {
          console.log("Error", res.error);
        } else {
          self.setState({
            pickedImage: res.uri
          });
        }
      }
    );
  };

  registerUser = () => {
    const self = this;
    let {
      email,
      password,
      mobile,
      name,
      passwordConfirmation,
      selectedType,
      region,
      pickedImage
    } = this.state;

    let nameError = validate("input", name);
    let mobileError = validate("number", mobile);
    let emailError = validate("email", email);
    let passwordError = validate("password", password);
    let passwordConfirmationError = validate("password", passwordConfirmation);

    if (nameError) {
      this.refs.toast.show(
        "Name field is required. Please check your Name field."
      );
    } else if (mobileError) {
      this.refs.toast.show(
        "Mobile field is required and should be Number. Please check your Mobile field."
      );
    } else if (emailError) {
      this.refs.toast.show(
        "Email field is required and should be Email Format. Please check your Email field."
      );
    } else if (passwordError) {
      this.refs.toast.show(
        "Password field is required. Please check your Password field."
      );
    } else if (passwordConfirmationError) {
      this.refs.toast.show(
        "Password Confirmation field is required. Please check your Password Confirmation field."
      );
    } else if (password !== passwordConfirmation) {
      this.refs.toast.show("Password mismatched.");
    }

    if (
      emailError ||
      passwordError ||
      nameError ||
      mobileError ||
      passwordConfirmationError ||
      password !== passwordConfirmation
    ) {
      return;
    }

    if (selectedType === 1) {
      //Next for Driver
      this.props.navigation.navigate("Vehicle", {
        name: name,
        mobile: mobile,
        email: email,
        password: password,
        pickedImage: pickedImage
      });
      return;
    }

    self.setState({
      waiting: true
    });

    firebase
      .auth()
      .createUserWithEmailAndPassword(email, password)
      .then(async res => {
        let avatar_name = ""

        if (pickedImage !== "") {
          avatar_name = new Date().getTime() + ".png"
          const unsubscribe = firebase.storage()
            .ref('/profile/' + avatar_name)
            .putFile(pickedImage)
            .on('state_changed', snapshot => {
              //Current upload state                    
            }, err => {
              //Error                    
              unsubscribe();
            }, uploadedFile => {
              //Success                    
              unsubscribe();
            });
        }

        firebase
          .firestore()
          .collection("users")
          .doc(res.user.uid)
          .set(
            {
              type: PASSENGER_TYPE,
              name: name,
              mobile: mobile,
              booking_id: "",
              avatar_name: avatar_name,
              coordinates: new firebase.firestore.GeoPoint(
                region.latitude,
                region.longitude
              )
            },
            { merge: true }
          );

        self.setState({
          waiting: false
        });

        SimpleToast.show("Check your email to verify your account.")
        res.user.sendEmailVerification();
        self.props.navigation.navigate("Login");
      })
      .catch(error => {
        self.setState({
          waiting: false
        });
        self.refs.toast.show(error.message);
      });
  };

  render() {
    const {
      waiting,
      region,
      selectedType,
      pickedImage,
      name,
      mobile,
      email,
      password,
      passwordConfirmation
    } = this.state;
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
                  <Text style={styles.top_bar_title}>CREATE ACCOUNT</Text>
                  <TouchableOpacity
                    style={styles.back_button}
                    onPress={() => this.props.navigation.navigate("Login")}
                  >
                    <MaterialIcons
                      name="keyboard-backspace"
                      size={24}
                      color="white"
                    />
                  </TouchableOpacity>
                </View>
                <View style={styles.content_body}>
                  <View style={styles.type_container}>
                    <TouchableOpacity
                      style={[
                        styles.type_button,
                        {
                          backgroundColor:
                            selectedType === 0 ? colors.yellow : colors.grey
                        }
                      ]}
                      onPress={() => this.setState({ selectedType: 0 })}
                    >
                      <Text style={styles.button_text}>Passenger</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.type_button,
                        {
                          backgroundColor:
                            selectedType === 0 ? colors.grey : colors.yellow
                        }
                      ]}
                      onPress={() => this.setState({ selectedType: 1 })}
                    >
                      <Text style={styles.button_text}>Driver</Text>
                    </TouchableOpacity>
                  </View>

                  <TouchableOpacity onPress={this.pickImageHandler.bind(this)}>
                    <Image
                      source={
                        pickedImage !== ""
                          ? { uri: this.state.pickedImage }
                          : AvatarIcon
                      }
                      style={styles.avatar_image}
                    />
                  </TouchableOpacity>
                  <TextInput
                    style={styles.inputs}
                    placeholderTextColor={colors.placeholderColor}
                    placeholder="Name"
                    onChangeText={value => this.setState({ name: value })}
                    value={this.state.name}
                  />
                  <TextInput
                    style={styles.inputs}
                    placeholderTextColor={colors.placeholderColor}
                    placeholder="Mobile Number"
                    keyboardType="number-pad"
                    onChangeText={value => this.setState({ mobile: value })}
                    value={this.state.mobile}
                  />
                  <TextInput
                    style={styles.inputs}
                    placeholderTextColor={colors.placeholderColor}
                    placeholder="Email"
                    onChangeText={value => this.setState({ email: value })}
                    value={this.state.email}
                  />
                  <TextInput
                    style={styles.inputs}
                    placeholderTextColor={colors.placeholderColor}
                    placeholder="*Password*"
                    secureTextEntry
                    onChangeText={value => this.setState({ password: value })}
                    value={this.state.password}
                  />
                  <TextInput
                    style={styles.inputs}
                    placeholderTextColor={colors.placeholderColor}
                    placeholder="*Password Confirmation*"
                    secureTextEntry
                    onChangeText={value =>
                      this.setState({ passwordConfirmation: value })
                    }
                    value={this.state.passwordConfirmation}
                  />
                  <TouchableOpacity
                    style={styles.button}
                    onPress={this.registerUser}
                  >
                    <Text style={styles.button_text}>
                      {selectedType === 0 ? "SUBMIT" : "NEXT"}
                    </Text>
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

export default SignUpScreen;

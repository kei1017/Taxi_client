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

const { width, height } = Dimensions.get("window");
const ASPECT_RATIO = width / height;
const LATITUDE_DELTA = 0.15;
const LONGITUDE_DELTA = ASPECT_RATIO * LATITUDE_DELTA;
const LATITUDE = 3.9654811;
const LONGITUDE = 102.3700989;

class VehicleScreen extends Component {
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
      name: this.props.navigation.getParam("name", ""),
      email: this.props.navigation.getParam("email", ""),
      password: this.props.navigation.getParam("password", ""),
      mobile: this.props.navigation.getParam("mobile", ""),
      pickedImage: this.props.navigation.getParam("pickedImage", ""),
      model: "",
      color: "",
      plateNumber: "",
      driver_license: "",
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

  registerUser = () => {
    const self = this;
    let {
      pickedImage,
      email,
      name,
      password,
      mobile,
      model,
      color,
      plateNumber,
      region,
      driver_license
    } = this.state;

    let modelError = validate("input", model);
    let colorError = validate("input", color);
    let plateNumberError = validate("input", plateNumber);

    if (
      modelError ||
      colorError ||
      plateNumberError
    ) {
      this.refs.toast.show(
        "All Fields are reuqired. Please check your input fields again."
      );
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
        let driver_license_name = ""

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

        if (driver_license !== "") {
          driver_license_name = new Date().getTime() + ".png"
          const unsubscribe = firebase.storage()
            .ref('/driver_license/' + driver_license_name)
            .putFile(driver_license)
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
              type: DRIVER_TYPE,
              name: name,
              mobile: mobile,
              avatar_name: avatar_name,
              driver_license: driver_license_name,
              vehicle: {
                color: color,
                model: model,
                plateNumber: plateNumber
              },
              booking_id: "",
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
            driver_license: res.uri
          });
        }
      }
    );
  };

  render() {
    const {
      waiting,
      region,
      driver_license,
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
                  <Text style={styles.top_bar_title}>Vehicle Information</Text>
                  <TouchableOpacity
                    style={styles.back_button}
                    onPress={() => this.props.navigation.navigate("SignUp")}
                  >
                    <MaterialIcons
                      name="keyboard-backspace"
                      size={24}
                      color="white"
                    />
                  </TouchableOpacity>
                </View>
                <View style={styles.content_body}>
                  {driver_license !== "" &&
                    <Image
                      source={{ uri: driver_license }}
                      style={styles.driver_license_image}
                    />}
                  <TouchableOpacity style={styles.button} onPress={this.pickImageHandler.bind(this)}>
                    <Text style={styles.button_text}>Upload</Text>
                  </TouchableOpacity>
                  <TextInput
                    style={styles.inputs}
                    placeholderTextColor={colors.placeholderColor}
                    placeholder="Model"
                    onChangeText={value => this.setState({ model: value })}
                    value={this.state.model}
                  />
                  <TextInput
                    style={styles.inputs}
                    placeholderTextColor={colors.placeholderColor}
                    placeholder="Color"
                    onChangeText={value => this.setState({ color: value })}
                    value={this.state.color}
                  />
                  <TextInput
                    style={styles.inputs}
                    placeholderTextColor={colors.placeholderColor}
                    placeholder="PlateNumber"
                    onChangeText={value => this.setState({ plateNumber: value })}
                    value={this.state.plateNumber}
                  />
                  <TouchableOpacity
                    style={styles.button}
                    onPress={this.registerUser}
                  >
                    <Text style={styles.button_text}>SUBMIT</Text>
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

export default VehicleScreen;

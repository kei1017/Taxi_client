import React, { Component } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  AsyncStorage,
  ActivityIndicator,
  Modal,
  StyleSheet,
  Dimensions,
  PermissionsAndroid,
  Alert
} from "react-native";
import MapView, { Marker } from "react-native-maps";
import {
  DriverMarker,
  PeopleMarker,
  MAP_API_KEY
} from "../../../utils/variables";
import { colors, fonts } from "../../../styles/styles";
import firebase from "react-native-firebase";
import AntDesignIcon from "react-native-vector-icons/AntDesign";
import BackgroundTimer from "react-native-background-timer";
import MapViewDirections from "react-native-maps-directions";
import calculateFare from "../../../utils/fareCalculator";
import request from "../../../utils/request";
import Geolocation from "react-native-geolocation-service";
import requestLocationPermission from "../../../utils/requestLocationPermission";

const { width, height } = Dimensions.get("window");
const ASPECT_RATIO = width / height;
const LATITUDE_DELTA = 0.15;
const LONGITUDE_DELTA = ASPECT_RATIO * LATITUDE_DELTA;
const LATITUDE = 3.9654811;
const LONGITUDE = 102.3700989;

const styles = StyleSheet.create({
  homeContainer: {
    flex: 1,
    justifyContent: "space-between",
    alignItems: "center"
  },
  map_view: {
    position: "absolute",
    top: 0,
    left: 0,
    bottom: 0,
    right: 0
  },
  map_marker: {
    height: 30,
    width: 30,
    resizeMode: "contain"
  },
  normal_map_marker: {
    height: 40,
    width: 40,
    resizeMode: "contain"
  },
  booking_container: {
    flexDirection: "row",
    width: "100%"
  },
  booking_btn: {
    flex: 1,
    height: 50,
    backgroundColor: colors.yellow,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center"
  },
  booking_title: {
    fontSize: fonts.mediumSize,
    color: "white"
  },
  btn_logout: {
    alignSelf: "flex-end",
    margin: 20,
    marginTop: 30,
    backgroundColor: colors.grey,
    alignItems: "center",
    justifyContent: "center",
    height: 40,
    width: 40,
    borderRadius: 20
  },
  result_view: {
    width: "100%",
    padding: 10,
    backgroundColor: colors.grey,
    flexDirection: "column"
  },
  result_text: {
    width: "100%",
    margin: 5,
    fontSize: 15,
    textAlign: "center",
    justifyContent: "center",
    alignItems: "center",
    color: "white"
  },
  fare: {
    width: "100%",
    height: 50,
    fontSize: 25,
    textAlign: "center",
    justifyContent: "center",
    alignItems: "center",
    color: "white"
  }
});

class DriverHomeScreen extends Component {
  intervalId = null;
  bookingSnapShotUnsubscribe = null;
  isCancelled = false;
  
  constructor(props) {
    super(props);
    this.state = {
      region: null,
      currentPosition: null,
      userInfo: null,
      booking_info: null,
      passengerInfo: null,
      status: 0
    };

    this.logOutAction = this.logOutAction.bind(this);
    this.updateCurrentLocation = this.updateCurrentLocation.bind(this);
    this.acceptAction = this.acceptAction.bind(this);
    this.declineAction = this.declineAction.bind(this);
    this.startAction = this.startAction.bind(this);
    this.endAction = this.endAction.bind(this);
    this.getPassengerInfo = this.getPassengerInfo.bind(this);

    this.checkBooking = this.checkBooking.bind(this);
    this.bookingSnapShot = this.bookingSnapShot.bind(this);
    this.calcFare = this.calcFare.bind(this);
    this.payAction = this.payAction.bind(this);
    this.initializeBooking = this.initializeBooking.bind(this);
  }

  async componentWillMount() {
    let self = this;
    this.isCancelled = false; 
    await requestLocationPermission()
    Geolocation.getCurrentPosition(
      position => {
        self.updateCurrentLocation(position);
      },
      error => alert(error.message),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
    );

    this.checkBooking();
  }

  checkBooking() {
    let self = this;

    firebase
      .firestore()
      .collection("users")
      .doc(firebase.auth().currentUser.uid)
      .onSnapshot(querySnapShot => {
        if (!this.isCancelled) {
          this.setState({
            userInfo: querySnapShot
          });
        }

        if (self.bookingSnapShotUnsubscribe) {
          self.bookingSnapShotUnsubscribe();
        }

        if (querySnapShot.data().booking_id !== "") {
          self.bookingSnapShot(querySnapShot.data().booking_id);
        } else {
          if (!this.isCancelled) {
            this.setState({ booking_info: null, passengerInfo: null });
            }
        }
      });
  }

  bookingSnapShot(booking_id) {
    const { booking_info } = this.state;
    let self = this;
    this.bookingSnapShotUnsubscribe = firebase
      .firestore()
      .collection("bookings")
      .doc(booking_id)
      .onSnapshot(querySnapShot => {
        if (querySnapShot.data()) {
          self.getPassengerInfo(querySnapShot);

          if (!this.isCancelled) {
            self.setState({
              booking_info: querySnapShot
            });
          }

          if (querySnapShot.data().status === 5) {
            self.initializeBooking();
          }
        }
      });
  }

  async componentDidMount() {
    let self = this;

    this.watchID = Geolocation.watchPosition(
      position => {
        self.updateCurrentLocation(position);
      },
      error => console.log(error),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
    );

    //Notification Parts
    this.checkPermission();
    this.createNotificationListeners();

    // firebase
    //   .firestore()
    //   .collection("bookings")
    //   .doc("sSM7WeITPPvIBY92w4hr")
    //   .get()
    //   .then(snap => {

    //   })
  }

  updateCurrentLocation(position) {
    if (!this.isCancelled) {

      if (this.state.region) {
        this.setState({
          currentPosition: {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            latitudeDelta: LATITUDE_DELTA,
            longitudeDelta: LONGITUDE_DELTA
          }
        });
      } else {
        this.setState({
          region: {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            latitudeDelta: LATITUDE_DELTA,
            longitudeDelta: LONGITUDE_DELTA
          },
          currentPosition: {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            latitudeDelta: LATITUDE_DELTA,
            longitudeDelta: LONGITUDE_DELTA
          }
        });
      }

      this.updateDriverLocation(position.coords);
    }
  }

  componentWillUnmount() {
    Geolocation.clearWatch(this.watchID);

    //Remove listeners allocated in createNotificationListeners()
    this.notificationListener();
    this.notificationOpenedListener();
    this.messageListener();

    this.isCancelled = true;    
  }

  updateDriverLocation(currentPosition) {
    const { booking_info } = this.state;

    if (firebase.auth().currentUser) {
      firebase
        .firestore()
        .collection("users")
        .doc(firebase.auth().currentUser.uid)
        .update({
          coordinates: new firebase.firestore.GeoPoint(
            currentPosition.latitude,
            currentPosition.longitude
          )
        });
    }

    if (booking_info && booking_info.data().status > 0) {
      let status = booking_info.data().status;
      if (status === 1) {
        let distance = this.calcDistance(
          currentPosition.latitude,
          currentPosition.longitude,
          booking_info.data().start_coordinates.latitude,
          booking_info.data().start_coordinates.longitude,
          "K"
        );

        if (distance < 0.5) {
          //500m
          status = 2;
        }
      }

      firebase
        .firestore()
        .collection("bookings")
        .doc(booking_info.id)
        .update({
          current_coordinates: new firebase.firestore.GeoPoint(
            currentPosition.latitude,
            currentPosition.longitude
          ),
          status: status
        });
    }
  }

  calcDistance(lat1, lon1, lat2, lon2, unit) {
    var radlat1 = (Math.PI * lat1) / 180;
    var radlat2 = (Math.PI * lat2) / 180;
    var theta = lon1 - lon2;
    var radtheta = (Math.PI * theta) / 180;
    var dist =
      Math.sin(radlat1) * Math.sin(radlat2) +
      Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);
    dist = Math.acos(dist);
    dist = (dist * 180) / Math.PI;
    dist = dist * 60 * 1.1515;
    if (unit == "K") {
      dist = dist * 1.609344;
    }
    if (unit == "M") {
      dist = dist * 0.8684;
    }
    return dist;
  }

  updateDeviceToken(fcmToken) {
    firebase
      .firestore()
      .collection("users")
      .doc(firebase.auth().currentUser.uid)
      .update({
        fcmToken: fcmToken
      });
  }

  /*********** Notification Part **************/

  //1
  async checkPermission() {
    const enabled = await firebase.messaging().hasPermission();
    if (enabled) {
      this.getToken();
    } else {
      this.requestPermission();
    }
  }

  //3
  async getToken() {
    let fcmToken = await AsyncStorage.getItem("fcmToken");
    if (!fcmToken) {
      fcmToken = await firebase.messaging().getToken();
      if (fcmToken) {
        // user has a device token
        await AsyncStorage.setItem("fcmToken", fcmToken);
      }
    }

    if (fcmToken) {
      this.updateDeviceToken(fcmToken);
    }
  }

  //2
  async requestPermission() {
    try {
      await firebase.messaging().requestPermission();
      // User has authorised
      this.getToken();
    } catch (error) {
      // User has rejected permissions
      console.log("permission rejected");
    }
  }

  async createNotificationListeners() {
    /*
     * Triggered when a particular notification has been received in foreground
     * */
    this.notificationListener = firebase
      .notifications()
      .onNotification(notification => {
        this.showAlert(notification);
      });

    /*
     * If your app is in background, you can listen for when a notification is clicked / tapped / opened as follows:
     * */
    this.notificationOpenedListener = firebase
      .notifications()
      .onNotificationOpened(notificationOpen => {
        // this.showAlert(notificationOpen.notification);
      });

    /*
     * If your app is closed, you can check if it was opened by a notification being clicked / tapped / opened as follows:
     * */
    const notificationOpen = await firebase
      .notifications()
      .getInitialNotification();
    if (notificationOpen) {
      // this.showAlert(notificationOpen.notification);
    }
    /*
     * Triggered for data only payload in foreground
     * */
    this.messageListener = firebase.messaging().onMessage(message => {
      //process data message
      console.log(JSON.stringify(message));
    });
  }

  showAlert(notification) {
    Alert.alert(
      notification.title,
      notification.body,
      [{ text: "OK", onPress: () => console.log("OK") }],
      { cancelable: false }
    );
  }

  acceptAction() {
    const { booking_info, currentPosition } = this.state;

    let status = 1;
    let distance = this.calcDistance(
      currentPosition.latitude,
      currentPosition.longitude,
      booking_info.data().start_coordinates.latitude,
      booking_info.data().start_coordinates.longitude,
      "K"
    );

    if (distance < 0.5) {
      //500m
      status = 2;
    }

    firebase
      .firestore()
      .collection("bookings")
      .doc(booking_info.id)
      .update({
        status: status //Accept or Arrived
      });
  }

  getPassengerInfo(booking_info) {
    let self = this;

    if (booking_info) {
      firebase
        .firestore()
        .collection("users")
        .doc(booking_info.data().passenger_id)
        .get()
        .then(querySnapShot => {
          if (!this.isCancelled) {
            self.setState({
              passengerInfo: querySnapShot.data()
            });
          }
        });
    }
  }

  declineAction() {
    firebase
      .firestore()
      .collection("users")
      .doc(firebase.auth().currentUser.uid)
      .update({
        booking_id: ""
      });

    if (this.bookingSnapShotUnsubscribe) this.bookingSnapShotUnsubscribe();

    if (!this.isCancelled) {
      this.setState({
        booking_info: null,
        passengerInfo: null
      });
    }
  }

  startAction() {
    const { booking_info } = this.state;

    firebase
      .firestore()
      .collection("bookings")
      .doc(booking_info.id)
      .update({
        status: 3 //Start Tracking
      });
  }

  endAction() {
    const { booking_info } = this.state;

    firebase
      .firestore()
      .collection("bookings")
      .doc(booking_info.id)
      .update({
        status: 4 //End Tracking
      });

    this.calcFare();
  }

  calcFare() {
    const { booking_info } = this.state;

    const dummyNumbers = {
      baseFare: 0.4,
      timeRate: 0.14,
      distanceRate: 0.97,
      surge: 1
    };

    if (booking_info) {
      request
        .get("https://maps.googleapis.com/maps/api/distancematrix/json")
        .query({
          origins:
            booking_info.data().start_coordinates.latitude +
            "," +
            booking_info.data().start_coordinates.longitude,
          destinations:
            booking_info.data().current_coordinates.latitude +
            "," +
            booking_info.data().current_coordinates.longitude,
          mode: "driving",
          key: MAP_API_KEY
        })
        .finish((error, res) => {
          let distanceMatrix = res.body;
          const fare = calculateFare(
            dummyNumbers.baseFare,
            dummyNumbers.timeRate,
            distanceMatrix.rows[0].elements[0].duration.value,
            dummyNumbers.distanceRate,
            distanceMatrix.rows[0].elements[0].distance.value,
            dummyNumbers.surge
          );

          firebase
            .firestore()
            .collection("bookings")
            .doc(booking_info.id)
            .update({
              result: {
                fare: fare,
                origin: distanceMatrix.origin_addresses[0],
                destination: distanceMatrix.destination_addresses[0],
                distance: distanceMatrix.rows[0].elements[0].distance.text,
                duration: distanceMatrix.rows[0].elements[0].duration.text
              }
            });
        });
    }
  }

  payAction() {
    const { booking_info } = this.state;

    firebase
      .firestore()
      .collection("bookings")
      .doc(booking_info.id)
      .update({
        status: 5 //pay for Tracking
      });

    this.initializeBooking();
  }

  initializeBooking() {
    const { booking_info } = this.state;

    firebase
      .firestore()
      .collection("users")
      .doc(firebase.auth().currentUser.uid)
      .update({
        booking_id: ""
      });

    if (booking_info && booking_info.data().passenger_id !== "") {
      firebase
        .firestore()
        .collection("users")
        .doc(booking_info.data().passenger_id)
        .update({
          booking_id: ""
        });
    }

    if (this.bookingSnapShotUnsubscribe) this.bookingSnapShotUnsubscribe();
    if (!this.isCancelled) {
      this.setState({
        booking_info: null,
        passengerInfo: null
      });
    }
  }

  async logOutAction() {
    await firebase.auth().signOut();
    await AsyncStorage.clear();
    this.props.navigation.navigate("Auth");
  }

  render() {
    const {
      region,
      currentPosition,
      booking_info,
      passengerInfo,
      status
    } = this.state;

    return (
      <View style={styles.homeContainer}>
        <MapView
          provider={MapView.PROVIDER_GOOGLE}
          style={styles.map_view}
          showsUserLocation={true}          
          region={currentPosition}          
        >
          {currentPosition && (
            <Marker
              coordinate={currentPosition}
              // title={currentPosition.name}
              // description={currentPosition.address}
            >
              <Image
                source={DriverMarker}
                style={styles.map_marker}
                resizeMode="contain"
              />
            </Marker>
          )}

          {booking_info && booking_info.data().status === 3 && (
            <MapViewDirections
              origin={{
                latitude: booking_info.data().start_coordinates.latitude,
                longitude: booking_info.data().start_coordinates.longitude,
                latitudeDelta: LATITUDE_DELTA,
                longitudeDelta: LONGITUDE_DELTA
              }}
              destination={{
                latitude: booking_info.data().current_coordinates.latitude,
                longitude: booking_info.data().current_coordinates.longitude,
                latitudeDelta: LATITUDE_DELTA,
                longitudeDelta: LONGITUDE_DELTA
              }}
              apikey={MAP_API_KEY}
              strokeWidth={5}
              strokeColor={colors.green}
            />
          )}

          {booking_info && booking_info.data().status < 3 && passengerInfo && (
            <Marker
              coordinate={{
                latitude: booking_info.data().start_coordinates.latitude,
                longitude: booking_info.data().start_coordinates.longitude,
                latitudeDelta: LATITUDE_DELTA,
                longitudeDelta: LONGITUDE_DELTA
              }}
              title={passengerInfo.name}
              description={"Phone:" + passengerInfo.mobile}
            >
              <Image
                source={PeopleMarker}
                style={styles.normal_map_marker}
                resizeMode="contain"
              />
            </Marker>
          )}
        </MapView>

        <TouchableOpacity
          style={styles.btn_logout}
          onPress={() => this.logOutAction()}
        >
          <AntDesignIcon name="logout" size={24} color={"white"} />
        </TouchableOpacity>

        {booking_info &&
          booking_info.data().status === 0 &&
          firebase.auth().currentUser.uid === booking_info.data().driver_id && (
            <View style={styles.booking_container}>
              <TouchableOpacity
                style={styles.booking_btn}
                onPress={this.acceptAction}
              >
                <Text style={styles.booking_title}>Accept</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.booking_btn, { backgroundColor: colors.grey }]}
                onPress={this.declineAction}
              >
                <Text style={styles.booking_title}>Decline</Text>
              </TouchableOpacity>
            </View>
          )}

        {booking_info && booking_info.data().status === 2 && (
          <View style={styles.booking_container}>
            <TouchableOpacity
              style={styles.booking_btn}
              onPress={this.startAction}
            >
              <Text style={styles.booking_title}>Start Trip</Text>
            </TouchableOpacity>
          </View>
        )}

        {booking_info && booking_info.data().status === 3 && (
          <View style={styles.booking_container}>
            <TouchableOpacity
              style={styles.booking_btn}
              onPress={this.endAction}
            >
              <Text style={styles.booking_title}>End Trip</Text>
            </TouchableOpacity>
          </View>
        )}

        {booking_info &&
          booking_info.data().status === 4 &&
          booking_info.data().result && (
            <View
              style={[styles.booking_container, { flexDirection: "column" }]}
            >
              <View style={styles.result_view}>
                {booking_info.data().result.fare !== null && (
                  <Text style={styles.fare}>
                    {"Fare: " + booking_info.data().result.fare + " RM"}
                  </Text>
                )}
                {booking_info.data().result.origin && (
                  <Text style={styles.result_text}>
                    {"Origin Address : " + booking_info.data().result.origin}
                  </Text>
                )}
                {booking_info.data().result.destination && (
                  <Text style={styles.result_text}>
                    {"Destination Address : " +
                      booking_info.data().result.destination}
                  </Text>
                )}
                {booking_info.data().result.distance && (
                  <Text style={styles.result_text}>
                    {"Distance : " + booking_info.data().result.distance}
                  </Text>
                )}
                {booking_info.data().result.duration && (
                  <Text style={styles.result_text}>
                    {"Duration : " + booking_info.data().result.duration}
                  </Text>
                )}
              </View>

              <TouchableOpacity
                style={[styles.booking_btn, { flex: 0 }]}
                onPress={this.payAction}
              >
                <Text style={styles.booking_title}>Finish</Text>
              </TouchableOpacity>
            </View>
          )}
      </View>
    );
  }
}

export default DriverHomeScreen;

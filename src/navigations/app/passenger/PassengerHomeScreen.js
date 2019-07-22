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
  UserMarker,
  NormalMarker,
  CarMarker,
  MAP_API_KEY,
  DRIVER_TYPE,
  PASSENGER_TYPE,
  AvatarSample
} from "../../../utils/variables";
import { colors, fonts } from "../../../styles/styles";
import RNGooglePlaces from "react-native-google-places";
import MapViewDirections from "react-native-maps-directions";
import firebase from "react-native-firebase";
import AntDesignIcon from "react-native-vector-icons/AntDesign";
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
  search_btn: {
    width: "100%",
    height: 50,
    backgroundColor: "rgba(255,147,38,0.8)",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center"
  },
  search_title: {
    fontSize: fonts.mediumSize,
    color: "white"
  },
  search_icon: {
    height: 30,
    width: 30
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

  retry_container: {
    flexDirection: "row",
    width: "100%"
  },
  retry_btn: {
    flex: 1,
    height: 50,
    backgroundColor: colors.yellow,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center"
  },
  retry_title: {
    fontSize: fonts.mediumSize,
    color: "white"
  },
  fare: {
    width: "100%",
    height: 50,
    fontSize: 30,
    textAlign: "center",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.grey,
    color: "white"
  },
  driver_container: {
    backgroundColor: colors.grey,
    height: 120,
    width: "100%",
    padding: 10,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center"
  },
  avatar_image_container: {
    width: 100,
    height: 100,
    borderRadius: 50,
    overflow: "hidden",
    marginRight: 20
  },
  avatar_image: {
    width: "100%",
    height: "100%",
    resizeMode: "contain"
  },
  driver_info: {
    height: "100%",
    justifyContent: "center",
    alignItems: "flex-start",
    flexDirection: "column"
  },
  driver_body: {
    color: "white",
    fontSize: fonts.defualtSize
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

class PassengerHomeScreen extends Component {
  bookingSnapShotUnsubscribe = null;
  isCancelled = false;

  constructor(props) {
    super(props);
    this.state = {
      region: null,
      currentPosition: null,
      userInfo: null,
      destination: null,
      driverInfo: null,
      driverAvatarURL: "",
      booking_id: null,
      nearbyDrivers: [],
      status: -1,
      booking_info: null
    };

    this.logOutAction = this.logOutAction.bind(this);
    this.getNearByDrivers = this.getNearByDrivers.bind(this);
    this.updateCurrentLocation = this.updateCurrentLocation.bind(this);
    this.setDestination = this.setDestination.bind(this);
    this.getDriverInfo = this.getDriverInfo.bind(this);
    this.cancelAction = this.cancelAction.bind(this);
    this.findAction = this.findAction.bind(this);
    this.retryAction = this.retryAction.bind(this);
    this.bookingSnapShot = this.bookingSnapShot.bind(this);
    this.checkBooking = this.checkBooking.bind(this);
    this.sendRequestNotifications = this.sendRequestNotifications.bind(this);
    this.initializeBooking = this.initializeBooking.bind(this);
  }

  setDestination(placeID) {
    let self = this;
    // const placeID = this.props.navigation.getParam("destinationID", null);

    if (placeID) {
      RNGooglePlaces.lookUpPlaceByID(placeID)
        .then(results => {
          if (!this.isCancelled) {
            self.setState({
              destination: {
                latitude: results.latitude,
                longitude: results.longitude,
                latitudeDelta: LATITUDE_DELTA,
                longitudeDelta: LONGITUDE_DELTA,
                name: results.name,
                address: results.address
              }
            });
          }
          self.sendRequestNotifications();
        })
        .catch(error => console.log(error.message));
    }
  }

  sendRequestNotifications() {
    const { nearbyDrivers } = this.state;
    let self = this;

    firebase
      .firestore()
      .collection("bookings")
      .add({
        driver_id: nearbyDrivers[0].id,
        passenger_id: firebase.auth().currentUser.uid,
        status: 0
      })
      .then(function(docRef) {
        if (!this.isCancelled) {
          self.setState({
            booking_id: docRef.id
          });
        }
      })
      .catch(function(error) {
        console.error("Error writing document: ", error);
      });

      if (!this.isCancelled) {
        this.setState({
          status: 0
        });
      }
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

      this.updateUserLocation(position.coords);
      // this.getNearByDrivers();
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

  // componentDidMount() {
  //   this.getCurrentLocation();
  //   this.requestLocationPermission();
  //   // this.props.navigation.navigate("Auth");
  //   this.getUserInfo();
  // }

  // async requestLocationPermission() {
  //   let self = this;
  //   try {
  //     const granted = await PermissionsAndroid.request(
  //       PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
  //       {
  //         title: "Location Permission",
  //         message: "This app needs access to your location"
  //       }
  //     );
  //     if (granted === PermissionsAndroid.RESULTS.GRANTED) {
  //       console.log("You can use the location");
  //       RNGooglePlaces.getCurrentPlace()
  //         .then(results => {
  //           self.setState({
  //             currentPosition: {
  //               latitude: results[0].latitude,
  //               longitude: results[0].longitude,
  //               latitudeDelta: LATITUDE_DELTA,
  //               longitudeDelta: LONGITUDE_DELTA,
  //               name: results[0].name,
  //               address: results[0].address
  //             },
  //             region: {
  //               latitude: results[0].latitude,
  //               longitude: results[0].longitude,
  //               latitudeDelta: LATITUDE_DELTA,
  //               longitudeDelta: LONGITUDE_DELTA
  //             }
  //           });
  //           self.updateUserLocation();
  //           self.getNearByDrivers();
  //         })
  //         .catch(error => console.log(error.message));
  //     } else {
  //       console.log("Location permission denied");
  //     }
  //   } catch (err) {
  //     console.warn(err);
  //   }
  // }

  // getCurrentLocation() {
  //   let self = this;
  //   navigator.geolocation.getCurrentPosition(
  //     position => {
  //       self.setState({
  //         region: {
  //           latitude: position.coords.latitude,
  //           longitude: position.coords.longitude,
  //           latitudeDelta: LATITUDE_DELTA,
  //           longitudeDelta: LONGITUDE_DELTA
  //         },
  //         currentPosition: {
  //           latitude: position.coords.latitude,
  //           longitude: position.coords.longitude,
  //           latitudeDelta: LATITUDE_DELTA,
  //           longitudeDelta: LONGITUDE_DELTA,
  //           name: "name",
  //           address: "address"
  //         }
  //       });

  //       self.updateUserLocation();
  //       self.getNearByDrivers();
  //     },
  //     error => console.log(error.message),
  //     { enableHighAccuracy: true, timeout: 20000, maximumAge: 1000 }
  //   );
  // }

  getNearByDrivers() {
    const { currentPosition } = this.state;
    let self = this;

    if (currentPosition) {
      // ~1 mile of lat and lon in degrees
      let lat = 0.0144927536231884;
      let lon = 0.0181818181818182;

      let distance = 2; // 10 miles
      let lowerLat = currentPosition.latitude - lat * distance;
      let lowerLon = currentPosition.longitude - lon * distance;

      let greaterLat = currentPosition.latitude + lat * distance;
      let greaterLon = currentPosition.longitude + lon * distance;

      let lesserGeopoint = new firebase.firestore.GeoPoint(lowerLat, lowerLon);
      let greaterGeopoint = new firebase.firestore.GeoPoint(
        greaterLat,
        greaterLon
      );

      firebase
        .firestore()
        .collection("users")
        .where("coordinates", ">", lesserGeopoint)
        .where("coordinates", "<", greaterGeopoint)
        .onSnapshot(querySnapShot => {
          const drivers = [];
          querySnapShot.forEach(driver => {
            if (driver.data().type === DRIVER_TYPE) {
              let driverData1 = driver.data();
              let distance1 = self.distance(
                currentPosition.latitude,
                currentPosition.longitude,
                driverData1.coordinates.latitude,
                driverData1.coordinates.longitude,
                "K"
              );
              let isAdded = false;
              for (let index = 0; index < drivers.length; index++) {
                let driverData2 = drivers[index].data();
                distance2 = self.distance(
                  currentPosition.latitude,
                  currentPosition.longitude,
                  driverData2.coordinates.latitude,
                  driverData2.coordinates.longitude,
                  "K"
                );
                if (distance1 < distance2) {
                  isAdded = true;
                  drivers.splice(0, 0, driver);
                  break;
                }
              }

              if (!isAdded) {
                drivers.push(driver);
              }
            }
          });

          if (!this.isCancelled) {
            self.setState({
              nearbyDrivers: drivers
            });
          }
        });
    }
  }

  distance(lat1, lon1, lat2, lon2, unit) {
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

  getUserInfo() {
    let self = this;

    firebase
      .firestore()
      .collection("users")
      .doc(firebase.auth().currentUser.uid)
      .onSnapshot(querySnapShot => {
        if (!this.isCancelled) {
          self.setState({
            userInfo: querySnapShot.data()
          });
        }
      });
  }

  updateUserLocation(currentPosition) {
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

    if (
      booking_info &&
      (booking_info.data().status === 1 || booking_info.data().status === 2)
    ) {
      //Accept and Comming
      firebase
        .firestore()
        .collection("bookings")
        .doc(booking_info.id)
        .update({
          start_coordinates: new firebase.firestore.GeoPoint(
            currentPosition.latitude,
            currentPosition.longitude
          )
        });
    }
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
      [{ text: "OK", onPress: () => console.log("OK Pressed") }],
      { cancelable: false }
    );
  }

  // getDriverInfo(notification) {
  //   let self = this;

  //   firebase
  //     .firestore()
  //     .collection("users")
  //     .doc(notification.data.driver_id)
  //     .onSnapshot(querySnapShot => {
  //       self.setState({
  //         nearbyDrivers: null,
  //         driverInfo: querySnapShot.data()
  //       });
  //     });
  // }

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
            this.setState({ booking_info: null, driverInfo: null });
          }
        }
      });
  }

  findAction() {
    const { currentPosition } = this.state;
    let self = this;

    firebase
      .firestore()
      .collection("bookings")
      .add({
        passenger_id: firebase.auth().currentUser.uid,
        start_coordinates: new firebase.firestore.GeoPoint(
          currentPosition.latitude,
          currentPosition.longitude
        ),
        driver_id: "",
        dest_coordinates: new firebase.firestore.GeoPoint(
          currentPosition.latitude,
          currentPosition.longitude
        ),
        current_coordinates: new firebase.firestore.GeoPoint(
          currentPosition.latitude,
          currentPosition.longitude
        ),
        decline_list: [],
        status: 0
      })
      .then(function(docRef) {
        firebase
          .firestore()
          .collection("users")
          .doc(firebase.auth().currentUser.uid)
          .update({
            booking_id: docRef.id
          });

        // self.bookingSnapShot(docRef.id);
      })
      .catch(function(error) {
        console.error("Error writing document: ", error);
      });

      if (!this.isCancelled) {
        this.setState({
          status: 0
        });
      }
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
          if
            (querySnapShot.data().status > 0 && querySnapShot.data().status < 4)
          {
            self.getDriverInfo(querySnapShot);
          }

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

  getDriverInfo(booking_info) {
    let self = this;

    firebase
      .firestore()
      .collection("users")
      .doc(booking_info.data().driver_id)
      .get()
      .then(async querySnapShot => {
        if (!this.isCancelled) {
          self.setState({
            driverInfo: querySnapShot.data()
          });
        }

        let downloadURL = await firebase
          .storage()
          .ref("/profile/" + querySnapShot.data().avatar_name)
          .getDownloadURL();

          if (!this.isCancelled) {
            self.setState({
              driverAvatarURL: downloadURL
            });
          }
      });
  }

  retryAction() {
    const { userInfo } = this.state;

    let booking_id = userInfo.data().booking_id;

    if (booking_id !== "") {
      firebase
        .firestore()
        .collection("bookings")
        .doc(booking_id)
        .update({
          status: 0,
          decline_list: [],
          driver_id: ""
        });
    }
  }

  cancelAction() {
    const { booking_info } = this.state;

    if (booking_info) {
      // firebase
      //   .firestore()
      //   .collection("bookings")
      //   .doc(booking_info.id)
      //   .delete()
      //   .then(() => {
      //     console.log("Document successfully deleted!")
      //   })
      //   .catch(error => {
      //     console.log(error)
      //   })

      firebase
        .firestore()
        .collection("bookings")
        .doc(booking_info.id)
        .update({
          status: -2,
          driver_id: ""
        });
    }

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

    if (booking_info && booking_info.data().driver_id !== "") {
      firebase
        .firestore()
        .collection("users")
        .doc(booking_info.data().driver_id)
        .update({
          booking_id: ""
        });
    }

    if (this.bookingSnapShotUnsubscribe) this.bookingSnapShotUnsubscribe();

    if (!this.isCancelled) {
      this.setState({
        booking_info: null,
        driverInfo: null
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
      destination,
      currentPosition,
      nearbyDrivers,
      driverInfo,
      status,
      booking_info,
      driverAvatarURL
    } = this.state;

    console.log("download=", driverAvatarURL);

    return (
      <View style={styles.homeContainer}>
        <MapView
          provider={MapView.PROVIDER_GOOGLE}
          style={styles.map_view}
          showsUserLocation={true}          
          region={currentPosition}          
        >
          {currentPosition && (
            <Marker coordinate={currentPosition}>
              <Image
                source={UserMarker}
                style={styles.map_marker}
                resizeMode="contain"
              />
            </Marker>
          )}

          {destination && (
            <Marker
              coordinate={destination}
              title={destination.name}
              description={destination.address}
            >
              <Image
                source={NormalMarker}
                style={styles.normal_map_marker}
                resizeMode="contain"
              />
            </Marker>
          )}

          {currentPosition && destination && (
            <MapViewDirections
              origin={currentPosition}
              destination={destination}
              apikey={MAP_API_KEY}
              strokeWidth={5}
              strokeColor={colors.green}
            />
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

          {/* {nearbyDrivers &&
            nearbyDrivers.map((driver, index) => (
              <Marker
                key={index}
                coordinate={{
                  latitude: driver.data().coordinates.latitude,
                  longitude: driver.data().coordinates.longitude,
                  latitudeDelta: LATITUDE_DELTA,
                  longitudeDelta: LONGITUDE_DELTA
                }}
                title={driver.data().name}
                description={"Phone:" + driver.data().mobile}
              >
                <Image
                  source={CarMarker}
                  style={styles.normal_map_marker}
                  resizeMode="contain"
                />
              </Marker>
            ))} */}

          {booking_info &&
            booking_info.data().status > 0 &&
            booking_info.data().status < 3 &&
            driverInfo && (
              <Marker
                coordinate={{
                  latitude: booking_info.data().current_coordinates.latitude,
                  longitude: booking_info.data().current_coordinates.longitude,
                  latitudeDelta: LATITUDE_DELTA,
                  longitudeDelta: LONGITUDE_DELTA
                }}
                title={driverInfo.name}
                description={"Phone:" + driverInfo.mobile}
              >
                <Image
                  source={CarMarker}
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

        {booking_info && booking_info.data().status === -1 && (
          <View style={styles.retry_container}>
            <TouchableOpacity
              style={styles.retry_btn}
              onPress={this.retryAction}
            >
              <Text style={styles.retry_title}>Retry</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.retry_btn, { backgroundColor: colors.grey }]}
              onPress={this.cancelAction}
            >
              <Text style={styles.retry_title}>Cancel</Text>
            </TouchableOpacity>
          </View>
        )}

        {booking_info && booking_info.data().status === 0 && (
          <TouchableOpacity
            style={[styles.search_btn, { backgroundColor: colors.grey }]}
            onPress={this.cancelAction}
          >
            <Text style={styles.search_title}>Cancel</Text>
          </TouchableOpacity>
        )}

        {booking_info &&
          booking_info.data().status > 0 &&
          booking_info.data().status < 4 &&
          driverInfo && (
            <View style={styles.driver_container}>
              <View style={styles.avatar_image_container}>
                <Image
                  source={
                    driverAvatarURL !== ""
                      ? { uri: driverAvatarURL }
                      : AvatarSample
                  }
                  style={styles.avatar_image}
                />
              </View>
              <View style={styles.driver_info}>
                <Text style={styles.driver_body}>
                  {"Name: " + driverInfo.name}
                </Text>
                <Text style={styles.driver_body}>
                  {"Mobile: " + driverInfo.mobile}
                </Text>
                <Text style={styles.driver_body}>
                  {"Vehicle: " +
                    driverInfo.vehicle.model +
                    ", " +
                    driverInfo.vehicle.color +
                    ", " +
                    driverInfo.vehicle.plateNumber}
                </Text>
              </View>
            </View>
          )}

        {booking_info &&
          booking_info.data().status === 4 &&
          booking_info.data().result && (
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
          )}

        {/* {booking_info && (
          <View style={{ backgroundColor:'white', flexDirection:'column', width:'100%', alignSelf:'flex-end', justifyContent:'center', alignItems:'center'}}>
            <Text>{"id=" + booking_info.id}</Text>
            <Text>{"passenger=" + booking_info.data().passenger_id}</Text>
            <Text>{"driver=" + booking_info.data().driver_id}</Text>
            <Text>
              {"location=" + booking_info.data().start_coordinates.latitude +
                "," +
                booking_info.data().start_coordinates.longitude}
            </Text>
            <Text>{"status=" + booking_info.data().status}</Text>
          </View>
        )} */}

        {!booking_info && (
          <TouchableOpacity style={styles.search_btn} onPress={this.findAction}>
            <Text style={styles.search_title}>Find Driver</Text>
          </TouchableOpacity>
        )}

        {/* {{status === 0 && (
          <TouchableOpacity
            style={styles.search_btn}
            onPress={this.cancelAction}
          >
            <Text style={styles.search_title}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.search_btn}
            onPress={() =>
              this.props.navigation.navigate("Search", {
                setDestination: this.setDestination
              })
            }
          >
            <Text style={styles.search_title}>Search</Text>
            <Image
              source={NormalMarker}
              style={styles.search_icon}
              resizeMode="contain"
            />
            <Text style={styles.search_title}>destination</Text>
          </TouchableOpacity>
        )} */}
      </View>
    );
  }
}

export default PassengerHomeScreen;

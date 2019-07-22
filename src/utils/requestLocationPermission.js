import {
  PermissionsAndroid,
  Platform
} from "react-native";

export default async function requestLocationPermission() 
{
  if (Platform.OS === "android") {
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        {
          'title': 'Taxikini App',
          'message': 'Taxikini App access to your location '
        }
      )
      if (granted === PermissionsAndroid.RESULTS.GRANTED) {
        console.log("You can use the location")
        // alert("You can use the location");
      } else {
        console.log("location permission denied")
        // alert("Location permission denied");
      }
    } catch (err) {
      console.warn(err)
    }
  }
}
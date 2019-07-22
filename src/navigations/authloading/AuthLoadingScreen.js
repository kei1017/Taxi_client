import React from "react";
import { MainScreen } from "../../components";
import { ActivityIndicator, AsyncStorage } from "react-native";
import { PASSENGER_TYPE } from "../../utils/variables";

class AuthLoadingScreen extends React.Component {
  constructor(props) {
    super(props);
    this._bootstrapAsync();
  }

  _bootstrapAsync = async () => {    
    const userInfo = await AsyncStorage.getItem('userInfo');        
    if (userInfo) {
      let userObj = JSON.parse(userInfo);      
      this.props.navigation.navigate(userObj.type === PASSENGER_TYPE ? 'Passenger' : 'Driver');
    }
    else 
      this.props.navigation.navigate('Auth');
  };

  render() {
    return (
      <MainScreen>
        <ActivityIndicator size="large" />
      </MainScreen>
    );
  }
}

export default AuthLoadingScreen;

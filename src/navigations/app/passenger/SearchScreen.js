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
  Input,
  ScrollView,
  FlatList
} from "react-native";
import { NormalMarker } from "../../../utils/variables";
import { colors, fonts } from "../../../styles/styles";
import { ListItem, Left, Body } from "native-base";
import RNGooglePlaces from "react-native-google-places";
import Icon from "react-native-vector-icons/MaterialIcons";

const styles = StyleSheet.create({
  searchContainer: {
    flex: 1,
    justifyContent: "flex-start",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    flexDirection: "column"
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

  destination_wrapper: {
    width: "100%",
    height: 40,
    marginTop: 2,
    backgroundColor: "rgba(255,147,38,0.2)",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },
  input_search_icon: {
    height: 20,
    width: 20,
    marginLeft: 20,
    marginRight: 10
  },
  destination_input: {
    flex: 1,
    color: colors.yellow,
    fontSize: fonts.defualtSize
  },

  search_result_wrapper: {
    marginTop: 10,
    width: "100%",
    flex: 1
  },
  primaryText: {
    fontWeight: "bold",
    color: "#373737"
  },
  secondaryText: {
    fontStyle: "italic",
    color: "#7D7D7D"
  },
  leftContainer: {
    flexWrap: "wrap",
    alignItems: "flex-start",
    borderLeftColor: "#7D7D7D"
  },
  leftIcon: {
    fontSize: 20,
    color: "#7D7D7D"
  },
  distance: {
    fontSize: 12
  }
});

class SearchScreen extends Component {
  constructor(props) {
    super(props);
    this.state = {
      destination: "",
      predictions: []
    };
    this.onChangeDestination = this.onChangeDestination.bind(this);
    this.onPressDestination = this.onPressDestination.bind(this);
    this.onBack = this.onBack.bind(this);
  }

  componentWillMount() {}

  onPressDestination(item) {
    let self = this;

    RNGooglePlaces.lookUpPlaceByID(item.placeID)
      .then(results => {        
        self.setState({
          destination: results.name
        });
      })
      .catch(error => console.log(error.message));
  }

  onChangeDestination(value) {
    let self = this;
    this.setState({
      destination: value
    });

    RNGooglePlaces.getAutocompletePredictions(value, {
      country: "KH"
    })
      .then(results =>
        self.setState({
          predictions: results
        })
      )
      .catch(error => console.log(error.message));
  }

  onBack(item) {
    this.props.navigation.state.params.setDestination(item.placeID);
    this.props.navigation.goBack();
  }

  render() {
    const { predictions } = this.state;

    return (
      <View style={styles.searchContainer}>
        <TouchableOpacity
          style={styles.search_btn}
          onPress={() => this.props.navigation.goBack()}
        >
          <Text style={styles.search_title}>Search</Text>
          <Image
            source={NormalMarker}
            style={styles.search_icon}
            resizeMode="contain"
          />
          <Text style={styles.search_title}>destination</Text>
        </TouchableOpacity>

        <View style={styles.destination_wrapper}>
          <Image
            source={NormalMarker}
            style={styles.input_search_icon}
            resizeMode="contain"
          />
          <TextInput
            style={styles.destination_input}
            placeholderTextColor={colors.yellow}
            placeholder="Enter destination..."
            onChangeText={value => this.onChangeDestination(value)}
            value={this.state.destination}
          />
        </View>

        <View style={styles.search_result_wrapper}>
          <ScrollView>
            {predictions.map((item, index) => (
              <ListItem
                key={index}
                onPress={() => this.onBack(item)}
                button
                avatar
              >
                <Left style={styles.leftContainer}>
                  <Icon style={styles.leftIcon} name="location-on" />
                </Left>
                <Body>
                  <Text style={styles.primaryText}>{item.primaryText}</Text>
                  <Text style={styles.secondaryText}>{item.secondaryText}</Text>
                </Body>
              </ListItem>
            ))}
          </ScrollView>
        </View>
      </View>
    );
  }
}

export default SearchScreen;

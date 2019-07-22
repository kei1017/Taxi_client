import { StyleSheet, Dimensions, Platform } from "react-native";
const { width, height } = Dimensions.get("window");

export const colors = {
  yellow: "#ff9326",
  grey: "#464646",
  green: "#229781",
  placeholderColor: '#888'
};

export const fonts = {
  defualtSize: 15,
  titleSize: 20,
  largeSize: 30,
  mediumSize: 18,
  smallSize: 12,
  minSize: 10
};

export default (gloabalStyles = StyleSheet.create({
  pageBackground: {    
    width: "100%",
    height: "100%"
  },

  map_view: {
    position: "absolute",
    top: 0,
    left: 0,
    bottom: 0,
    right: 0
  },

  mainContainer: {
    width: "100%",
    height: "100%",
    justifyContent:'center'
  },

  scroll_container: {
    flexGrow: 1,
    justifyContent: "center",    
  },

  scroll_container_wrapper : {
    backgroundColor: 'rgba(0,0,0,0.3)',
    width: "100%",
    height: "100%",    
  },

  content_bg : {
    width: "100%",
    height: "100%",
    justifyContent:'center'    
  },
  
  content_container: {
    width: "70%",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "white",
    alignSelf: "center",
    borderRadius: 20
  },
  top_bar: {
    width: "100%",
    borderRadius: 20,
    height: 40,
    backgroundColor: colors.yellow,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",    
  },
  back_button: {    
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center"
  },
  top_bar_title: {
    fontSize: fonts.defualtSize,
    color: "white",    
    position: "absolute",
    width: "100%",   
    textAlign:'center',
  },
  type_container: {
    width: '80%',
    flexDirection:'row',
    justifyContent:'space-between',
    borderRadius:15,
    overflow: 'hidden',
    marginBottom: 10,
  },
  type_button: {
    height: 30,        
    flex:1,  
    backgroundColor: colors.yellow,    
    justifyContent:'center',
    alignItems:'center',        
  },

  content_body: {
    width: "100%",
    maxHeight: "80%",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
    marginBottom: 20,
  },
  avatar_image: {
    width: 100,
    height: 100,    
    resizeMode: "contain",    
    marginBottom: 20,    
  },
  driver_license_image: {
    position:'relative',
    width: '80%',
    height: 200,    
    resizeMode: "contain",    
    marginBottom: 20,    
  },
  taxi_status_text: {
    fontSize: fonts.largeSize,
    color: colors.yellow,    
    margin: 20,    
    marginTop: 0,
    textAlign: "center",
    fontWeight: "bold"
  },
  inputs: {
    height: 30,    
    borderRadius: 30,
    width: '80%',
    fontSize: fonts.defualtSize,
    backgroundColor: colors.grey,
    color: 'white',
    padding: 0,
    paddingLeft: 10,
    paddingRight: 10,
    textAlign:'center',
    marginBottom: 10,
  },
  button: {
    height: 30,    
    borderRadius: 30,
    width: '80%',    
    backgroundColor: colors.yellow,    
    justifyContent:'center',
    alignItems:'center',    
    marginBottom: 10,
  },
  button_text:{
    textAlign:'center',
    fontSize: fonts.defualtSize,
    color: 'white',
  }

}));

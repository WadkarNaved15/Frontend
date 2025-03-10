const React = require('react');
const { useState, useEffect, useRef,useContext } = React;
const { 
    StyleSheet, View, Image, TouchableOpacity, 
    Text, Modal, Animated, Button, ActivityIndicator, 
    Platform, PermissionsAndroid ,Alert,Linking
} = require('react-native');
const { Dimensions } = require('react-native');
const MapView = require('react-native-maps').default;
const { PROVIDER_GOOGLE } = require('react-native-maps');
const { Marker } = require('react-native-maps');
const Geolocation = require('react-native-geolocation-service').default;
const Footer = require('../Components/Footer');
const apiCall = require('../functions/axios');
const { getToken, deleteToken } = require('../functions/secureStorage');
const { decodeToken } = require('../functions/token');
const { launchImageLibrary, launchCamera } = require('react-native-image-picker');
const { check, request, PERMISSIONS, RESULTS } = require('react-native-permissions');
const {ProfileDrawer} = require('../Components/ProfileDrawer');
const Keychain = require('react-native-keychain');
var GetLocation = require('react-native-get-location').default;
const RNAndroidLocationEnabler = require('react-native-android-location-enabler');
const { UserContext } = require('../Context/User');


  
 function Home({ navigation }) {
    const {logout} = useContext(UserContext);
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [location, setLocation] = useState({ latitude: 19.059956, longitude: 72.8767162});
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isModalVisible, setModalVisible] = useState(false);
    const [selectedImage, setSelectedImage] = useState(null);
    const [errorMsg, setErrorMsg] = useState(null);
    const [retryCount, setRetryCount] = useState(0);
    const displayEmergency = user?.gender === 'Female';
    const maxRetryCount = 3;
    const defaultMaleImage = require('./../assets/male.png');
    const defaultFemaleImage = require('./../assets/female.png');
    
  console.log("backend uri",process.env.BACKEND_URI);
    const slideAnim = useRef(new Animated.Value(Dimensions.get('window').width)).current; 
    // useEffect(() => {
    //   fetchLocation();
    // }, [retryCount]);
  
    const getUser = async () => {
      setLoading(true);
      const accessToken = await getToken('accessToken'); 
      if (accessToken) {
          const decodedToken = decodeToken(accessToken);
          if (decodedToken) {
              setUser(decodedToken);
          }
      }
      setLoading(false);
  };
  


  async function checkAndRequestLocationPermission() {
    try {
      const isGPSEnabled = await RNAndroidLocationEnabler.promptForEnableLocationIfNeeded({
        interval: 10000,
        fastInterval: 5000,
      });
  
      if (!isGPSEnabled) {
        Alert.alert("⚠ GPS Required", "Please enable GPS to continue.");
        return;
      }
  
      const granted = await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
        PermissionsAndroid.PERMISSIONS.ACCESS_BACKGROUND_LOCATION, // Required for background access
      ]);
  
      if (
        granted["android.permission.ACCESS_FINE_LOCATION"] === "granted" &&
        granted["android.permission.ACCESS_COARSE_LOCATION"] === "granted"
      ) {
        fetchLocation(); // Automatically fetch location after permission is granted
      } else {
        Alert.alert("⚠ Location Permission Denied", "Enable it in settings.", [
          { text: "Open Settings", onPress: () => Linking.openSettings() },
          { text: "Cancel", style: "cancel" },
        ]);
      }
    } catch (error) {
      console.error("❌ Permission Error:", error);
      Alert.alert("Error", "Something went wrong while requesting permissions.");
    }
  }
  
  async function fetchLocation() {
    try {
      const location = await GetLocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 15000,
      });
  
      console.log("📍 Location:", location);
      setLocation(location); 
      await updateRedisLocation();
    } catch (error) {
      console.error("❌ Error fetching location:", error);
  
      if (error.code === "CANCELLED") {
        Alert.alert("⚠ Location Error", "Location request was cancelled.");
        return;
      }
  
      if (error.code === "UNAVAILABLE") {
        Alert.alert(
          "⚠ GPS is Off",
          "Please turn on GPS to get your location.",
          [
            { text: "Turn On GPS", onPress: checkAndRequestLocationPermission },
            { text: "Cancel", style: "cancel" },
          ]
        );
        return;
      }
  
      if (retryCount < maxRetryCount) {
        retryCount++;
        console.log(`🔄 Retrying... Attempt ${retryCount}`);
        setTimeout(fetchLocation, 2000); // Retry after 2 seconds
      } else {
        Alert.alert("⚠ Location Error", "Max retries reached. Please check GPS and try again.");
      }
    }
  }


  async function updateRedisLocation() {
    try {
      apiCall({
        method: "PUT",
        url: "/location/update-location",
        data: { latitude: location.latitude, longitude: location.longitude },
      });
    } catch (error) {
      console.error("Error updating Redis location:", error);
    }
  }
    
    // Call requestLocationPermission automatically on component mount
    useEffect(() => {
      getUser();
      checkAndRequestLocationPermission();
    }, []);
    
    // Image Picker
    const pickImage = () => {
        launchImageLibrary({ mediaType: 'photo', quality: 1 }, (response) => {
            if (response.didCancel) {
                console.log('User cancelled image picker');
            } else if (response.errorMessage) {
                Alert.alert('Error', response.errorMessage);
            } else {
                setSelectedImage(response.assets[0].uri);
            }
        });
    };

    // Upload Image
    const uploadImage = async () => {
        if (!selectedImage) {
            Alert.alert("Please select an image first!");
            return;
        }

        const formData = new FormData();
        formData.append('image', {
            uri: selectedImage,
            type: 'image/jpeg',
            name: 'photo.jpg',
        });

        try {
            const response = await fetch('https://your-api-url/upload', { // Replace with actual API
                method: 'POST',
                body: formData,
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            const responseData = await response.json();
            if (response.ok) {
                Alert.alert('Success', 'Image uploaded successfully!');
            } else {
                Alert.alert('Upload failed', responseData.message);
            }
        } catch (error) {
            Alert.alert('Error uploading image', error.message);
        }
    };

    // Toggle Slide Menu
    const toggleMenu = () => {
        if (isMenuOpen) {
            Animated.timing(slideAnim, {
                toValue: Dimensions.get('window').width,
                duration: 300,
                useNativeDriver: true,
            }).start(() => setIsMenuOpen(false));
        } else {
            setIsMenuOpen(true);
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 300,
                useNativeDriver: true,
            }).start();
        }
    };



    // Logout Function
    const handleLogout = async () => {
       await logout();
        navigation.navigate('Login');
    };


    const region = {
        latitude: location.latitude,
        longitude: location.longitude,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
    }


    if (loading || !user) {
        return (
            <View style={styles.loaderContainer}>
                <ActivityIndicator size="large" color="#0000ff" />
                <Text>Loading...</Text>
            </View>
        );
      }

    return (    <View style={styles.container}>
        {/* Hamburger Icon */}
        <TouchableOpacity activeOpacity={0.7} style={styles.profileIcon} onPress={toggleMenu}>
          <View style={styles.hamburgerCircle}>
            <Image
              source={require('./../assets/download-removebg-preview.png')}
              style={styles.hamburgerImage}
            />
          </View>
        </TouchableOpacity>
  
        {/* Profile Drawer */}
        <ProfileDrawer
          isMenuOpen={isMenuOpen}
          slideAnim={slideAnim}
          toggleMenu={toggleMenu}
          user={user}
          pickImage={pickImage}
          navigation={navigation}
          handleLogout={handleLogout}
        />
  
        {/* Map Section */}
        {location ? (
        <MapView
          provider={PROVIDER_GOOGLE}
          style={styles.map}
          region={region}
        >
          <Marker
            coordinate={{
              latitude: location.latitude,
              longitude: location.longitude,
            }}
            anchor={{ x: 0.5, y: 0.5 }}
          >
            <View style={styles.markerContainer}>
              <View style={styles.imageContainer}>
              <Image
                source={user.profileImage ? { uri: user.profileImage } : (user.gender === 'Male' ? defaultMaleImage : defaultFemaleImage)}
                style={styles.userImage}
            />
              </View>
              <View style={styles.markerPin} />
            </View>
          </Marker>
        </MapView>
      ) : (
        <View style={styles.errorContainer}>
          <Text style={styles.errorMessage}>{errorMsg}</Text>
          <Button title="Retry" onPress={retryFetchingLocation} />
        </View>
      )}
  
        {/* Footer */}
        <Footer display={displayEmergency} latitude={location?.latitude} longitude={location?.longitude} user={user} page="Home" />
      </View>
    );
  };

;
  const styles = StyleSheet.create({
    container: {
      flex: 1,
    },
    map: {
      width: Dimensions.get('window').width,
      height:  Dimensions.get('window').height,
    },
    profileIcon: {
      position: 'absolute',
      top: 40,
      right: 20,
      zIndex: 10, // Ensures it's always above the map
    },
    hamburgerImage: {
      width: 25,
      height: 25,
    },
    markerContainer: {
      height:70,
      width:70,
      borderRadius:35,
      alignItems: 'center',
    },
    imageContainer: {
      width: 70,
      height: 70,
      borderRadius: 35, // Make the image circular
      // overflow: 'hidden',
      // borderWidth:3,
      // borderColor: '#fff', // Add a white border around the image
    },
    userImage: {
      width: '50%',
      height: '50%',
    },
    markerPin: {
      width: 10,
      height: 10,
      backgroundColor: '#7157E4', // Color of the pin
      borderRadius: 5,
      marginTop: -10,
      
    },
    // footer: {
    //   height: 80,
    //   backgroundColor: '#E8E8E8',
    //   flexDirection: 'row',
    //   justifyContent: 'space-around',
    //   alignItems: 'center',
    //   borderTopWidth: 1,
    //   borderColor: '#ddd',
    //   position: 'absolute',
    //   bottom: 0,
    //   width: '100%',
    // },
    // iconContainer: {
    //   alignItems: 'center',
    // },
    hamburgerCircle: {
      width: 40,
      height: 40,
      borderRadius: 20,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#D7D0FF',
    },
    // circle: {
    //   width: 50,
    //   height: 50,
    //   backgroundColor: '#D7D0FF',
    //   borderRadius: 25,
    //   justifyContent: 'center',
    //   alignItems: 'center',
    // },
    // activeCircle: {
    //   backgroundColor: '#FFEDC0', 
    //   borderColor: '#FFEDC0', 
    // },
    // iconImage: {
    //   width: 25,
    //   height: 25,
    //   resizeMode: 'contain',
    // },
    // emergencyButton: {
    //   position: 'absolute',
    //   bottom: 100, // Place above the footer
    //   left: '50%', // Center horizontally
    //   marginLeft: -40, // Half of button width (80 px) to center it
    //   backgroundColor: '#7157E4', // Red color for emergency
    //   width: 90,
    //   height: 90,
    //   borderRadius: 45, // Circular button
    //   justifyContent: 'center',
    //   alignItems: 'center',
    //   zIndex: 10, // Ensure it’s above other components
    //   shadowColor: '#000',
    //   shadowOffset: { width: 0, height: 2 },
    //   shadowOpacity: 0.3,
    //   shadowRadius: 4,
    // },
    // emergencyButtonInner: {
    //   width: 80,
    //   height: 80,
    //   borderRadius: 40,
    //   justifyContent: 'center',
    //   alignItems: 'center',
    //   backgroundColor: '#FF0000',
    //   zIndex: 11,
    // },
    // emergencyIcon: {
    //   width: 50,
    //   height: 50,
    // },
    // emergencyOverlay: {
    //   ...StyleSheet.absoluteFillObject, // Cover the entire screen
    //   backgroundColor: 'rgba(0, 0, 0, 0.4)', // Semi-transparent black
    // },
    // drawerRight: {
    //   width: 250,
    //   backgroundColor: '#F1F1F1',
    //   height: '100%',
    //   position: 'absolute',
    //   right: 0, // Align the drawer to the right
    // },
    // overlay: {
    //   flex: 1, // Cover the entire screen
    //   justifyContent: 'flex-start',
    //   backgroundColor: 'rgba(0,0,0,0.5)', // Semi-transparent black background
    // },  
    // menuItem: {
    //   fontSize: 18,
    //   padding: 20,
    //   borderTopWidth: 1,
    //   flexDirection: 'row',
    // },
    // menuItemText: {
    //   marginLeft: 10,
    //   alignSelf: 'center',
    //   flexWrap: 'wrap',
    //   flexShrink: 1,
    //   flexGrow: 1,
    // },
    // closeButton: {
    //   width: 40, 
    //   height: 40, 
    //   justifyContent: 'center', 
    //   alignItems: 'center', 
    //   position: 'absolute', 
    //   top: 10,
    //   left: 10, 
    //   borderRadius: 20,
    // },
    // closeButtonText: {
    //   fontSize: 24,
    //   fontWeight: 'bold',
    //   color: '#000',
    // },
    // profileContainer: {
    //   padding: 20,
    //   alignItems: 'center',
    //   marginTop: 20,
    // },
    // profileImageOuterContainer: {
    //   height: 120,
    //   width: 120,
    //   borderRadius: 60,
    //   backgroundColor: '#7157E4',
    //   alignItems: 'center',
    //   justifyContent: 'center',
    // },
    // profileImageInnerContainer: {
    //   height: 105,
    //   width: 105,
    //   borderRadius: 52.5,
    //   borderWidth: 2.5,
    //   borderColor: '#000',
    //   alignItems: 'center',
    //   justifyContent: 'center',
    // },
    // profileImage: {
    //   width: 105,
    //   height: 105,
    //   borderRadius: 52.5,
    //   resizeMode: 'cover',
    // },
    // profileName: {
    //   fontSize: 16,
    //   fontWeight: 'bold',
    //   marginTop: 10,
    // },
    // profilePhoneNumber: {
    //   fontSize: 14,
    //   fontWeight: '500',
    //   marginTop: 5,
    // },
    errorContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    errorMessage: {
      fontSize: 16,
      color: 'red',
      marginBottom: 10,
    },
    // editImageContainer: {
    //   position: 'absolute',
    //   top: 90,
    //   right: 15,
    //   alignItems: 'center',
    //   justifyContent: 'center',
    //   backgroundColor: '#fff',
    //   width: 25,
    //   height: 25,
    //   borderRadius: 12.5,
    // },
    // editImage: {
    //   width: 17,
    //   height: 17,
    //   resizeMode: 'contain',
    //   tintColor: 'red',
    // },
    loaderContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
  });
  
module.exports = Home
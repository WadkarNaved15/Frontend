const React = require('react');
const { useEffect } = require('react');
const { View, Text, TouchableOpacity, StyleSheet, Alert, BackHandler } = require('react-native');

 function EmergencyPage({ navigation }) {
  useEffect(() => {
    const backAction = () => {
      Alert.alert(
        "Back Navigation Disabled",
        "Please use the on-screen button to navigate.",
        [{ text: "OK" }]
      );
      return true;
    };

    const backHandler = BackHandler.addEventListener("hardwareBackPress", backAction);

    return () => backHandler.remove();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Emergency Signal Initiated</Text>
      <View style={styles.messageContainer}>
        <Text style={styles.message}>
          An Emergency SOS signal was sent to the nearby verified users and local emergency services!
        </Text>
      </View>
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.continueButton}
          onPress={() => navigation.navigate('Home')}
        >
          <Text style={styles.buttonText}>Continue</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => navigation.navigate('Home')}
        >
          <Text style={styles.buttonText}>Cancel the call</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#7157E4',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginVertical: 40,
    color: '#8B0000',
  },
  messageContainer: {
    marginVertical: 40,
    backgroundColor: '#EAD0FF',
    padding: 20,
    borderRadius: 20,
  },
  message: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  buttonContainer: {
    width: '100%',
    alignItems: 'center',
  },
  continueButton: {
    backgroundColor: '#EAD0FF',
    padding: 15,
    borderRadius: 10,
    marginVertical: 20,
    alignItems: 'center',
  },  
  cancelButton: {
    backgroundColor: '#FF3974',
    padding: 15,
    borderRadius: 10,
    marginVertical: 20,
    alignItems: 'center',
  },
  buttonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

module.exports = EmergencyPage;
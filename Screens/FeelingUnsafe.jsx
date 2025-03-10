const React = require("react");
const { useState, useEffect } = require("react");
const { View, Text, TouchableOpacity, Alert, StyleSheet,Platform,NativeModules } = require("react-native");
const { Picker } = require("@react-native-picker/picker");
const { useNavigation } = require("@react-navigation/native");
const Footer = require("../Components/Footer");
const apiCall = require("../functions/axios");
const AudioRecord = require("react-native-audio-record").default;
const { startBackgroundService, stopBackgroundService, getSocket } = require("../services/socketService");

const FeelingUnsafe = () => {
  const [period, setPeriod] = useState(null);
  const [isActive, setIsActive] = useState(false);
  const navigation = useNavigation();
  let audioListener = null;



  function getBestAudioSource() {
    if (Platform.OS === 'android' && NativeModules.AudioRecord) {
      try {
        // Attempt to use VOICE_RECOGNITION (6)
        AudioRecord.init({
          sampleRate: 16000,
          channels: 1,
          bitsPerSample: 16,
          audioSource: 6, // Try VOICE_RECOGNITION first
        });
        console.log("✅ Using VOICE_RECOGNITION (6)");
        return 6;
      } catch (error) {
        console.warn("⚠️ VOICE_RECOGNITION not supported, falling back to MIC (1)");
      }
    }
    return 1; // Default to MIC
  }

  useEffect(() => {
    // Fetch status on component mount
    apiCall({
      method: "GET",
      url: "/FeelingUnsafe",
    })
      .then((response) => {
        setIsActive(response.data?.session.active);
        setPeriod(response.data?.session.interval.toString());
      })
      .catch((error) => console.error("Failed to check Feeling Unsafe status:", error));
  }, []);

  console.log("period", period);

  const startRecording = async () => {
    console.log("Audio Record", AudioRecord);
    const socket = getSocket();
    if (!socket) return;

    const bestAudioSource = getBestAudioSource();
    AudioRecord.init({
      sampleRate: 16000,
      channels: 1,
      bitsPerSample: 16,
      audioSource: bestAudioSource,
    });

    
    console.log("🎙️ Starting Emergency Audio Streaming...");
    AudioRecord.start();

    // Send audio data continuously to the server
    audioListener = AudioRecord.on("data", (data) => {
      socket.emit("audio_data", data);
    });
  };

  const stopRecording = async () => {
    if (audioListener) {
      audioListener.remove();
      audioListener = null;
    }
    await AudioRecord.stop();
    console.log("🎙️ Stopped Audio Streaming.");
  };

  const startFeelingUnsafe = async () => {
    try {
      const response = await apiCall({
        method: "POST",
        url: "/FeelingUnsafe/startFeelingUnsafe",
        data: { interval: parseInt(period) },
      });

      if (response.status === 200) {
        setIsActive(true);
        await startBackgroundService(); // 🚀 Start Background WebSocket
        startRecording(); // 🎙️ Start Recording Audio
        console.log("✅ Feeling Unsafe Mode Activated");
      }
    } catch (error) {
      console.error("❌ Failed to start Feeling Unsafe mode:", error);
    }
  };

  const isFirstRender = React.useRef(true); // Track initial render

useEffect(() => {
  if (isFirstRender.current) {
    isFirstRender.current = false; // Mark as initialized
    return; // 🚀 Skip the first execution
  }

  apiCall({
    method: "POST",
    url: "/FeelingUnsafe/updateFeelingUnsafe",
    data: { interval: parseInt(period) },
  }).catch((error) => console.error("❌ Failed to update interval:", error));

}, [period]);

const stopFeelingUnsafe = async () => {
  Alert.alert(
    "Abort",
    "Are you sure you want to turn off the Feeling Unsafe mode?",
    [
      { text: "Cancel", style: "cancel" },
      {
        text: "OK",
        onPress: async () => {
          try {
            await apiCall({
              method: "POST",
              url: "/FeelingUnsafe/stopFeelingUnsafe",
            });

            // 1️⃣ Stop Recording First
            await stopRecording(); // ⛔ Ensure audio stops first

            // 2️⃣ Stop Background WebSocket Service
            await stopBackgroundService(); // ⛔ Stop background service

            // 3️⃣ Close WebSocket Connection
            const socket = getSocket();
            if (socket) {
              socket.disconnect();
              console.log("🛑 WebSocket Disconnected");
            }

            // 4️⃣ Update UI State
            setIsActive(false);
            console.log("✅ Feeling Unsafe Mode Deactivated");

            // 5️⃣ Navigate Back
            navigation.goBack();
          } catch (error) {
            console.error("❌ Failed to stop Feeling Unsafe mode:", error);
          }
        },
      },
    ],
    { cancelable: true }
  );
};

  return (
    <>
      <View style={styles.container}>
        <View style={styles.dropdownContainer}>
          <Picker selectedValue={period} style={styles.picker} onValueChange={setPeriod}>
            <Picker.Item label="Every 1 min" value="1" />
            <Picker.Item label="Every 3 mins" value="3" />
            <Picker.Item label="Every 5 mins" value="5" />
            <Picker.Item label="Every 10 mins" value="10" />
            <Picker.Item label="Every 15 mins" value="15" />
          </Picker>
        </View>

        {isActive ? (
          <View style={styles.messageBox}>
            <Text style={styles.messageText}>
              "Feeling Unsafe" is activated. You'll receive calls every {period} minutes.
            </Text>
            <Text style={styles.messageText}>
              If a call is missed, an emergency signal will be activated.
            </Text>
          </View>
        ) : (
          <Text style={styles.deactivatedText}>The "Feeling Unsafe" option is off.</Text>
        )}

        {isActive && (
          <TouchableOpacity style={styles.abortButton} onPress={stopFeelingUnsafe}>
            <Text style={styles.abortButtonText}>Abort</Text>
          </TouchableOpacity>
        )}

        {!isActive && (
          <TouchableOpacity style={styles.startButton} onPress={startFeelingUnsafe}>
            <Text style={styles.startButtonText}>Activate Feeling Unsafe</Text>
          </TouchableOpacity>
        )}
      </View>
      <Footer page="FeelingUnsafe" display />
    </>
  );
};

module.exports = FeelingUnsafe;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  dropdownContainer: {
    position: "absolute",
    top: 40,
    left: 10,
    width: 180,
    height: 50,
    borderRadius: 20,
    backgroundColor: "#C7E6F6",
  },
  picker: {
    height: 50,
    width: "100%",
  },
  messageBox: {
    width: "100%",
    padding: 20,
    backgroundColor: "#C7E6F6",
    borderRadius: 10,
    marginBottom: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  messageText: {
    fontSize: 18,
    color: "#333",
    textAlign: "center",
  },
  deactivatedText: {
    fontSize: 18,
    color: "red",
    textAlign: "center",
  },
  abortButton: {
    marginTop: 20,
    paddingVertical: 15,
    paddingHorizontal: 40,
    backgroundColor: "#FF5A5F",
    borderRadius: 10,
  },
  abortButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  startButton: {
    marginTop: 20,
    paddingVertical: 15,
    paddingHorizontal: 40,
    backgroundColor: "#28a745",
    borderRadius: 10,
  },
  startButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
});

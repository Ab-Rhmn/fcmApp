import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState  } from 'react';
import messaging from '@react-native-firebase/messaging';
import { StyleSheet, Text, View, Button,FlatList , TouchableOpacity, Modal,Image, Dimensions,Alert} from "react-native"
import * as TaskManager from "expo-task-manager"
import * as Location from "expo-location"
import { ref, set, update} from 'firebase/database';
import {db} from './component/config';
import Icon from 'react-native-vector-icons/FontAwesome';
import { v4 as uuidv4 } from 'uuid';


const windowWidth = Dimensions.get('window').width;
const windowHeight = Dimensions.get('window').height;

const LOCATION_TASK_NAME = "LOCATION_TASK_NAME"
let foregroundSubscription = null
let backPosition = null
let deviceToken = null

let updateLocation = (location) => {
  update(ref(db, '/am/'+deviceToken), { lat: location.latitude, long: location.longitude})
  .then(() => console.log("Data successfully updated!"))
  .catch((error) => console.error("Error updating data: ", error));
};

// Define the background task for location tracking
TaskManager.defineTask(LOCATION_TASK_NAME, async ({ data, error }) => {
  if (error) {
    console.error(error)
    return
  }
  if (data) {
    // Extract location coordinates from data
    const { locations } = data
    const location = locations[0]
    if (location) {
      console.log("Location in background", location)
      backPosition = location.coords;
      updateLocation(location.coords)
      // push to firebase 

    }
  }
})


export default function App() {  
  const [notificationArray, setNotificationArray] = useState([]);
  const [token, setToken] = useState([]);

  const [position, setPosition] = useState(null);
  const [isBackgroundUpdateRunning, setIsBackgroundUpdateRunning] = useState(false);
  const [isForegroundUpdateRunning, setIsForegroundUpdateRunning] = useState(false);
  const [datas, setData] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  // const [counter, setCounter] = useState(211);

  const handleTilePress = (item) => {
    setSelectedItem(item);
    setModalVisible(true);
    //for debugging, comment out
    handleConsole();
  };

  //comment this out 
  const handleConsole = ()=> {
    console.log("data",datas);
  }

  const updateData = (remoteMessage) => {
    const {data,notification} =remoteMessage;
    console.log(remoteMessage);

    const newData = {
      time: data.time,
      picture:JSON.parse(data.picture),
      notification: notification
    };
    
    newData.picture.unshift(newData.notification.android.imageUrl);
    const parsedData = {
      ...newData,
      id: uuidv4(), // Generating a unique identifier using uuidv4()
    };
    setData(prevArray => [ parsedData,...prevArray]);
    console.log("data",JSON.stringify(datas));
  }


  const toggleForegroundUpdate = () => {
    if (isForegroundUpdateRunning) {
      stopForegroundUpdate();
    } else {
      startForegroundUpdate();
    }
    setIsForegroundUpdateRunning(!isForegroundUpdateRunning);
  }

  const toggleBackgroundUpdate = () => {
    if (isBackgroundUpdateRunning) {
      stopBackgroundUpdate();
    } else {
      startBackgroundUpdate();
    }
    setIsBackgroundUpdateRunning(!isBackgroundUpdateRunning);
  }

  const requestUserPermission = async () => { 
    const authStatus = await messaging().requestPermission();
    const enabled =
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL;

    if (enabled) {
      console.log('Authorization status:', authStatus);
    }
    return authStatus;
  } 

   
   useEffect(()=>{
    const getToken = async () => {
      const hasPermission = await requestUserPermission();
      const token = await messaging().getToken();
        // console.log('Token:', token); 
      if (hasPermission) {
        const token = await messaging().getToken();
        console.log('Token:', token);
        deviceToken = token
      } else {
        console.log('Failed to get permission');
      }
    };
    getToken();

    messaging().getInitialNotification().then(async (remoteMessage) => {
      if (remoteMessage) {
        console.log('Notification caused app to open from quit state:',remoteMessage.notification,);
        try {           
          updateData(remoteMessage); 
        } catch (error) {
          console.log(error);
        }
      }      
    });

    // Assume a message-notification contains a "type" property in the data payload of the screen to open
    messaging().onNotificationOpenedApp(async (remoteMessage) => {
        console.log(
          'Notification caused app to open from background state:',
          remoteMessage.notification,
        );
        try {           
          updateData(remoteMessage);         
        } catch (error) {
          console.log(error);
        }
    });

    // Register background handler
    messaging().setBackgroundMessageHandler(async remoteMessage => {
        console.log('Message handled in the background!', remoteMessage);
        try {           
          updateData(remoteMessage);        
        } catch (error) {
          console.log(error);
        }
          
    });


    const unsubscribe = messaging().onMessage(async remoteMessage => {
      Alert.alert('A new FCM message arrived!', JSON.stringify(remoteMessage.notification.title));
      try {     
        updateData(remoteMessage);
      } catch (error) {
        console.log(error);
      }
    });


    const requestPermissions = async () => {
      const foreground = await Location.requestForegroundPermissionsAsync()
      if (foreground.granted) await Location.requestBackgroundPermissionsAsync()
    }
    requestPermissions()
    // fetchData();
    return unsubscribe;

    
  },[])

  // from this to  delete. no needed
        // const fetchData = async () => {
        //   // Fetch data from API and update state
        //   const response = await fetch('https://jsonplaceholder.typicode.com/todos/');
        //   const json = await response.json();
        //   // Modify each object in the array
        // const modifiedData = json.map(item => {
        //   return {
        //     ...item,
        //     images: ['https://totalgyan.com/wp-content/uploads/2017/12/White-2BPlate.jpeg','https://storage.googleapis.com/checkingbucket1/ab/car.jpeg']
        //   };
        // });
        // setData(modifiedData.slice(0, 10));
        // // console.log("ghghk", json)
        // // console.log("dataaaaa", JSON.stringify(data))
        // console.log("dd",modifiedData.slice(0, 10))
        // };
        // const renderItem = ({ item }) => (
        //   <View>
        //     <Text>{item.userId}</Text>
        //     <Text>{item.title}</Text>
            
        //   </View>
        // );
  // this dlt

  // Start location tracking in foreground
  const startForegroundUpdate = async () => {
    // Check if foreground permission is granted
    const { granted } = await Location.getForegroundPermissionsAsync()
    if (!granted) {
      console.log("location tracking denied")
      return
    }

    // Make sure that foreground location tracking is not running
    foregroundSubscription?.remove()

    // Start watching position in real-time
    foregroundSubscription = await Location.watchPositionAsync(
      {
        // For better logs, we set the accuracy to the most sensitive option
        accuracy: Location.Accuracy.BestForNavigation,
        distanceInterval: 5,//when 5m change of distance
      },
      location => {
        setPosition(location.coords)
        updateLocation(location.coords)
        // push to firebase
      }
    )
  }

  // Stop location tracking in foreground
  const stopForegroundUpdate = () => {
    foregroundSubscription?.remove()
    setPosition(null)
  }

  // Start location tracking in background
  const startBackgroundUpdate = async () => {
    // Don't track position if permission is not granted
    const { granted } = await Location.getBackgroundPermissionsAsync()
    if (!granted) {
      console.log("location tracking denied")
      return
    }

    // Make sure the task is defined otherwise do not start tracking
    const isTaskDefined = await TaskManager.isTaskDefined(LOCATION_TASK_NAME)
    if (!isTaskDefined) {
      console.log("Task is not defined")
      return
    }

    // Don't track if it is already running in background
    const hasStarted = await Location.hasStartedLocationUpdatesAsync(
      LOCATION_TASK_NAME
    )
    if (hasStarted) {
      console.log("Already started")
      return
    }

    await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
      // For better logs, we set the accuracy to the most sensitive option
      accuracy: Location.Accuracy.BestForNavigation,
      // timeInterval: 60000,
      distanceInterval: 5,
      // Make sure to enable this notification if you want to consistently track in the background
      showsBackgroundLocationIndicator: true,
      foregroundService: {
        notificationTitle: "Location",
        notificationBody: "Location tracking in background",
        notificationColor: "#fff",
      },
    })
  }

  // Stop location tracking in background
  const stopBackgroundUpdate = async () => {
    const hasStarted = await Location.hasStartedLocationUpdatesAsync(
      LOCATION_TASK_NAME
    )
    if (hasStarted) {
      await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME)
      console.log("Location tracking stopped")
    }
  }
  const deleteItem = (itemId) => {
    setData(prevData => prevData.filter(item => item.id !== itemId));
  }


  return (
    
    
    <View style={styles.container}>
     

<FlatList
        data={datas}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
           <TouchableOpacity style={styles.tile} onPress={() => handleTilePress(item)}>
            
           <View style={styles.tileTextContainer}>
            <Text style={styles.tileTitle}>Location : {item?.notification.title}</Text>
            <Text style={styles.tileText}>Day and Time of Violation: {item?.time}</Text>
            <Image source={{ uri: item?.notification.android.imageUrl }} style={styles.image} /> 
          </View>

            {/* <Text style={styles.tileText}>Time of Violation is: {item?.time}</Text> */}
            {/* <Button title="Delete" onPress={() => deleteItem(item.id)} /> */}
            <TouchableOpacity style={styles.deleteButton} onPress={() => handleTilePress(item)}>
              <Icon name="trash" size={24} color="red" onPress={() => deleteItem(item.id)} />
            </TouchableOpacity>
          </TouchableOpacity>
        )}
      />
      <Modal visible={modalVisible} animationType="slide">
        <View style={styles.modal}>
          <View style={styles.tileTextContainer}>
            <Text style={styles.tileTitle}>{selectedItem?.notification.title}</Text>
            <Text style={styles.tileText}>Cause of Violation: {selectedItem?.notification.body}</Text>
            <Text style={styles.tileText}>Day and Time of Violation : {selectedItem?.time}</Text>
          </View>
          <FlatList
          data={selectedItem?.picture}
          keyExtractor={(item, index) => index.toString()}
          // horizontal={true}
          renderItem={({ item }) => (
            <Image source={{ uri: item }} style={styles.imageTile} />
          )}
        />

          <TouchableOpacity style={styles.closeButton} onPress={() => setModalVisible(false)}>
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </Modal>
      {notificationArray.map((notification, index) => (
  <Text key={index}>{JSON.stringify(notification)}</Text>
))}
        {/* <Text>Longitude: {position?.longitude}</Text>
      <Text>Latitude: {position?.latitude}</Text> */}
      <View style={styles.separator} />
      <Button
        onPress={toggleForegroundUpdate}
        // onPress={() => storageHighScore("1", 450)}
        title={isForegroundUpdateRunning ? "Stop in foreground" : "Start in foreground"}
        color={isForegroundUpdateRunning ? "red" : "green"}
      />
      <View style={styles.separator} />
     

      <Button
        onPress={toggleBackgroundUpdate}
        title={isBackgroundUpdateRunning ? "Stop in background" : "Start in background"}
        color={isBackgroundUpdateRunning ? "red" : "green"}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#303030",
    alignItems: "center",
    justifyContent: "flex-start",
    paddingTop: 20,
    paddingHorizontal: 20,
  },
  separator: {
    height: 1,
    backgroundColor: "#ccc",
    marginVertical: 10,
    width: "100%",
  },
  modal: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  tileTextContainer: {
    backgroundColor: '#f2f2f2',
    padding: 10,
    borderRadius: 5,
    marginBottom: 5,
  },
  tile: {
    // flex: 1, 
    backgroundColor: "#FFF",
    padding: 10,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    marginBottom: 10,
    width:"100%",
  },
  tileTitle: {
    fontWeight: "bold",
    fontSize: 16,
    marginBottom: 5,   
  },
  tileText: {
    fontWeight: "bold",
    fontSize: 12,
    color: "#555",
  },

  // modal: {
  //   flex: 1,
  //   backgroundColor: "#fff",
  //   alignItems: "center",
  //   justifyContent: "center",
  //   padding: 20,
  // },
  imageTile: {
    width: windowWidth,
    height: windowHeight / 2,
    margin: 5,
    resizeMode: 'contain',
    borderRadius: 5,
  },
  userId: {
    fontSize: 16,
    marginTop: 20,
    textAlign: "center",
  },
  closeButton: {
    backgroundColor: "#ff0000",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    marginTop: 20,
  },
  closeButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  deleteButton: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  image: {
    width: "100%",
    height: 80,
    resizeMode: 'contain',
    borderRadius: 25
  },
 
});
 

import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, Alert } from 'react-native';
import React, { useEffect, useState  } from 'react';
import messaging from '@react-native-firebase/messaging';

export default function App() {  
  const [notificationArray, setNotificationArray] = useState([]);
  const [token, setToken] = useState([]);

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
      } else {
        console.log('Failed to get permission');
      }
    };
    getToken();

    messaging().getInitialNotification().then(async (remoteMessage) => {
      if (remoteMessage) {
        console.log('Notification caused app to open from quit state:',remoteMessage.notification,);
        setNotificationArray(prevArray => [...prevArray, remoteMessage]);
      }      
    });

    // Assume a message-notification contains a "type" property in the data payload of the screen to open
    messaging().onNotificationOpenedApp(async (remoteMessage) => {
        console.log(
          'Notification caused app to open from background state:',
          remoteMessage.notification,
        );
        setNotificationArray(prevArray => [...prevArray, remoteMessage]);
    });

    // Register background handler
    messaging().setBackgroundMessageHandler(async remoteMessage => {
        console.log('Message handled in the background!', remoteMessage);
        setNotificationArray(prevArray => [...prevArray, remoteMessage]);
    });


    const unsubscribe = messaging().onMessage(async remoteMessage => {
      Alert.alert('A new FCM message arrived!', JSON.stringify(remoteMessage));
      const { title, body } = remoteMessage.notification;
      setNotificationArray(prevArray => [...prevArray, { title, body, image }]);
    });
    return unsubscribe;
  },[])




  return (
    <View style={styles.container}>
      {notificationArray.map((notification, index) => (
      <Text key={index}>{JSON.stringify(notification)}</Text>
    ))}
      {/* {notificationData && (<Text>{JSON.stringify(notificationData)}</Text>)} */}
      <Text>FCM EXAMPLE</Text>
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
 



  // const requestUserPermission = async () => {
  //   try {
  //     const authStatus = await messaging().requestPermission();
  //     const enabled =
  //       authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
  //       authStatus === messaging.AuthorizationStatus.PROVISIONAL;
  
  //     if (enabled) {
  //       console.log('Authorization status:', authStatus);
  //       return true;
  //     } else {
  //       console.log('Authorization status:', authStatus);
  //       return false;
  //     }
  //   } catch (error) {
  //     console.log('Error requesting permission:', error);
  //     return false;
  //   }
  // };
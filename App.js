import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, Alert } from 'react-native';
import React, { useEffect  } from 'react';
import messaging from '@react-native-firebase/messaging';

export default function App() {
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
  

  const requestUserPermission = async () => { 
    const authStatus = await messaging().requestPermission();
    const enabled =
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL;

    if (enabled) {
      console.log('Authorization status:', authStatus);
    }
  } 

   

  
   useEffect(()=>{
    const getToken = async () => {
      const hasPermission = await requestUserPermission();
      const token = await messaging().getToken();
        console.log('Token:', token);
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
        console.log(
          'Notification caused app to open from quit state:',remoteMessage.notification,
        );
      }      
    });

    // Assume a message-notification contains a "type" property in the data payload of the screen to open
    messaging().onNotificationOpenedApp(async (remoteMessage) => {
        console.log(
          'Notification caused app to open from background state:',
          remoteMessage.notification,
        );
    });

   
   
   
   
    // Register background handler
    messaging().setBackgroundMessageHandler(async remoteMessage => {
        console.log('Message handled in the background!', remoteMessage);
    });


    const unsubscribe = messaging().onMessage(async remoteMessage => {
      Alert.alert('A new FCM message arrived!', JSON.stringify(remoteMessage));
    });
    return unsubscribe;
  },[])




  return (
    <View style={styles.container}>
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
 
import {Platform, StyleSheet} from 'react-native';
import {NavigationContainer} from "@react-navigation/native";
import {createBottomTabNavigator} from "@react-navigation/bottom-tabs";
import Ionicons from "@expo/vector-icons/Ionicons"
import RegisterApplicantPage from "./pages/RegisterApplicantPg";
import ApplicantsListPage from "./pages/ApplicantsListPg";
import {useState, useEffect, useRef} from "react";
import connect from "./helpers/db_connection";
import ConnectionContext from "./helpers/ConnectionContext";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import Constants from "expo-constants";
import {useCameraPermissions} from "expo-camera";

Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound:true,
        shouldSetBadge:true
    })
})


async function registerForPushNotificationsAsync(){
    let token
    if(Platform.OS === 'android'){
        await Notifications.setNotificationChannelAsync('default', {
            name:'default',
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern:[0,255,255,250],
            lightColor: '#FF231F7C',
        })
    }
    if(Device.isDevice){
        const {status:currStatus} = await Notifications.getPermissionsAsync()
        let finalStatus = currStatus
        while(finalStatus !== 'granted'){//request permission until user accepts
            const {status} = await Notifications.requestPermissionsAsync()
            finalStatus = status
        }
        try{
            const projectId = Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId
            if(!projectId) throw new Error('Project Id not found.')
            token = (await Notifications.getExpoPushTokenAsync({projectId})).data
            console.log(token)
        }catch(e){
            token = e
        }
    }else{
        alert('Must use a physical device for push notifications')
    }
    return token
}
const {Navigator, Screen} = createBottomTabNavigator()

export default function App() {

    const [permission, requestPermissions] = useCameraPermissions()

    const currToken = useRef('')
    const channels = useRef([])
    const [notification, setNotification] = useState(undefined)
    const notificationListener = useRef(null)
    const responseListener = useRef(null)

    const [connection, setConnection] = useState(null)
    const [applicants, setApplicants] = useState([])

    useEffect(() =>{
        (async () =>{
            if(!connection) return
            const rows = await connection.getAllAsync('SELECT * FROM applicants')
            setApplicants(rows)
        })()
    }, [connection])
    useEffect(() => {
        (async() =>{
            const newConnection = await connect()
            setConnection(newConnection)
        })()
    },[])
    useEffect(() => {
        registerForPushNotificationsAsync().then(token => {
            console.log("getting token")
            if (token) currToken.current = token
        })
        if(Platform.OS === 'android') Notifications.getNotificationChannelsAsync().then(value => {
            if(value) channels.current = value
        })
        notificationListener.current = Notifications.addNotificationReceivedListener(notification => setNotification(notification))

        responseListener.current = Notifications.addNotificationResponseReceivedListener(response => console.log(response))

        return () => {
            notificationListener.current && Notifications.removeNotificationSubscription(notificationListener.current)
            responseListener.current && Notifications.removeNotificationSubscription(responseListener.current)
        }
    },[])
    useEffect(async () => {
        while(!permission){
            await requestPermissions()
        }
    }, [])
  return (
      <ConnectionContext.Provider value={{connection, applicants, setApplicants}}>
          <NavigationContainer>
              <Navigator initialRouteName="register_applicant" screenOptions={({route})=>(
                  {
                      headerStyle:{
                          backgroundColor:'tomato',
                      },
                      headerTintColor: 'white',
                      headerTitleStyle:{
                          fontWeight:'bold',
                          fontSize:24,
                      },
                      tabBarActiveTintColor:'tomato',
                      tabBarInactiveTintColor:'gray',
                      tabBarIcon:({color, size, focused}) => {
                          let iconName

                          if(route.name === 'register_applicant'){
                              iconName = focused? 'person-add':'person-add-outline'
                          } else if(route.name === 'applicants_list'){
                              iconName = focused? 'people':'people-outline'
                          }

                          return <Ionicons name={iconName} size={size} color={color} />
                      }
                  }
              )}>
                  <Screen name="register_applicant" component={RegisterApplicantPage} options={{
                      title: 'Register Applicant',
                  }}/>
                  <Screen name="applicants_list" component={ApplicantsListPage} options={{
                      title: 'Applicants',
                  }}/>

              </Navigator>
          </NavigationContainer>
      </ConnectionContext.Provider>
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

import {FlatList, View, Text, StyleSheet, Pressable, Image} from "react-native";
import {SafeAreaProvider} from "react-native-safe-area-context";
import { useContext, useCallback} from 'react'
import ConnectionContext from "../helpers/ConnectionContext";
import {createNativeStackNavigator} from "@react-navigation/native-stack";
import EditApplicantPage from "./EditApplicantPg";
import Ionicons from "@expo/vector-icons/Ionicons";
import * as Notifications from "expo-notifications";

const {Navigator, Screen} = createNativeStackNavigator();

function ListItem({id, name, email, phone, profile_picture, navigation}){
    const {connection, setApplicants} = useContext(ConnectionContext);
    const removeApplicant = useCallback(async (id) => {
        const statement = await connection.prepareAsync(
            "DELETE FROM Applicants WHERE id=$id",
        )
        try{
            const result = await statement.executeAsync({$id:id})
            setApplicants(prev => prev.filter(applicant => applicant.id !== id))
            await Notifications.scheduleNotificationAsync({
                content:{
                    title:"Applicant Deleted",
                    body: `The applicant ${id} was deleted.`
                },
                trigger:null
            })
        }catch(e){
            console.log(e)
        }finally {
            await statement.finalizeAsync()
        }
    }, [])
    return(
        <View style={styles.card}>
            <Pressable onPress={()=>{
                navigation.navigate("edit_applicant",{user:{id, name, email, phone, profile_picture}})
            }}>
                <View style={{flexDirection:'row', justifyContent:'space-between'}}>
                    <View style={{flexDirection:"row", justifyContent:'flex-start'}}>
                        <Image style={{width:100, height:100, borderRadius:5}} source={{uri: "data:image/jpeg;base64,"+profile_picture}}/>
                        <View style={{paddingHorizontal:10}}>
                            <Text style={{fontSize:12, color:'#2f2f2f', fontWeight:'300'}}>#{id}</Text>
                            <Text style={{fontSize:12, color:'#2f2f2f', fontWeight:'300'}}>{name}</Text>
                            <Text style={{fontSize:12, color:'#2f2f2f', fontWeight:'300'}}>{email}</Text>
                            <Text style={{fontSize:12, color:'#2f2f2f', fontWeight:'300'}}>{phone}</Text>
                        </View>
                    </View>
                    <Pressable onPress={() => removeApplicant(id)} style={{alignSelf:'center', backgroundColor:'rgba(91,0,0,0.65)', width:60, height:60, borderRadius:30, justifyContent:'center', alignItems: 'center'}}>
                        <Ionicons name="trash-bin-outline" size={24} color="tomato"/>
                    </Pressable>
                </View>

            </Pressable>
        </View>
    )
}

function ApplicantsPage({navigation}) {
    const { applicants} = useContext(ConnectionContext);
    return(
        <SafeAreaProvider>
            <FlatList data={applicants}
                      renderItem={({item:{id, name, phone, email, profile_picture}}) => <ListItem navigation={navigation} id={id} name={name} phone={phone} profile_picture={profile_picture} email={email}/>}
                      keyExtractor={item => item.id}
            />
        </SafeAreaProvider>
    )
}

export default function ApplicantsListPage(){
    return(<Navigator screenOptions={{
        headerShown: false,
    }}>
        <Screen name="applicants" component={ApplicantsPage} options={{
            title: 'Applicants',
        }}/>
        <Screen name="edit_applicant" component={EditApplicantPage} options={{
            title: 'Edit Applicant',
        }}/>
    </Navigator> )
}

const styles = StyleSheet.create({
    card:{
        backgroundColor:'#fff',
        borderColor:'#dbdbdb',
        borderWidth:1,
        borderRadius:5,
        marginVertical:5,
        padding:10,
    }
})
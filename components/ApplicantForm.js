import {Animated,StyleSheet, Image, Text, KeyboardAvoidingView, TextInput,View, Pressable, Platform} from "react-native";
import {useForm, Controller} from "react-hook-form";
import {useCallback, useContext,useRef , useEffect, useState} from "react";
import ConnectionContext from "../helpers/ConnectionContext";
import * as Notifications from 'expo-notifications'
import Ionicons from "@expo/vector-icons/Ionicons";
import * as ImagePicker from "expo-image-picker";

function AttachmentButton({iconName, actionText, onPressHandler, customStyles}){
    const scaleAnim = useRef(new Animated.Value(1)).current
    const opacityAnim = useRef(new Animated.Value(1)).current
    const handlePressIn = useCallback(() => {
        Animated.parallel([
            Animated.spring(scaleAnim, {
                toValue: 1.1,
                friction:3,
                useNativeDriver: true,
            }),
            Animated.timing(opacityAnim, {
                toValue: 0.8,
                duration: 100,
                useNativeDriver: true,
            })
        ]).start()
    }, [scaleAnim, opacityAnim])

    const handlePressOut = useCallback(() => {
        Animated.parallel([
            Animated.spring(scaleAnim, {
                toValue: 1,
                friction:3,
                useNativeDriver: true,
            }),
            Animated.timing(opacityAnim, {
                toValue: 1,
                duration: 100,
                useNativeDriver: true,
            })
        ]).start()
    }, [scaleAnim, opacityAnim])
    return(
        <View>
            <Animated.View style={{
                transform:[{scale:scaleAnim}],
                opacity:opacityAnim,
            }}>
                <Pressable style={[styles.attachment, customStyles||{}]} onPress={onPressHandler} onPressIn={handlePressIn} onPressOut={handlePressOut}>
                    <Ionicons name={iconName} size={30} color="gray"/>
                </Pressable>
            </Animated.View>
            <Text style={[styles.label, {fontSize: 11}]}>{actionText}</Text>
        </View>
    )
}



export default function ApplicantForm({formHeader, user}){
    const {handleSubmit, register, setValue,control,reset, formState:{errors}} = useForm({
        mode: "onChange",
        defaultValues:{
            id:user?.id||undefined,
            name:user?.name||'',
            email:user?.email||'',
            phone:user?.phone||'',
            profile_picture: user?.profile_picture||null,
        }
    });
    const {connection, setApplicants} = useContext(ConnectionContext);

    const registerApplicant = useCallback(async data => {
        const {name, email, phone, profile_picture} = data
        const statement = await connection.prepareAsync(
            'INSERT INTO applicants (name, email, phone, profile_picture) VALUES ($name, $email, $phone, $profile_picture)'
        )
        try{
            let result = await statement.executeAsync({$name:name, $email:email, $phone:phone,$profile_picture:profile_picture})
            setApplicants(prev => [...prev, {id:result.lastInsertRowId, name, email, phone, profile_picture}])
            //show notification
            await Notifications.scheduleNotificationAsync({
                content:{
                    title:"New Applicant Registered",
                    body: `The applicant: ${name} has been registered.`,
                },
                trigger:null
            })
        }catch(e){
            console.log(e)
        }finally {
            await statement.finalizeAsync()
            reset()//reset form
            if(!user){
                setSelectedImage(null)
            }
        }
    }, [connection])
    const updateApplicant = useCallback(async data => {
        const {id, name, email, phone, profile_picture} = data
        const statement = await connection.prepareAsync(
            'UPDATE applicants SET name=$name, email=$email, phone=$phone, profile_picture=$profile_picture WHERE id = $id'
        )
        try{
            const result = await statement.executeAsync({$id:id, $name:name, $email:email, $phone:phone, $profile_picture:profile_picture})
            setApplicants(prev => prev.map(
                applicant => {
                    if(applicant.id === id) {
                        return {id, name, email, phone, profile_picture}
                    }
                    return applicant
                }
            ))
            await Notifications.scheduleNotificationAsync({
                content:{
                    title:"New Applicant Updated",
                    body:`The applicant ${name} has been updated successfully.`
                },
                trigger:null
            })
        }catch(e){
            console.log(e)
        }finally {
            await statement.finalizeAsync()
            //show notification
        }
    }, [connection])
    const onSuccess = useCallback(async data => {
        if(!user) {
            await registerApplicant(data)
        }else{
            await updateApplicant(data)
        }

    },[connection])

    const onError = useCallback(errors => {
        console.log(errors)
    }, [])

    const [selectedImage, setSelectedImage] = useState(user?.profile_picture||null)
    const takePicture = useCallback(async () => {
        const {canceled, assets } = await ImagePicker.launchCameraAsync({
            allowsEditing:true,
            aspectRatio: [4,3],
            quality: 1,
            allowsMultipleSelection:false,
            base64:true,
            cameraType:'front',
            MediaTypes:"Images"
        })
        if(!canceled){
            const {base64} = assets[0]
            setSelectedImage(base64)
            setValue('profile_picture', base64)
        }

    },[])

    const selectPicture = useCallback(async () => {
        const {canceled, assets } = await ImagePicker.launchImageLibraryAsync({
            allowsEditing:true,
            aspectRatio: [4,3],
            quality: 1,
            allowsMultipleSelection:false,
            base64:true,
            cameraType:'front',
            MediaTypes:"Images"
        })
        if(!canceled){
            const {base64} = assets[0]
            setSelectedImage(base64)
            setValue('profile_picture', base64)
        }
    },[])
    useEffect(() => {
        register('profile_picture', {
            required:{
                value:'false'
            }
        })
    },[])

    return(
        <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios'? 'padding':'height'}>
            <Text style={styles.formHeader}>{formHeader}</Text>

            <View style={styles.attachments}>

                <AttachmentButton iconName="camera-outline" actionText='Take picture' onPressHandler={takePicture}/>
                <AttachmentButton iconName="folder-open-outline" actionText='Select picture' onPressHandler={selectPicture}/>
                <AttachmentButton iconName="document-attach-outline" actionText='Select CV'/>
            </View>
            {selectedImage &&
                <Image style={{width:120, height:120, borderRadius:60, alignSelf:'center'}} source={{uri:'data:image/jpeg;base64,'+selectedImage}}/>}
            <Text style={styles.label}>Name</Text>
            <Controller
                name='name'
                control={control}
                rules={{
                    required: true,
                }}
                render={({field:{onChange, onBlur, value}}) => (
                    <>
                        <TextInput
                            style={styles.input}
                            value={value}
                            onChangeText={onChange}
                            onBlur={onBlur}
                            inputMode='text'
                            keyboardAppearance="dark"
                        />
                        <Text style={styles.helperText}>{errors?.name && errors?.name?.message}</Text>
                    </>

                )}
            />
            <Text style={styles.label}>Email</Text>
            <Controller
                name='email'
                control={control}
                rules={{
                    required: true,
                }}
                render={({field:{onChange, onBlur, value}}) => (
                    <TextInput
                        style={styles.input}
                        value={value}
                        onChangeText={onChange}
                        onBlur={onBlur}
                        inputMode='email'
                        keyboardAppearance="dark"
                    />
                )}
            />
            <Text style={styles.label}>Phone</Text>
            <Controller
                name='phone'
                control={control}
                rules={{
                    required: true,
                }}
                render={({field:{onChange, onBlur, value}}) => (
                    <TextInput
                        style={styles.input}
                        value={value}
                        onChangeText={onChange}
                        onBlur={onBlur}
                        inputMode='tel'
                        keyboardAppearance="dark"
                    />
                )}
            />
            <Pressable style={styles.btnSubmit} onPress={handleSubmit(onSuccess, onError)}>
                <Text style={styles.btnText}>{user? 'Update':'Register'}</Text>
            </Pressable>
        </KeyboardAvoidingView>
    )
}

const styles = StyleSheet.create({
    form:{
        width: '100%',
        margin:10,
        padding:10,
        borderWidth:1,
        borderColor:'#dbdbdb',
        borderRadius:5,
        backgroundColor:'rgb(255,255,255)'
    },
    formHeader:{
        fontWeight:'500',
        fontSize:26,
        textAlign:'center',
        marginVertical:10,
    },
    attachments:{
        flexDirection:'row',
        justifyContent:'space-around',
    },
    attachment:{
        alignItems: 'center',
        justifyContent:'center',
        width:80,
        height:80,
        borderRadius:15,
        backgroundColor:"rgba(168,168,168,0.58)",
        alignSelf:"center"
    },
    camera:{
        flex:1,
        justifyContent:'flex-end',
        alignItems:'center',
        padding:10,
        backgroundColor:'rgba(255,255,255,0.4)'
    },
    label:{
        fontSize:16,
        fontWeight:'300',
    },
    input:{
        width:'100%',
        height:40,
        marginVertical:10,
        paddingHorizontal:5,
        borderWidth:1,
        borderRadius:5,
        borderColor:'#dbdbdb',
    },
helperText:{
    color:'tomato',
    fontSize:16,
    fontWeight:'300',
},
    btnSubmit:{
        backgroundColor:'tomato',
        padding:15,
        borderRadius:5,
    },
    btnText:{
        color:'white',
        fontSize:20,
        fontWeight:'300',
        textAlign:'center',
    }
})
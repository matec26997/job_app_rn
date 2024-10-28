import ApplicantForm from "../components/ApplicantForm";
import {StyleSheet, View} from 'react-native';
export default function EditApplicantPage({route, navigation}) {
    const {user} = route.params;
    return(
        <View style={styles.container}>
            <ApplicantForm formHeader="Edit Applicant" user={user}/>
        </View>
    )
}

const styles = StyleSheet.create({
    container:{
        flex:1,
        paddingHorizontal:10,
        backgroundColor:'white',
    }
})
import {StyleSheet, View} from "react-native";
import ApplicantForm from "../components/ApplicantForm";
export default function RegisterApplicantPage() {
    return(
        <View style={styles.container}>
            <ApplicantForm formHeader="Register Form"/>
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
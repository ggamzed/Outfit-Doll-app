import { StyleSheet, Text, View } from "react-native";

import Welcome from './index';
import { Pet } from './Pet';
import { PetQuailities } from "./PetQual";

export default function App()
{
	const petName = {
		firstName: "Roger",
		lastName: "Prot"
	}

	const quailities = [
		{
			qualOne: 'a lizard',
			qualTwo: 'enormous',
			qualThree: 'scary',
			age: 3
		},
		{
			qualOne: 'green',
			qualTwo: 'sometimes yellow',
			qualThree: 'herbal',
			age: 7
		},
	]

	return (
		<View style={styles.container}>
			<Welcome name="Gamze" age={37} gender={true}/>
			<Pet petName={petName} type="cat"/>
			<PetQuailities quailities={quailities}/>
		</View>
	)
}

const styles = StyleSheet.create({
	container:
	{
		flex: 1,
		backgroundColor: '#fff',
		alignItems: 'center',
		justifyContent: 'center',
	},
});
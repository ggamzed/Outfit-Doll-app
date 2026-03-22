import { View, Text } from "react-native"

type PetQualProps = {
	quailities: {
		qualOne: string,
		qualTwo: string,
		qualThree: string,
		age: number
	}[]
}

export const PetQuailities = (props: PetQualProps) => {
	return (
		<View>
			{props.quailities.map((e, i) => {
				if (i === 0)
					return (<Text key={i}>Your pet is {e.qualOne}, {e.qualTwo}, {e.qualThree}, {e.age} </Text>)
				return (<Text key={i}>Also Your pet is {e.qualOne}, {e.qualTwo}, {e.qualThree}, {e.age} </Text>)
			})}
		</View>
	)
}
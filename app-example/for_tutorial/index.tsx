import { Text, View } from "react-native";

type Props = {
	name: string,
	age: number,
	gender: boolean,
}

export default function Welcome(props: Props)
{
	return (
		<View>
			<Text>Hello {props.name}</Text>
			<Text>You are {props.age} years old</Text>
			<Text>your gender {props.gender ? "man" : "woman"}</Text>
		</View>
	);
	
}
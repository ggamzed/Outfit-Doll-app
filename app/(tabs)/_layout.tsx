import { StyleSheet, Text, View } from "react-native";
import { Tabs } from 'expo-router';

import { Colors } from '@/src/constants/Colors'
import { Metrics } from "@/src/constants/Metrics";
import { HomeIcon } from "@/src/components/icons/HomeIcon";

const styles = StyleSheet.create({
	tabBar:
	{
		height: Metrics.tabBarHeight,
		backgroundColor: Colors.background,
	}
});

const tabConfig = {
	tabBarActiveTintColor: 'black',
	tabBarInactiveTintColor: 'gray',
	headerShown: false,
	tabBarShowLabel: false,
	tabBarStyle: styles.tabBar,
} as const;

export default function RootLayout()
{
	return (
		<Tabs screenOptions={tabConfig}>
			<Tabs.Screen name="index" options={{
				tabBarIcon: ({focused, color}) =>
							(<HomeIcon focused={focused} color={color} size={Metrics.tabIconSize}/>),
			}}/>

		</Tabs>
	)
}


import { StyleSheet, Text, View } from "react-native";
import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors } from '@/src/constants/Colors'
import { Metrics } from "@/src/constants/Metrics";

import { HomeIcon } from "@/src/components/icons/HomeIcon";
import { WardrobeIcon } from "@/src/components/icons/WardrobeIcon";
import { AddIcon } from "@/src/components/icons/AddIcon";
import { OutfitIcon } from "@/src/components/icons/OutfitIcon";
import { MyDollIcon } from "@/src/components/icons/MyDollIcon";

const tabConfig = {
	tabBarActiveTintColor: 'black',
	tabBarInactiveTintColor: 'black',
	headerShown: false,
	tabBarShowLabel: false,
	//tabBarStyle: styles.tabBar,
} as const;

export default function RootLayout()
{
	const insets = useSafeAreaInsets();
	const dynamicTabConfig = {
		...tabConfig,
        tabBarStyle: [
            styles.tabBar, 
            { 
                height: Metrics.tabBarHeight + insets.bottom,
                paddingBottom: insets.bottom 
            }
        ],
    };

	return (
		<Tabs screenOptions={dynamicTabConfig} >
			<Tabs.Screen name="index" options={{
				tabBarIcon: ({focused, color}) => (
					<View style={styles.iconContainer}>
						<HomeIcon focused={focused} color={color} size={Metrics.tabIconSize}/>
					</View>
				),
			}}/>
			<Tabs.Screen name="wardrobe" options={{
				tabBarIcon: ({focused, color}) => (
					<View style={styles.iconContainer}>
						<WardrobeIcon focused={focused} color={color} size={Metrics.tabIconSize}/>
					</View>
				),
			}}/>
			<Tabs.Screen name="add-item" options={{
				tabBarIcon: ({focused, color}) => (
					<View style={styles.iconContainer}>
						<AddIcon focused={focused} color={color} size={Metrics.tabIconSize}/>
					</View>
				),
			}}/>
			<Tabs.Screen name="outfits" options={{
				tabBarIcon: ({focused, color}) => (
					<View style={styles.iconContainer}>
						<OutfitIcon focused={focused} color={color} size={Metrics.tabIconSize}/>
					</View>
				),
			}}/>
			<Tabs.Screen name="my-doll" options={{
				tabBarIcon: ({focused, color}) => (
					<View style={styles.iconContainer}>
						<MyDollIcon focused={focused} color={color} size={Metrics.tabIconSize}/>
					</View>
				),
			}}/>

		</Tabs>
	)
}

const styles = StyleSheet.create({
	tabBar:
	{
		height: Metrics.tabBarHeight,
		backgroundColor: Colors.lightBackground,
	},
	iconContainer:
	{
        width: Metrics.tabIconSize,
        height: Metrics.tabIconSize,
        //justifyContent: 'center',
        //alignItems: 'center',
        marginTop: 16,
    }
});
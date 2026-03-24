import React from 'react'; 
import { View, ViewStyle, StyleProp, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

import { Colors } from "@/src/constants/Colors";

interface ScreenWrapperProps
{
	children: React.ReactNode;
	style?: StyleProp<ViewStyle>;
}

export const ScreenWrapper = ({ children, style }: ScreenWrapperProps) =>
{
	const insets = useSafeAreaInsets();
	
	return (
		<View style={[styles.container, { paddingTop: insets.top }, 
				style ]}>
		<StatusBar style="dark" translucent={true} backgroundColor="transparent" />
		{children}
		</View>
	);
};

const styles = StyleSheet.create({
	container:
	{
		flex: 1,
   		backgroundColor: Colors.darkBackground,
		//marginTop: 10,
	}
})
// backgroundColor: '#FDE2F3',

// backgroundColor: '#f6e3efff',
import { Dimensions } from "react-native";

const { width, height } = Dimensions.get('window');

export const Metrics = {
	screenWidth: width,
	screenHeight: height,

	tabBarHeight: 50,
	tabIconSize: 28,
	//tabIconSizeFocused: 35,

	//paddingSmall: 8,
    //paddingMedium: 16,
    //paddingLarge: 24,

	//borderRadiusSmall: 4,
    //borderRadiusMedium: 12,
    //borderRadiusFull: 99,

    // Component sizes
    //headerHeight: 60,
    //buttonHeight: 50,
} as const;
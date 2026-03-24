import { Dimensions } from "react-native";

const { width, height } = Dimensions.get('window');

export const Metrics = {
	screenWidth: width,
	screenHeight: height,

	tabBarHeight: 60,
	tabIconSize: 28,
	//tabIconSizeFocused: 35,

	//paddingSmall: 8,
    //paddingMedium: 16,
    //paddingLarge: 24,

	//borderRadiusSmall: 4,
    //borderRadiusMedium: 12, // Modern "dolap" kartları için ideal
    //borderRadiusFull: 99,   // Tam yuvarlak butonlar için

    // 5. Bileşen Boyutları
    //headerHeight: 60,
    //buttonHeight: 50,
} as const;
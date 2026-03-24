import { Image, ImageBackground, StyleSheet, View, Text } from "react-native";

import { ScreenWrapper } from "@/src/components/common/ScreenWrapper";

import { Colors } from '@/src/constants/Colors'
import { Metrics } from '@/src/constants/Metrics';

export default function MainScreen()
{
    return (
        <ScreenWrapper style={styles.container}>
            <View style={styles.contentArea}>
                <ImageBackground
                    source={require('@/assets/podium.png')}
                    style={styles.podium}
                    imageStyle={styles.podiumImage}
                >
                    <Image
                        source={require('@/assets/avatar.png')}
                        style={styles.avatar}
                    />
                </ImageBackground>
            </View>
        </ScreenWrapper>
    );
}

const styles = StyleSheet.create({
    container:
	{
        flex: 1,
        backgroundColor: Colors.lightBackground,
    },
    contentArea:
	{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'flex-end',
        paddingBottom: Metrics.screenHeight * 0.011,
    },
    podium:
	{
        width: Metrics.screenWidth * 1.1, 
        height: (Metrics.screenWidth * 1.0) * 0.54,
        justifyContent: 'center',
        alignItems: 'center',
    },
    podiumImage:
	{
        resizeMode: 'contain',
    },
    avatar:
	{
        width: Metrics.screenWidth * 1.3,
        height: Metrics.screenHeight * 0.78,
        resizeMode: 'contain',
        position: 'absolute',
        bottom: Metrics.screenHeight * 0.05,
    },
});
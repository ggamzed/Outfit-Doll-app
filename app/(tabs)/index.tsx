import { Image, ImageBackground, StyleSheet, View, Text } from "react-native";

import { Colors } from '../../src/constants/Colors'

export default function MainPage()
{
    return (
        <View style={styles.container}>

            <View style={styles.contentArea}>
                <ImageBackground
                    source={require('../../assets/podium.png')}
                    style={styles.podium}
                    imageStyle={styles.podiumImage}
                >
                    <Image
                        source={require('../../assets/avatar.png')}
                        style={styles.avatar}
                    />
                </ImageBackground>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    contentArea: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'flex-end',
		backgroundColor: Colors.background,
        paddingBottom: 10,
    },
    podium: {
        width: 460,
        height: 250,
        justifyContent: 'center',
        alignItems: 'center',
    },
    podiumImage: {
        resizeMode: 'contain',
    },
    avatar: {
        width: 500,
        height: 700,
        resizeMode: 'contain',
        marginBottom: 550, 
    },
});
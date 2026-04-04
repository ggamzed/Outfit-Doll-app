import { StyleSheet } from "react-native";

import { ScreenWrapper } from "@/src/components/common/ScreenWrapper";
import { Colors } from "@/src/constants/Colors";
import { DollView } from "@/src/components/doll/DollView";

export default function MainScreen()
{
    return (
        <ScreenWrapper style={styles.container}>
          <DollView />
        </ScreenWrapper>
    );
}

const styles = StyleSheet.create({
    container:
	{
        flex: 1,
        backgroundColor: Colors.lightBackground,
    },
});
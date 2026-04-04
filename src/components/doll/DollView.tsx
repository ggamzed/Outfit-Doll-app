import React, { useMemo } from "react";
import { Image, ImageBackground, StyleSheet, View } from "react-native";
import { Gesture, GestureDetector, GestureHandlerRootView, } from "react-native-gesture-handler";
import Animated, { useSharedValue, useAnimatedStyle, } from "react-native-reanimated";

import { Metrics } from "@/src/constants/Metrics";
import { Colors } from "@/src/constants/Colors";
import { ClothingCategoryId, ClothingItem, useOutfit } from "@/src/state/OutfitContext";

type OverlayLayout = {
	leftPct: number;
	topPct: number;
	widthPct: number;
	heightPct: number;
	borderRadius: number;
};

const OVERLAY_LAYOUT_BY_CATEGORY_ID: Record<string, OverlayLayout> = {
	"2": { leftPct: 18, topPct: 26, widthPct: 64, heightPct: 45, borderRadius: 18 },
	"3": { leftPct: 20, topPct: 24, widthPct: 60, heightPct: 32, borderRadius: 16 },
	"4": { leftPct: 22, topPct: 58, widthPct: 56, heightPct: 26, borderRadius: 14 },
	"5": { leftPct: 12, topPct: 16, widthPct: 76, heightPct: 62, borderRadius: 22 },
	"6": { leftPct: 34, topPct: 82, widthPct: 32, heightPct: 14, borderRadius: 10 },
	"7": { leftPct: 40, topPct: 10, widthPct: 20, heightPct: 14, borderRadius: 14 },
};

const MIN_SIZE = 30;
const HANDLE_SIZE = 28;

function getOverlayLayout(categoryId: ClothingCategoryId): OverlayLayout {
	return (
		OVERLAY_LAYOUT_BY_CATEGORY_ID[String(categoryId)] ?? {
		leftPct: 25,
		topPct: 25,
		widthPct: 50,
		heightPct: 40,
		borderRadius: 16,
		}
	);
}

type DraggableOverlayProps = {
	item: ClothingItem;
	avatarWidth: number;
	avatarHeight: number;
};

function DraggableOverlay({ item, avatarWidth, avatarHeight }: DraggableOverlayProps) {
	const layout = getOverlayLayout(item.categoryId);
	const hasImage = Boolean(item.image);
	const backgroundColor = item.color ?? Colors.activeButton;

	const initLeft   = (layout.leftPct   / 100) * avatarWidth;
	const initTop    = (layout.topPct    / 100) * avatarHeight;
	const initWidth  = (layout.widthPct  / 100) * avatarWidth;
	const initHeight = (layout.heightPct / 100) * avatarHeight;

	const posX      = useSharedValue(initLeft);
	const posY      = useSharedValue(initTop);
	const savedPosX = useSharedValue(initLeft);
	const savedPosY = useSharedValue(initTop);

	const boxWidth    = useSharedValue(initWidth);
	const boxHeight   = useSharedValue(initHeight);
	const savedWidth  = useSharedValue(initWidth);
	const savedHeight = useSharedValue(initHeight);

	const dragGesture = Gesture.Pan()
		.onStart(() => {
		savedPosX.value = posX.value;
		savedPosY.value = posY.value;
		})
		.onUpdate((e) => {
		posX.value = savedPosX.value + e.translationX;
		posY.value = savedPosY.value + e.translationY;
		});

	const resizeGesture = Gesture.Pan()
		.onStart(() => {
		savedWidth.value  = boxWidth.value;
		savedHeight.value = boxHeight.value;
		})
		.onUpdate((e) => {
		boxWidth.value  = Math.max(MIN_SIZE, savedWidth.value  + e.translationX);
		boxHeight.value = Math.max(MIN_SIZE, savedHeight.value + e.translationY);
		});

	const containerStyle = useAnimatedStyle(() => ({
		left:   posX.value,
		top:    posY.value,
		width:  boxWidth.value,
		height: boxHeight.value,
	}));

	return (
		<GestureDetector gesture={dragGesture}>
		<Animated.View
			style={[
			styles.overlay,
			{
				borderRadius: layout.borderRadius,
				backgroundColor: hasImage ? "transparent" : backgroundColor,
				opacity: hasImage ? 1 : 0.55,
			},
			containerStyle,
			]}
		>
			{hasImage && (
			<Image
				source={{ uri: item.image as string }}
				style={[styles.overlayImage, { borderRadius: layout.borderRadius }]}
			/>
			)}

			<GestureDetector gesture={resizeGesture}>
			<Animated.View style={styles.resizeHandle}>
				<View style={styles.gripDot} />
				<View style={styles.gripDot} />
				<View style={styles.gripDot} />
			</Animated.View>
			</GestureDetector>
		</Animated.View>
		</GestureDetector>
	);
}

export function DollView()
{
	const { appliedItemsByCategoryId } = useOutfit();

	const appliedItems = useMemo(() => {
		return (Object.entries(appliedItemsByCategoryId))
		.map(([, item]) => item)
		.filter((x): x is ClothingItem => Boolean(x));
	}, [appliedItemsByCategoryId]);

	const avatarWidth  = Metrics.screenWidth  * 1.3;
	const avatarHeight = Metrics.screenHeight * 0.78;

	return (
		<GestureHandlerRootView style={styles.gestureRoot}>
		<View style={styles.contentArea}>
			<ImageBackground
			source={require("@/assets/podium.png")}
			style={styles.podium}
			imageStyle={styles.podiumImage}
			>
			<View
				style={[
				styles.avatarWrapper,
				{
					width: avatarWidth,
					height: avatarHeight,
					bottom: Metrics.screenHeight * 0.05,
					marginLeft: -(avatarWidth / 2),
				},
				]}
			>
				<Image
				source={require("@/assets/avatar.png")}
				style={styles.avatarImage}
				/>

				{appliedItems.map((item) => (
				<DraggableOverlay
					key={String(item.categoryId)}
					item={item}
					avatarWidth={avatarWidth}
					avatarHeight={avatarHeight}
				/>
				))}
			</View>
			</ImageBackground>
		</View>
		</GestureHandlerRootView>
	);
}

const styles = StyleSheet.create({
	gestureRoot:
	{
		flex: 1,
	},
	contentArea:
	{
		flex: 1,
		alignItems: "center",
		justifyContent: "flex-end",
		paddingBottom: Metrics.screenHeight * 0.011,
	},
	podium:
	{
		width: Metrics.screenWidth * 1.1,
		height: Metrics.screenWidth * 1.0 * 0.54,
		justifyContent: "center",
		alignItems: "center",
	},
	podiumImage:
	{
		resizeMode: "contain",
	},
	avatarWrapper:
	{
		position: "absolute",
		left: "50%",
	},
	avatarImage:
	{
		width: "100%",
		height: "100%",
		resizeMode: "contain",
	},
	overlay:
	{
		position: "absolute",
		borderWidth: 1,
		borderColor: "rgba(0,0,0,0.15)",
		justifyContent: "center",
		alignItems: "center",
		overflow: "visible",
	},
	overlayImage:
	{
		position: "absolute",
		left: 0,
		top: 0,
		right: 0,
		bottom: 0,
		resizeMode: "cover",
	},
	resizeHandle:
	{
		position: "absolute",
		bottom: -(HANDLE_SIZE / 2),
		right: -(HANDLE_SIZE / 2),
		width: HANDLE_SIZE,
		height: HANDLE_SIZE,
		borderRadius: HANDLE_SIZE / 2,
		backgroundColor: "rgba(255,255,255,0.92)",
		borderWidth: 1.5,
		borderColor: "rgba(0,0,0,0.18)",
		justifyContent: "center",
		alignItems: "center",
		flexDirection: "row",
		gap: 3,
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.18,
		shadowRadius: 4,
		elevation: 4,
	},
	gripDot:
	{
		width: 4,
		height: 4,
		borderRadius: 2,
		backgroundColor: "rgba(0,0,0,0.35)",
	},
});

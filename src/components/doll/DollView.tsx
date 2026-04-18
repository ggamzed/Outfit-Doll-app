import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Image, ImageBackground, Pressable, StyleSheet, Text, View } from "react-native";
import { Gesture, GestureDetector, GestureHandlerRootView, } from "react-native-gesture-handler";
import Animated, { runOnJS, useAnimatedStyle, useSharedValue, } from "react-native-reanimated";

import { Metrics } from "@/src/constants/Metrics";
import { Colors } from "@/src/constants/Colors";
import { ClothingItem, useOutfit } from "@/src/state/OutfitContext";
import { getOverlayLayout } from "@/src/components/doll/overlayLayout";

const MIN_SIZE = 30;
const HANDLE_SIZE = 28;
const DISMISS_PAST_EDGE_MIN_PX = 4;
const DISMISS_PAST_EDGE_RATIO = 0.1;

type DraggableOverlayProps = {
	instanceId: string;
	item: ClothingItem;
	avatarWidth: number;
	avatarHeight: number;
	isSelected: boolean;
	onSelectInstance: (instanceId: string) => void;
	onDismissInstance: (instanceId: string) => void;
};

function DraggableOverlay({ instanceId, item, avatarWidth, avatarHeight, isSelected, onSelectInstance, onDismissInstance }: DraggableOverlayProps) {
	const {
		appliedInstances,
		overlayTransformsByInstanceId,
		setOverlayTransform,
		moveInstanceForward,
		moveInstanceBackward,
	} = useOutfit();
	const layerIndex = appliedInstances.findIndex((x) => x.instanceId === instanceId);
	const canMoveForward = layerIndex >= 0 && layerIndex < appliedInstances.length - 1;
	const canMoveBackward = layerIndex > 0;
	const savedTransform = overlayTransformsByInstanceId[instanceId];
	const layout = getOverlayLayout(item.categoryId);
	const hasImage = Boolean(item.image);
	const backgroundColor = item.color ?? Colors.activeButton;

	const defaultPixels = useMemo(() => ({
		left: (layout.leftPct / 100) * avatarWidth,
		top: (layout.topPct / 100) * avatarHeight,
		width: (layout.widthPct / 100) * avatarWidth,
		height: (layout.heightPct / 100) * avatarHeight,
	}), [layout, avatarWidth, avatarHeight]);

	const initialPixels = useMemo(() => {
		if (savedTransform) {
			return {
				left: (savedTransform.leftPct / 100) * avatarWidth,
				top: (savedTransform.topPct / 100) * avatarHeight,
				width: (savedTransform.widthPct / 100) * avatarWidth,
				height: (savedTransform.heightPct / 100) * avatarHeight,
			};
		}
		return defaultPixels;
	}, [savedTransform, defaultPixels, avatarWidth, avatarHeight]);

	const posX      = useSharedValue(initialPixels.left);
	const posY      = useSharedValue(initialPixels.top);
	const savedPosX = useSharedValue(initialPixels.left);
	const savedPosY = useSharedValue(initialPixels.top);

	const boxWidth    = useSharedValue(initialPixels.width);
	const boxHeight   = useSharedValue(initialPixels.height);
	const savedWidth  = useSharedValue(initialPixels.width);
	const savedHeight = useSharedValue(initialPixels.height);

	const persistLayout = useCallback(
		(px: number, py: number, w: number, h: number) => {
			setOverlayTransform(instanceId, {
				leftPct: (px / avatarWidth) * 100,
				topPct: (py / avatarHeight) * 100,
				widthPct: (w / avatarWidth) * 100,
				heightPct: (h / avatarHeight) * 100,
			});
		},
		[instanceId, avatarWidth, avatarHeight, setOverlayTransform]
	);

	const [interactionMode, setInteractionMode] = useState<"idle" | "drag" | "resize">("idle");
	const showChrome = isSelected && interactionMode === "idle";

	const onSelectTap = useCallback(() => {
		onSelectInstance(instanceId);
	}, [instanceId, onSelectInstance]);

	const handleDragEnd = useCallback(
		(px: number, py: number, w: number, h: number) => {
			const requiredPast = Math.max(DISMISS_PAST_EDGE_MIN_PX, DISMISS_PAST_EDGE_RATIO * w);
			if (px + w > avatarWidth + requiredPast) {
				setInteractionMode("idle");
				onDismissInstance(instanceId);
				return;
			}
			persistLayout(px, py, w, h);
			setInteractionMode("idle");
		},
		[avatarWidth, instanceId, onDismissInstance, persistLayout]
	);

	useEffect(() => {
		posX.value = initialPixels.left;
		posY.value = initialPixels.top;
		boxWidth.value = initialPixels.width;
		boxHeight.value = initialPixels.height;
	}, [initialPixels.left, initialPixels.top, initialPixels.width, initialPixels.height, posX, posY, boxWidth, boxHeight]);

	const dragGesture = useMemo(
		() =>
			Gesture.Pan()
				.onStart(() => {
					runOnJS(setInteractionMode)("drag");
					savedPosX.value = posX.value;
					savedPosY.value = posY.value;
				})
				.onUpdate((e) => {
					posX.value = savedPosX.value + e.translationX;
					posY.value = savedPosY.value + e.translationY;
				})
				.onEnd(() => {
					runOnJS(handleDragEnd)(posX.value, posY.value, boxWidth.value, boxHeight.value);
				})
				.onFinalize(() => {
					runOnJS(setInteractionMode)("idle");
				}),
		[handleDragEnd]
	);

	const resizeGesture = useMemo(
		() =>
			Gesture.Pan()
				.onStart(() => {
					runOnJS(setInteractionMode)("resize");
					savedWidth.value = boxWidth.value;
					savedHeight.value = boxHeight.value;
				})
				.onUpdate((e) => {
					boxWidth.value = Math.max(MIN_SIZE, savedWidth.value + e.translationX);
					boxHeight.value = Math.max(MIN_SIZE, savedHeight.value + e.translationY);
				})
				.onEnd(() => {
					runOnJS(persistLayout)(posX.value, posY.value, boxWidth.value, boxHeight.value);
					runOnJS(setInteractionMode)("idle");
				})
				.onFinalize(() => {
					runOnJS(setInteractionMode)("idle");
				}),
		[persistLayout]
	);

	const tapGesture = useMemo(
		() =>
			Gesture.Tap()
				.maxDistance(12)
				.onEnd(() => {
					runOnJS(onSelectTap)();
				}),
		[onSelectTap]
	);

	const dragOrTapGesture = useMemo(
		() => Gesture.Exclusive(tapGesture, dragGesture),
		[tapGesture, dragGesture]
	);

	const containerStyle = useAnimatedStyle(() => ({
		left:   posX.value,
		top:    posY.value,
		width:  boxWidth.value,
		height: boxHeight.value,
	}));

	return (
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
			<GestureDetector gesture={dragOrTapGesture}>
			<View style={[styles.overlayHitArea, { borderRadius: layout.borderRadius }]}>
			{hasImage && (
			<Image
				source={{ uri: item.image as string }}
				style={[styles.overlayImage, { borderRadius: layout.borderRadius }]}
			/>
			)}
			</View>
			</GestureDetector>

			{showChrome && (
			<View
				pointerEvents="none"
				style={[
					styles.overlaySelectionFrame,
					{ borderRadius: layout.borderRadius },
				]}
			/>
			)}

			{showChrome && (
			<View style={styles.layerControls} pointerEvents="box-none">
				<Pressable
					style={({ pressed }) => [
						styles.layerButton,
						!canMoveForward && styles.layerButtonDisabled,
						pressed && canMoveForward && styles.layerButtonPressed,
					]}
					disabled={!canMoveForward}
					onPress={() => {
						moveInstanceForward(instanceId);
					}}
					accessibilityRole="button"
					accessibilityLabel="Bring to front"
				>
					<Text style={styles.layerButtonIcon}>▲</Text>
				</Pressable>
				<Pressable
					style={({ pressed }) => [
						styles.layerButton,
						!canMoveBackward && styles.layerButtonDisabled,
						pressed && canMoveBackward && styles.layerButtonPressed,
					]}
					disabled={!canMoveBackward}
					onPress={() => {
						moveInstanceBackward(instanceId);
					}}
					accessibilityRole="button"
					accessibilityLabel="Send to back"
				>
					<Text style={styles.layerButtonIcon}>▼</Text>
				</Pressable>
			</View>
			)}

			{isSelected && (
			<GestureDetector gesture={resizeGesture}>
			<Animated.View style={styles.resizeHandle}>
				<View style={styles.gripDot} />
				<View style={styles.gripDot} />
				<View style={styles.gripDot} />
			</Animated.View>
			</GestureDetector>
			)}
		</Animated.View>
	);
}

export function DollView()
{
	const { appliedInstances, removeInstance } = useOutfit();
	const [selectedInstanceId, setSelectedInstanceId] = useState<string | null>(null);
	const selectInstance = useCallback((id: string) => {
		setSelectedInstanceId(id);
	}, []);

	const dismissInstance = useCallback((id: string) => {
		removeInstance(id);
		setSelectedInstanceId((s) => (s === id ? null : s));
	}, [removeInstance]);

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
				<Pressable
					style={StyleSheet.absoluteFill}
					onPress={() => {
						setSelectedInstanceId(null);
					}}
					accessibilityRole="button"
					accessibilityLabel="Clear outfit selection"
				/>
				<View style={styles.avatarImageWrap} pointerEvents="none">
				<Image
				source={require("@/assets/avatar.png")}
				style={styles.avatarImage}
				/>
				</View>

				{appliedInstances.map(({ instanceId, item }) => (
				<DraggableOverlay
					key={instanceId}
					instanceId={instanceId}
					item={item}
					avatarWidth={avatarWidth}
					avatarHeight={avatarHeight}
					isSelected={selectedInstanceId === instanceId}
					onSelectInstance={selectInstance}
					onDismissInstance={dismissInstance}
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
	avatarImageWrap:
	{
		...StyleSheet.absoluteFillObject,
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
		justifyContent: "center",
		alignItems: "center",
		overflow: "visible",
	},
	overlayHitArea:
	{
		...StyleSheet.absoluteFillObject,
		justifyContent: "center",
		alignItems: "center",
		overflow: "hidden",
	},
	overlaySelectionFrame:
	{
		...StyleSheet.absoluteFillObject,
		borderWidth: 2,
		borderColor: "rgba(0,0,0,0.35)",
		zIndex: 1,
	},
	layerControls:
	{
		position: "absolute",
		left: "100%",
		marginLeft: 6,
		top: 0,
		bottom: 0,
		justifyContent: "center",
		alignItems: "center",
		gap: 4,
		zIndex: 5,
	},
	layerButton:
	{
		width: 34,
		height: 34,
		borderRadius: 8,
		backgroundColor: "rgba(255,255,255,0.96)",
		borderWidth: 1.5,
		borderColor: "rgba(0,0,0,0.18)",
		justifyContent: "center",
		alignItems: "center",
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 1 },
		shadowOpacity: 0.2,
		shadowRadius: 3,
		elevation: 4,
	},
	layerButtonPressed:
	{
		backgroundColor: "rgba(0,0,0,0.06)",
	},
	layerButtonDisabled:
	{
		opacity: 0.35,
	},
	layerButtonIcon:
	{
		fontSize: 14,
		color: Colors.blackShadow,
		fontWeight: "700",
	},
	overlayImage:
	{
		position: "absolute",
		left: 0,
		top: 0,
		right: 0,
		bottom: 0,
		width: "100%",
		height: "100%",
		resizeMode: "contain",
	},
	resizeHandle:
	{
		zIndex: 2,
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

import React from "react";
import { Image, ImageBackground, StyleSheet, View } from "react-native";

import { Metrics } from "@/src/constants/Metrics";
import { Colors } from "@/src/constants/Colors";
import type { ClothingItem, OverlayTransform } from "@/src/state/OutfitContext";
import type { OutfitSnapshot } from "@/src/utils/outfitSnapshot";

import { getOverlayLayout } from "@/src/components/doll/overlayLayout";

type StaticLayerProps = {
	item: ClothingItem;
	transform: OverlayTransform;
	avatarWidth: number;
	avatarHeight: number;
	zIndex: number;
};

function StaticLayer({ item, transform, avatarWidth, avatarHeight, zIndex }: StaticLayerProps) {
	const layout = getOverlayLayout(item.categoryId);
	const hasImage = Boolean(item.image);
	const backgroundColor = item.color ?? Colors.activeButton;

	const left = (transform.leftPct / 100) * avatarWidth;
	const top = (transform.topPct / 100) * avatarHeight;
	const width = (transform.widthPct / 100) * avatarWidth;
	const height = (transform.heightPct / 100) * avatarHeight;

	return (
		<View
			pointerEvents="none"
			style={[
				styles.layer,
				{
					left,
					top,
					width,
					height,
					borderRadius: layout.borderRadius,
					backgroundColor: hasImage ? "transparent" : backgroundColor,
					opacity: hasImage ? 1 : 0.55,
					zIndex,
				},
			]}
		>
			{hasImage && (
				<Image
					source={{ uri: item.image as string }}
					style={[styles.layerImage, { borderRadius: layout.borderRadius }]}
				/>
			)}
		</View>
	);
}

type OutfitSnapshotPreviewProps = {
	snapshot: OutfitSnapshot;
	layoutWidth?: number;
	layoutHeight?: number;
	showPodium?: boolean;
};

const DOLL_ONLY_SIZE_BOOST = 1.22;

export function OutfitSnapshotPreview({
	snapshot,
	layoutWidth,
	layoutHeight,
	showPodium = true,
}: OutfitSnapshotPreviewProps) {
	const baseW = layoutWidth ?? Metrics.screenWidth;
	const baseH = layoutHeight ?? Metrics.screenHeight;
	let avatarWidth = baseW * 1.3;
	let avatarHeight = baseH * 0.78;
	if (!showPodium) {
		avatarWidth *= DOLL_ONLY_SIZE_BOOST;
		avatarHeight *= DOLL_ONLY_SIZE_BOOST;
	}
	const podiumW = baseW * 1.1;
	const podiumH = baseW * 1.0 * 0.54;

	const dollStack = (
		<View
			style={[
				showPodium ? styles.avatarWrapper : styles.avatarWrapperDollOnly,
				{
					width: avatarWidth,
					height: avatarHeight,
					...(showPodium
						? {
								bottom: baseH * 0.05,
								marginLeft: -(avatarWidth / 2),
							}
						: {}),
				},
			]}
		>
			<View style={styles.avatarImageWrap} pointerEvents="none">
				<Image source={require("@/assets/avatar.png")} style={styles.avatarImage} />
			</View>
			{snapshot.layers.map((layer, index) => (
				<StaticLayer
					key={`${layer.item.id}-${index}`}
					item={layer.item}
					transform={layer.transform}
					avatarWidth={avatarWidth}
					avatarHeight={avatarHeight}
					zIndex={index + 1}
				/>
			))}
		</View>
	);

	if (!showPodium) {
		return (
			<View style={styles.rootDollOnly}>
				{dollStack}
			</View>
		);
	}

	return (
		<View style={[styles.root, { paddingBottom: baseH * 0.011 }]}>
			<ImageBackground
				source={require("@/assets/podium.png")}
				style={[styles.podium, { width: podiumW, height: podiumH }]}
				imageStyle={styles.podiumImage}
			>
				{dollStack}
			</ImageBackground>
		</View>
	);
}

const styles = StyleSheet.create({
	root:
	{
		flex: 1,
		alignItems: "center",
		justifyContent: "flex-end",
	},
	rootDollOnly:
	{
		flex: 1,
		width: "100%",
		height: "100%",
		justifyContent: "center",
		alignItems: "center",
	},
	podium:
	{
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
	avatarWrapperDollOnly:
	{
		position: "relative",
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
	layer:
	{
		position: "absolute",
		justifyContent: "center",
		alignItems: "center",
		overflow: "hidden",
	},
	layerImage:
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
});

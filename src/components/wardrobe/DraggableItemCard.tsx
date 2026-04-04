import React, { useMemo, useRef } from "react";
import { Image, PanResponder, StyleSheet, Text, View } from "react-native";

import { ClothingItem } from "@/src/state/OutfitContext";

type DraggableItemCardProps = {
	item: ClothingItem;
	size: number;
	thresholdPx: number;
	disabled?: boolean;
	hiddenWhenActive?: boolean;
	isActiveDrag?: boolean;
	onDragStart: (item: ClothingItem) => void;
	onDragMove: (args: { moveX: number; moveY: number; progress: number }) => void;
	onDragRelease: (args: { progress: number }) => void;
};

function clamp01(x: number) {
  	return Math.max(0, Math.min(1, x));
}

export function DraggableItemCard({ item, size, thresholdPx, disabled, hiddenWhenActive,
			isActiveDrag, onDragStart, onDragMove, onDragRelease, }: DraggableItemCardProps) {
	const progressRef = useRef(0);
	const startMoveXRef = useRef<number | null>(null);

	const label = useMemo(() => item.name.trim().split(" ")[0] ?? item.name, [item.name]);

	const panResponder = useMemo(() => {
		return PanResponder.create({
		onStartShouldSetPanResponder: () => false,
		onMoveShouldSetPanResponder: (_evt, gesture) => {
			if (disabled)
				return (false);
			const absDx = Math.abs(gesture.dx);
			const absDy = Math.abs(gesture.dy);
			return (absDx > 10 && absDx > absDy);
		},
		onPanResponderGrant: (_evt, gesture) => {
			if (disabled)
				return ;
			startMoveXRef.current = gesture.moveX;
			onDragStart(item);
		},
		onPanResponderMove: (_evt, gesture) => {
			if (disabled)
				return ;
			const startMoveX = startMoveXRef.current ?? gesture.moveX ?? thresholdPx;
			const leftDistance = Math.max(0, startMoveX - gesture.moveX);
			const effectiveThresholdPx = Math.max(1, Math.min(thresholdPx, startMoveX) * 0.8);
			const progress = clamp01(leftDistance / effectiveThresholdPx);
			progressRef.current = progress;
			onDragMove({ moveX: gesture.moveX, moveY: gesture.moveY, progress });
		},
		onPanResponderRelease: () => {
			if (disabled)
				return ;
			onDragRelease({ progress: progressRef.current });
			startMoveXRef.current = null;
		},
		onPanResponderTerminate: () => {
			if (disabled)
				return ;
			onDragRelease({ progress: progressRef.current });
			startMoveXRef.current = null;
		},
		});
	}, [disabled, item, onDragMove, onDragRelease, onDragStart, thresholdPx]);

	const cardOpacity = hiddenWhenActive && isActiveDrag ? 0 : 1;

	return (
		<View
			{...panResponder.panHandlers}
			style={[
				styles.itemCard,
				{ width: size, height: size, opacity: cardOpacity, backgroundColor: "#FFF" },
			]}
			pointerEvents={disabled ? "none" : "auto"}
			>
			{item.image ? (
				<Image source={{ uri: item.image }} style={styles.media} />
			) : (
				<View style={[styles.imagePlaceholder, { backgroundColor: "#E5E7EB" }]} />
			)}
			<Text style={styles.label} numberOfLines={2}>
				{label}
			</Text>
		</View>
	);
}

const styles = StyleSheet.create({
	itemCard:
	{
		backgroundColor: "#FFF",
		borderRadius: 20,
		justifyContent: "center",
		alignItems: "center",
		elevation: 2,
	},
	imagePlaceholder:
	{
		width: "84%",
		height: "58%",
		borderRadius: 14,
		opacity: 0.35,
		marginBottom: 6,
	},
	media:
	{
		width: "84%",
		height: "58%",
		borderRadius: 14,
		marginBottom: 6,
		resizeMode: "cover",
	},
	label:
	{
		fontSize: 12,
		fontWeight: "700",
		color: "#222",
		textAlign: "center",
	},
});


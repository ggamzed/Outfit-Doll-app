import React, { useEffect, useMemo, useRef, useState } from "react";
import { Animated, FlatList, Image, StyleSheet, Text, View } from "react-native";
import { usePathname, useRouter } from "expo-router";

import { ScreenWrapper } from "@/src/components/common/ScreenWrapper";
import { DollView } from "@/src/components/doll/DollView";
import { DraggableItemCard } from "@/src/components/wardrobe/DraggableItemCard";
import { Colors } from "@/src/constants/Colors";
import { Metrics } from "@/src/constants/Metrics";
import { ClothingItem, useOutfit } from "@/src/state/OutfitContext";


const CATEGORIES = [
    { id: '1', name: 'All' },
    { id: '2', name: 'Jacket' },
    { id: '3', name: 'Top' },
    { id: '4', name: 'Bottom' },
    { id: '5', name: 'Dress' },
    { id: '6', name: 'Shoe' },
    { id: '7', name: 'Accessory' },
];

const CLOTHING_ITEMS: ClothingItem[] = [
	{ id: "1", categoryId: "3", name: "Siyah Tişört", image: "https://static.vecteezy.com/system/resources/thumbnails/027/112/690/small/black-t-shirt-mockup-isolated-on-transparent-background-ai-generative-png.png" },
	{ id: "2", categoryId: "3", name: "Beyaz Tişört", image: "https://png.pngtree.com/png-vector/20230902/ourmid/pngtree-white-t-shirt-mockup-realistic-t-shirt-png-image_9906363.png" },
	{ id: "3", categoryId: "4", name: "Mavi Kot", image: "https://static.vecteezy.com/system/resources/thumbnails/021/916/575/small/blue-jean-shorts-isolated-on-a-transparent-background-png.png" },
	{ id: "4", categoryId: "5", name: "Nike Air", image: null },
	{ id: "5", categoryId: "5", name: "bluz", image: null },
];

function clamp01(x: number) {
  	return Math.max(0, Math.min(1, x));
}

export default function WardrobeScreen()
{
	const router = useRouter();
	const pathname = usePathname();
	const isWardrobeRoute = (pathname ?? "").endsWith("/wardrobe");
	const [activeHeader, setActiveHeader] = useState<"Clothes" | "Outfits">("Clothes");
	const [activeCategory, setActiveCategory] = useState("1");

	const { applyItem } = useOutfit();

	const filteredItems = useMemo(() => {
		if (activeCategory === "1")
			return CLOTHING_ITEMS;
		return CLOTHING_ITEMS.filter((item) => item.categoryId === activeCategory);
	}, [activeCategory]);

	const itemCardSize = (Metrics.screenWidth - 50) / 3;
	const thresholdPx = Metrics.screenWidth * 0.10;
	const dragProgress = useRef(new Animated.Value(0)).current;
	
	const wardrobeTranslateX = dragProgress.interpolate({
		inputRange: [0, 1],
		outputRange: [0, Metrics.screenWidth],
	});

	const wardrobeOpacity = dragProgress.interpolate({
		inputRange: [0, 1],
		outputRange: [1, 0.4],
	});
	const [wardrobeDismissed, setWardrobeDismissed] = useState(false);
	const wardrobeDismissedRef = useRef(false);
	const [activeDragItemId, setActiveDragItemId] = useState<string | null>(null);
	const [ghostItem, setGhostItem] = useState<ClothingItem | null>(null);
	const ghostItemRef = useRef<ClothingItem | null>(null);
	const ghostOpacity = useRef(new Animated.Value(0)).current;
	const ghostX = useRef(new Animated.Value(0)).current;
	const ghostY = useRef(new Animated.Value(0)).current;

	useEffect(() => {
		if (!isWardrobeRoute)
			return;
		setWardrobeDismissed(false);
		wardrobeDismissedRef.current = false;
		setActiveDragItemId(null);
		dragProgress.setValue(0);
		ghostOpacity.setValue(0);
		ghostX.setValue(0);
		ghostY.setValue(0);
		ghostItemRef.current = null;
		setGhostItem(null);
	}, [isWardrobeRoute, dragProgress, ghostOpacity, ghostX, ghostY]);

	const wardrobeAnimatedStyle = {
		transform: [{ translateX: wardrobeTranslateX }],
		opacity: wardrobeOpacity,
	};

	const onDragStart = (item: ClothingItem) => {
		if (wardrobeDismissedRef.current)
			return;
		wardrobeDismissedRef.current = false;
		setActiveDragItemId(item.id);
		setGhostItem(item);
		ghostItemRef.current = item;
		ghostOpacity.setValue(1);
		dragProgress.setValue(0);
	};

	const onDragMove = ({ moveX, moveY, progress,
	} : {
		moveX: number;
		moveY: number;
		progress: number;
		}) => {
			if (wardrobeDismissedRef.current)
				return;
			dragProgress.setValue(clamp01(progress));
			ghostX.setValue(moveX - itemCardSize / 2);
			ghostY.setValue(moveY - itemCardSize / 2);
		};

  	const onDragRelease = ({ progress }: { progress: number }) => {
		const p = clamp01(progress);
		const item = ghostItemRef.current;

		setActiveDragItemId(null);

		if (p >= 1 && item && !wardrobeDismissedRef.current) {
			applyItem(item);
			setWardrobeDismissed(true);
			wardrobeDismissedRef.current = true;

			Animated.timing(dragProgress, {
				toValue: 1,
				duration: 450,
				useNativeDriver: false,
			}).start(() => {
				router.replace("/");
			});

			Animated.timing(ghostOpacity, {
				toValue: 0,
				duration: 200,
				useNativeDriver: false,
			}).start(() => {
				ghostItemRef.current = null;
				setGhostItem(null);
			});
			return ;
		}
		Animated.parallel([
			Animated.timing(dragProgress, {
				toValue: 0,
				duration: 180,
				useNativeDriver: false,
			}),
			Animated.timing(ghostOpacity, {
				toValue: 0,
				duration: 120,
				useNativeDriver: false,
			}),
			]).start(() => {
			ghostItemRef.current = null;
			setGhostItem(null);
			});
	};

  	return (
		<ScreenWrapper style={styles.container}>
			<View style={styles.stage}>
				<DollView />
				<Animated.View
					style={[styles.wardrobeLayer, wardrobeAnimatedStyle]}
					pointerEvents={wardrobeDismissed ? "none" : "auto"}
				>
				<View style={styles.headerContainer}>
					<View style={styles.headerOption}>
					<Text
						onPress={() => setActiveHeader("Clothes")}
						style={[
						styles.inactiveHeaderText,
						activeHeader === "Clothes" && styles.activeHeaderText,
						]}
					>
						Clothes
					</Text>
					{activeHeader === "Clothes" && <View style={styles.underline} />}
					</View>

					<View style={styles.headerOption}>
					<Text
						onPress={() => setActiveHeader("Outfits")}
						style={[
						styles.inactiveHeaderText,
						activeHeader === "Outfits" && styles.activeHeaderText,
						]}
					>
						Outfits
					</Text>
					{activeHeader === "Outfits" && <View style={styles.underline} />}
					</View>
				</View>

				<View style={styles.categoryContainer}>
					<FlatList
						horizontal
						showsHorizontalScrollIndicator={false}
						data={CATEGORIES}
						keyExtractor={(item) => item.id}
						contentContainerStyle={styles.categoryScrollContent}
						scrollEnabled={activeDragItemId == null}
						renderItem={({ item }) => (
						<View
						style={[
							styles.inactiveCategoryCircle,
							activeCategory === item.id && styles.activeCategoryCircle,
						]}
						>
						<Text
							onPress={() => setActiveCategory(item.id)}
							style={[
							styles.inactiveCategoryText,
							activeCategory === item.id && styles.activeCategoryText,
							]}
						>
							{item.name}
						</Text>
						</View>
					)}
					/>
				</View>

				<FlatList
					data={filteredItems}
					numColumns={3}
					keyExtractor={(item) => item.id}
					contentContainerStyle={styles.gridContent}
					columnWrapperStyle={styles.columnWrapper}
					scrollEnabled={activeDragItemId == null}
					renderItem={({ item }) => (
					<DraggableItemCard
						item={item}
						size={itemCardSize}
						thresholdPx={thresholdPx}
						disabled={wardrobeDismissed}
						hiddenWhenActive
						isActiveDrag={activeDragItemId === item.id}
						onDragStart={onDragStart}
						onDragMove={onDragMove}
						onDragRelease={onDragRelease}
					/>
					)}
				/>
				</Animated.View>

				<Animated.View
				pointerEvents="none"
				style={[
					styles.ghost,
					{
					opacity: ghostOpacity,
					width: itemCardSize,
					height: itemCardSize,
					left: ghostX,
					top: ghostY,
					},
				]}
				>
				{ghostItem?.image ? (
					<Image
					source={{ uri: ghostItem.image }}
					style={[styles.ghostImage, { width: itemCardSize, height: itemCardSize }]}
					/>
				) : (
					<View style={styles.ghostInner} />
				)}
				</Animated.View>
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
	stage:
	{
		flex: 1,
		position: "relative",
	},
	wardrobeLayer:
	{
		position: "absolute",
		top: 0,
		left: 0,
		right: 0,
		bottom: 0,
		backgroundColor: Colors.lightBackground,
		zIndex: 1,
		elevation: 5,
	},
	ghost:
	{
		position: "absolute",
		borderRadius: 20,
		borderWidth: 1,
		borderColor: "rgba(0,0,0,0.08)",
		elevation: 10,
		overflow: "hidden",
		zIndex: 10,
	},
	ghostInner:
	{
		width: "100%",
		height: "100%",
		backgroundColor: "rgba(255,255,255,0.25)",
	},
	ghostImage:
	{
		position: "absolute",
		left: 0,
		top: 0,
		right: 0,
		bottom: 0,
		resizeMode: "cover",
	},
	headerOption:
	{
		alignItems: "center",
	},
    headerContainer:
	{
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginTop: 10, //bunu wrapper a ekleyince üstte boşluk kalıyor
        paddingBottom: 20,
    },
    inactiveHeaderText:
	{
        fontSize: 18,
        fontWeight: '600',
		color: Colors.inactiveHeaderText,
    },
    activeHeaderText:
	{
        color: Colors.blackShadow,
    },
    underline:
	{
        height: 3,
        backgroundColor: Colors.blackShadow,
        width: '100%',
        marginTop: 4,
        borderRadius: 2,
    },

    categoryContainer:
	{
        paddingVertical: 5,
		//marginTop: 20,
    	alignItems: 'center',
    	width: '100%',
    },
    categoryScrollContent:
	{
		paddingHorizontal: 20, 
		alignItems: 'center',
		paddingBottom: 15,
		gap: 12,
    },
    inactiveCategoryCircle:
	{
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: Colors.inactiveButton,
        justifyContent: 'center',
        alignItems: 'center',
        //marginRight: 15,
        // Hafif gölge (iOS)
		shadowColor: Colors.blackShadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        // Gölge (Android)
        elevation: 3,
    },
    activeCategoryCircle:
	{
		backgroundColor: Colors.activeButton,

		// bu ikisi ayrı ayrı lazım mı?
        shadowOpacity: 0.4,
        elevation: 3.5,
    },
	inactiveCategoryText:
	{
        fontSize: 11,
        fontWeight: '600',
        color: Colors.inactiveButtonText,
    },
    activeCategoryText:
	{
		color: Colors.activeButtonText,
        
    },
	
    gridContent:
	{
        paddingHorizontal: 15,
        paddingBottom: 5,
    },
    columnWrapper:
	{
        justifyContent: 'flex-start',
        marginBottom: 15,
		gap: 10,
    },
    itemCard:
	{
        width: (Metrics.screenWidth - 50) / 3,
        height: (Metrics.screenWidth - 50) / 3,
        backgroundColor: '#FFF',
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 2,
    },
    imagePlaceholder:
	{
        justifyContent: 'center',
        alignItems: 'center',
    },
    itemImage:
	{
        width: '90%',
        height: '90%',
        resizeMode: 'contain',
    }
});
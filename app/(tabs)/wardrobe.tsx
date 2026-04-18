import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, usePathname, useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
	Alert,
	Animated,
	FlatList,
	Image,
	KeyboardAvoidingView,
	Modal,
	Platform,
	Pressable,
	StyleSheet,
	Text,
	TextInput,
	View,
} from "react-native";
import { FlatList as GestureFlatList, GestureHandlerRootView } from "react-native-gesture-handler";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ScreenWrapper } from "@/src/components/common/ScreenWrapper";
import { DollView } from "@/src/components/doll/DollView";
import { OutfitSnapshotPreview } from "@/src/components/doll/OutfitSnapshotPreview";
import { DraggableItemCard } from "@/src/components/wardrobe/DraggableItemCard";
import { Colors } from "@/src/constants/Colors";
import { WARDROBE_CATEGORIES } from "@/src/constants/wardrobeCategories";
import { Metrics } from "@/src/constants/Metrics";
import { deleteUserWardrobeItemsByIds, isUserWardrobeItemId } from "@/src/db/wardrobeItemsRepository";
import { ClothingItem, useOutfit } from "@/src/state/OutfitContext";
import { useOutfitLibrary, type SavedOutfitRecord } from "@/src/state/OutfitLibraryContext";
import { useUserWardrobeItems } from "@/src/state/UserWardrobeItemsContext";
import type { OutfitSnapshot } from "@/src/utils/outfitSnapshot";


const CLOTHING_ITEMS: ClothingItem[] = [
	{ id: "1", categoryId: "3", name: "Black T-shirt", image: "https://static.vecteezy.com/system/resources/thumbnails/027/112/690/small/black-t-shirt-mockup-isolated-on-transparent-background-ai-generative-png.png" },
	{ id: "2", categoryId: "3", name: "White T-shirt", image: "https://png.pngtree.com/png-vector/20230902/ourmid/pngtree-white-t-shirt-mockup-realistic-t-shirt-png-image_9906363.png" },
	{ id: "3", categoryId: "4", name: "Blue Jeans", image: "https://static.vecteezy.com/system/resources/thumbnails/021/916/575/small/blue-jean-shorts-isolated-on-a-transparent-background-png.png" },
	{ id: "4", categoryId: "5", name: "Nike Air", image: null },
	{ id: "5", categoryId: "5", name: "Blouse", image: null },
];

function clamp01(x: number) {
  	return Math.max(0, Math.min(1, x));
}

/** Same horizontal padding as Outfits grid (outfitsGridContent paddingHorizontal: 15) */
const ALBUM_VIEWER_GRID_GAP = 15;
/** White card inner width (screen width minus side gaps) */
const ALBUM_VIEWER_CARD_INNER_WIDTH = Metrics.screenWidth - ALBUM_VIEWER_GRID_GAP * 2;
/** Horizontal paging uses full screen width so card + margins scroll together */
const ALBUM_VIEWER_SNAP_PAGE_WIDTH = Metrics.screenWidth;

export default function WardrobeScreen()
{
	const router = useRouter();
	const pathname = usePathname();
	const insets = useSafeAreaInsets();
	const isWardrobeRoute = (pathname ?? "").endsWith("/wardrobe");
	const [activeHeader, setActiveHeader] = useState<"Clothes" | "Outfits">("Clothes");
	const [activeCategory, setActiveCategory] = useState("1");
	const [clothesSelectMode, setClothesSelectMode] = useState(false);
	const [selectedClothingIds, setSelectedClothingIds] = useState<string[]>([]);
	const [outfitsSelectMode, setOutfitsSelectMode] = useState(false);
	const [selectedAlbumIds, setSelectedAlbumIds] = useState<string[]>([]);
	const [newAlbumModalVisible, setNewAlbumModalVisible] = useState(false);
	const [newAlbumNameDraft, setNewAlbumNameDraft] = useState("");
	const [albumViewer, setAlbumViewer] = useState<{ id: string; name: string } | null>(null);
	const [albumViewerPagerH, setAlbumViewerPagerH] = useState(Metrics.screenHeight * 0.62);
	const [albumViewerPageIndex, setAlbumViewerPageIndex] = useState(0);
	const albumViewerPagerRef = useRef<FlatList<SavedOutfitRecord>>(null);

	const { applyItem, applySnapshot } = useOutfit();
	const { albums, addAlbum, removeAlbumsByIds, savedOutfits, removeSavedOutfit } = useOutfitLibrary();
	const { userItems, reload: reloadUserWardrobe } = useUserWardrobeItems();

	useFocusEffect(
		useCallback(() => {
			void reloadUserWardrobe();
		}, [reloadUserWardrobe])
	);

	const allClothingItems = useMemo(() => [...CLOTHING_ITEMS, ...userItems], [userItems]);

	const outfitsInOpenAlbum = useMemo(() => {
		if (!albumViewer)
			return [];
		return savedOutfits.filter((s) => s.albumId === albumViewer.id);
	}, [savedOutfits, albumViewer]);

	/** Latest saved outfit snapshot per album for grid thumbnails */
	const albumCoverSnapshotById = useMemo(() => {
		const m = new Map<string, OutfitSnapshot>();
		for (const a of albums) {
			const latest = savedOutfits
				.filter((s) => s.albumId === a.id)
				.sort((x, y) => y.savedAt.localeCompare(x.savedAt))[0];
			if (latest)
				m.set(a.id, latest.snapshot);
		}
		return m;
	}, [albums, savedOutfits]);

	const outfitCountByAlbumId = useMemo(() => {
		const m = new Map<string, number>();
		for (const s of savedOutfits) {
			m.set(s.albumId, (m.get(s.albumId) ?? 0) + 1);
		}
		return m;
	}, [savedOutfits]);

	const closeAlbumViewer = useCallback(() => {
		setAlbumViewer(null);
	}, []);

	const openAlbumViewer = useCallback((album: { id: string; name: string }) => {
		setAlbumViewer({ id: album.id, name: album.name });
		setAlbumViewerPageIndex(0);
		setOutfitsSelectMode(false);
		setSelectedAlbumIds([]);
	}, []);

	const confirmDeleteCurrentOutfit = useCallback(() => {
		const record = outfitsInOpenAlbum[albumViewerPageIndex];
		if (!record)
			return;
		Alert.alert(
			"Delete outfit",
			"Are you sure you want to delete this saved outfit?",
			[
				{ text: "Cancel", style: "cancel" },
				{
					text: "Delete",
					style: "destructive",
					onPress: () => {
						const idx = albumViewerPageIndex;
						const beforeLen = outfitsInOpenAlbum.length;
						removeSavedOutfit(record.id);
						const afterLen = beforeLen - 1;
						const nextIdx = afterLen <= 0 ? 0 : Math.min(idx, afterLen - 1);
						setAlbumViewerPageIndex(nextIdx);
						setTimeout(() => {
							albumViewerPagerRef.current?.scrollToOffset({
								offset: nextIdx * ALBUM_VIEWER_SNAP_PAGE_WIDTH,
								animated: false,
							});
						}, 0);
					},
				},
			],
		);
	}, [albumViewerPageIndex, outfitsInOpenAlbum, removeSavedOutfit]);

	const confirmUseCurrentOutfit = useCallback(() => {
		const record = outfitsInOpenAlbum[albumViewerPageIndex];
		if (!record)
			return;
		Alert.alert(
			"Use outfit",
			"Replace the outfit on the home screen with this one?",
			[
				{ text: "Cancel", style: "cancel" },
				{
					text: "Replace",
					onPress: () => {
						applySnapshot(record.snapshot);
						closeAlbumViewer();
						router.replace("/");
					},
				},
			],
		);
	}, [albumViewerPageIndex, outfitsInOpenAlbum, applySnapshot, closeAlbumViewer, router]);

	const openNewAlbumModal = useCallback(() => {
		setNewAlbumNameDraft("");
		setNewAlbumModalVisible(true);
	}, []);

	const dismissNewAlbumModal = useCallback(() => {
		setNewAlbumModalVisible(false);
		setNewAlbumNameDraft("");
	}, []);

	const confirmNewAlbum = useCallback(() => {
		const name = newAlbumNameDraft.trim();
		if (!name)
			return;
		addAlbum(name);
		dismissNewAlbumModal();
	}, [newAlbumNameDraft, dismissNewAlbumModal, addAlbum]);

	const filteredItems = useMemo(() => {
		const base =
			activeCategory === "1"
				? allClothingItems
				: allClothingItems.filter((item) => item.categoryId === activeCategory);
		return base.filter((item) => Boolean(item.image));
	}, [activeCategory, allClothingItems]);

	const toggleClothesSelectMode = useCallback(() => {
		setClothesSelectMode((prev) => !prev);
	}, []);

	const exitClothesSelectMode = useCallback(() => {
		setClothesSelectMode(false);
	}, []);

	const toggleClothingItemSelected = useCallback((id: string) => {
		setSelectedClothingIds((prev) =>
			prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
		);
	}, []);

	const confirmDeleteSelectedClothes = useCallback(() => {
		const deletable = selectedClothingIds.filter(isUserWardrobeItemId);
		if (selectedClothingIds.length === 0) {
			Alert.alert("Select items", "Tap the clothes you want to remove, then tap the trash.");
			return;
		}
		if (deletable.length === 0) {
			Alert.alert("Can't delete", "Only items you added can be removed.");
			return;
		}
		Alert.alert(
			"Remove items",
			`Remove ${deletable.length} item(s) from your wardrobe?`,
			[
				{ text: "Cancel", style: "cancel" },
				{
					text: "Delete",
					style: "destructive",
					onPress: () => {
						void (async () => {
							try {
								await deleteUserWardrobeItemsByIds(deletable);
								await reloadUserWardrobe();
								setSelectedClothingIds([]);
								setClothesSelectMode(false);
							} catch (e) {
								console.warn(e);
								Alert.alert("Error", "Could not delete items. Please try again.");
							}
						})();
					},
				},
			],
		);
	}, [selectedClothingIds, reloadUserWardrobe]);

	const toggleOutfitsSelectMode = useCallback(() => {
		setOutfitsSelectMode((prev) => !prev);
	}, []);

	const exitOutfitsSelectMode = useCallback(() => {
		setOutfitsSelectMode(false);
	}, []);

	const toggleAlbumSelected = useCallback((id: string) => {
		setSelectedAlbumIds((prev) =>
			prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
		);
	}, []);

	const confirmDeleteSelectedAlbums = useCallback(() => {
		if (selectedAlbumIds.length === 0) {
			Alert.alert("Select albums", "Tap the albums you want to remove, then tap the trash.");
			return;
		}
		const ids = [...selectedAlbumIds];
		Alert.alert(
			"Remove albums",
			`Remove ${ids.length} album(s)? Saved outfits inside will be deleted too.`,
			[
				{ text: "Cancel", style: "cancel" },
				{
					text: "Delete",
					style: "destructive",
					onPress: () => {
						removeAlbumsByIds(ids);
						setSelectedAlbumIds([]);
						setOutfitsSelectMode(false);
						setAlbumViewer((prev) => {
							if (!prev)
								return null;
							if (ids.includes(prev.id))
								return null;
							return prev;
						});
					},
				},
			],
		);
	}, [selectedAlbumIds, removeAlbumsByIds]);

	useEffect(() => {
		if (!clothesSelectMode)
			setSelectedClothingIds([]);
	}, [clothesSelectMode]);

	useEffect(() => {
		if (!outfitsSelectMode)
			setSelectedAlbumIds([]);
	}, [outfitsSelectMode]);

	useEffect(() => {
		setSelectedClothingIds([]);
	}, [activeCategory]);

	const itemCardSize = (Metrics.screenWidth - 50) / 3;
	const outfitAlbumTileSize = (Metrics.screenWidth - 40) / 2;
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

	useEffect(() => {
		if (activeHeader !== "Outfits") {
			setNewAlbumModalVisible(false);
			setNewAlbumNameDraft("");
			setAlbumViewer(null);
			setOutfitsSelectMode(false);
			setSelectedAlbumIds([]);
		}
		if (activeHeader !== "Clothes") {
			setClothesSelectMode(false);
			setSelectedClothingIds([]);
		}
	}, [activeHeader]);

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
				<Pressable
					style={styles.headerContainer}
					disabled={
						!(
							(activeHeader === "Clothes" && clothesSelectMode) ||
							(activeHeader === "Outfits" && outfitsSelectMode)
						)
					}
					onPress={() => {
						if (activeHeader === "Clothes")
							exitClothesSelectMode();
						else if (activeHeader === "Outfits")
							exitOutfitsSelectMode();
					}}
				>
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
				</Pressable>

				{activeHeader === "Clothes" && (
				<>
				<Pressable
					style={styles.categoryContainer}
					disabled={!clothesSelectMode}
					onPress={exitClothesSelectMode}
				>
					<FlatList
						horizontal
						showsHorizontalScrollIndicator={false}
						data={WARDROBE_CATEGORIES}
						keyExtractor={(item) => item.id}
						contentContainerStyle={styles.categoryScrollContent}
						scrollEnabled={activeDragItemId == null}
						renderItem={({ item }) => (
						<Pressable
							onPress={() => setActiveCategory(item.id)}
							style={({ pressed }) => [
							styles.inactiveCategoryCircle,
							activeCategory === item.id && styles.activeCategoryCircle,
							pressed && styles.categoryCirclePressed,
							]}
							accessibilityRole="button"
							accessibilityState={{ selected: activeCategory === item.id }}
						>
						<Text
							style={[
							styles.inactiveCategoryText,
							activeCategory === item.id && styles.activeCategoryText,
							]}
						>
							{item.name}
						</Text>
						</Pressable>
					)}
					/>
				</Pressable>

				<FlatList
					data={filteredItems}
					numColumns={3}
					keyExtractor={(item) => item.id}
					extraData={`${clothesSelectMode}-${selectedClothingIds.join(",")}`}
					contentContainerStyle={[
						styles.gridContent,
						styles.gridContentClothesFabPad,
						clothesSelectMode && styles.gridContentFlexGrow,
					]}
					columnWrapperStyle={styles.columnWrapper}
					scrollEnabled={activeDragItemId == null}
					ListHeaderComponent={
						clothesSelectMode ? (
							<Pressable
								onPress={exitClothesSelectMode}
								style={styles.clothesListDismissGap}
								accessibilityLabel="Dismiss selection mode"
							/>
						) : null
					}
					ListFooterComponent={
						clothesSelectMode ? (
							<Pressable
								onPress={exitClothesSelectMode}
								style={styles.clothesListDismissFooter}
								accessibilityLabel="Dismiss selection mode"
							/>
						) : null
					}
					renderItem={({ item }) => (
					<Pressable
						disabled={!clothesSelectMode}
						onPress={() => toggleClothingItemSelected(item.id)}
						style={[styles.clothesGridCell, { width: itemCardSize }]}
					>
					<DraggableItemCard
						item={item}
						size={itemCardSize}
						thresholdPx={thresholdPx}
						disabled={wardrobeDismissed || clothesSelectMode}
						hiddenWhenActive
						isActiveDrag={activeDragItemId === item.id}
						selectionMode={clothesSelectMode}
						selected={selectedClothingIds.includes(item.id)}
						onDragStart={onDragStart}
						onDragMove={onDragMove}
						onDragRelease={onDragRelease}
					/>
					</Pressable>
					)}
				/>

				<View
					pointerEvents="box-none"
					style={[
						styles.clothesFabContainer,
						{ bottom: Math.max(insets.bottom - 4, 0) },
					]}
				>
					<View style={styles.clothesFabRow}>
						<View style={styles.clothesTrashSlot}>
							{clothesSelectMode ? (
								<Pressable
									onPress={confirmDeleteSelectedClothes}
									style={({ pressed }) => [
										styles.clothesDeleteIconBtn,
										pressed && styles.categoryCirclePressed,
									]}
									accessibilityRole="button"
									accessibilityLabel="Delete selected clothes"
								>
									<Ionicons name="trash-outline" size={15} color={Colors.blackShadow} />
								</Pressable>
							) : null}
						</View>
						<Pressable
							onPress={toggleClothesSelectMode}
							style={({ pressed }) => [
								styles.clothesSelectChip,
								clothesSelectMode && styles.clothesSelectChipActive,
								pressed && styles.categoryCirclePressed,
							]}
							accessibilityRole="button"
							accessibilityState={{ selected: clothesSelectMode }}
							accessibilityLabel="Select clothes"
						>
							<Text
								style={[
									styles.clothesSelectChipText,
									clothesSelectMode && styles.clothesSelectChipTextActive,
								]}
							>
								Select
							</Text>
						</Pressable>
					</View>
				</View>
				</>
				)}

				{activeHeader === "Outfits" && (
				<>
				<View style={styles.outfitsToolbar}>
					<Pressable
						onPress={openNewAlbumModal}
						style={({ pressed }) => [
							styles.newAlbumPlusCircle,
							newAlbumModalVisible && styles.newAlbumPlusCircleActive,
							pressed && styles.newAlbumPlusCirclePressed,
						]}
						accessibilityRole="button"
						accessibilityLabel="Create new album"
						accessibilityState={{ selected: newAlbumModalVisible }}
					>
						<Text
							style={[
								styles.newAlbumPlus,
								newAlbumModalVisible && styles.newAlbumPlusTextActive,
							]}
						>
							+
						</Text>
					</Pressable>
				</View>

				<FlatList
					data={albums}
					numColumns={2}
					keyExtractor={(item) => item.id}
					extraData={`${outfitsSelectMode}-${selectedAlbumIds.join(",")}`}
					contentContainerStyle={[
						styles.outfitsGridContent,
						styles.gridContentClothesFabPad,
						outfitsSelectMode && styles.gridContentFlexGrow,
					]}
					columnWrapperStyle={styles.outfitsColumnWrapper}
					scrollEnabled
					ListHeaderComponent={
						outfitsSelectMode ? (
							<Pressable
								onPress={exitOutfitsSelectMode}
								style={styles.clothesListDismissGap}
								accessibilityLabel="Dismiss selection mode"
							/>
						) : null
					}
					ListFooterComponent={
						outfitsSelectMode ? (
							<Pressable
								onPress={exitOutfitsSelectMode}
								style={styles.clothesListDismissFooter}
								accessibilityLabel="Dismiss selection mode"
							/>
						) : null
					}
					renderItem={({ item }) => {
						const cover = albumCoverSnapshotById.get(item.id);
						const outfitCount = outfitCountByAlbumId.get(item.id) ?? 0;
						const albumSelected = selectedAlbumIds.includes(item.id);
						return (
							<Pressable
								onPress={() => {
									if (outfitsSelectMode)
										toggleAlbumSelected(item.id);
									else
										openAlbumViewer({ id: item.id, name: item.name });
								}}
								style={({ pressed }) => [
									styles.albumCell,
									{ width: outfitAlbumTileSize },
									pressed && !outfitsSelectMode && styles.albumCellPressed,
								]}
								accessibilityRole="button"
								accessibilityLabel={`${item.name}, ${outfitCount} outfit`}
							>
								<View
									style={[
										styles.albumTile,
										{
											width: outfitAlbumTileSize,
											height: outfitAlbumTileSize,
										},
										outfitsSelectMode &&
											!albumSelected &&
											styles.albumTileDimmed,
									]}
								>
									<View style={styles.albumTilePreviewInner}>
										{cover ? (
											<OutfitSnapshotPreview
												snapshot={cover}
												layoutWidth={outfitAlbumTileSize}
												layoutHeight={outfitAlbumTileSize}
												showPodium={false}
											/>
										) : (
											<View style={styles.albumTileEmptyPreview}>
												<Ionicons
													name="images-outline"
													size={Math.min(36, outfitAlbumTileSize * 0.22)}
													color={Colors.inactiveButton}
												/>
											</View>
										)}
									</View>
									{outfitsSelectMode && albumSelected ? (
										<>
											<View style={styles.albumSelectionRing} pointerEvents="none" />
											<View style={styles.albumSelectionCheck} pointerEvents="none">
												<Ionicons
													name="checkmark-circle"
													size={22}
													color={Colors.activeButton}
												/>
											</View>
										</>
									) : null}
								</View>
								<Text style={styles.albumTileTitle} numberOfLines={2}>
									{item.name}
								</Text>
								<Text style={styles.albumTileCount}>
									{outfitCount} outfit
								</Text>
							</Pressable>
						);
					}}
				/>

				<View
					pointerEvents="box-none"
					style={[
						styles.clothesFabContainer,
						{ bottom: Math.max(insets.bottom - 4, 0) },
					]}
				>
					<View style={styles.clothesFabRow}>
						<View style={styles.clothesTrashSlot}>
							{outfitsSelectMode ? (
								<Pressable
									onPress={confirmDeleteSelectedAlbums}
									style={({ pressed }) => [
										styles.clothesDeleteIconBtn,
										pressed && styles.categoryCirclePressed,
									]}
									accessibilityRole="button"
									accessibilityLabel="Delete selected albums"
								>
									<Ionicons name="trash-outline" size={15} color={Colors.blackShadow} />
								</Pressable>
							) : null}
						</View>
						<Pressable
							onPress={toggleOutfitsSelectMode}
							style={({ pressed }) => [
								styles.clothesSelectChip,
								outfitsSelectMode && styles.clothesSelectChipActive,
								pressed && styles.categoryCirclePressed,
							]}
							accessibilityRole="button"
							accessibilityState={{ selected: outfitsSelectMode }}
							accessibilityLabel="Select albums"
						>
							<Text
								style={[
									styles.clothesSelectChipText,
									outfitsSelectMode && styles.clothesSelectChipTextActive,
								]}
							>
								Select
							</Text>
						</Pressable>
					</View>
				</View>
				</>
				)}
				</Animated.View>

				<Modal
					visible={newAlbumModalVisible}
					transparent
					animationType="fade"
					onRequestClose={dismissNewAlbumModal}
				>
					<KeyboardAvoidingView
						style={styles.newAlbumModalRoot}
						behavior={Platform.OS === "ios" ? "padding" : undefined}
					>
						<Pressable
							style={styles.newAlbumModalBackdrop}
							onPress={dismissNewAlbumModal}
							accessibilityLabel="Close"
						/>
						<View style={styles.newAlbumModalCard} pointerEvents="box-none">
							<Text style={styles.newAlbumModalTitle}>Album name</Text>
							<Text style={styles.newAlbumModalHint}>
								Enter a name for your new album
							</Text>
							<TextInput
								value={newAlbumNameDraft}
								onChangeText={setNewAlbumNameDraft}
								placeholder="e.g. Summer looks"
								placeholderTextColor="rgba(0,0,0,0.35)"
								style={styles.newAlbumModalInput}
								autoFocus
								maxLength={48}
								returnKeyType="done"
								onSubmitEditing={() => {
									if (newAlbumNameDraft.trim())
										confirmNewAlbum();
								}}
							/>
							<View style={styles.newAlbumModalActions}>
								<Pressable
									onPress={dismissNewAlbumModal}
									style={({ pressed }) => [
										styles.newAlbumModalButton,
										styles.newAlbumModalButtonSecondary,
										pressed && styles.newAlbumModalButtonPressed,
									]}
								>
									<Text style={styles.newAlbumModalButtonTextSecondary}>Cancel</Text>
								</Pressable>
								<Pressable
									onPress={confirmNewAlbum}
									disabled={!newAlbumNameDraft.trim()}
									style={({ pressed }) => [
										styles.newAlbumModalButton,
										styles.newAlbumModalButtonPrimary,
										!newAlbumNameDraft.trim() && styles.newAlbumModalButtonDisabled,
										pressed && newAlbumNameDraft.trim() && styles.newAlbumModalButtonPressed,
									]}
								>
									<Text style={styles.newAlbumModalButtonTextPrimary}>Add</Text>
								</Pressable>
							</View>
						</View>
					</KeyboardAvoidingView>
				</Modal>

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

			<Modal
				visible={albumViewer != null}
				animationType="none"
				presentationStyle="fullScreen"
				onRequestClose={closeAlbumViewer}
			>
				<GestureHandlerRootView style={styles.albumViewerGestureRoot}>
					<View
						style={[
							styles.albumViewerRoot,
							{
								paddingTop: insets.top,
								paddingBottom: insets.bottom,
							},
						]}
					>
						<View style={styles.albumViewerHeader}>
							<Pressable
								onPress={closeAlbumViewer}
								style={({ pressed }) => [
									styles.albumViewerBack,
									pressed && styles.albumViewerBackPressed,
								]}
								accessibilityRole="button"
								accessibilityLabel="Back"
							>
								<Text style={styles.albumViewerBackText}>‹ Back</Text>
							</Pressable>
							<Text style={styles.albumViewerTitle} numberOfLines={1}>
								{albumViewer?.name ?? ""}
							</Text>
							<View style={styles.albumViewerHeaderActions}>
								{outfitsInOpenAlbum.length > 0 && (
									<>
										<Pressable
											onPress={confirmUseCurrentOutfit}
											style={({ pressed }) => [
												styles.albumViewerHeaderIconBtn,
												pressed && styles.albumViewerHeaderIconBtnPressed,
											]}
											accessibilityRole="button"
											accessibilityLabel="Apply outfit"
										>
											<Ionicons name="shirt-outline" size={22} color={Colors.blackShadow} />
										</Pressable>
										<Pressable
											onPress={confirmDeleteCurrentOutfit}
											style={({ pressed }) => [
												styles.albumViewerHeaderIconBtn,
												pressed && styles.albumViewerHeaderIconBtnPressed,
											]}
											accessibilityRole="button"
											accessibilityLabel="Delete"
										>
											<Ionicons name="trash-outline" size={22} color={Colors.blackShadow} />
										</Pressable>
									</>
								)}
							</View>
						</View>
						<View
							style={styles.albumViewerPagerBody}
							onLayout={(e) => {
								const h = e.nativeEvent.layout.height;
								if (h > 0)
									setAlbumViewerPagerH(h);
							}}
						>
							{outfitsInOpenAlbum.length === 0 ? (
								<View style={styles.albumViewerPageShell}>
									<View style={styles.albumViewerGridCard}>
										<View style={styles.albumViewerEmpty}>
											<Text style={styles.albumViewerEmptyText}>
												No saved outfits in this album yet. Save from the home screen to add some.
											</Text>
										</View>
									</View>
								</View>
							) : (
								<GestureFlatList<SavedOutfitRecord>
									ref={albumViewerPagerRef as never}
									data={outfitsInOpenAlbum}
									horizontal
									pagingEnabled
									nestedScrollEnabled
									showsHorizontalScrollIndicator={false}
									decelerationRate="fast"
									{...(Platform.OS === "android"
										? { overScrollMode: "auto" as const }
										: {})}
									bounces
									alwaysBounceHorizontal
									keyExtractor={(record) => record.id}
									getItemLayout={(_, index) => ({
										length: ALBUM_VIEWER_SNAP_PAGE_WIDTH,
										offset: ALBUM_VIEWER_SNAP_PAGE_WIDTH * index,
										index,
									})}
									onMomentumScrollEnd={(e) => {
										const x = e.nativeEvent.contentOffset.x;
										const page = Math.round(x / ALBUM_VIEWER_SNAP_PAGE_WIDTH);
										const max = Math.max(0, outfitsInOpenAlbum.length - 1);
										setAlbumViewerPageIndex(Math.max(0, Math.min(page, max)));
									}}
									renderItem={({ item: record }) => (
										<View
											style={[
												styles.albumViewerSnapPage,
												{ height: albumViewerPagerH },
											]}
										>
											<View style={styles.albumViewerPageShell}>
												<View style={styles.albumViewerGridCard}>
													<View style={styles.albumViewerClipPage}>
														<View style={styles.albumViewerClipInner}>
															<OutfitSnapshotPreview snapshot={record.snapshot} />
														</View>
													</View>
												</View>
											</View>
										</View>
									)}
									style={styles.albumViewerPager}
								/>
							)}
						</View>
					</View>
				</GestureHandlerRootView>
			</Modal>
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
        marginTop: 10,
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
        // Light shadow (iOS)
		shadowColor: Colors.blackShadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        // Shadow (Android)
        elevation: 3,
    },
    activeCategoryCircle:
	{
		backgroundColor: Colors.activeButton,

        shadowOpacity: 0.4,
        elevation: 3.5,
    },
	categoryCirclePressed:
	{
		opacity: 0.88,
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

	clothesFabContainer:
	{
		position: "absolute",
		right: 16,
		zIndex: 40,
		elevation: 40,
	},
	clothesFabRow:
	{
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "flex-end",
		gap: 6,
		minHeight: 30,
	},
	/** Keeps Select’s position fixed when trash is shown vs hidden. */
	clothesTrashSlot:
	{
		width: 30,
		height: 30,
	},
	clothesSelectChip:
	{
		minWidth: 62,
		height: 30,
		paddingHorizontal: 9,
		justifyContent: "center",
		alignItems: "center",
		borderRadius: 15,
		backgroundColor: Colors.inactiveButton,
		shadowColor: Colors.blackShadow,
		shadowOffset: { width: 0, height: 1 },
		shadowOpacity: 0.08,
		shadowRadius: 3,
		elevation: 2,
	},
	clothesSelectChipActive:
	{
		backgroundColor: Colors.activeButton,
	},
	clothesSelectChipText:
	{
		fontSize: 11,
		fontWeight: "600",
		color: Colors.inactiveButtonText,
	},
	clothesSelectChipTextActive:
	{
		color: Colors.activeButtonText,
	},
	clothesDeleteIconBtn:
	{
		width: 30,
		height: 30,
		borderRadius: 15,
		backgroundColor: Colors.inactiveButton,
		justifyContent: "center",
		alignItems: "center",
		shadowColor: Colors.blackShadow,
		shadowOffset: { width: 0, height: 1 },
		shadowOpacity: 0.08,
		shadowRadius: 3,
		elevation: 2,
	},
	clothesGridCell:
	{
		alignItems: "center",
	},
	
    gridContent:
	{
        paddingHorizontal: 15,
        paddingBottom: 5,
    },
	gridContentClothesFabPad:
	{
		paddingBottom: 64,
	},
	gridContentFlexGrow:
	{
		flexGrow: 1,
	},
	clothesListDismissGap:
	{
		height: 14,
		width: "100%",
	},
	clothesListDismissFooter:
	{
		minHeight: Math.max(280, Metrics.screenHeight * 0.38),
		width: "100%",
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
    },
	outfitsToolbar:
	{
		paddingHorizontal: 15,
		paddingTop: 4,
		paddingBottom: 14,
		alignItems: "flex-start",
	},
	newAlbumPlusCircle:
	{
		width: 40,
		height: 40,
		borderRadius: 20,
		backgroundColor: Colors.inactiveButton,
		justifyContent: "center",
		alignItems: "center",
		shadowColor: Colors.blackShadow,
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.1,
		shadowRadius: 4,
		elevation: 3,
	},
	newAlbumPlusCircleActive:
	{
		backgroundColor: Colors.activeButton,
		shadowOpacity: 0.4,
		elevation: 3.5,
	},
	newAlbumPlusCirclePressed:
	{
		opacity: 0.88,
		transform: [{ scale: 0.96 }],
	},
	newAlbumPlus:
	{
		fontSize: 26,
		fontWeight: "600",
		color: Colors.inactiveButtonText,
		marginTop: -2,
	},
	newAlbumPlusTextActive:
	{
		color: Colors.activeButtonText,
	},
	newAlbumModalRoot:
	{
		flex: 1,
		justifyContent: "center",
		paddingHorizontal: 28,
	},
	newAlbumModalBackdrop:
	{
		...StyleSheet.absoluteFillObject,
		backgroundColor: "rgba(48, 32, 48, 0.38)",
	},
	newAlbumModalCard:
	{
		width: "100%",
		maxWidth: 340,
		alignSelf: "center",
		zIndex: 1,
		backgroundColor: "#FFFCFE",
		borderRadius: 22,
		paddingHorizontal: 22,
		paddingTop: 22,
		paddingBottom: 18,
		borderWidth: 1,
		borderColor: "rgba(0,0,0,0.06)",
		shadowColor: Colors.blackShadow,
		shadowOffset: { width: 0, height: 8 },
		shadowOpacity: 0.12,
		shadowRadius: 20,
		elevation: 8,
	},
	newAlbumModalTitle:
	{
		fontSize: 18,
		fontWeight: "700",
		color: Colors.blackShadow,
		letterSpacing: -0.3,
	},
	newAlbumModalHint:
	{
		marginTop: 6,
		fontSize: 14,
		fontWeight: "500",
		color: Colors.inactiveHeaderText,
		lineHeight: 20,
	},
	newAlbumModalInput:
	{
		marginTop: 16,
		borderRadius: 14,
		borderWidth: 1,
		borderColor: "rgba(0,0,0,0.08)",
		backgroundColor: "rgba(255,255,255,0.95)",
		paddingHorizontal: 16,
		paddingVertical: Platform.OS === "ios" ? 14 : 12,
		fontSize: 16,
		color: Colors.blackShadow,
	},
	newAlbumModalActions:
	{
		flexDirection: "row",
		justifyContent: "flex-end",
		alignItems: "center",
		gap: 10,
		marginTop: 20,
	},
	newAlbumModalButton:
	{
		paddingVertical: 12,
		paddingHorizontal: 20,
		borderRadius: 14,
		minWidth: 88,
		alignItems: "center",
	},
	newAlbumModalButtonSecondary:
	{
		backgroundColor: "rgba(0,0,0,0.05)",
	},
	newAlbumModalButtonPrimary:
	{
		backgroundColor: Colors.activeButton,
	},
	newAlbumModalButtonDisabled:
	{
		opacity: 0.45,
	},
	newAlbumModalButtonPressed:
	{
		opacity: 0.88,
	},
	newAlbumModalButtonTextSecondary:
	{
		fontSize: 15,
		fontWeight: "600",
		color: Colors.inactiveButtonText,
	},
	newAlbumModalButtonTextPrimary:
	{
		fontSize: 15,
		fontWeight: "700",
		color: Colors.activeButtonText,
	},
	outfitsGridContent:
	{
		paddingHorizontal: 15,
		paddingBottom: 24,
	},
	outfitsColumnWrapper:
	{
		justifyContent: "flex-start",
		alignItems: "flex-start",
		marginBottom: 18,
		gap: 10,
	},
	albumCell:
	{
		marginBottom: 4,
	},
	albumCellPressed:
	{
		opacity: 0.92,
	},
	albumTile:
	{
		backgroundColor: "#FFF",
		borderRadius: 20,
		overflow: "hidden",
		elevation: 2,
		shadowColor: Colors.blackShadow,
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.08,
		shadowRadius: 4,
		borderWidth: 1,
		borderColor: "rgba(0,0,0,0.06)",
	},
	albumTilePreviewInner:
	{
		...StyleSheet.absoluteFillObject,
	},
	albumTileEmptyPreview:
	{
		...StyleSheet.absoluteFillObject,
		justifyContent: "center",
		alignItems: "center",
		backgroundColor: "rgba(0,0,0,0.04)",
	},
	albumTilePressed:
	{
		opacity: 0.92,
	},
	albumTileDimmed:
	{
		opacity: 0.55,
	},
	albumSelectionRing:
	{
		...StyleSheet.absoluteFillObject,
		borderRadius: 20,
		borderWidth: 3,
		borderColor: Colors.activeButton,
	},
	albumSelectionCheck:
	{
		position: "absolute",
		top: 8,
		right: 8,
	},
	albumTileTitle:
	{
		marginTop: 8,
		fontSize: 14,
		fontWeight: "700",
		color: Colors.blackShadow,
		textAlign: "center",
		width: "100%",
	},
	albumTileCount:
	{
		marginTop: 3,
		fontSize: 12,
		fontWeight: "600",
		color: Colors.inactiveHeaderText,
		textAlign: "center",
		width: "100%",
	},
	albumViewerGestureRoot:
	{
		flex: 1,
	},
	albumViewerRoot:
	{
		flex: 1,
		backgroundColor: Colors.darkBackground,
	},
	albumViewerPagerBody:
	{
		flex: 1,
		minHeight: 120,
	},
	albumViewerSnapPage:
	{
		width: ALBUM_VIEWER_SNAP_PAGE_WIDTH,
	},
	albumViewerPageShell:
	{
		flex: 1,
		paddingHorizontal: ALBUM_VIEWER_GRID_GAP,
		paddingBottom: 10,
	},
	albumViewerClipPage:
	{
		flex: 1,
		overflow: "hidden",
	},
	albumViewerClipInner:
	{
		position: "absolute",
		bottom: 0,
		width: Metrics.screenWidth,
		height: Metrics.screenHeight,
		left: (ALBUM_VIEWER_CARD_INNER_WIDTH - Metrics.screenWidth) / 2,
	},
	albumViewerHeader:
	{
		flexDirection: "row",
		alignItems: "center",
		paddingHorizontal: ALBUM_VIEWER_GRID_GAP,
		paddingBottom: 10,
	},
	albumViewerGridCard:
	{
		flex: 1,
		backgroundColor: Colors.lightBackground,
		borderRadius: 20,
		borderWidth: 1,
		borderColor: "rgba(0,0,0,0.06)",
		overflow: "hidden",
		shadowColor: Colors.blackShadow,
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.08,
		shadowRadius: 4,
		elevation: 2,
	},
	albumViewerBack:
	{
		paddingVertical: 10,
		paddingHorizontal: 12,
		minWidth: 72,
	},
	albumViewerBackPressed:
	{
		opacity: 0.65,
	},
	albumViewerBackText:
	{
		fontSize: 17,
		fontWeight: "600",
		color: Colors.blackShadow,
	},
	albumViewerTitle:
	{
		flex: 1,
		textAlign: "center",
		fontSize: 17,
		fontWeight: "700",
		color: Colors.blackShadow,
		paddingHorizontal: 8,
	},
	albumViewerHeaderActions:
	{
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "flex-end",
		gap: 2,
		minWidth: 72,
	},
	albumViewerHeaderIconBtn:
	{
		paddingVertical: 10,
		paddingHorizontal: 8,
	},
	albumViewerHeaderIconBtnPressed:
	{
		opacity: 0.55,
	},
	albumViewerPager:
	{
		flex: 1,
	},
	albumViewerEmpty:
	{
		flex: 1,
		justifyContent: "center",
		paddingHorizontal: 32,
	},
	albumViewerEmptyText:
	{
		textAlign: "center",
		fontSize: 15,
		lineHeight: 22,
		color: Colors.inactiveButtonText,
	},
});
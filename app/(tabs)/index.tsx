import { Ionicons } from "@expo/vector-icons";
import React, { useCallback, useEffect, useState } from "react";
import {
	Alert,
	FlatList,
	Modal,
	Pressable,
	StyleSheet,
	Text,
	View,
} from "react-native";
import { ScreenWrapper } from "@/src/components/common/ScreenWrapper";
import { Colors } from "@/src/constants/Colors";
import { DollView } from "@/src/components/doll/DollView";
import { useOutfit } from "@/src/state/OutfitContext";
import { useOutfitLibrary } from "@/src/state/OutfitLibraryContext";
import { buildOutfitSnapshot } from "@/src/utils/outfitSnapshot";

const SAVE_TOAST_MS = 2800;

export default function MainScreen()
{
	const { appliedInstances, overlayTransformsByInstanceId } = useOutfit();
	const { albums, saveOutfitToAlbum } = useOutfitLibrary();
	const [saveModalVisible, setSaveModalVisible] = useState(false);
	const [saveToastText, setSaveToastText] = useState<string | null>(null);

	const openSaveModal = useCallback(() => {
		if (appliedInstances.length === 0) {
			Alert.alert(
				"Nothing to save",
				"Drag clothes from the wardrobe onto the doll to build an outfit first."
			);
			return;
		}
		setSaveModalVisible(true);
	}, [appliedInstances.length]);

	const dismissSaveModal = useCallback(() => {
		setSaveModalVisible(false);
	}, []);

	const onSelectAlbum = useCallback(
		(albumId: string) => {
			const snapshot = buildOutfitSnapshot(appliedInstances, overlayTransformsByInstanceId);
			saveOutfitToAlbum(albumId, snapshot);
			setSaveModalVisible(false);
			const album = albums.find((a) => a.id === albumId);
			const name = album?.name?.trim() ?? "Album";
			setSaveToastText(`Added to “${name}”`);
		},
		[appliedInstances, overlayTransformsByInstanceId, saveOutfitToAlbum, albums]
	);

	useEffect(() => {
		if (!saveToastText)
			return;
		const t = setTimeout(() => {
			setSaveToastText(null);
		}, SAVE_TOAST_MS);
		return () => clearTimeout(t);
	}, [saveToastText]);

	return (
		<ScreenWrapper style={styles.container}>
			<View style={styles.shell}>
				<View style={styles.topBar}>
					<Pressable
						onPress={openSaveModal}
						style={({ pressed }) => [
							styles.saveButton,
							saveModalVisible && styles.saveButtonActive,
							pressed && styles.saveButtonPressed,
						]}
						accessibilityRole="button"
						accessibilityLabel="Save"
						accessibilityState={{ selected: saveModalVisible }}
					>
						<Ionicons
							name="save-outline"
							size={22}
							color={saveModalVisible ? Colors.activeButtonText : Colors.inactiveButtonText}
						/>
					</Pressable>
				</View>
				<View style={styles.dollArea}>
					<DollView />
				</View>
			</View>

			<Modal
				visible={saveModalVisible}
				transparent
				animationType="fade"
				onRequestClose={dismissSaveModal}
			>
				<View style={styles.saveModalRoot}>
					<Pressable
						style={styles.saveModalBackdrop}
						onPress={dismissSaveModal}
						accessibilityLabel="Close"
					/>
					<View style={styles.saveModalCard}>
						<Text style={styles.saveModalTitle}>Choose album</Text>
						<Text style={styles.saveModalHint}>
							Which album should this outfit be saved to?
						</Text>
						{albums.length === 0 ? (
							<Text style={styles.saveModalEmpty}>
								No albums yet. Go to Wardrobe → Outfits and tap + to create one.
							</Text>
						) : (
							<FlatList
								data={albums}
								keyExtractor={(a) => a.id}
								style={styles.saveModalList}
								showsVerticalScrollIndicator={false}
								renderItem={({ item }) => (
									<Pressable
										onPress={() => {
											onSelectAlbum(item.id);
										}}
										style={({ pressed }) => [
											styles.saveModalRow,
											pressed && styles.saveModalRowPressed,
										]}
									>
										<Text style={styles.saveModalRowText}>{item.name}</Text>
									</Pressable>
								)}
							/>
						)}
						<Pressable
							onPress={dismissSaveModal}
							style={({ pressed }) => [
								styles.saveModalCancel,
								pressed && styles.saveModalCancelPressed,
							]}
						>
							<Text style={styles.saveModalCancelText}>Cancel</Text>
						</Pressable>
					</View>
				</View>
			</Modal>

			{saveToastText != null && (
				<View
					style={[styles.saveToast, { bottom: 10 }]}
					pointerEvents="none"
					accessibilityLiveRegion="polite"
				>
					<Ionicons
						name="checkmark-circle"
						size={18}
						color={Colors.activeButtonText}
						style={styles.saveToastIcon}
					/>
					<Text style={styles.saveToastText} numberOfLines={2}>
						{saveToastText}
					</Text>
				</View>
			)}
		</ScreenWrapper>
	);
}

const styles = StyleSheet.create({
	container:
	{
		flex: 1,
		backgroundColor: Colors.lightBackground,
	},
	shell:
	{
		flex: 1,
	},
	topBar:
	{
		flexDirection: "row",
		justifyContent: "flex-end",
		alignItems: "center",
		paddingHorizontal: 16,
		paddingBottom: 8,
		zIndex: 2,
	},
	saveButton:
	{
		paddingVertical: 10,
		paddingHorizontal: 12,
		borderRadius: 14,
		backgroundColor: Colors.inactiveButton,
		justifyContent: "center",
		alignItems: "center",
		shadowColor: Colors.blackShadow,
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.1,
		shadowRadius: 4,
		elevation: 3,
	},
	saveButtonActive:
	{
		backgroundColor: Colors.activeButton,
		shadowOpacity: 0.4,
		elevation: 3.5,
	},
	saveButtonPressed:
	{
		opacity: 0.88,
		transform: [{ scale: 0.96 }],
	},
	saveToast:
	{
		position: "absolute",
		left: 16,
		right: 16,
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		paddingVertical: 11,
		paddingHorizontal: 14,
		borderRadius: 12,
		backgroundColor: Colors.activeButton,
		zIndex: 100,
		elevation: 12,
		shadowColor: Colors.blackShadow,
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.2,
		shadowRadius: 8,
	},
	saveToastIcon:
	{
		marginRight: 8,
	},
	saveToastText:
	{
		flexShrink: 1,
		fontSize: 14,
		fontWeight: "600",
		color: Colors.activeButtonText,
		textAlign: "center",
	},
	dollArea:
	{
		flex: 1,
	},
	saveModalRoot:
	{
		flex: 1,
		justifyContent: "center",
		paddingHorizontal: 28,
	},
	saveModalBackdrop:
	{
		...StyleSheet.absoluteFillObject,
		backgroundColor: "rgba(48, 32, 48, 0.38)",
	},
	saveModalCard:
	{
		zIndex: 1,
		width: "100%",
		maxWidth: 340,
		alignSelf: "center",
		maxHeight: "70%",
		backgroundColor: "#FFFCFE",
		borderRadius: 22,
		paddingHorizontal: 22,
		paddingTop: 22,
		paddingBottom: 16,
		borderWidth: 1,
		borderColor: "rgba(0,0,0,0.06)",
		shadowColor: Colors.blackShadow,
		shadowOffset: { width: 0, height: 8 },
		shadowOpacity: 0.12,
		shadowRadius: 20,
		elevation: 8,
	},
	saveModalTitle:
	{
		fontSize: 18,
		fontWeight: "700",
		color: Colors.blackShadow,
	},
	saveModalHint:
	{
		marginTop: 6,
		fontSize: 14,
		fontWeight: "500",
		color: Colors.inactiveHeaderText,
		lineHeight: 20,
	},
	saveModalEmpty:
	{
		marginTop: 16,
		fontSize: 14,
		lineHeight: 20,
		color: Colors.inactiveButtonText,
	},
	saveModalList:
	{
		marginTop: 14,
		maxHeight: 220,
	},
	saveModalRow:
	{
		paddingVertical: 14,
		paddingHorizontal: 12,
		borderRadius: 14,
		backgroundColor: "rgba(255,255,255,0.95)",
		borderWidth: 1,
		borderColor: "rgba(0,0,0,0.08)",
		marginBottom: 8,
	},
	saveModalRowPressed:
	{
		opacity: 0.88,
	},
	saveModalRowText:
	{
		fontSize: 16,
		fontWeight: "600",
		color: Colors.blackShadow,
	},
	saveModalCancel:
	{
		marginTop: 8,
		alignSelf: "center",
		paddingVertical: 10,
		paddingHorizontal: 16,
	},
	saveModalCancelPressed:
	{
		opacity: 0.7,
	},
	saveModalCancelText:
	{
		fontSize: 15,
		fontWeight: "600",
		color: Colors.inactiveButtonText,
	},
});

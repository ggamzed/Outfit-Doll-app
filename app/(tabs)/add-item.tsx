import { Ionicons } from "@expo/vector-icons";
import * as ImageManipulator from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import {
	ActivityIndicator,
	Alert,
	Image,
	Pressable,
	ScrollView,
	StyleSheet,
	Text,
	View,
} from "react-native";

import { ScreenWrapper } from "@/src/components/common/ScreenWrapper";
import { Colors } from "@/src/constants/Colors";
import { WARDROBE_CATEGORIES } from "@/src/constants/wardrobeCategories";
import {
	copyPickedImageToDocuments,
	insertUserWardrobeItem,
	newUserWardrobeItemId,
} from "@/src/db/wardrobeItemsRepository";
import { useUserWardrobeItems } from "@/src/state/UserWardrobeItemsContext";

const PICKABLE_CATEGORIES = WARDROBE_CATEGORIES.filter((c) => c.id !== "1");

export default function AddItemScreen() {
	const router = useRouter();
	const { reload } = useUserWardrobeItems();
	const [categoryId, setCategoryId] = useState(PICKABLE_CATEGORIES[0]?.id ?? "3");
	const [pickedUri, setPickedUri] = useState<string | null>(null);
	const [saving, setSaving] = useState(false);

	const canSave = useMemo(() => {
		return pickedUri != null && !saving;
	}, [pickedUri, saving]);

	const finalizePickedAsset = useCallback(async (uri: string) => {
		const manipulated = await ImageManipulator.manipulateAsync(uri, [], {
			compress: 0.88,
			format: ImageManipulator.SaveFormat.JPEG,
		});
		setPickedUri(manipulated.uri);
	}, []);

	const openCamera = useCallback(async () => {
		const { status } = await ImagePicker.requestCameraPermissionsAsync();
		if (status !== "granted") {
			Alert.alert("Permission needed", "Camera access is required to take a photo.");
			return;
		}
		const result = await ImagePicker.launchCameraAsync({
			mediaTypes: ImagePicker.MediaTypeOptions.Images,
			allowsEditing: true,
			aspect: [1, 1],
			quality: 0.92,
		});
		if (!result.canceled && result.assets[0]?.uri)
			void finalizePickedAsset(result.assets[0].uri);
	}, [finalizePickedAsset]);

	const openLibrary = useCallback(async () => {
		const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
		if (status !== "granted") {
			Alert.alert("Permission needed", "Photo library access is required to pick an image.");
			return;
		}
		const result = await ImagePicker.launchImageLibraryAsync({
			mediaTypes: ImagePicker.MediaTypeOptions.Images,
			allowsEditing: true,
			aspect: [1, 1],
			quality: 0.92,
		});
		if (!result.canceled && result.assets[0]?.uri)
			void finalizePickedAsset(result.assets[0].uri);
	}, [finalizePickedAsset]);

	const onSave = useCallback(async () => {
		if (!pickedUri)
			return;
		const displayName =
			PICKABLE_CATEGORIES.find((c) => c.id === categoryId)?.name ?? "Clothing";
		setSaving(true);
		try {
			const id = newUserWardrobeItemId();
			const permanentUri = await copyPickedImageToDocuments(pickedUri, id);
			await insertUserWardrobeItem({
				id,
				name: displayName,
				categoryId,
				localUri: permanentUri,
			});
			await reload();
			Alert.alert("Saved", "Your item was added to the wardrobe.", [
				{
					text: "OK",
					onPress: () => {
						setPickedUri(null);
						router.push("/wardrobe");
					},
				},
			]);
		} catch (e) {
			console.warn(e);
			Alert.alert("Could not save", "Please try again.");
		} finally {
			setSaving(false);
		}
	}, [pickedUri, categoryId, reload, router]);

	return (
		<ScreenWrapper style={styles.screen}>
			<ScrollView
				style={styles.flex}
				contentContainerStyle={styles.scroll}
				showsVerticalScrollIndicator={false}
			>
					<Text style={styles.title}>Add clothing</Text>

					<View style={styles.card}>
						<Text style={styles.label}>Category</Text>
						<ScrollView
							horizontal
							showsHorizontalScrollIndicator={false}
							contentContainerStyle={styles.categoryRow}
						>
							{PICKABLE_CATEGORIES.map((c) => (
								<Pressable
									key={c.id}
									onPress={() => setCategoryId(c.id)}
									style={({ pressed }) => [
										styles.categoryChip,
										categoryId === c.id && styles.categoryChipActive,
										pressed && styles.categoryChipPressed,
									]}
								>
									<Text
										style={[
											styles.categoryChipText,
											categoryId === c.id && styles.categoryChipTextActive,
										]}
									>
										{c.name}
									</Text>
								</Pressable>
							))}
						</ScrollView>

						<Text style={[styles.label, styles.labelSpaced]}>Photo</Text>
						<View style={styles.photoRow}>
							<Pressable
								onPress={openCamera}
								style={({ pressed }) => [styles.photoBtn, pressed && styles.photoBtnPressed]}
							>
								<Ionicons name="camera-outline" size={22} color={Colors.blackShadow} />
								<Text style={styles.photoBtnText}>Camera</Text>
							</Pressable>
							<Pressable
								onPress={openLibrary}
								style={({ pressed }) => [styles.photoBtn, pressed && styles.photoBtnPressed]}
							>
								<Ionicons name="images-outline" size={22} color={Colors.blackShadow} />
								<Text style={styles.photoBtnText}>Library</Text>
							</Pressable>
						</View>

						{pickedUri ? (
							<View style={styles.previewWrap}>
								<Image source={{ uri: pickedUri }} style={styles.preview} />
							</View>
						) : (
							<View style={styles.previewPlaceholder}>
								<Ionicons name="shirt-outline" size={40} color={Colors.inactiveButton} />
								<Text style={styles.previewHint}>No photo yet</Text>
							</View>
						)}
					</View>

					<Pressable
						onPress={onSave}
						disabled={!canSave}
						style={({ pressed }) => [
							styles.saveBtn,
							!canSave && styles.saveBtnDisabled,
							pressed && canSave && styles.saveBtnPressed,
						]}
					>
						{saving ? (
							<ActivityIndicator color={Colors.activeButtonText} />
						) : (
							<Text style={styles.saveBtnText}>Save to wardrobe</Text>
						)}
					</Pressable>
			</ScrollView>
		</ScreenWrapper>
	);
}

const styles = StyleSheet.create({
	screen:
	{
		flex: 1,
		backgroundColor: Colors.lightBackground,
	},
	flex:
	{
		flex: 1,
	},
	scroll:
	{
		paddingHorizontal: 20,
		paddingBottom: 32,
		paddingTop: 8,
	},
	title:
	{
		fontSize: 22,
		fontWeight: "700",
		color: Colors.blackShadow,
		letterSpacing: -0.3,
	},
	card:
	{
		marginTop: 20,
		backgroundColor: "#FFFCFE",
		borderRadius: 22,
		padding: 18,
		borderWidth: 1,
		borderColor: "rgba(0,0,0,0.06)",
		shadowColor: Colors.blackShadow,
		shadowOffset: { width: 0, height: 6 },
		shadowOpacity: 0.08,
		shadowRadius: 16,
		elevation: 4,
	},
	label:
	{
		fontSize: 13,
		fontWeight: "700",
		color: Colors.inactiveHeaderText,
		textTransform: "uppercase",
		letterSpacing: 0.4,
	},
	labelSpaced:
	{
		marginTop: 16,
	},
	categoryRow:
	{
		marginTop: 10,
		gap: 8,
		paddingRight: 4,
	},
	categoryChip:
	{
		paddingVertical: 8,
		paddingHorizontal: 14,
		borderRadius: 16,
		backgroundColor: Colors.inactiveButton,
	},
	categoryChipActive:
	{
		backgroundColor: Colors.activeButton,
	},
	categoryChipPressed:
	{
		opacity: 0.88,
	},
	categoryChipText:
	{
		fontSize: 13,
		fontWeight: "600",
		color: Colors.inactiveButtonText,
	},
	categoryChipTextActive:
	{
		color: Colors.activeButtonText,
	},
	photoRow:
	{
		flexDirection: "row",
		gap: 10,
		marginTop: 10,
	},
	photoBtn:
	{
		flex: 1,
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		gap: 8,
		paddingVertical: 12,
		borderRadius: 14,
		backgroundColor: "rgba(0,0,0,0.05)",
		borderWidth: 1,
		borderColor: "rgba(0,0,0,0.06)",
	},
	photoBtnPressed:
	{
		opacity: 0.88,
	},
	photoBtnText:
	{
		fontSize: 15,
		fontWeight: "600",
		color: Colors.blackShadow,
	},
	previewWrap:
	{
		marginTop: 14,
		alignItems: "center",
	},
	preview:
	{
		width: 200,
		height: 200,
		borderRadius: 20,
		backgroundColor: "rgba(0,0,0,0.06)",
	},
	previewPlaceholder:
	{
		marginTop: 14,
		height: 180,
		borderRadius: 20,
		borderWidth: 1,
		borderStyle: "dashed",
		borderColor: "rgba(0,0,0,0.12)",
		alignItems: "center",
		justifyContent: "center",
		backgroundColor: "rgba(255,255,255,0.5)",
	},
	previewHint:
	{
		marginTop: 8,
		fontSize: 13,
		color: Colors.inactiveButtonText,
	},
	saveBtn:
	{
		marginTop: 22,
		backgroundColor: Colors.activeButton,
		paddingVertical: 15,
		borderRadius: 16,
		alignItems: "center",
		justifyContent: "center",
		minHeight: 52,
		shadowColor: Colors.blackShadow,
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.15,
		shadowRadius: 8,
		elevation: 4,
	},
	saveBtnDisabled:
	{
		opacity: 0.45,
	},
	saveBtnPressed:
	{
		opacity: 0.9,
	},
	saveBtnText:
	{
		fontSize: 16,
		fontWeight: "700",
		color: Colors.activeButtonText,
	},
});

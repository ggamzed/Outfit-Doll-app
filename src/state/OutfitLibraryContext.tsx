import React, { createContext, useCallback, useContext, useMemo, useState } from "react";

import type { OutfitSnapshot } from "@/src/utils/outfitSnapshot";

export type OutfitAlbum = {
	id: string;
	name: string;
	createdAt: string;
};

export type SavedOutfitRecord = {
	id: string;
	albumId: string;
	savedAt: string;
	snapshot: OutfitSnapshot;
};

type OutfitLibraryContextValue = {
	albums: OutfitAlbum[];
	addAlbum: (name: string) => void;
	removeAlbumsByIds: (albumIds: string[]) => void;
	savedOutfits: SavedOutfitRecord[];
	saveOutfitToAlbum: (albumId: string, snapshot: OutfitSnapshot) => void;
	removeSavedOutfit: (savedOutfitId: string) => void;
};

const OutfitLibraryContext = createContext<OutfitLibraryContextValue | null>(null);

function newId(prefix: string): string {
	return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

export function OutfitLibraryProvider({ children }: { children: React.ReactNode }) {
	const [albums, setAlbums] = useState<OutfitAlbum[]>([]);
	const [savedOutfits, setSavedOutfits] = useState<SavedOutfitRecord[]>([]);

	const addAlbum = useCallback((name: string) => {
		const trimmed = name.trim();
		if (!trimmed)
			return;
		const album: OutfitAlbum = {
			id: newId("album"),
			name: trimmed,
			createdAt: new Date().toISOString(),
		};
		setAlbums((prev) => [...prev, album]);
	}, []);

	const removeAlbumsByIds = useCallback((albumIds: string[]) => {
		const remove = new Set(albumIds);
		if (remove.size === 0)
			return;
		setAlbums((prev) => prev.filter((a) => !remove.has(a.id)));
		setSavedOutfits((prev) => prev.filter((s) => !remove.has(s.albumId)));
	}, []);

	const saveOutfitToAlbum = useCallback((albumId: string, snapshot: OutfitSnapshot) => {
		const record: SavedOutfitRecord = {
			id: newId("saved"),
			albumId,
			savedAt: new Date().toISOString(),
			snapshot,
		};
		setSavedOutfits((prev) => [...prev, record]);
	}, []);

	const removeSavedOutfit = useCallback((savedOutfitId: string) => {
		setSavedOutfits((prev) => prev.filter((x) => x.id !== savedOutfitId));
	}, []);

	const value = useMemo<OutfitLibraryContextValue>(
		() => ({
			albums,
			addAlbum,
			removeAlbumsByIds,
			savedOutfits,
			saveOutfitToAlbum,
			removeSavedOutfit,
		}),
		[albums, addAlbum, removeAlbumsByIds, savedOutfits, saveOutfitToAlbum, removeSavedOutfit]
	);

	return (
		<OutfitLibraryContext.Provider value={value}>{children}</OutfitLibraryContext.Provider>
	);
}

export function useOutfitLibrary() {
	const ctx = useContext(OutfitLibraryContext);
	if (!ctx)
		throw new Error("useOutfitLibrary must be used within an OutfitLibraryProvider");
	return ctx;
}

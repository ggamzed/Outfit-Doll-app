import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

import type { ClothingItem } from "@/src/state/OutfitContext";
import { loadUserWardrobeItemsAsClothing } from "@/src/db/wardrobeItemsRepository";

type UserWardrobeItemsContextValue = {
	userItems: ClothingItem[];
	isReady: boolean;
	reload: () => Promise<void>;
};

const UserWardrobeItemsContext = createContext<UserWardrobeItemsContextValue | null>(null);

export function UserWardrobeItemsProvider({ children }: { children: React.ReactNode }) {
	const [userItems, setUserItems] = useState<ClothingItem[]>([]);
	const [isReady, setIsReady] = useState(false);

	const reload = useCallback(async () => {
		try {
			const items = await loadUserWardrobeItemsAsClothing();
			setUserItems(items);
		} catch {
			setUserItems([]);
		} finally {
			setIsReady(true);
		}
	}, []);

	useEffect(() => {
		void reload();
	}, [reload]);

	const value = useMemo<UserWardrobeItemsContextValue>(
		() => ({
			userItems,
			isReady,
			reload,
		}),
		[userItems, isReady, reload]
	);

	return (
		<UserWardrobeItemsContext.Provider value={value}>{children}</UserWardrobeItemsContext.Provider>
	);
}

export function useUserWardrobeItems() {
	const ctx = useContext(UserWardrobeItemsContext);
	if (!ctx)
		throw new Error("useUserWardrobeItems must be used within UserWardrobeItemsProvider");
	return ctx;
}

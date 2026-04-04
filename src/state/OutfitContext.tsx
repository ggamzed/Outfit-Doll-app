import React, { createContext, useContext, useMemo, useState } from "react";

export type ClothingCategoryId = string;

export type ClothingItem = {
	id: string;
	categoryId: ClothingCategoryId;
	name: string;
	image?: string | null;
	color?: string;
};

type OutfitContextValue = {
	appliedItemsByCategoryId: Record<ClothingCategoryId, ClothingItem | undefined>;
	applyItem: (item: ClothingItem) => void;
	clearAll: () => void;
};

const OutfitContext = createContext<OutfitContextValue | null>(null);

export function OutfitProvider({ children }: { children: React.ReactNode }) {
	const [appliedItemsByCategoryId, setAppliedItemsByCategoryId] = useState<
		Record<ClothingCategoryId, ClothingItem | undefined>
	>({});

	const applyItem = (item: ClothingItem) => {
		setAppliedItemsByCategoryId((prev) => ({
		...prev,
		[item.categoryId]: item,
		}));
	};
	const clearAll = () => {
		setAppliedItemsByCategoryId({});
	};
	const value = useMemo<OutfitContextValue>(
		() => ({
		appliedItemsByCategoryId,
		applyItem,
		clearAll,
		}),
		[appliedItemsByCategoryId]
	);
	return (<OutfitContext.Provider value={value}>{children}</OutfitContext.Provider>);
}

export function useOutfit() {
	const ctx = useContext(OutfitContext);
	if (!ctx)
		throw new Error("useOutfit must be used within an OutfitProvider");
	return (ctx);
}


import React, { createContext, useCallback, useContext, useMemo, useState } from "react";

import type { OutfitSnapshot } from "@/src/utils/outfitSnapshot";

export type ClothingCategoryId = string;

export type ClothingItem = {
	id: string;
	categoryId: ClothingCategoryId;
	name: string;
	image?: string | null;
	color?: string;
};

export type AppliedClothingInstance = {
	instanceId: string;
	item: ClothingItem;
};

export type OverlayTransform = {
	leftPct: number;
	topPct: number;
	widthPct: number;
	heightPct: number;
};

type OutfitContextValue = {
	appliedInstances: AppliedClothingInstance[];
	overlayTransformsByInstanceId: Record<string, OverlayTransform | undefined>;
	applyItem: (item: ClothingItem) => void;
	setOverlayTransform: (instanceId: string, transform: OverlayTransform) => void;
	moveInstanceForward: (instanceId: string) => void;
	moveInstanceBackward: (instanceId: string) => void;
	removeInstance: (instanceId: string) => void;
	clearAll: () => void;
	applySnapshot: (snapshot: OutfitSnapshot) => void;
};

const OutfitContext = createContext<OutfitContextValue | null>(null);

function createInstanceId(item: ClothingItem): string {
	return `${item.id}-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

export function OutfitProvider({ children }: { children: React.ReactNode }) {
	const [appliedInstances, setAppliedInstances] = useState<AppliedClothingInstance[]>([]);
	const [overlayTransformsByInstanceId, setOverlayTransformsByInstanceId] = useState<
		Record<string, OverlayTransform | undefined>
	>({});

	const applyItem = useCallback((item: ClothingItem) => {
		const instanceId = createInstanceId(item);
		setAppliedInstances((prev) => [...prev, { instanceId, item }]);
	}, []);

	const setOverlayTransform = useCallback((instanceId: string, transform: OverlayTransform) => {
		setOverlayTransformsByInstanceId((prev) => ({
			...prev,
			[instanceId]: transform,
		}));
	}, []);

	const moveInstanceForward = useCallback((instanceId: string) => {
		setAppliedInstances((prev) => {
			const idx = prev.findIndex((x) => x.instanceId === instanceId);
			if (idx === -1 || idx >= prev.length - 1)
				return prev;
			const next = [...prev];
			[next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
			return next;
		});
	}, []);

	const moveInstanceBackward = useCallback((instanceId: string) => {
		setAppliedInstances((prev) => {
			const idx = prev.findIndex((x) => x.instanceId === instanceId);
			if (idx <= 0)
				return prev;
			const next = [...prev];
			[next[idx], next[idx - 1]] = [next[idx - 1], next[idx]];
			return next;
		});
	}, []);

	const removeInstance = useCallback((instanceId: string) => {
		setAppliedInstances((prev) => prev.filter((x) => x.instanceId !== instanceId));
		setOverlayTransformsByInstanceId((prev) => {
			if (!(instanceId in prev))
				return prev;
			const next = { ...prev };
			delete next[instanceId];
			return next;
		});
	}, []);

	const clearAll = useCallback(() => {
		setAppliedInstances([]);
		setOverlayTransformsByInstanceId({});
	}, []);

	const applySnapshot = useCallback((snapshot: OutfitSnapshot) => {
		const instances: AppliedClothingInstance[] = [];
		const transforms: Record<string, OverlayTransform | undefined> = {};
		for (const layer of snapshot.layers) {
			const instanceId = createInstanceId(layer.item);
			instances.push({ instanceId, item: layer.item });
			transforms[instanceId] = layer.transform;
		}
		setAppliedInstances(instances);
		setOverlayTransformsByInstanceId(transforms);
	}, []);

	const value = useMemo<OutfitContextValue>(
		() => ({
		appliedInstances,
		overlayTransformsByInstanceId,
		applyItem,
		setOverlayTransform,
		moveInstanceForward,
		moveInstanceBackward,
		removeInstance,
		clearAll,
		applySnapshot,
		}),
		[appliedInstances, overlayTransformsByInstanceId, applyItem, setOverlayTransform, moveInstanceForward, moveInstanceBackward, removeInstance, clearAll, applySnapshot]
	);
	return (<OutfitContext.Provider value={value}>{children}</OutfitContext.Provider>);
}

export function useOutfit() {
	const ctx = useContext(OutfitContext);
	if (!ctx)
		throw new Error("useOutfit must be used within an OutfitProvider");
	return (ctx);
}


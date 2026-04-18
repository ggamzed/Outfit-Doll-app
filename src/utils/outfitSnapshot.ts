import type { AppliedClothingInstance, OverlayTransform } from "@/src/state/OutfitContext";

export const OUTFIT_SNAPSHOT_SCHEMA_VERSION = 1 as const;

export type OutfitSnapshotLayer = {
	item: AppliedClothingInstance["item"];
	transform: OverlayTransform;
};

export type OutfitSnapshot = {
	schemaVersion: typeof OUTFIT_SNAPSHOT_SCHEMA_VERSION;
	layers: OutfitSnapshotLayer[];
};

function fallbackTransform(): OverlayTransform {
	return {
		leftPct: 25,
		topPct: 25,
		widthPct: 50,
		heightPct: 40,
	};
}

export function buildOutfitSnapshot(
	appliedInstances: AppliedClothingInstance[],
	overlayTransformsByInstanceId: Record<string, OverlayTransform | undefined>
): OutfitSnapshot {
	const layers = appliedInstances.map(({ item, instanceId }) => ({
		item,
		transform: overlayTransformsByInstanceId[instanceId] ?? fallbackTransform(),
	}));
	return {
		schemaVersion: OUTFIT_SNAPSHOT_SCHEMA_VERSION,
		layers,
	};
}

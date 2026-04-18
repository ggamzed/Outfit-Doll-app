import type { ClothingCategoryId } from "@/src/state/OutfitContext";

export type OverlayLayout = {
	leftPct: number;
	topPct: number;
	widthPct: number;
	heightPct: number;
	borderRadius: number;
};

export const OVERLAY_LAYOUT_BY_CATEGORY_ID: Record<string, OverlayLayout> = {
	"2": { leftPct: 18, topPct: 26, widthPct: 64, heightPct: 45, borderRadius: 18 },
	"3": { leftPct: 20, topPct: 24, widthPct: 60, heightPct: 32, borderRadius: 16 },
	"4": { leftPct: 22, topPct: 58, widthPct: 56, heightPct: 26, borderRadius: 14 },
	"5": { leftPct: 12, topPct: 16, widthPct: 76, heightPct: 62, borderRadius: 22 },
	"6": { leftPct: 34, topPct: 82, widthPct: 32, heightPct: 14, borderRadius: 10 },
	"7": { leftPct: 40, topPct: 10, widthPct: 20, heightPct: 14, borderRadius: 14 },
};

export function getOverlayLayout(categoryId: ClothingCategoryId): OverlayLayout {
	return (
		OVERLAY_LAYOUT_BY_CATEGORY_ID[String(categoryId)] ?? {
			leftPct: 25,
			topPct: 25,
			widthPct: 50,
			heightPct: 40,
			borderRadius: 16,
		}
	);
}

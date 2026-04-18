export const WARDROBE_CATEGORIES = [
	{ id: "1", name: "All" },
	{ id: "2", name: "Jacket" },
	{ id: "3", name: "Top" },
	{ id: "4", name: "Bottom" },
	{ id: "5", name: "Dress" },
	{ id: "6", name: "Shoe" },
	{ id: "7", name: "Accessory" },
] as const;

export type WardrobeCategoryId = (typeof WARDROBE_CATEGORIES)[number]["id"];

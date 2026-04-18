import * as SQLite from "expo-sqlite";
import {
	copyAsync,
	deleteAsync,
	documentDirectory,
	getInfoAsync,
	makeDirectoryAsync,
} from "expo-file-system/legacy";

import type { ClothingItem } from "@/src/state/OutfitContext";

const DB_NAME = "wardrobe.db";
const STORAGE_DIR = "wardrobe-items";

export type UserWardrobeItemRow = {
	id: string;
	name: string;
	category_id: string;
	local_uri: string;
	cloud_url: string | null;
	created_at: string;
};

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

async function getDb(): Promise<SQLite.SQLiteDatabase> {
	if (!dbPromise) {
		dbPromise = (async () => {
			const db = await SQLite.openDatabaseAsync(DB_NAME);
			await db.execAsync(`
				CREATE TABLE IF NOT EXISTS user_wardrobe_items (
					id TEXT PRIMARY KEY NOT NULL,
					name TEXT NOT NULL,
					category_id TEXT NOT NULL,
					local_uri TEXT NOT NULL,
					cloud_url TEXT,
					created_at TEXT NOT NULL
				);
			`);
			return db;
		})();
	}
	return dbPromise;
}

export function newUserWardrobeItemId(): string {
	return `local-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

/** User-added rows use ids from {@link newUserWardrobeItemId}; bundled demo items use other ids. */
export function isUserWardrobeItemId(id: string): boolean {
	return id.startsWith("local-");
}

/**
 * Deletes rows and local image files. Ignores ids that are not user wardrobe rows.
 * @returns number of rows removed from the database
 */
export async function deleteUserWardrobeItemsByIds(ids: string[]): Promise<number> {
	const unique = [...new Set(ids)].filter(isUserWardrobeItemId);
	if (unique.length === 0)
		return 0;
	const db = await getDb();
	const placeholders = unique.map(() => "?").join(",");
	const rows = await db.getAllAsync<UserWardrobeItemRow>(
		`SELECT id, local_uri FROM user_wardrobe_items WHERE id IN (${placeholders})`,
		unique
	);
	for (const row of rows) {
		try {
			await deleteAsync(row.local_uri, { idempotent: true });
		} catch {
			/* file may already be gone */
		}
	}
	await db.runAsync(
		`DELETE FROM user_wardrobe_items WHERE id IN (${placeholders})`,
		unique
	);
	return rows.length;
}

/**
 * Prefer local file; if missing (deleted / migrated), fall back to cloud URL for future sync.
 */
export async function resolveDisplayImageUri(row: UserWardrobeItemRow): Promise<string | null> {
	try {
		const info = await getInfoAsync(row.local_uri);
		if (info.exists && !info.isDirectory)
			return row.local_uri;
	} catch {
		/* ignore */
	}
	if (row.cloud_url)
		return row.cloud_url;
	return null;
}

async function ensureStorageDir(): Promise<string> {
	const base = documentDirectory;
	if (!base)
		throw new Error("documentDirectory is not available");
	const dir = `${base}${STORAGE_DIR}/`;
	const info = await getInfoAsync(dir);
	if (!info.exists)
		await makeDirectoryAsync(dir, { intermediates: true });
	return dir;
}

/**
 * Copies a picked/cropped image into app documents. Returns permanent file:// URI.
 */
export async function copyPickedImageToDocuments(sourceUri: string, itemId: string): Promise<string> {
	const dir = await ensureStorageDir();
	const dest = `${dir}${itemId}.jpg`;
	await copyAsync({ from: sourceUri, to: dest });
	return dest;
}

export async function insertUserWardrobeItem(params: {
	id?: string;
	name: string;
	categoryId: string;
	localUri: string;
}): Promise<UserWardrobeItemRow> {
	const db = await getDb();
	const id = params.id ?? newUserWardrobeItemId();
	const created_at = new Date().toISOString();
	await db.runAsync(
		`INSERT INTO user_wardrobe_items (id, name, category_id, local_uri, cloud_url, created_at)
		 VALUES (?, ?, ?, ?, ?, ?)`,
		id,
		params.name.trim(),
		params.categoryId,
		params.localUri,
		null,
		created_at
	);
	return {
		id,
		name: params.name.trim(),
		category_id: params.categoryId,
		local_uri: params.localUri,
		cloud_url: null,
		created_at,
	};
}

export async function getAllUserWardrobeRows(): Promise<UserWardrobeItemRow[]> {
	const db = await getDb();
	const rows = await db.getAllAsync<UserWardrobeItemRow>(
		`SELECT id, name, category_id, local_uri, cloud_url, created_at
		 FROM user_wardrobe_items ORDER BY created_at DESC`
	);
	return rows;
}

export async function loadUserWardrobeItemsAsClothing(): Promise<ClothingItem[]> {
	const rows = await getAllUserWardrobeRows();
	const out: ClothingItem[] = [];
	for (const row of rows) {
		const image = await resolveDisplayImageUri(row);
		if (!image)
			continue;
		out.push({
			id: row.id,
			name: row.name,
			categoryId: row.category_id,
			image,
		});
	}
	return out;
}

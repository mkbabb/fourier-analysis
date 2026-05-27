import type { WorkspaceDraft } from "./types";

// B.W4 — the IndexedDB draft layer is a local-first CACHE of `visibility=draft`
// rows on the converged `visualization` entity (CRUD-CONTRACT §4), NOT a
// parallel identity scheme. This collapses one of the five divergent identity
// schemes from audit E: a draft is keyed by its `visualizationSlug` once it has
// been saved (the slug minted by `POST /visualizations`). An unsaved working
// session has no slug yet, so it keys by its `image_slug` asset handle until
// the first save lifts it onto the entity — that fallback is intentional and
// contract-aligned (the draft "lift" happens on the next `POST /visualizations`).
//
// The object-store `keyPath` stays `imageSlug` (the `WorkspaceDraft` field that
// holds the session handle: the `visualizationSlug` once saved, else the
// `image_slug`). A `visualizationSlug` index is added at DB v2 so saved drafts
// can be reconciled against the entity by slug without a full scan.

const DB_NAME = "fourier-drafts";
const STORE_NAME = "drafts";
const DB_VERSION = 2;
const SLUG_INDEX = "by-visualization-slug";

let dbPromise: Promise<IDBDatabase> | null = null;

function openDB(): Promise<IDBDatabase> {
    if (dbPromise) return dbPromise;
    dbPromise = new Promise((resolve, reject) => {
        const req = indexedDB.open(DB_NAME, DB_VERSION);
        req.onupgradeneeded = (event) => {
            const db = req.result;
            const store = db.objectStoreNames.contains(STORE_NAME)
                ? req.transaction!.objectStore(STORE_NAME)
                : db.createObjectStore(STORE_NAME, { keyPath: "imageSlug" });
            // v2: index saved drafts by their converged visualization slug so a
            // draft can be located by entity identity (§1) as well as by the
            // pre-save image-asset key. `unique: false` — an unsaved session has
            // no slug and a slug may transiently coexist across re-saves.
            const oldVersion = (event as IDBVersionChangeEvent).oldVersion;
            if (oldVersion < 2 && !store.indexNames.contains(SLUG_INDEX)) {
                store.createIndex(SLUG_INDEX, "visualizationSlug", { unique: false });
            }
        };
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
    });
    return dbPromise;
}

export async function saveDraft(draft: WorkspaceDraft): Promise<void> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, "readwrite");
        tx.objectStore(STORE_NAME).put(draft);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
    });
}

/**
 * Load a draft by its session key — the `visualizationSlug` once the session
 * has been saved onto the entity, else the pre-save `image_slug` asset handle.
 */
export async function loadDraft(
    key: string,
): Promise<WorkspaceDraft | undefined> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, "readonly");
        const req = tx.objectStore(STORE_NAME).get(key);
        req.onsuccess = () => resolve(req.result ?? undefined);
        req.onerror = () => reject(req.error);
    });
}

/** Locate a saved draft by its converged visualization slug (§1), if cached. */
export async function loadDraftByVisualizationSlug(
    visualizationSlug: string,
): Promise<WorkspaceDraft | undefined> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, "readonly");
        const req = tx.objectStore(STORE_NAME).index(SLUG_INDEX).get(visualizationSlug);
        req.onsuccess = () => resolve(req.result ?? undefined);
        req.onerror = () => reject(req.error);
    });
}

export async function deleteDraft(key: string): Promise<void> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, "readwrite");
        tx.objectStore(STORE_NAME).delete(key);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
    });
}

export async function listDrafts(): Promise<WorkspaceDraft[]> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, "readonly");
        const req = tx.objectStore(STORE_NAME).getAll();
        req.onsuccess = () => resolve(req.result ?? []);
        req.onerror = () => reject(req.error);
    });
}

if (typeof window !== "undefined") {
    window.addEventListener("beforeunload", () => {
        if (dbPromise) {
            dbPromise.then((db) => db.close()).catch(() => {});
            dbPromise = null;
        }
    });
}

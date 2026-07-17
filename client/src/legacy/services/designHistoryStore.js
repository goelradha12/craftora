/* ============================================================
   designHistoryStore.js — IndexedDB-backed storage for
   AI-generated design history. Shared across every product page.

   localStorage (5-10MB, shared site-wide) can't reliably hold more
   than one or two generated PNG data URLs, silently evicting older
   entries. IndexedDB has a much larger per-origin quota, so history
   actually persists across page/product navigation.
   ============================================================ */

const DB_NAME = 'craftora';
const DB_VERSION = 1;
const STORE_NAME = 'aiDesignHistory';

function openDb() {
    return new Promise((resolve, reject) => {
        const req = indexedDB.open(DB_NAME, DB_VERSION);
        req.onupgradeneeded = () => {
            const db = req.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME, { keyPath: 'id' });
            }
        };
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
    });
}

export async function getAllHistory() {
    const db = await openDb();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const req = tx.objectStore(STORE_NAME).getAll();
        req.onsuccess = () => {
            const items = req.result || [];
            items.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)); // newest first
            resolve(items);
        };
        req.onerror = () => reject(req.error);
    });
}

export async function putHistoryEntry(entry) {
    const db = await openDb();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        tx.objectStore(STORE_NAME).put(entry);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
    });
}

export async function deleteHistoryEntry(id) {
    const db = await openDb();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        tx.objectStore(STORE_NAME).delete(id);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
    });
}

export async function clearHistory() {
    const db = await openDb();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        tx.objectStore(STORE_NAME).clear();
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
    });
}

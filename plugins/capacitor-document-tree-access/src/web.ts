import { WebPlugin } from '@capacitor/core';

import type { DocumentTreeAccessPlugin } from './definitions';

declare global {
  interface Window {
    showDirectoryPicker(): Promise<FileSystemDirectoryHandle>;
  }

  interface FileSystemDirectoryHandle {
    entries(): AsyncIterableIterator<[string, any]>;
    queryPermission(options: { mode: 'read' | 'readwrite' }): Promise<'granted' | 'denied' | 'prompt'>;
    requestPermission(options: { mode: 'read' | 'readwrite' }): Promise<'granted' | 'denied'>;
  }
}

const DB_NAME = 'DocumentTreeAccess';
const DB_VERSION = 1;
const STORE_NAME = 'directoryHandles';

export class DocumentTreeAccessWeb extends WebPlugin implements DocumentTreeAccessPlugin {
  private dirHandle: FileSystemDirectoryHandle | null = null;

  private async openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      };
    });
  }

  private async saveHandle(): Promise<void> {
    if (!this.dirHandle) return;

    const db = await this.openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.put(this.dirHandle, 'currentHandle');

    await new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve(null);
      tx.onerror = () => reject(tx.error);
    });
  }

  private async loadPersistedHandle(): Promise<void> {
    const db = await this.openDB();
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.get('currentHandle');

    this.dirHandle = await new Promise<FileSystemDirectoryHandle | null>((resolve, reject) => {
      request.onsuccess = async () => {
        const handle = request.result as FileSystemDirectoryHandle | undefined;
        if (!handle) return resolve(null);

        try {
          const perm = await handle.queryPermission({ mode: 'readwrite' });
          if (perm === 'granted') return resolve(handle);
          if (perm === 'prompt') {
            const newPerm = await handle.requestPermission({ mode: 'readwrite' });
            return resolve(newPerm === 'granted' ? handle : null);
          }
          return resolve(null);
        } catch (e) {
          return resolve(null);
        }
      };
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Pick a folder for file operations
   * @returns Promise<{ uri: string }>
   */
  async pickFolder(): Promise<{ uri: string }> {
    this.dirHandle = await window.showDirectoryPicker();

    // Store the folder name for later retrieval
    if (this.dirHandle?.name) {
      localStorage.setItem('selectedFolderName', this.dirHandle.name);
    }

    await this.saveHandle();
    return { uri: 'virtual://web-dir' };
  }

  /**
   * Get the previously selected folder URI
   * @returns Promise<{ uri: string | null }>
   */
  async getPersistedUri(): Promise<{ uri: string | null }> {
    if (!this.dirHandle) {
      await this.loadPersistedHandle();
    }
    return { uri: this.dirHandle ? 'virtual://web-dir' : null };
  }

  /**
   * List files in the selected folder
   * @returns Promise<{ files: { name: string; uri: string; type?: string; size: number }[] }>
   */
  async listFiles(): Promise<{ files: { name: string; uri: string; type?: string; size: number }[] }> {
    if (!this.dirHandle) await this.loadPersistedHandle();
    if (!this.dirHandle) throw this.unavailable('No directory picked');

    const files: { name: string; uri: string; type?: string; size: number }[] = [];

    for await (const [name, handle] of this.dirHandle.entries()) {
      if (handle.kind === 'file') {
        const file = await (handle as FileSystemFileHandle).getFile();
        files.push({
          name,
          uri: name,
          type: file.type || 'application/octet-stream',
          size: file.size,
        });
      }
    }

    return { files };
  }

  /**
   * Write data to a file in the selected folder
   * @param options - The file name and data to write
   * @returns Promise<void>
   */
  async writeFile({ name, data }: { name: string; data: ArrayBuffer }): Promise<void> {
    if (!this.dirHandle) await this.loadPersistedHandle();
    if (!this.dirHandle) throw this.unavailable('No directory picked');

    const handle = await this.dirHandle.getFileHandle(name, { create: true });
    const writable = await handle.createWritable();
    await writable.write(data);
    await writable.close();
  }

  /**
   * Read data from a file in the selected folder
   * @param options - The file name to read
   * @returns Promise<{ data: ArrayBuffer }>
   */
  async readFile({ name }: { name: string }): Promise<{ data: ArrayBuffer }> {
    if (!this.dirHandle) await this.loadPersistedHandle();
    if (!this.dirHandle) throw this.unavailable('No directory picked');

    const handle = await this.dirHandle.getFileHandle(name);
    const file = await handle.getFile();
    const arrayBuffer = await file.arrayBuffer();
    return { data: arrayBuffer };
  }

  /**
   * Delete a file from the selected folder
   * @param options - The file name to delete
   * @returns Promise<void>
   */
  async deleteFile({ name }: { name: string }): Promise<void> {
    if (!this.dirHandle) await this.loadPersistedHandle();
    if (!this.dirHandle) throw this.unavailable('No directory picked');

    await this.dirHandle.removeEntry(name);
  }
}

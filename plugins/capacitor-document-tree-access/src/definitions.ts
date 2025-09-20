export interface DocumentTreeAccessPlugin {
  pickFolder(): Promise<{ uri: string }>;
  getPersistedUri(): Promise<{ uri: string | null }>;
  listFiles(): Promise<{ files: { name: string; uri: string; type?: string; size: number }[] }>;
  writeFile(options: { name: string; data: ArrayBuffer }): Promise<void>;
  readFile(options: { name: string }): Promise<{ data: ArrayBuffer }>;
  deleteFile(options: { name: string }): Promise<void>;
}

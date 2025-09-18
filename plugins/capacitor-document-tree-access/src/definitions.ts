export interface DocumentTreeAccessPlugin {
  pickFolder(): Promise<{ uri: string }>;
  getPersistedUri(): Promise<{ uri: string | null }>;
  listFiles(): Promise<{ files: { name: string; uri: string; type?: string; size: number }[] }>;
  writeFile(options: { name: string; data: string }): Promise<void>;
  readFile(options: { name: string }): Promise<{ data: string }>;
  deleteFile(options: { name: string }): Promise<void>;
}

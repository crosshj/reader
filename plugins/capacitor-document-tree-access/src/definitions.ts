export interface DocumentTreeAccessPluginPlugin {
  echo(options: { value: string }): Promise<{ value: string }>;
}

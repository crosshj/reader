import { registerPlugin } from '@capacitor/core';

import type { DocumentTreeAccessPluginPlugin } from './definitions';

const DocumentTreeAccessPlugin = registerPlugin<DocumentTreeAccessPluginPlugin>('DocumentTreeAccessPlugin', {
  web: () => import('./web').then((m) => new m.DocumentTreeAccessPluginWeb()),
});

export * from './definitions';
export { DocumentTreeAccessPlugin };

import { registerPlugin } from '@capacitor/core';

import type { DocumentTreeAccessPlugin } from './definitions';
import { DocumentTreeAccessWeb } from './web';

export const DocumentTreeAccess = registerPlugin<DocumentTreeAccessPlugin>('DocumentTreeAccess', {
  web: () => new DocumentTreeAccessWeb(),
});

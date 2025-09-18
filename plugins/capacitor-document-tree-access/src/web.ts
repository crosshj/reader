import { WebPlugin } from '@capacitor/core';

import type { DocumentTreeAccessPluginPlugin } from './definitions';

export class DocumentTreeAccessPluginWeb extends WebPlugin implements DocumentTreeAccessPluginPlugin {
  async echo(options: { value: string }): Promise<{ value: string }> {
    console.log('ECHO', options);
    return options;
  }
}

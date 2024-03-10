import { DocumentHeader } from '../../document-header';

import { State } from './state';

export interface StateConfig {
  begin(documentHeader: DocumentHeader): State;

  recreate(documentHeader: DocumentHeader): State;
}

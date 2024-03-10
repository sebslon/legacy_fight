import { DocumentHeader } from './document-header';

export interface DocumentHeaderRepository {
  getOne(id: string): Promise<DocumentHeader>;

  save(header: DocumentHeader): Promise<void>;
}

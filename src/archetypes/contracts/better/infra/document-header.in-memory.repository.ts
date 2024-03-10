import { DocumentHeader } from '../model/document-header';
import { DocumentHeaderRepository } from '../model/document-header.repository';

export class DocumentHeaderInMemoryRepository
  implements DocumentHeaderRepository
{
  private documentHeaders: DocumentHeader[] = [];

  public async getOne(id: string): Promise<DocumentHeader> {
    const header = this.documentHeaders.find((h) => h.getId() === id);

    if (!header) {
      throw new Error(`Document header with id ${id} not found.`);
    }

    return header;
  }

  public async save(header: DocumentHeader): Promise<void> {
    this.documentHeaders.push(header);
  }
}

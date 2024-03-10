import { Injectable } from '@nestjs/common';

import { DocumentContent } from '../../model/content/document-content';
import { DocumentContentRepository } from '../../model/content/document-content.repository';

import { CommitResult, CommitResultStatus } from './commit-result';
import { DocumentDTO } from './document.dto';

@Injectable()
export class DocumentEditor {
  public constructor(
    private readonly documentContentRepository: DocumentContentRepository,
  ) {}

  public async commit(document: DocumentDTO): Promise<CommitResult> {
    const previousId = document.getContentId();
    const content = new DocumentContent(
      previousId,
      document.getPhysicalContent(),
      document.getDocumentVersion(),
    );

    await this.documentContentRepository.save(content);

    return new CommitResult(previousId, CommitResultStatus.SUCCESS);
  }

  public async get(contentId: string) {
    const content = await this.documentContentRepository.findOne(contentId);

    if (!content) {
      throw new Error(`Document with id ${contentId} not found`);
    }

    return new DocumentDTO(
      content.getId(),
      content.getPhysicalContent(),
      content.getDocumentVersion(),
    );
  }
}

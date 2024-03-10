import { Column, Entity } from 'typeorm';

import { BaseEntity } from '../../../../common/base.entity';

import { DocumentNumber } from './content/document-number';
import { ContentId } from './content-id';

@Entity()
export class DocumentHeader extends BaseEntity {
  @Column({
    transformer: {
      from: (value: string) => new DocumentNumber(value),
      to: (value: DocumentNumber) => value.getNumber(),
    },
  })
  private number: DocumentNumber;

  @Column()
  private authorId: string;

  @Column()
  private verifierId: string;

  @Column()
  private stateDescriptor: string;

  @Column({
    transformer: {
      from: (value: string) => new ContentId(value),
      to: (value: ContentId) => value.getId(),
    },
  })
  private contentId: ContentId;

  public constructor(authorId: string, number: DocumentNumber) {
    super();

    this.authorId = authorId;
    this.number = number;
  }

  public changeCurrentContentId(contentId: ContentId) {
    this.contentId = contentId;
  }

  public notEmpty(): boolean {
    return !!this.contentId;
  }

  public getAuthorId(): string {
    return this.authorId;
  }

  public getVerifierId(): string {
    return this.verifierId;
  }

  public getContentId(): ContentId {
    return this.contentId;
  }

  public getStateDescriptor(): string {
    return this.stateDescriptor;
  }

  public getDocumentNumber(): DocumentNumber {
    return this.number;
  }

  public setAuthorId(authorId: string) {
    this.authorId = authorId;
  }

  public setVerifierId(verifierId: string) {
    this.verifierId = verifierId;
  }

  public setStateDescriptor(stateDescriptor: string) {
    this.stateDescriptor = stateDescriptor;
  }
}

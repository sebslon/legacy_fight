import { Column, Entity, JoinTable, ManyToMany, ManyToOne } from 'typeorm';

import { BaseAggregateRoot } from './base.aggregate-root';
import { Printable } from './printable';
import { User } from './user';

export enum DocumentStatus {
  DRAFT = 'DRAFT',
  VERIFIED = 'VERIFIED',
  PUBLISHED = 'PUBLISHED',
  ARCHIVED = 'ARCHIVED',
}

@Entity()
export class Document extends BaseAggregateRoot implements Printable {
  @Column()
  private number: string;

  @Column()
  private title: string;

  @Column()
  private content: string;

  @Column()
  private status: DocumentStatus = DocumentStatus.DRAFT;

  @ManyToMany(() => User)
  @JoinTable()
  private assignedUsers: User[];

  @ManyToOne(() => User, (user) => user._createdDocuments)
  public _creator: User;

  @ManyToOne(() => User, (user) => user._verifiedDocuments)
  public _verifier: User;

  public constructor(number: string, creator: User) {
    super();

    this.number = number;
    this._creator = creator;
  }

  public verifyBy(verifier: User) {
    if (this.status !== DocumentStatus.DRAFT) {
      throw new Error(`Can't verify in status: ${this.status}`);
    }

    if (this._creator.getId() === verifier.getId()) {
      throw new Error('Verifier can not verify documents by himself');
    }

    this._verifier = verifier;
    this.status = DocumentStatus.VERIFIED;
  }

  public publish() {
    if (this.status !== DocumentStatus.VERIFIED) {
      throw new Error(`Can't publish in status: ${this.status}`);
    }

    this.status = DocumentStatus.PUBLISHED;
  }

  public archive() {
    this.status = DocumentStatus.ARCHIVED;
  }

  //===============================================================

  public changeTitle(title: string) {
    if (
      this.status === DocumentStatus.ARCHIVED ||
      this.status === DocumentStatus.PUBLISHED
    ) {
      throw new Error(`Can't change title in status: ${this.status}`);
    }

    this.title = title;

    if (this.status === DocumentStatus.VERIFIED) {
      this.status = DocumentStatus.DRAFT;
    }
  }

  protected overridePublished: boolean;

  public changeContent(content: string) {
    if (this.overridePublished) {
      this.content = content;
      return;
    }

    if (
      this.status === DocumentStatus.ARCHIVED ||
      this.status === DocumentStatus.PUBLISHED
    ) {
      throw new Error(`Can't change content in status: ${this.status}`);
    }

    this.content = content;

    if (this.status === DocumentStatus.VERIFIED) {
      this.status = DocumentStatus.DRAFT;
    }
  }
  //===============================================================

  protected getContent(): string {
    return this.content;
  }
}

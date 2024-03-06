import { Entity, OneToMany } from 'typeorm';

import { BaseEntity } from '../../../common/base.entity';

import { Document } from './document';

@Entity()
export class User extends BaseEntity {
  @OneToMany(() => Document, (document) => document._creator)
  public _createdDocuments: Document[];

  @OneToMany(() => Document, (document) => document._verifier)
  public _verifiedDocuments: Document[];
}

import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

import { ContentVersion } from './content-version';

@Entity()
export class DocumentContent {
  @PrimaryGeneratedColumn('uuid')
  private id: string;

  @Column()
  private previousId: string;

  @Column()
  private physicalContent: string; // some kind of reference to file, version control. or a blob :)

  @Column({
    transformer: {
      from: (value: string) => new ContentVersion(value),
      to: (value: ContentVersion) => value.getVersion(),
    },
    type: 'varchar',
  })
  private contentVersion: ContentVersion;

  public constructor(
    previousId: string,
    physicalContent: string,
    contentVersion: ContentVersion,
  ) {
    this.previousId = previousId;
    this.physicalContent = physicalContent;
    this.contentVersion = contentVersion;
  }

  public getId(): string {
    return this.id;
  }

  public getPhysicalContent(): string {
    return this.physicalContent;
  }

  public getDocumentVersion(): ContentVersion {
    return this.contentVersion;
  }
}

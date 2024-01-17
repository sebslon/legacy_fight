import { PrimaryGeneratedColumn, VersionColumn } from 'typeorm';

export class BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  protected id: string;

  @VersionColumn({ type: 'int', default: 1, select: false })
  protected version: number;

  public getId(): string {
    return this.id;
  }

  public getVersion(): number {
    return this.version;
  }
}

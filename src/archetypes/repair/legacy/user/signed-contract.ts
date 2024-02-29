import { BaseEntity, Column, Entity } from 'typeorm';

import { Parts } from '../parts/parts';

@Entity()
export class SignedContract extends BaseEntity {
  @Column({ type: 'varchar', array: true })
  private coveredParts: Parts[];

  @Column({ type: 'float' })
  private coverageRatio: number;

  public getCoveredParts(): Parts[] {
    return this.coveredParts;
  }

  public setCoveredParts(parts: Parts[]) {
    this.coveredParts = parts;
  }

  public getCoverageRatio(): number {
    return this.coverageRatio;
  }

  public setCoverageRatio(ratio: number) {
    this.coverageRatio = ratio;
  }
}

import { Column, Entity } from 'typeorm';

import { BaseEntity } from '../../common/base.entity';
import { Type } from '../client.entity';

import { Claim, ClaimStatus } from './claim.entity';

export enum WhoToAsk {
  ASK_DRIVER = 'ASK_DRIVER',
  ASK_CLIENT = 'ASK_CLIENT',
  ASK_NOONE = 'ASK_NOONE',
}

export class ClaimResult {
  public whoToAsk: WhoToAsk;
  public decision: ClaimStatus;

  constructor(whoToAsk: WhoToAsk, decision: ClaimStatus) {
    this.whoToAsk = whoToAsk;
    this.decision = decision;
  }
}

/**
 * @ADR We keep ids as string arrays, in future if we would like to change it it's hidden behind stable interface.
 */
@Entity()
export class ClaimsResolver extends BaseEntity {
  @Column('varchar', { array: true, default: [] })
  private claimedTransitIds: string[] = [];

  @Column({ nullable: true, type: 'uuid' })
  private clientId: string | null;

  constructor(clientId?: string) {
    super();

    this.clientId = clientId ?? null;
  }

  public resolve(
    claim: Claim,
    clientType: Type,
    automaticRefundForVipPriceThreshold: number,
    numberOfTransits: number,
    noOfTransitsForClaimAutomaticRefund: number,
  ): ClaimResult {
    const transitId = claim.getTransitId();

    if (!transitId) {
      throw new Error(`Missing transitId in claim ${claim.getId()}`);
    }

    if (this.getClaimedTransitIds().includes(transitId)) {
      return new ClaimResult(WhoToAsk.ASK_NOONE, ClaimStatus.ESCALATED);
    }

    this.addNewClaimFor(transitId);

    if (this.numberOfClaims() <= 3) {
      return new ClaimResult(WhoToAsk.ASK_NOONE, ClaimStatus.REFUNDED);
    }

    if (clientType === Type.VIP) {
      if (
        (claim.getTransitPrice()?.toInt() ?? 0) <
        automaticRefundForVipPriceThreshold
      ) {
        return new ClaimResult(WhoToAsk.ASK_NOONE, ClaimStatus.REFUNDED);
      } else {
        return new ClaimResult(WhoToAsk.ASK_DRIVER, ClaimStatus.ESCALATED);
      }
    } else {
      if (numberOfTransits >= noOfTransitsForClaimAutomaticRefund) {
        if (
          (claim.getTransitPrice()?.toInt() ?? 0) <
          automaticRefundForVipPriceThreshold
        ) {
          return new ClaimResult(WhoToAsk.ASK_NOONE, ClaimStatus.REFUNDED);
        } else {
          return new ClaimResult(WhoToAsk.ASK_CLIENT, ClaimStatus.ESCALATED);
        }
      } else {
        return new ClaimResult(WhoToAsk.ASK_DRIVER, ClaimStatus.ESCALATED);
      }
    }
  }

  private getClaimedTransitIds(): string[] {
    return this.claimedTransitIds;
  }

  private numberOfClaims(): number {
    return this.getClaimedTransitIds().length;
  }

  private async addNewClaimFor(transitId: string): Promise<void> {
    const transitIds = this.getClaimedTransitIds();
    transitIds.push(transitId);
  }
}

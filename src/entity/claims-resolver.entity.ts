import { BaseEntity, Column, Entity } from 'typeorm';

import { Claim, ClaimStatus } from './claim.entity';
import { Type } from './client.entity';
import { Transit } from './transit.entity';

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
  @Column('array', {
    default: () => 'ARRAY[]::varchar[]',
  })
  private claimedTransitIds: string[] = [];

  public resolve(
    claim: Claim,
    automaticRefundForVipPriceThreshold: number,
    numberOfTransits: number,
    noOfTransitsForClaimAutomaticRefund: number,
  ): ClaimResult {
    const transitId = claim.getTransit().getId();

    if (this.getClaimedTransitIds().includes(transitId)) {
      return new ClaimResult(WhoToAsk.ASK_NOONE, ClaimStatus.ESCALATED);
    }

    this.addNewClaimFor(claim.getTransit());

    if (this.numberOfClaims() <= 3) {
      return new ClaimResult(WhoToAsk.ASK_NOONE, ClaimStatus.REFUNDED);
    }

    if (claim.getOwner().getType() === Type.VIP) {
      if (
        (claim.getTransit().getPrice()?.toInt() ?? 0) <
        automaticRefundForVipPriceThreshold
      ) {
        return new ClaimResult(WhoToAsk.ASK_NOONE, ClaimStatus.REFUNDED);
      } else {
        return new ClaimResult(WhoToAsk.ASK_DRIVER, ClaimStatus.ESCALATED);
      }
    } else {
      if (numberOfTransits >= noOfTransitsForClaimAutomaticRefund) {
        if (
          (claim.getTransit().getPrice()?.toInt() ?? 0) <
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

  private async addNewClaimFor(transit: Transit): Promise<void> {
    const transitIds = this.getClaimedTransitIds();

    transitIds.push(transit.getId());

    await this.save();
  }
}

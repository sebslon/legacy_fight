import { Claim, ClaimStatus } from '../../../src/crm/claims/claim.entity';
import {
  ClaimsResolver,
  WhoToAsk,
} from '../../../src/crm/claims/claims-resolver.entity';
import { Type } from '../../../src/crm/client.entity';
import { Money } from '../../../src/money/money';
import { Transit } from '../../../src/ride/transit.entity';

describe('Claim Automatic Resolving (ClaimsResolver)', () => {
  it('Second claim for the same transit will be escalated', () => {
    const resolver = new ClaimsResolver();

    const transit = aTransit('id');

    const claim = createClaim(transit, 39);
    resolver.resolve(claim, Type.NORMAL, 40, 15, 10);

    const claim2 = createClaim(transit, 39);
    const result = resolver.resolve(claim2, Type.NORMAL, 40, 15, 10);

    expect(result.decision).toBe(ClaimStatus.ESCALATED);
    expect(result.whoToAsk).toBe(WhoToAsk.ASK_NOONE);
  });

  it('Low cost transits are refunded if client is VIP', () => {
    const resolver = new ClaimsResolver();
    const transit = aTransit('id');

    const claim = createClaim(transit, 39);

    const result = resolver.resolve(claim, Type.VIP, 40, 15, 10);

    expect(result.decision).toBe(ClaimStatus.REFUNDED);
    expect(result.whoToAsk).toBe(WhoToAsk.ASK_NOONE);
  });

  it('High cost transits are escalated even when client is VIP', () => {
    const resolver = new ClaimsResolver();

    const claim = createClaim(aTransit('id-1'), 39);
    resolver.resolve(claim, Type.VIP, 40, 15, 10);

    const claim2 = createClaim(aTransit('id-2'), 39);
    resolver.resolve(claim2, Type.VIP, 40, 15, 10);

    const claim3 = createClaim(aTransit('id-3'), 39);
    resolver.resolve(claim3, Type.VIP, 40, 15, 10);

    const claim4 = createClaim(aTransit('id-4'), 41);
    const result = resolver.resolve(claim4, Type.VIP, 40, 15, 10);

    expect(result.decision).toBe(ClaimStatus.ESCALATED);
    expect(result.whoToAsk).toBe(WhoToAsk.ASK_DRIVER);
  });

  it('First three claims are refunded', () => {
    const resolver = new ClaimsResolver();

    const claim1 = createClaim(aTransit('id-1'), 39);
    const result1 = resolver.resolve(claim1, Type.NORMAL, 40, 15, 10);

    const claim2 = createClaim(aTransit('id-2'), 39);
    const result2 = resolver.resolve(claim2, Type.NORMAL, 40, 15, 10);

    const claim3 = createClaim(aTransit('id-3'), 39);
    const result3 = resolver.resolve(claim3, Type.NORMAL, 40, 15, 10);

    const claim4 = createClaim(aTransit('id-4'), 39);
    const result4 = resolver.resolve(claim4, Type.NORMAL, 40, 4, 10);

    expect(result1.decision).toBe(ClaimStatus.REFUNDED);
    expect(result1.whoToAsk).toBe(WhoToAsk.ASK_NOONE);
    expect(result2.decision).toBe(ClaimStatus.REFUNDED);
    expect(result2.whoToAsk).toBe(WhoToAsk.ASK_NOONE);
    expect(result3.decision).toBe(ClaimStatus.REFUNDED);
    expect(result3.whoToAsk).toBe(WhoToAsk.ASK_NOONE);

    expect(result4.decision).toBe(ClaimStatus.ESCALATED);
    expect(result4.whoToAsk).toBe(WhoToAsk.ASK_DRIVER);
  });

  it('Low cost transits are refunded when many transits', () => {
    const resolver = new ClaimsResolver();

    const claim = createClaim(aTransit('id-1'), 39);
    resolver.resolve(claim, Type.NORMAL, 40, 15, 10);

    const claim2 = createClaim(aTransit('id-2'), 39);
    resolver.resolve(claim2, Type.NORMAL, 40, 15, 10);

    const claim3 = createClaim(aTransit('id-3'), 39);
    resolver.resolve(claim3, Type.NORMAL, 40, 15, 10);

    const claim4 = createClaim(aTransit('id-4'), 39);
    const result = resolver.resolve(claim4, Type.NORMAL, 40, 10, 9);

    expect(result.decision).toBe(ClaimStatus.REFUNDED);
    expect(result.whoToAsk).toBe(WhoToAsk.ASK_NOONE);
  });

  it('High cost transits are escalated even with many transits', () => {
    const resolver = new ClaimsResolver();

    const claim = createClaim(aTransit('id-1'), 39);
    resolver.resolve(claim, Type.NORMAL, 40, 15, 10);

    const claim2 = createClaim(aTransit('id-2'), 39);
    resolver.resolve(claim2, Type.NORMAL, 40, 15, 10);

    const claim3 = createClaim(aTransit('id-3'), 39);
    resolver.resolve(claim3, Type.NORMAL, 40, 15, 10);

    const claim4 = createClaim(aTransit('id-4'), 50);
    const result = resolver.resolve(claim4, Type.NORMAL, 40, 12, 10);

    expect(result.decision).toBe(ClaimStatus.ESCALATED);
    expect(result.whoToAsk).toBe(WhoToAsk.ASK_CLIENT);
  });

  it('High cost transits are escalated when few transits', () => {
    const resolver = new ClaimsResolver();

    const claim = createClaim(aTransit('id-1'), 39);
    resolver.resolve(claim, Type.NORMAL, 40, 15, 10);

    const claim2 = createClaim(aTransit('id-2'), 39);
    resolver.resolve(claim2, Type.NORMAL, 40, 15, 10);

    const claim3 = createClaim(aTransit('id-3'), 39);
    resolver.resolve(claim3, Type.NORMAL, 40, 15, 10);

    const claim4 = createClaim(aTransit('id-4'), 50);
    const result = resolver.resolve(claim4, Type.NORMAL, 40, 2, 10);

    expect(result.decision).toBe(ClaimStatus.ESCALATED);
    expect(result.whoToAsk).toBe(WhoToAsk.ASK_DRIVER);
  });

  function aTransit(id: string) {
    const transit = Transit._createWithId(id);
    return transit;
  }

  function createClaim(transit: Transit, transitPrice: number) {
    const claim = new Claim();

    claim.setTransit(transit.getId());
    claim.setTransitPrice(new Money(transitPrice));
    claim.setOwnerId('1');

    return claim;
  }
});

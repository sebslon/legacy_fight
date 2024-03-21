import { Claim, ClaimStatus } from '../../../src/crm/claims/claim.entity';
import {
  ClaimsResolver,
  WhoToAsk,
} from '../../../src/crm/claims/claims-resolver.entity';
import { Client, Type } from '../../../src/entity/client.entity';
import { Transit } from '../../../src/entity/transit/transit.entity';
import { Money } from '../../../src/money/money';

describe('Claim Automatic Resolving (ClaimsResolver)', () => {
  it('Second claim for the same transit will be escalated', () => {
    const resolver = new ClaimsResolver();

    const transit = aTransit('id', 39);

    const claim = createClaim(transit);
    resolver.resolve(claim, Type.NORMAL, 40, 15, 10);

    const claim2 = createClaim(transit);
    const result = resolver.resolve(claim2, Type.NORMAL, 40, 15, 10);

    expect(result.decision).toBe(ClaimStatus.ESCALATED);
    expect(result.whoToAsk).toBe(WhoToAsk.ASK_NOONE);
  });

  it('Low cost transits are refunded if client is VIP', () => {
    const resolver = new ClaimsResolver();
    const transit = aTransit('id', 39);
    const client = new Client(Type.VIP);

    const claim = createClaim(transit, client);

    const result = resolver.resolve(claim, Type.VIP, 40, 15, 10);

    expect(result.decision).toBe(ClaimStatus.REFUNDED);
    expect(result.whoToAsk).toBe(WhoToAsk.ASK_NOONE);
  });

  it('High cost transits are escalated even when client is VIP', () => {
    const resolver = new ClaimsResolver();

    const client = new Client(Type.VIP);

    const claim = createClaim(aTransit('id-1', 41), client);
    resolver.resolve(claim, Type.VIP, 40, 15, 10);

    const claim2 = createClaim(aTransit('id-2', 41), client);
    resolver.resolve(claim2, Type.VIP, 40, 15, 10);

    const claim3 = createClaim(aTransit('id-3', 41), client);
    resolver.resolve(claim3, Type.VIP, 40, 15, 10);

    const claim4 = createClaim(aTransit('id-4', 41), client);
    const result = resolver.resolve(claim4, Type.VIP, 40, 15, 10);

    expect(result.decision).toBe(ClaimStatus.ESCALATED);
    expect(result.whoToAsk).toBe(WhoToAsk.ASK_DRIVER);
  });

  it('First three claims are refunded', () => {
    const resolver = new ClaimsResolver();

    const claim1 = createClaim(aTransit('id-1', 41));
    const result1 = resolver.resolve(claim1, Type.NORMAL, 40, 15, 10);

    const claim2 = createClaim(aTransit('id-2', 41));
    const result2 = resolver.resolve(claim2, Type.NORMAL, 40, 15, 10);

    const claim3 = createClaim(aTransit('id-3', 41));
    const result3 = resolver.resolve(claim3, Type.NORMAL, 40, 15, 10);

    const client = new Client(Type.NORMAL);
    const claim4 = createClaim(aTransit('id-4', 41), client);
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

    const claim = createClaim(aTransit('id-1', 39));
    resolver.resolve(claim, Type.NORMAL, 40, 15, 10);

    const claim2 = createClaim(aTransit('id-2', 39));
    resolver.resolve(claim2, Type.NORMAL, 40, 15, 10);

    const claim3 = createClaim(aTransit('id-3', 39));
    resolver.resolve(claim3, Type.NORMAL, 40, 15, 10);

    const client = new Client(Type.NORMAL);
    const claim4 = createClaim(aTransit('id-4', 39), client);
    const result = resolver.resolve(claim4, Type.NORMAL, 40, 10, 9);

    expect(result.decision).toBe(ClaimStatus.REFUNDED);
    expect(result.whoToAsk).toBe(WhoToAsk.ASK_NOONE);
  });

  it('High cost transits are escalated even with many transits', () => {
    const resolver = new ClaimsResolver();

    const claim = createClaim(aTransit('id-1', 39));
    resolver.resolve(claim, Type.NORMAL, 40, 15, 10);

    const claim2 = createClaim(aTransit('id-2', 39));
    resolver.resolve(claim2, Type.NORMAL, 40, 15, 10);

    const claim3 = createClaim(aTransit('id-3', 39));
    resolver.resolve(claim3, Type.NORMAL, 40, 15, 10);

    const client = new Client(Type.NORMAL);
    const claim4 = createClaim(aTransit('id-4', 50), client);
    const result = resolver.resolve(claim4, Type.NORMAL, 40, 12, 10);

    expect(result.decision).toBe(ClaimStatus.ESCALATED);
    expect(result.whoToAsk).toBe(WhoToAsk.ASK_CLIENT);
  });

  it('High cost transits are escalated when few transits', () => {
    const resolver = new ClaimsResolver();

    const claim = createClaim(aTransit('id-1', 39));
    resolver.resolve(claim, Type.NORMAL, 40, 15, 10);

    const claim2 = createClaim(aTransit('id-2', 39));
    resolver.resolve(claim2, Type.NORMAL, 40, 15, 10);

    const claim3 = createClaim(aTransit('id-3', 39));
    resolver.resolve(claim3, Type.NORMAL, 40, 15, 10);

    const client = new Client(Type.NORMAL);
    const claim4 = createClaim(aTransit('id-4', 50), client);
    const result = resolver.resolve(claim4, Type.NORMAL, 40, 2, 10);

    expect(result.decision).toBe(ClaimStatus.ESCALATED);
    expect(result.whoToAsk).toBe(WhoToAsk.ASK_DRIVER);
  });

  function aTransit(id: string, price: number) {
    const transit = Transit._createWithId(id);
    transit.setPrice(new Money(price));
    return transit;
  }

  function createClaim(transit: Transit, client?: Client) {
    const claim = new Claim();

    claim.setTransit(transit.getId());
    claim.setTransitPrice(transit.getPrice() as Money);

    if (client) {
      claim.setOwnerId(client.getId());
    }

    return claim;
  }
});

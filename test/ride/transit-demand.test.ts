import { v4 as uuid } from 'uuid';

import { TransitDemand } from '../../src/ride/transit-demand.entity';
import { TransitStatus } from '../../src/ride/transit.entity';

describe('Transit Demand', () => {
  it('Can change pickup place', () => {
    const transitDemand = createTransitDemand();

    transitDemand.changePickup(0.1);
  });

  it('Cant change pickup place after transit is accepted', () => {
    const transitDemand = createTransitDemand();

    transitDemand.accepted();

    expect(() => transitDemand.changePickup(0.2)).toThrow();
    expect(() => transitDemand.changePickup(0)).toThrow();
  });

  it('Cant change pickup place more than three times', () => {
    const transitDemand = createTransitDemand();

    transitDemand.changePickup(0.1);
    transitDemand.changePickup(0.12);
    transitDemand.changePickup(0.13);

    expect(() => transitDemand.changePickup(0.14)).toThrow();
  });

  it('Cant change pickup place when it is far way from original', () => {
    const transitDemand = createTransitDemand();

    expect(() => transitDemand.changePickup(50)).toThrow();
  });

  it('Can cancel demand', () => {
    const transitDemand = createTransitDemand();

    transitDemand.cancel();

    expect(transitDemand.getStatus()).toEqual(TransitStatus.CANCELLED);
  });

  it('Can publish demand', () => {
    const transitDemand = createTransitDemand();

    expect(transitDemand.getStatus()).toEqual(
      TransitStatus.WAITING_FOR_DRIVER_ASSIGNMENT,
    );
  });

  function createTransitDemand() {
    return new TransitDemand(uuid());
  }
});

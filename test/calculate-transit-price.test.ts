import { ForbiddenException } from '@nestjs/common';

import { Distance } from '../src/distance/distance';
import { TransitStatus, Transit } from '../src/entity/transit.entity';
import { Money } from '../src/money/money';

describe('Calculate Transit Price', () => {
  describe('Proper price calculations', () => {
    it("Can't calculate final price when transit is cancelled", () => {
      const transit = createTestTransit(TransitStatus.CANCELLED, 20);

      expect(() => transit.calculateFinalCosts()).toThrowError(
        new ForbiddenException(
          'Cannot calculate final cost if the transit is not completed',
        ),
      );
    });

    it("Can't estimate price when transit is completed", () => {
      const transit = createTestTransit(TransitStatus.COMPLETED, 20);

      expect(() => transit.estimateCost()).toThrowError(
        new ForbiddenException(
          'Estimating cost for completed transit is forbidden, id = ' +
            transit.getId(),
        ),
      );
    });

    it('Calculates price on regular day', () => {
      const expectedPrice = 2900;
      const transit = createTestTransit(TransitStatus.COMPLETED, 20);

      transitWasOnDoneOnFriday(transit);

      const price = transit.calculateFinalCosts();

      expect(price).toEqual(new Money(expectedPrice));
    });

    it('Estimates price on regular day', () => {
      const transit = createTestTransit(TransitStatus.DRAFT, 20);

      transitWasOnDoneOnFriday(transit);

      const price = transit.estimateCost();

      expect(price).toEqual(new Money(2900));
    });
  });

  describe('Proper price calculations - based on different tariffs', () => {
    it('Calculates price on new years eve', () => {
      const expectedPrice = 8100;
      const transit = createTestTransit(TransitStatus.COMPLETED, 20);

      transit.setDateTime(new Date('2023-12-31').getTime());

      const price = transit.calculateFinalCosts();

      expect(price).toEqual(new Money(expectedPrice));
    });

    it('Calculates price on saturday', () => {
      const expectedPrice = 3800;
      const transit = createTestTransit(TransitStatus.COMPLETED, 20);

      transit.setDateTime(new Date('2023-12-30 12:00').getTime());

      const price = transit.calculateFinalCosts();

      expect(price).toEqual(new Money(expectedPrice));
    });

    it('Calculates price on saturday night', () => {
      const expectedPrice = 6000;
      const transit = createTestTransit(TransitStatus.COMPLETED, 20);

      transit.setDateTime(new Date('2023-12-30 23:00').getTime());

      const price = transit.calculateFinalCosts();

      expect(price).toEqual(new Money(expectedPrice));
    });

    it('Should use standard price before 2019', () => {
      const transit = createTestTransit(TransitStatus.COMPLETED, 20);
      const expectedPrice = 2900;

      transit.setDateTime(new Date('2018-12-30 23:00').getTime());

      const price = transit.calculateFinalCosts();

      expect(price).toEqual(new Money(expectedPrice));
    });
  });

  function createTestTransit(status: TransitStatus, km: number) {
    const transit = new Transit();

    transit.setDateTime(Date.now());
    transit.setStatus(TransitStatus.DRAFT);
    transit.setKm(Distance.fromKm(km));
    transit.setStatus(status);

    return transit;
  }

  function transitWasOnDoneOnFriday(transit: Transit) {
    transit.setDateTime(new Date('2023-12-29').getTime());
  }
});

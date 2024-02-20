import { Distance } from '../src/distance/distance';
import { TransitDTO } from '../src/dto/transit.dto';
import { Address } from '../src/entity/address.entity';
import { CarClass } from '../src/entity/car-type.entity';
import { Client, Type } from '../src/entity/client.entity';
import { Transit } from '../src/entity/transit.entity';
import { Money } from '../src/money/money';

describe('Calculate Transit Distance', () => {
  it('Should not work with invalid unit', () => {
    expect(() => transitForDistance(10).getDistance('invalid')).toThrowError(
      'Invalid unit',
    );
  });

  it('Should represent as km', () => {
    expect(transitForDistance(10).getDistance('km')).toBe('10km');
    expect(transitForDistance(10.123).getDistance('km')).toBe('10.123km');
    expect(transitForDistance(0).getDistance('km')).toBe('0km');
  });

  it('Should represent as meters', () => {
    expect(transitForDistance(10).getDistance('m')).toBe('10000m');
    expect(transitForDistance(10.123).getDistance('m')).toBe('10123m');
    expect(transitForDistance(0).getDistance('m')).toBe('0m');
  });

  it('Should represent as miles', () => {
    expect(transitForDistance(10).getDistance('miles')).toBe('6.214miles');
    expect(transitForDistance(10.123).getDistance('miles')).toBe('6.29miles');
    expect(transitForDistance(0).getDistance('miles')).toBe('0miles');
  });

  function transitForDistance(km: number): TransitDTO {
    const transit = Transit.create(
      new Address('test', 'test', 'test', 'test', 1),
      new Address('test', 'test', 'test', 'test', 1),
      new Client(Type.NORMAL),
      CarClass.REGULAR,
      Date.now(),
      Distance.fromKm(km),
    );

    transit.setPrice(new Money(10));

    return new TransitDTO(transit);
  }
});

import { Money } from '../src/money/money';
import { TransitDto } from '../src/dto/transit.dto';
import { Address } from '../src/entity/address.entity';
import { Client } from '../src/entity/client.entity';
import { Transit, TransitStatus } from '../src/entity/transit.entity';

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
    expect(transitForDistance(10).getDistance('m')).toBe('10,000m');
    expect(transitForDistance(10.123).getDistance('m')).toBe('10,123m');
    expect(transitForDistance(0).getDistance('m')).toBe('0m');
  });

  it('Should represent as miles', () => {
    expect(transitForDistance(10).getDistance('miles')).toBe('6.214miles');
    expect(transitForDistance(10.123).getDistance('miles')).toBe('6.29miles');
    expect(transitForDistance(0).getDistance('miles')).toBe('0miles');
  });

  function transitForDistance(km: number): TransitDto {
    const transit = new Transit();

    transit.setPrice(new Money(10));
    transit.setDateTime(Date.now());
    transit.setTo(new Address('test', 'test', 'test', 1));
    transit.setFrom(new Address('test', 'test', 'test', 1));
    transit.setStatus(TransitStatus.DRAFT);
    transit.setKm(km);
    transit.setClient(new Client());

    return new TransitDto(transit);
  }
});

import { Clock } from '../src/common/clock';
import { Distance } from '../src/distance/distance';
import { AddressDTO } from '../src/dto/address.dto';
import { ClientDto } from '../src/dto/client.dto';
import { TransitDTO } from '../src/dto/transit.dto';
import { CarClass } from '../src/entity/car-type.entity';
import { Transit, TransitStatus } from '../src/entity/transit/transit.entity';
import { Money } from '../src/money/money';
import { TransitDetailsDTO } from '../src/transit-details/transit-details.dto';

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
    const now = Clock.currentDate();
    const distance = Distance.fromKm(km);
    const transit = new Transit(TransitStatus.DRAFT, now, distance);
    transit.setPrice(new Money(10));

    const transitDetails = new TransitDetailsDTO(
      transit.getId(),
      now.getTime(),
      now.getTime(),
      new ClientDto(null),
      CarClass.REGULAR,
      AddressDTO.empty(),
      AddressDTO.empty(),
      now.getTime(),
      now.getTime(),
      distance,
      transit.getTariff(),
    );

    return new TransitDTO(transit, transitDetails);
  }
});

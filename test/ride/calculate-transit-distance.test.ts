import { CarClass } from '../../src/car-fleet/car-class.enum';
import { Clock } from '../../src/common/clock';
import { ClientDTO } from '../../src/crm/client.dto';
import { AddressDTO } from '../../src/geolocation/address/address.dto';
import { Distance } from '../../src/geolocation/distance';
import { Tariff } from '../../src/pricing/tariff';
import { TransitDetailsDTO } from '../../src/ride/transit-details/transit-details.dto';
import { TransitDTO } from '../../src/ride/transit.dto';

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
    const tariff = Tariff.ofTime(now);

    const transitDetails = new TransitDetailsDTO(
      '1',
      '1',
      now.getTime(),
      now.getTime(),
      new ClientDTO(null),
      CarClass.REGULAR,
      AddressDTO.empty(),
      AddressDTO.empty(),
      now.getTime(),
      now.getTime(),
      Distance.fromKm(km),
      tariff,
    );

    return new TransitDTO(transitDetails, [], [], null);
  }
});

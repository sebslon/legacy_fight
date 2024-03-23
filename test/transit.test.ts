import { Clock } from '../src/common/clock';
import { Driver } from '../src/driver-fleet/driver.entity';
import { NotPublished } from '../src/entity/transit/rules/not-published.rule';
import { OrRule } from '../src/entity/transit/rules/or-rule';
import { Transit, TransitStatus } from '../src/entity/transit/transit.entity';
import { Address } from '../src/geolocation/address/address.entity';
import { Distance } from '../src/geolocation/distance';

describe('Transit - Life Cycle', () => {
  it('Can create transit', () => {
    const transit = requestTransitFromTo();

    expect(transit.getPrice()).toBeNull();

    expect(transit.getStatus()).toBe(TransitStatus.DRAFT);
    expect(transit.getTariff()).not.toBeNull();
    expect(transit.getTariff().getKmRate()).not.toBe(0);
  });

  it('Can change transit destination', () => {
    const transit = requestTransitFromTo();

    transit.changeDestinationTo(
      new Address('Poland', 'Warsaw', '00-000', 'Otherstreet', 120),
      Distance.fromKm(20),
      new OrRule([new NotPublished()]),
    );

    expect(transit.getEstimatedPrice()).not.toBeNull();
    expect(transit.getPrice()).toBeNull();
  });

  it("Can't change destination when transit is completed", () => {
    const driver = new Driver();

    const transit = requestTransitFromTo();

    transit.publishAt(new Date());
    transit.proposeTo(driver);
    transit.acceptBy(driver);
    transit.start();
    transit.completeTransitAt(Distance.fromKm(20));

    expect(() => {
      transit.changeDestinationTo(
        new Address('Poland', 'Warsaw', '00-000', 'Otherstreet', 120),
        Distance.fromKm(20),
        new OrRule([new NotPublished()]),
      );
    }).toThrow();
  });

  it('Can change pickup place', () => {
    const transit = requestTransitFromTo();

    expect(() =>
      transit.changePickupTo(
        new Address('Poland', 'Warsaw', '00-000', 'Otherstreet', 120),
        Distance.fromKm(20),
        0.2,
      ),
    ).not.toThrow();
  });

  it("Can't change pickup place after transit is accepted, started or completed", () => {
    const driver = new Driver();

    const transit = requestTransitFromTo();
    const newAddress = new Address(
      'Poland',
      'Warsaw',
      '00-000',
      'Otherstreet',
      120,
    );

    transit.publishAt(new Date());
    transit.proposeTo(driver);
    transit.acceptBy(driver);

    expect(() => {
      transit.changePickupTo(newAddress, Distance.fromKm(20), 0.2);
    }).toThrow();

    transit.start();

    expect(() => {
      transit.changePickupTo(newAddress, Distance.fromKm(20), 0.2);
    }).toThrow();

    transit.completeTransitAt(Distance.fromKm(20));

    expect(() => {
      transit.changePickupTo(newAddress, Distance.fromKm(20), 0.2);
    }).toThrow();
  });

  it("Can't change pickup place more than three times", () => {
    const transit = requestTransitFromTo();

    transit.changePickupTo(
      new Address('Poland', 'Warsaw', '00-000', 'Otherstreet', 120),
      Distance.fromKm(20),
      0.2,
    );

    transit.changePickupTo(
      new Address('Poland', 'Warsaw', '00-000', 'Otherstreet', 130),
      Distance.fromKm(20),
      0.2,
    );

    transit.changePickupTo(
      new Address('Poland', 'Warsaw', '00-000', 'Otherstreet', 140),
      Distance.fromKm(20),
      0.2,
    );

    expect(() => {
      transit.changePickupTo(
        new Address('Poland', 'Warsaw', '00-000', 'Otherstreet', 150),
        Distance.fromKm(20),
        0.2,
      );
    }).toThrow();
  });

  it("Can't change pickup place when it is far way from original", () => {
    const transit = requestTransitFromTo();

    const distanceFromPrevious = Distance.fromKm(50).toKmInFloat();

    expect(() => {
      transit.changePickupTo(
        new Address('Poland', 'Warsaw', '00-000', 'Otherstreet', 120),
        Distance.fromKm(100),
        distanceFromPrevious,
      );
    }).toThrow();
  });

  it('Can cancel transit', () => {
    const transit = requestTransitFromTo();

    transit.cancel();

    expect(transit.getStatus()).toBe(TransitStatus.CANCELLED);
  });

  it("Can't cancel transit after it was started or completed", () => {
    const driver = new Driver();
    const transit = requestTransitFromTo();

    transit.publishAt(new Date());
    transit.proposeTo(driver);
    transit.acceptBy(driver);
    transit.start();

    expect(() => {
      transit.cancel();
    }).toThrow();

    transit.completeTransitAt(Distance.fromKm(20));

    expect(() => {
      transit.cancel();
    }).toThrow();
  });

  it('Can publish transit', () => {
    const transit = requestTransitFromTo();

    transit.publishAt(new Date());

    expect(transit.getStatus()).toBe(
      TransitStatus.WAITING_FOR_DRIVER_ASSIGNMENT,
    );
  });

  it('Can accept transit', () => {
    const transit = requestTransitFromTo();
    const driver = new Driver();

    transit.publishAt(new Date());
    transit.proposeTo(driver);
    transit.acceptBy(driver);

    expect(transit.getStatus()).toBe(TransitStatus.TRANSIT_TO_PASSENGER);
  });

  it('Only one driver can accept transit', () => {
    const transit = requestTransitFromTo();
    const driver = new Driver();
    const driver2 = new Driver();

    transit.publishAt(new Date());
    transit.proposeTo(driver);
    transit.acceptBy(driver);

    expect(() => {
      transit.acceptBy(driver2);
    }).toThrow();
  });

  it("Transit can't be accepted by driver who already rejected", () => {
    const transit = requestTransitFromTo();
    const driver = new Driver();

    transit.publishAt(new Date());
    transit.rejectBy(driver);

    expect(() => {
      transit.acceptBy(driver);
    }).toThrow();
  });

  it("Transit can't be accepted by driver who has not seen proposal", () => {
    const transit = requestTransitFromTo();
    const driver = new Driver();

    transit.publishAt(new Date());

    expect(() => {
      transit.acceptBy(driver);
    }).toThrow();
  });

  it('Can start transit', () => {
    const transit = requestTransitFromTo();
    const driver = new Driver();

    transit.publishAt(new Date());
    transit.proposeTo(driver);
    transit.acceptBy(driver);
    transit.start();

    expect(transit.getStatus()).toBe(TransitStatus.IN_TRANSIT);
  });

  it("Can't start not accepted transit", () => {
    const transit = requestTransitFromTo();

    transit.publishAt(new Date());

    expect(() => {
      transit.start();
    }).toThrow();
  });

  it('Can complete transit', () => {
    const transit = requestTransitFromTo();
    const driver = new Driver();

    transit.publishAt(new Date());
    transit.proposeTo(driver);
    transit.acceptBy(driver);
    transit.start();

    transit.completeTransitAt(Distance.fromKm(20));

    expect(transit.getStatus()).toBe(TransitStatus.COMPLETED);
    expect(transit.getPrice()).not.toBeNull();
    expect(transit.getTariff()).not.toBeNull();
  });

  it("Can't complete not started transit", () => {
    const transit = requestTransitFromTo();
    const driver = new Driver();

    transit.publishAt(new Date());
    transit.proposeTo(driver);
    transit.acceptBy(driver);

    expect(() => {
      transit.completeTransitAt(Distance.fromKm(20));
    }).toThrow();
  });

  it('Can reject transit', () => {
    const transit = requestTransitFromTo();
    const driver = new Driver();

    transit.publishAt(new Date());
    transit.rejectBy(driver);

    expect(transit.getStatus()).toBe(
      TransitStatus.WAITING_FOR_DRIVER_ASSIGNMENT,
    );
  });

  function requestTransitFromTo() {
    return Transit.create(Clock.currentDate(), Distance.ZERO);
  }
});

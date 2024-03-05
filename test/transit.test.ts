import { Distance } from '../src/distance/distance';
import { Address } from '../src/entity/address.entity';
import { CarClass } from '../src/entity/car-type.entity';
import { Client, Type } from '../src/entity/client.entity';
import { Driver } from '../src/entity/driver.entity';
import { NotPublished } from '../src/entity/transit/rules/not-published.rule';
import { OrRule } from '../src/entity/transit/rules/or-rule';
import { Transit, TransitStatus } from '../src/entity/transit/transit.entity';

describe('Transit - Life Cycle', () => {
  it('Can create transit', () => {
    const transit = requestTransitFromTo(
      new Address('Poland', 'Warsaw', '00-000', 'Młynarska', 20),
      new Address('Poland', 'Warsaw', '00-000', 'Żytnia', 25),
    );

    expect(transit.getCarType()).toBe(CarClass.REGULAR);
    expect(transit.getPrice()).toBeNull();

    expect(transit.getFrom().getCountry()).toBe('Poland');
    expect(transit.getFrom().getCity()).toBe('Warsaw');
    expect(transit.getFrom().getStreet()).toBe('Młynarska');
    expect(transit.getFrom().getPostalCode()).toBe('00-000');
    expect(transit.getFrom().getBuildingNumber()).toBe(20);

    expect(transit.getTo().getCountry()).toBe('Poland');
    expect(transit.getTo().getCity()).toBe('Warsaw');
    expect(transit.getTo().getStreet()).toBe('Żytnia');
    expect(transit.getTo().getPostalCode()).toBe('00-000');
    expect(transit.getTo().getBuildingNumber()).toBe(25);

    expect(transit.getStatus()).toBe(TransitStatus.DRAFT);
    expect(transit.getTariff()).not.toBeNull();
    expect(transit.getTariff().getKmRate()).not.toBe(0);
    expect(transit.getDateTime()).not.toBeNull();
  });

  it('Can change transit destination', () => {
    const transit = requestTransitFromTo(
      new Address('Poland', 'Warsaw', '00-000', 'Młynarska', 20),
      new Address('Poland', 'Warsaw', '00-000', 'Żytnia', 25),
    );

    transit.changeDestinationTo(
      new Address('Poland', 'Warsaw', '00-000', 'Otherstreet', 120),
      Distance.fromKm(20),
      new OrRule([new NotPublished()]),
    );

    expect(transit.getTo().getBuildingNumber()).toBe(120);
    expect(transit.getTo().getStreet()).toBe('Otherstreet');
    expect(transit.getEstimatedPrice()).not.toBeNull();
    expect(transit.getPrice()).toBeNull();
  });

  it("Can't change destination when transit is completed", () => {
    const destination = new Address('Poland', 'Warsaw', '00-000', 'Żytnia', 25);
    const driver = new Driver();

    const transit = requestTransitFromTo(
      new Address('Poland', 'Warsaw', '00-000', 'Młynarska', 20),
      destination,
    );

    transit.publishAt(new Date());
    transit.proposeTo(driver);
    transit.acceptBy(driver, new Date());
    transit.start(new Date());
    transit.completeTransitAt(new Date(), destination, Distance.fromKm(20));

    expect(() => {
      transit.changeDestinationTo(
        new Address('Poland', 'Warsaw', '00-000', 'Otherstreet', 120),
        Distance.fromKm(20),
        new OrRule([new NotPublished()]),
      );
    }).toThrow();
  });

  it('Can change pickup place', () => {
    const transit = requestTransitFromTo(
      new Address('Poland', 'Warsaw', '00-000', 'Młynarska', 20),
      new Address('Poland', 'Warsaw', '00-000', 'Żytnia', 25),
    );

    transit.changePickupTo(
      new Address('Poland', 'Warsaw', '00-000', 'Otherstreet', 120),
      Distance.fromKm(20),
      0.2,
    );

    expect(transit.getFrom().getBuildingNumber()).toBe(120);
    expect(transit.getFrom().getStreet()).toBe('Otherstreet');
  });

  it("Can't change pickup place after transit is accepted, started or completed", () => {
    const destination = new Address('Poland', 'Warsaw', '00-000', 'Żytnia', 25);
    const driver = new Driver();

    const transit = requestTransitFromTo(
      new Address('Poland', 'Warsaw', '00-000', 'Młynarska', 20),
      destination,
    );
    const newAddress = new Address(
      'Poland',
      'Warsaw',
      '00-000',
      'Otherstreet',
      120,
    );

    transit.publishAt(new Date());
    transit.proposeTo(driver);
    transit.acceptBy(driver, new Date());

    expect(() => {
      transit.changePickupTo(newAddress, Distance.fromKm(20), 0.2);
    }).toThrow();

    transit.start(new Date());

    expect(() => {
      transit.changePickupTo(newAddress, Distance.fromKm(20), 0.2);
    }).toThrow();

    transit.completeTransitAt(new Date(), destination, Distance.fromKm(20));

    expect(() => {
      transit.changePickupTo(newAddress, Distance.fromKm(20), 0.2);
    }).toThrow();
  });

  it("Can't change pickup place more than three times", () => {
    const transit = requestTransitFromTo(
      new Address('Poland', 'Warsaw', '00-000', 'Młynarska', 20),
      new Address('Poland', 'Warsaw', '00-000', 'Żytnia', 25),
    );

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
    const transit = requestTransitFromTo(
      new Address('Poland', 'Warsaw', '00-000', 'Młynarska', 20),
      new Address('Poland', 'Warsaw', '00-000', 'Żytnia', 25),
    );

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
    const transit = requestTransitFromTo(
      new Address('Poland', 'Warsaw', '00-000', 'Młynarska', 20),
      new Address('Poland', 'Warsaw', '00-000', 'Żytnia', 25),
    );

    transit.cancel();

    expect(transit.getStatus()).toBe(TransitStatus.CANCELLED);
  });

  it("Can't cancel transit after it was started or completed", () => {
    const destination = new Address('Poland', 'Warsaw', '00-000', 'Żytnia', 25);
    const driver = new Driver();
    const transit = requestTransitFromTo(
      new Address('Poland', 'Warsaw', '00-000', 'Młynarska', 20),
      destination,
    );

    transit.publishAt(new Date());
    transit.proposeTo(driver);
    transit.acceptBy(driver, new Date());
    transit.start(new Date());

    expect(() => {
      transit.cancel();
    }).toThrow();

    transit.completeTransitAt(new Date(), destination, Distance.fromKm(20));

    expect(() => {
      transit.cancel();
    }).toThrow();
  });

  it('Can publish transit', () => {
    const transit = requestTransitFromTo(
      new Address('Poland', 'Warsaw', '00-000', 'Młynarska', 20),
      new Address('Poland', 'Warsaw', '00-000', 'Żytnia', 25),
    );

    transit.publishAt(new Date());

    expect(transit.getStatus()).toBe(
      TransitStatus.WAITING_FOR_DRIVER_ASSIGNMENT,
    );
  });

  it('Can accept transit', () => {
    const transit = requestTransitFromTo(
      new Address('Poland', 'Warsaw', '00-000', 'Młynarska', 20),
      new Address('Poland', 'Warsaw', '00-000', 'Żytnia', 25),
    );
    const driver = new Driver();

    transit.publishAt(new Date());
    transit.proposeTo(driver);
    transit.acceptBy(driver, new Date());

    expect(transit.getStatus()).toBe(TransitStatus.TRANSIT_TO_PASSENGER);
    expect(transit.getAcceptedAt()).not.toBeNull();
  });

  it('Only one driver can accept transit', () => {
    const transit = requestTransitFromTo(
      new Address('Poland', 'Warsaw', '00-000', 'Młynarska', 20),
      new Address('Poland', 'Warsaw', '00-000', 'Żytnia', 25),
    );
    const driver = new Driver();
    const driver2 = new Driver();

    transit.publishAt(new Date());
    transit.proposeTo(driver);
    transit.acceptBy(driver, new Date());

    expect(() => {
      transit.acceptBy(driver2, new Date());
    }).toThrow();
  });

  it("Transit can't be accepted by driver who already rejected", () => {
    const transit = requestTransitFromTo(
      new Address('Poland', 'Warsaw', '00-000', 'Młynarska', 20),
      new Address('Poland', 'Warsaw', '00-000', 'Żytnia', 25),
    );
    const driver = new Driver();

    transit.publishAt(new Date());
    transit.rejectBy(driver);

    expect(() => {
      transit.acceptBy(driver, new Date());
    }).toThrow();
  });

  it("Transit can't be accepted by driver who has not seen proposal", () => {
    const transit = requestTransitFromTo(
      new Address('Poland', 'Warsaw', '00-000', 'Młynarska', 20),
      new Address('Poland', 'Warsaw', '00-000', 'Żytnia', 25),
    );
    const driver = new Driver();

    transit.publishAt(new Date());

    expect(() => {
      transit.acceptBy(driver, new Date());
    }).toThrow();
  });

  it('Can start transit', () => {
    const transit = requestTransitFromTo(
      new Address('Poland', 'Warsaw', '00-000', 'Młynarska', 1),
      new Address('Poland', 'Warsaw', '00-000', 'Żytnia', 2),
    );
    const driver = new Driver();

    transit.publishAt(new Date());
    transit.proposeTo(driver);
    transit.acceptBy(driver, new Date());
    transit.start(new Date());

    expect(transit.getStatus()).toBe(TransitStatus.IN_TRANSIT);
    expect(transit.getStarted()).not.toBeNull();
  });

  it("Can't start not accepted transit", () => {
    const transit = requestTransitFromTo(
      new Address('Poland', 'Warsaw', '00-000', 'Młynarska', 1),
      new Address('Poland', 'Warsaw', '00-000', 'Żytnia', 2),
    );

    transit.publishAt(new Date());

    expect(() => {
      transit.start(new Date());
    }).toThrow();
  });

  it('Can complete transit', () => {
    const destination = new Address('Poland', 'Warsaw', '00-000', 'Żytnia', 2);
    const transit = requestTransitFromTo(
      new Address('Poland', 'Warsaw', '00-000', 'Młynarska', 1),
      destination,
    );
    const driver = new Driver();

    transit.publishAt(new Date());
    transit.proposeTo(driver);
    transit.acceptBy(driver, new Date());
    transit.start(new Date());

    transit.completeTransitAt(new Date(), destination, Distance.fromKm(20));

    expect(transit.getStatus()).toBe(TransitStatus.COMPLETED);
    expect(transit.getCompleteAt()).not.toBeNull();
    expect(transit.getPrice()).not.toBeNull();
    expect(transit.getTariff()).not.toBeNull();
  });

  it("Can't complete not started transit", () => {
    const addressTo = new Address('Poland', 'Warsaw', '00-000', 'Żytnia', 2);
    const transit = requestTransitFromTo(
      new Address('Poland', 'Warsaw', '00-000', 'Młynarska', 1),
      addressTo,
    );
    const driver = new Driver();

    transit.publishAt(new Date());
    transit.proposeTo(driver);
    transit.acceptBy(driver, new Date());

    expect(() => {
      transit.completeTransitAt(new Date(), addressTo, Distance.fromKm(20));
    }).toThrow();
  });

  it('Can reject transit', () => {
    const transit = requestTransitFromTo(
      new Address('Poland', 'Warsaw', '00-000', 'Młynarska', 1),
      new Address('Poland', 'Warsaw', '00-000', 'Żytnia', 2),
    );
    const driver = new Driver();

    transit.publishAt(new Date());
    transit.rejectBy(driver);

    expect(transit.getStatus()).toBe(
      TransitStatus.WAITING_FOR_DRIVER_ASSIGNMENT,
    );
    expect(transit.getAcceptedAt()).toBeNull();
  });

  function requestTransitFromTo(pickup: Address, destination: Address) {
    return Transit.create(
      pickup,
      destination,
      new Client(Type.NORMAL),
      CarClass.REGULAR,
      Date.now(),
      Distance.ZERO,
    );
  }
});

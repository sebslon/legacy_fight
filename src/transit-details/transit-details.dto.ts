import { Distance } from '../distance/distance';
import { AddressDTO } from '../dto/address.dto';
import { ClientDTO } from '../dto/client.dto';
import { CarClass } from '../entity/car-type.entity';
import { Tariff } from '../entity/tariff.entity';
import { TransitStatus } from '../entity/transit/transit.entity';
import { Money } from '../money/money';

import { TransitDetails } from './transit-details.entity';

export class TransitDetailsDTO {
  public transitId: string;
  public dateTime: number | null;
  public completedAt: number | null;
  public client: ClientDTO;
  public carType: CarClass;
  public from: AddressDTO;
  public to: AddressDTO;
  public started: number | null;
  public acceptedAt: number | null;
  public price: Money;
  public driverFee: Money;
  public driverId: string;
  public estimatedPrice: Money;
  public status: TransitStatus;
  public publishedAt: number | null;
  public distance: Distance;
  public baseFee: number | null;
  public kmRate: number | null;
  public tariffName: string | null;

  public static fromTransitDetails(td: TransitDetails) {
    const dto = new TransitDetailsDTO(
      td.getTransitId(),
      td.getDateTime(),
      td.getCompleteAt(),
      new ClientDTO(td.getClient()),
      td.getCarType(),
      new AddressDTO(td.getFrom()),
      new AddressDTO(td.getTo()),
      td.getStartedAt(),
      td.getAcceptedAt(),
      td.getDistance(),
      td.getTariff(),
    );

    dto.price = td.getPrice();
    dto.driverFee = td.getDriversFee();
    dto.driverId = td.getDriverId();
    dto.estimatedPrice = td.getEstimatedPrice();
    dto.status = td.getStatus();
    dto.publishedAt = td.getPublishedAt();
    dto.baseFee = td.getBaseFee();
    dto.kmRate = td.getKmRate();

    return dto;
  }

  constructor(
    transitId: string,
    dateTime: number | null,
    completedAt: number | null,
    client: ClientDTO,
    carType: CarClass,
    from: AddressDTO,
    to: AddressDTO,
    started: number | null,
    acceptedAt: number | null,
    distance: Distance,
    tariff: Tariff | null,
  ) {
    this.transitId = transitId;
    this.dateTime = dateTime;
    this.completedAt = completedAt;
    this.client = client;
    this.carType = carType;
    this.from = from;
    this.to = to;
    this.started = started;
    this.acceptedAt = acceptedAt;
    this.distance = distance;
    this.kmRate = tariff?.getKmRate() ?? null;
    this.baseFee = tariff?.getBaseFee() ?? null;
    this.tariffName = tariff?.getName() ?? null;
  }
}

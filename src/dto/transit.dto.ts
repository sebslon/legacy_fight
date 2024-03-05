import * as dayjs from 'dayjs';
import * as dayOfYear from 'dayjs/plugin/dayOfYear';

import { Distance } from '../distance/distance';
import { CarClass } from '../entity/car-type.entity';
import { TransitStatus, Transit } from '../entity/transit/transit.entity';

import { AddressDTO } from './address.dto';
import { ClaimDTO } from './claim.dto';
import { ClientDto } from './client.dto';
import { DriverDTO } from './driver.dto';

dayjs.extend(dayOfYear);

export class TransitDTO {
  public id: string;

  public tariff: string;

  public status: TransitStatus;

  public driver: DriverDTO;

  public factor: number | null;

  public distance: Distance;

  public distanceUnit: string;

  public kmRate: number;

  public price: number;

  public driverFee: number;

  public estimatedPrice: number;

  public baseFee: number;

  public date: number;

  public dateTime: number;

  public published: number;

  public acceptedAt: number | null;

  public started: number | null;

  public completeAt: number | null;

  public claimDto: ClaimDTO | null;

  public proposedDrivers: DriverDTO[] = [];

  public to: AddressDTO;

  public from: AddressDTO;

  public carClass: CarClass;

  public clientDto: ClientDto;

  public static createFromRawData(
    id: string,
    tariffName: string,
    status: TransitStatus,
    driver: DriverDTO | null,
    distance: Distance,
    kmRate: number,
    price: number,
    driverFee: number,
    estimatedPrice: number,
    baseFee: number,
    dateTime: number,
    published: number,
    acceptedAt: number,
    started: number,
    completeAt: number,
    claimDto: ClaimDTO | null,
    proposedDrivers: DriverDTO[] | null,
    from: AddressDTO,
    to: AddressDTO,
    carClass: CarClass,
    clientDto: ClientDto | null,
  ) {
    const transit = new TransitDTO();
    transit.id = id;
    transit.factor = 1;
    transit.tariff = tariffName;
    transit.status = status;
    transit.distance = distance;
    transit.kmRate = kmRate;
    transit.price = price;
    transit.driverFee = driverFee;
    transit.estimatedPrice = estimatedPrice;
    transit.baseFee = baseFee;
    transit.dateTime = dateTime;
    transit.published = published;
    transit.acceptedAt = acceptedAt;
    transit.started = started;
    transit.completeAt = completeAt;
    transit.claimDto = claimDto;
    transit.proposedDrivers = proposedDrivers || [];
    transit.to = to;
    transit.from = from;
    transit.carClass = carClass;
    transit.clientDto = clientDto || new ClientDto(null);
    return transit;
  }

  constructor(transit?: Transit) {
    if (!transit) {
      return;
    }

    this.id = transit.getId();
    this.distance = transit.getKm();
    this.factor = 1;
    const price = transit.getPrice();
    if (price) {
      this.price = price.toInt();
    }
    this.date = transit.getDateTime();
    this.status = transit.getStatus();
    this.tariff = transit.getTariff().getName();
    this.kmRate = transit.getTariff().getKmRate();
    this.baseFee = transit.getTariff().getBaseFee();

    for (const d of transit.getProposedDrivers()) {
      this.proposedDrivers.push(new DriverDTO(d));
    }

    this.to = new AddressDTO(transit.getTo());
    this.from = new AddressDTO(transit.getFrom());
    this.carClass = transit.getCarType();
    this.clientDto = new ClientDto(transit.getClient());
    if (transit.getDriversFee() != null) {
      this.driverFee = transit.getDriversFee().toInt();
    }
    const estimatedPrice = transit.getEstimatedPrice();
    if (estimatedPrice) {
      this.estimatedPrice = estimatedPrice.toInt();
    }
    this.dateTime = transit.getDateTime();
    this.published = transit.getPublished();
    this.acceptedAt = transit.getAcceptedAt();
    this.started = transit.getStarted();
    this.completeAt = transit.getCompleteAt();
  }

  public getKmRate() {
    return this.kmRate;
  }

  public getTariff() {
    return this.tariff;
  }

  public getDistance(unit: string) {
    this.distanceUnit = unit;

    return this.distance.toString(unit);
  }

  public getProposedDrivers() {
    return this.proposedDrivers;
  }

  public setProposedDrivers(proposedDrivers: DriverDTO[]) {
    this.proposedDrivers = proposedDrivers;
  }

  public getClaimDTO() {
    return this.claimDto;
  }

  public setClaimDTO(claimDto: ClaimDTO) {
    this.claimDto = claimDto;
  }

  public getTo() {
    return this.to;
  }

  public setTo(to: AddressDTO) {
    this.to = to;
  }

  public getFrom() {
    return this.from;
  }

  public setFrom(from: AddressDTO) {
    this.from = from;
  }

  public getCarClass() {
    return this.carClass;
  }

  public setCarClass(carClass: CarClass) {
    this.carClass = carClass;
  }

  public getClientDto() {
    return this.clientDto;
  }

  public setClientDTO(clientDto: ClientDto) {
    this.clientDto = clientDto;
  }

  public getId() {
    return this.id;
  }

  public getStatus() {
    return this.status;
  }

  public setStatus(status: TransitStatus) {
    this.status = status;
  }

  public getPrice() {
    return this.price;
  }

  public getDriverFee() {
    return this.driverFee;
  }

  public setDriverFee(driverFee: number) {
    this.driverFee = driverFee;
  }

  public getDateTime() {
    return this.dateTime;
  }

  public setDateTime(dateTime: number) {
    this.dateTime = dateTime;
  }

  public getPublished() {
    return this.published;
  }

  public setPublished(published: number) {
    this.published = published;
  }

  public getAcceptedAt() {
    return this.acceptedAt;
  }

  public setAcceptedAt(acceptedAt: number) {
    this.acceptedAt = acceptedAt;
  }

  public getStarted() {
    return this.started;
  }

  public setStarted(started: number) {
    this.started = started;
  }

  public getCompleteAt() {
    return this.completeAt;
  }

  public setCompleteAt(completeAt: number) {
    this.completeAt = completeAt;
  }

  public getEstimatedPrice() {
    return this.estimatedPrice;
  }

  public setEstimatedPrice(estimatedPrice: number) {
    this.estimatedPrice = estimatedPrice;
  }
}

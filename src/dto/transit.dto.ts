import { Clock } from '../common/clock';
import { Distance } from '../distance/distance';
import { CarClass } from '../entity/car-type.entity';
import { TransitStatus, Transit } from '../entity/transit/transit.entity';
import { TransitDetailsDTO } from '../transit-details/transit-details.dto';

import { AddressDTO } from './address.dto';
import { ClaimDTO } from './claim.dto';
import { ClientDto } from './client.dto';
import { DriverDTO } from './driver.dto';

export class TransitDTO {
  public id: string;

  public tariff: string | null;

  public status: TransitStatus;

  public driver: DriverDTO | null;

  public factor: number | null;

  public distance: Distance;

  public distanceUnit: string;

  public kmRate: number | null;

  public price: number;

  public driverFee: number;

  public estimatedPrice: number;

  public baseFee: number | null;

  public date: number;

  public dateTime: number;

  public published: number | null;

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
    const transit = TransitDTO.createEmpty();
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

  public static createEmpty() {
    return new TransitDTO(null, null);
  }

  constructor(
    transit: Transit | null,
    transitDetails: TransitDetailsDTO | null,
  ) {
    if (!transit || !transitDetails) {
      return;
    }

    const driver = transit.getDriver();

    this.id = transitDetails.transitId;
    this.distance = transitDetails.distance;
    this.factor = 1;
    this.driver = driver ? new DriverDTO(driver) : null;

    const price = transitDetails.price;
    if (price) {
      this.price = price.toInt();
    }

    this.date = transitDetails.dateTime || Clock.currentDate().getTime();
    this.status = transitDetails.status;
    this.tariff = transitDetails.tariffName;
    this.kmRate = transitDetails.kmRate;
    this.baseFee = transitDetails.baseFee;

    for (const d of transit.getProposedDrivers()) {
      this.proposedDrivers.push(new DriverDTO(d));
    }

    this.to = new AddressDTO(transitDetails.to);
    this.from = new AddressDTO(transitDetails.from);
    this.carClass = transitDetails.carType;
    this.clientDto = transitDetails.client;
    if (transitDetails.driverFee != null) {
      this.driverFee = transitDetails.driverFee.toInt();
    }
    const estimatedPrice = transitDetails.estimatedPrice;
    if (estimatedPrice) {
      this.estimatedPrice = estimatedPrice.toInt();
    }
    this.dateTime = transitDetails.dateTime || Clock.currentDate().getTime();
    this.published = transitDetails.publishedAt;
    this.acceptedAt = transitDetails.acceptedAt;
    this.started = transitDetails.started;
    this.completeAt = transitDetails.completedAt || null;
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

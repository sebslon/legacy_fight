import { DriverAttributeDTO } from './driver-attribute.dto';
import { DriverSessionDto } from './driver-session.dto';
import { DriverDto } from './driver.dto';
import { TransitDto } from './transit.dto';

export class DriverReport {
  public driverDto: DriverDto;

  public attributes: DriverAttributeDTO[] = [];

  public sessions: Map<DriverSessionDto, TransitDto[]> = new Map();

  public getDriverDto() {
    return this.driverDto;
  }

  public setDriverDTO(driverDto: DriverDto) {
    this.driverDto = driverDto;
  }

  public getAttributes() {
    return this.attributes;
  }

  public setAttributes(attributes: DriverAttributeDTO[]) {
    this.attributes = attributes;
  }

  public getSessions() {
    return this.sessions;
  }

  public setSessions(sessions: Map<DriverSessionDto, TransitDto[]>) {
    this.sessions = sessions;
  }
}

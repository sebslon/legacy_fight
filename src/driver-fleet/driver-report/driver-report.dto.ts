import { TransitDTO } from '../../dto/transit.dto';
import { DriverSessionDTO } from '../../tracking/driver-session.dto';
import { DriverAttributeName } from '../driver-attribute-name.enum';
import { DriverAttributeDTO } from '../driver-attribute.dto';
import { DriverDTO } from '../driver.dto';

export class DriverReport {
  public driverDto: DriverDTO;

  public attributes: DriverAttributeDTO[] = [];

  public sessions: Map<DriverSessionDTO, TransitDTO[]> = new Map();

  public getDriverDto() {
    return this.driverDto;
  }

  public setDriverDTO(driverDto: DriverDTO) {
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

  public setSessions(sessions: Map<DriverSessionDTO, TransitDTO[]>) {
    this.sessions = sessions;
  }

  public addAttr(name: DriverAttributeName, value: string) {
    this.attributes.push(DriverAttributeDTO.createDriverAttribute(name, value));
  }
}

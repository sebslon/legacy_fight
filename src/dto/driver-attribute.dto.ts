import objectHash from 'object-hash';

import {
  DriverAttribute,
  DriverAttributeName,
} from '../entity/driver-attribute.entity';
import { Driver } from '../entity/driver.entity';

export class DriverAttributeDTO {
  public name: DriverAttributeName;

  public value: string;

  constructor(driverAttribute: DriverAttribute) {
    this.name = driverAttribute.getName();
    this.value = driverAttribute.getValue();
  }

  // For testing purposes
  public static createDriverAttribute(
    name: DriverAttributeName,
    value: string,
  ) {
    return new DriverAttributeDTO(
      new DriverAttribute(new Driver(), name, value),
    );
  }

  public getName() {
    return this.name;
  }

  public setName(name: DriverAttributeName) {
    this.name = name;
  }

  public getValue() {
    return this.value;
  }

  public setValue(value: string) {
    this.value = value;
  }

  public hashCode() {
    return objectHash({ name: this.name, value: this.value });
  }
}

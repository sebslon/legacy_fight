import { Driver, DriverStatus, DriverType } from './driver.entity';

export class DriverDTO {
  private id: string;

  private status: DriverStatus;

  private firstName: string;

  private lastName: string;

  private driverLicense: string;

  private photo: string | null;

  private type: DriverType;

  constructor(driver?: Driver) {
    if (!driver) {
      return this;
    }

    this.id = driver.getId();
    this.firstName = driver.getFirstName();
    this.lastName = driver.getLastName();
    this.driverLicense = driver.getDriverLicense().asString();
    this.photo = driver.getPhoto();
    this.status = driver.getStatus();
    this.type = driver.getType();
  }

  public static createFromRawData(
    id: string,
    firstName: string,
    lastName: string,
    driverLicense: string,
    photo: string | null,
    status: DriverStatus,
    type: DriverType,
  ): DriverDTO {
    const driver = new DriverDTO();
    driver.id = id;
    driver.firstName = firstName;
    driver.lastName = lastName;
    driver.driverLicense = driverLicense;
    driver.photo = photo;
    driver.status = status;
    driver.type = type;
    return driver;
  }

  public getId(): string {
    return this.id;
  }

  public getStatus(): DriverStatus {
    return this.status;
  }

  public getDriverLicense(): string {
    return this.driverLicense;
  }

  public getFirstName(): string {
    return this.firstName;
  }

  public getLastName(): string {
    return this.lastName;
  }
}

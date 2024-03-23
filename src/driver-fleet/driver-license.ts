export class DriverLicense {
  private static DRIVER_LICENSE_REGEX = '^[A-Z9]{5}\\d{6}[A-Z9]{2}\\d[A-Z]{2}$';
  private driverLicense: string;

  private constructor(driverLicense: string) {
    this.driverLicense = driverLicense;
  }

  public static withLicense(driverLicense: string): DriverLicense {
    if (!driverLicense || !driverLicense.match(this.DRIVER_LICENSE_REGEX)) {
      throw new Error('Illegal license no = ' + driverLicense);
    }

    return new DriverLicense(driverLicense);
  }

  public static withoutValidation(driverLicense: string): DriverLicense {
    return new DriverLicense(driverLicense);
  }

  public asString(): string {
    return this.driverLicense;
  }
}

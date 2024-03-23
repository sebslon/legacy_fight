import { IsEnum, IsNotEmpty } from 'class-validator';

import { DriverStatus, DriverType } from './driver.entity';

export class CreateDriverDto {
  @IsNotEmpty()
  public firstName: string;

  @IsNotEmpty()
  public lastName: string;

  @IsNotEmpty()
  public driverLicense: string;

  @IsEnum(DriverType)
  public type: DriverType;

  @IsEnum(DriverStatus)
  public status: DriverStatus;

  public photo: string;
}

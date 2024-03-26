import { IsEnum, IsNotEmpty } from 'class-validator';

import { CarClass } from '../car-fleet/car-class.enum';

export class CreateDriverSessionDto {
  @IsNotEmpty()
  public carBrand: string;

  @IsNotEmpty()
  public platesNumber: string;

  @IsEnum(CarClass)
  public carClass: CarClass;
}

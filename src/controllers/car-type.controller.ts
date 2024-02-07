import {
  Body,
  Controller,
  Param,
  Post,
  UsePipes,
  ValidationPipe,
  Res,
  HttpStatus,
  Get,
} from '@nestjs/common';
import { Response } from 'express';

import { CarTypeDTO } from '../dto/car-type.dto';
import { CarClass } from '../entity/car-type.entity';
import { CarTypeService } from '../service/car-type.service';

@Controller('cartypes')
export class CarTypeController {
  constructor(private readonly carTypeService: CarTypeService) {}

  @Post()
  @UsePipes(ValidationPipe)
  public async create(@Body() carTypeDTO: CarTypeDTO): Promise<CarTypeDTO> {
    const carType = await this.carTypeService.create(carTypeDTO);

    return this.carTypeService.loadDto(carType.getId());
  }

  @Post(':carClass/registerCar')
  public async registerCar(
    @Param('carClass') carClass: CarClass,
    @Res() res: Response,
  ): Promise<void> {
    await this.carTypeService.registerCar(carClass);
    res.status(HttpStatus.OK).send();
  }

  @Post(':carClass/unregisterCar')
  public async unregisterCar(
    @Param('carClass') carClass: CarClass,
    @Res() res: Response,
  ): Promise<void> {
    await this.carTypeService.unregisterCar(carClass);
    res.status(HttpStatus.OK).send();
  }

  @Post(':id/activate')
  public async activate(
    @Param('id') id: string,
    @Res() res: Response,
  ): Promise<void> {
    await this.carTypeService.activate(id);
    res.status(HttpStatus.OK).send();
  }

  @Post(':id/deactivate')
  public async deactivate(
    @Param('id') id: string,
    @Res() res: Response,
  ): Promise<void> {
    await this.carTypeService.deactivate(id);
    res.status(HttpStatus.OK).send();
  }

  @Get(':id')
  public async find(@Param('id') id: string): Promise<CarTypeDTO> {
    return this.carTypeService.loadDto(id);
  }
}

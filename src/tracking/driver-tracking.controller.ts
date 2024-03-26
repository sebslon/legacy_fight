import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';

import { Clock } from '../common/clock';

import { CreateDriverPositionDto } from './create-driver-position.dto';
import { DriverPositionDto } from './driver-position.dto';
import { DriverPosition } from './driver-position.entity';
import { DriverTrackingService } from './driver-tracking.service';

@Controller('driverPositions')
export class DriverTrackingController {
  constructor(private readonly trackingService: DriverTrackingService) {}

  @Post()
  @UsePipes(ValidationPipe)
  public async create(
    @Body() createDriverPositionDto: CreateDriverPositionDto,
  ): Promise<DriverPositionDto> {
    const driverPosition = await this.trackingService.registerPosition(
      createDriverPositionDto.driverId,
      createDriverPositionDto.latitude,
      createDriverPositionDto.longitude,
      createDriverPositionDto.seenAt ?? Clock.currentDate(),
    );

    return this.toDto(driverPosition);
  }

  @Get(':driverId/total')
  public async calculateTravelledDistance(
    @Param('driverId') driverId: string,
    @Body() params: { from: number; to: number },
  ): Promise<number> {
    const distance = await this.trackingService.calculateTravelledDistance(
      driverId,
      params.from,
      params.to,
    );

    return distance.toKmInFloat();
  }

  private toDto(driverPosition: DriverPosition) {
    return new DriverPositionDto(
      driverPosition.getDriverId(),
      driverPosition.getLatitude(),
      driverPosition.getLongitude(),
      driverPosition.getSeenAt(),
    );
  }
}

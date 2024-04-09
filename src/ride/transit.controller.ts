import { Body, Controller, Get, Param, Post } from '@nestjs/common';

import { AddressDTO } from '../geolocation/address/address.dto';
import { CreateAddressDto } from '../geolocation/address/create-address.dto';

import { RideService } from './ride.service';
import { TransitDTO } from './transit.dto';

@Controller('transits')
export class TransitController {
  constructor(private readonly rideService: RideService) {}

  @Get(':transitId')
  public async getTransit(
    @Param('transitId') requestUUID: string,
  ): Promise<TransitDTO> {
    return this.rideService.loadTransit(requestUUID);
  }

  @Post()
  public async createTransit(
    @Body() transitDto: TransitDTO,
  ): Promise<TransitDTO> {
    return this.rideService.createTransitFromDTO(transitDto);
  }

  @Post(':transitId/changeAddressTo')
  public async changeAddressTo(
    @Param('transitId') transitId: string,
    @Body() createAddressDto: CreateAddressDto,
  ): Promise<TransitDTO> {
    await this.rideService.changeTransitAddressTo(
      transitId,
      new AddressDTO(createAddressDto),
    );
    return this.rideService.loadTransit(transitId);
  }

  @Post(':transitId/changeAddressFrom')
  public async changeAddressFrom(
    @Param('transitId') transitId: string,
    @Body() createAddressDto: CreateAddressDto,
  ): Promise<TransitDTO> {
    await this.rideService.changeTransitAddressFrom(
      transitId,
      new AddressDTO(createAddressDto).toAddressEntity(),
    );
    return this.rideService.loadTransit(transitId);
  }

  @Post(':transitId/cancel')
  public async cancel(
    @Param('transitId') transitId: string,
  ): Promise<TransitDTO> {
    await this.rideService.cancelTransit(transitId);
    return this.rideService.loadTransit(transitId);
  }

  @Post(':transitId/publish')
  public async publishTransit(
    @Param('transitId') transitId: string,
  ): Promise<TransitDTO> {
    await this.rideService.publishTransit(transitId);
    return this.rideService.loadTransit(transitId);
  }

  @Post(':transitId/findDrivers')
  public async findDriversForTransit(
    @Param('transitId') transitId: string,
  ): Promise<TransitDTO> {
    await this.rideService.findDriversForTransit(transitId);
    return this.rideService.loadTransit(transitId);
  }

  @Post(':transitId/accept/:driverId')
  public async acceptTransit(
    @Param('transitId') transitId: string,
    @Param('driverId') driverId: string,
  ): Promise<TransitDTO> {
    await this.rideService.acceptTransit(driverId, transitId);
    return this.rideService.loadTransit(transitId);
  }

  @Post(':transitId/start/:driverId')
  public async start(
    @Param('transitId') transitId: string,
    @Param('driverId') driverId: string,
  ): Promise<TransitDTO> {
    await this.rideService.startTransit(driverId, transitId);
    return this.rideService.loadTransit(transitId);
  }

  @Post(':transitId/reject/:driverId')
  public async reject(
    @Param('transitId') transitId: string,
    @Param('driverId') driverId: string,
  ): Promise<TransitDTO> {
    await this.rideService.rejectTransit(driverId, transitId);
    return this.rideService.loadTransit(transitId);
  }

  @Post(':transitId/complete/:driverId')
  public async complete(
    @Param('transitId') transitId: string,
    @Param('driverId') driverId: string,
    @Body() destination: AddressDTO,
  ): Promise<TransitDTO> {
    await this.rideService.completeTransitFromDto(
      driverId,
      transitId,
      destination,
    );
    return this.rideService.loadTransit(transitId);
  }
}

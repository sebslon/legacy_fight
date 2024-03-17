import { Body, Controller, Get, Param, Post } from '@nestjs/common';

import { AddressDTO } from '../dto/address.dto';
import { CreateAddressDto } from '../dto/create-address.dto';
import { TransitDTO } from '../dto/transit.dto';
import { TransitService } from '../service/transit.service';

@Controller('transits')
export class TransitController {
  constructor(private readonly transitService: TransitService) {}

  @Get(':transitId')
  public async getTransit(
    @Param('transitId') transitId: string,
  ): Promise<TransitDTO> {
    return this.transitService.loadTransit(transitId);
  }

  @Post()
  public async createTransit(
    @Body() transitDto: TransitDTO,
  ): Promise<TransitDTO> {
    const transit = await this.transitService.createTransitFromDTO(transitDto);
    return this.transitService.loadTransit(transit.getId());
  }

  @Post(':transitId/changeAddressTo')
  public async changeAddressTo(
    @Param('transitId') transitId: string,
    @Body() createAddressDto: CreateAddressDto,
  ): Promise<TransitDTO> {
    await this.transitService.changeTransitAddressTo(
      transitId,
      new AddressDTO(createAddressDto),
    );
    return this.transitService.loadTransit(transitId);
  }

  @Post(':transitId/changeAddressFrom')
  public async changeAddressFrom(
    @Param('transitId') transitId: string,
    @Body() createAddressDto: CreateAddressDto,
  ): Promise<TransitDTO> {
    await this.transitService.changeTransitAddressFrom(
      transitId,
      new AddressDTO(createAddressDto),
    );
    return this.transitService.loadTransit(transitId);
  }

  @Post(':transitId/cancel')
  public async cancel(
    @Param('transitId') transitId: string,
  ): Promise<TransitDTO> {
    await this.transitService.cancelTransit(transitId);
    return this.transitService.loadTransit(transitId);
  }

  @Post(':transitId/publish')
  public async publishTransit(
    @Param('transitId') transitId: string,
  ): Promise<TransitDTO> {
    await this.transitService.publishTransit(transitId);
    return this.transitService.loadTransit(transitId);
  }

  @Post(':transitId/findDrivers')
  public async findDriversForTransit(
    @Param('transitId') transitId: string,
  ): Promise<TransitDTO> {
    await this.transitService.findDriversForTransit(transitId);
    return this.transitService.loadTransit(transitId);
  }

  @Post(':transitId/accept/:driverId')
  public async acceptTransit(
    @Param('transitId') transitId: string,
    @Param('driverId') driverId: string,
  ): Promise<TransitDTO> {
    await this.transitService.acceptTransit(driverId, transitId);
    return this.transitService.loadTransit(transitId);
  }

  @Post(':transitId/start/:driverId')
  public async start(
    @Param('transitId') transitId: string,
    @Param('driverId') driverId: string,
  ): Promise<TransitDTO> {
    await this.transitService.startTransit(driverId, transitId);
    return this.transitService.loadTransit(transitId);
  }

  @Post(':transitId/reject/:driverId')
  public async reject(
    @Param('transitId') transitId: string,
    @Param('driverId') driverId: string,
  ): Promise<TransitDTO> {
    await this.transitService.rejectTransit(driverId, transitId);
    return this.transitService.loadTransit(transitId);
  }

  @Post(':transitId/complete/:driverId')
  public async complete(
    @Param('transitId') transitId: string,
    @Param('driverId') driverId: string,
  ): Promise<TransitDTO> {
    await this.transitService.completeTransitFromDto(driverId, transitId);
    return this.transitService.loadTransit(transitId);
  }
}

import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';

import { CreateDriverDto } from '../dto/create-driver.dto';
import { DriverDTO } from '../dto/driver.dto';
import { DriverStatus } from '../entity/driver.entity';
import { DriverService } from '../service/driver.service';

@Controller('drivers')
export class DriverController {
  constructor(private readonly driverService: DriverService) {}

  @Post()
  @UsePipes(ValidationPipe)
  public async createDriver(
    @Body() createDriverDto: CreateDriverDto,
  ): Promise<DriverDTO> {
    const driver = await this.driverService.createDriver(createDriverDto);

    return this.driverService.loadDriver(driver.getId());
  }

  @Get(':id')
  public async getDriver(@Param('id') id: string): Promise<DriverDTO> {
    return this.driverService.loadDriver(id);
  }

  @Post(':id')
  public async updateDriver(@Param('id') id: string): Promise<DriverDTO> {
    return this.driverService.loadDriver(id);
  }

  @Post(':id/deactivate')
  public async deactivateDriver(@Param('id') id: string): Promise<DriverDTO> {
    await this.driverService.changeDriverStatus(id, DriverStatus.INACTIVE);
    return this.driverService.loadDriver(id);
  }

  @Post(':id/activate')
  public async activateDriver(@Param('id') id: string): Promise<DriverDTO> {
    await this.driverService.changeDriverStatus(id, DriverStatus.ACTIVE);
    return this.driverService.loadDriver(id);
  }
}

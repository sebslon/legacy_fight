import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';

import { ClientDTO } from './client.dto';
import { ClientService } from './client.service';
import { CreateClientDto } from './create-client.dto';

@Controller('clients')
export class ClientController {
  constructor(private readonly clientService: ClientService) {}

  @Post()
  @UsePipes(ValidationPipe)
  public async register(
    @Body() createClientDto: CreateClientDto,
  ): Promise<ClientDTO> {
    const client = await this.clientService.registerClient(
      createClientDto.name,
      createClientDto.lastName,
      createClientDto.type,
      createClientDto.defaultPaymentType,
    );

    return this.clientService.load(client.getId());
  }

  @Get(':id')
  public async find(@Param('id') id: string): Promise<ClientDTO> {
    return this.clientService.load(id);
  }

  @Post(':id/upgrade')
  public async upgradeToVIP(@Param('id') id: string): Promise<ClientDTO> {
    await this.clientService.upgradeToVIP(id);
    return this.clientService.load(id);
  }

  @Post(':id/downgrade')
  public async downgrade(@Param('id') id: string): Promise<ClientDTO> {
    await this.clientService.downgradeToRegular(id);
    return this.clientService.load(id);
  }

  @Post(':id/changeDefaultPaymentType')
  public async changeDefaultPaymentType(
    @Param('id') id: string,
    @Body() createClientDto: Pick<CreateClientDto, 'defaultPaymentType'>,
  ): Promise<ClientDTO> {
    await this.clientService.changeDefaultPaymentType(
      id,
      createClientDto.defaultPaymentType,
    );
    return this.clientService.load(id);
  }
}

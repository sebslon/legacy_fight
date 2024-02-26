import { Controller, Get, Logger, Param } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';

import { AddressDTO } from '../dto/address.dto';
import { AnalyzedAddressesDTO } from '../dto/analyzed-addresses.dto';

import { TransitAnalyzerService } from './transit-analyzer.service';

@Controller('transitAnalyze')
export class TransitAnalyzerController {
  constructor(private readonly transitAnalyzer: TransitAnalyzerService) {}

  @Get(':clientId/:addressId')
  public async analyze(
    @Param('clientId') clientId: string,
    @Param('addressId') addressId: string,
  ): Promise<AnalyzedAddressesDTO> {
    const addresses = await this.transitAnalyzer.analyze(clientId, addressId);
    const addressDtos = addresses.map((a) => new AddressDTO(a));

    return new AnalyzedAddressesDTO(addressDtos);
  }

  @OnEvent('transit.completed')
  public async handleTransitCompletedEvent(
    clientId: string,
    addressId: string,
  ): Promise<void> {
    Logger.log(
      'Handling transit completed event',
      TransitAnalyzerController.name,
    );

    console.log('Handling transit completed event');

    await this.transitAnalyzer.analyze(clientId, addressId);
  }
}

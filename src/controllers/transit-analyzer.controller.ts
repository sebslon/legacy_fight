import { Controller, Get, Param } from '@nestjs/common';

import { AddressDto } from '../dto/address.dto';
import { AnalyzedAddressesDto } from '../dto/analyzed-addresses.dto';
import { TransitAnalyzerService } from '../service/transit-analyzer.service';

@Controller('transitAnalyze')
export class TransitAnalyzerController {
  constructor(private readonly transitAnalyzer: TransitAnalyzerService) {}

  @Get(':clientId/:addressId')
  public async analyze(
    @Param('clientId') clientId: string,
    @Param('addressId') addressId: string,
  ): Promise<AnalyzedAddressesDto> {
    const addresses = await this.transitAnalyzer.analyze(clientId, addressId);
    const addressDtos = addresses.map((a) => new AddressDto(a));

    return new AnalyzedAddressesDto(addressDtos);
  }
}

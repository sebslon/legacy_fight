import { Controller, Get, Param } from '@nestjs/common';

import { AddressDTO } from '../dto/address.dto';
import { AnalyzedAddressesDTO } from '../dto/analyzed-addresses.dto';
import { AddressRepository } from '../repository/address.repository';

import { GraphTransitAnalyzer } from './graph-transit-analyzer';

@Controller('transitAnalyze')
export class TransitAnalyzerController {
  constructor(
    private readonly transitAnalyzer: GraphTransitAnalyzer,
    private readonly addressRepository: AddressRepository,
  ) {}

  @Get(':clientId/:addressId')
  public async analyze(
    @Param('clientId') clientId: string,
    @Param('addressId') addressId: string,
  ): Promise<AnalyzedAddressesDTO> {
    const hashes = await this.transitAnalyzer.analyze(
      clientId,
      await this.addressRepository.findHashById(addressId),
    );

    const addressDTOs = await Promise.all(
      hashes.map((hash) => this.mapToAddressDTO(hash)),
    );

    return new AnalyzedAddressesDTO(addressDTOs);
  }

  private async mapToAddressDTO(hash: string): Promise<AddressDTO> {
    return new AddressDTO(await this.addressRepository.findByHashOrFail(hash));
  }
}

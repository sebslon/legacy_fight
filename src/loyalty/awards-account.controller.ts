import { Controller, Get, Param, Post } from '@nestjs/common';

import { AwardsAccountDTO } from './awards-account.dto';
import { AwardsService } from './awards.service';

@Controller('clients')
export class AwardsAccountController {
  constructor(private awardsService: AwardsService) {}

  @Post(':clientId/awards')
  public async register(
    @Param('clientId') clientId: string,
  ): Promise<AwardsAccountDTO> {
    await this.awardsService.registerToProgram(clientId);
    return this.awardsService.findBy(clientId);
  }

  @Post(':clientId/awards/activate')
  public async activate(
    @Param('clientId') clientId: string,
  ): Promise<AwardsAccountDTO> {
    await this.awardsService.activateAccount(clientId);
    return this.awardsService.findBy(clientId);
  }
  @Post(':clientId/awards/deactivate')
  public async deactivate(
    @Param('clientId') clientId: string,
  ): Promise<AwardsAccountDTO> {
    await this.awardsService.deactivateAccount(clientId);
    return this.awardsService.findBy(clientId);
  }

  @Post(':clientId/awards/balance')
  public async calculateBalance(
    @Param('clientId') clientId: string,
  ): Promise<number> {
    return this.awardsService.calculateBalance(clientId);
  }

  @Post(':clientId/awards/transfer/:toClientId/:howMuch')
  public async transferMiles(
    @Param('clientId') clientId: string,
    @Param('toClientId') toClientId: string,
    @Param('howMuch') howMuch: string,
  ): Promise<AwardsAccountDTO> {
    await this.awardsService.transferMiles(
      clientId,
      toClientId,
      Number(howMuch),
    );
    return this.awardsService.findBy(clientId);
  }

  @Get(':clientId/awards')
  public async findBy(
    @Param('clientId') clientId: string,
  ): Promise<AwardsAccountDTO> {
    return this.awardsService.findBy(clientId);
  }
}

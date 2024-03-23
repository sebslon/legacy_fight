import { Client } from '../../../src/entity/client.entity';
import { AwardsService } from '../../../src/loyalty/awards.service';

export class AwardsAccountFixture {
  constructor(private awardsService: AwardsService) {
    this.awardsService = awardsService;
  }

  public async createAwardsAccount(client: Client) {
    return await this.awardsService.registerToProgram(client.getId());
  }

  public async createActiveAwardsAccount(client: Client) {
    await this.createAwardsAccount(client);
    await this.awardsService.activateAccount(client.getId());
  }
}

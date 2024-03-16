import { ClaimDTO } from '../../../src/dto/claim.dto';
import { Client } from '../../../src/entity/client.entity';
import { Transit } from '../../../src/entity/transit/transit.entity';
import { ClaimService } from '../../../src/service/claim.service';

export class ClaimFixture {
  constructor(private claimService: ClaimService) {
    this.claimService = claimService;
  }

  public async createClaim(client: Client, transit: Transit, reason?: string) {
    const claimDto = this.createClaimDTO(
      'description',
      reason ?? 'reason',
      client.getId(),
      transit.getId(),
    );

    claimDto.setDraft(false);

    const claim = await this.claimService.create(claimDto);

    return claim;
  }

  public async createAndResolveClaim(client: Client, transit: Transit) {
    let claim = await this.createClaim(client, transit);
    claim = await this.claimService.tryToResolveAutomatically(claim.getId());
    return claim;
  }

  private createClaimDTO(
    desc: string,
    reason: string,
    clientId: string,
    transitId: string,
  ) {
    const claimDTO = new ClaimDTO();

    claimDTO.setClientId(clientId);
    claimDTO.setTransitId(transitId);
    claimDTO.setIncidentDescription(desc);
    claimDTO.setReason(reason);

    return claimDTO;
  }
}

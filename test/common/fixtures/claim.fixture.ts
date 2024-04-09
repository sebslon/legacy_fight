import { ClaimDTO } from '../../../src/crm/claims/claim.dto';
import { ClaimService } from '../../../src/crm/claims/claim.service';
import { Client } from '../../../src/crm/client.entity';
import { Transit } from '../../../src/ride/transit.entity';

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

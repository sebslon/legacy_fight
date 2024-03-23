import {
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { AppProperties } from '../../config/app-properties.config';
import { Type } from '../../entity/client.entity';
import { AwardsService } from '../../loyalty/awards.service';
import { ClientNotificationService } from '../../notification/client-notification.service';
import { DriverNotificationService } from '../../notification/driver-notification.service';
import { ClientRepository } from '../../repository/client.repository';
import { TransitDetailsFacade } from '../../transit-details/transit-details.facade';

import { ClaimNumberGenerator } from './claim-number-generator.service';
import { ClaimDTO } from './claim.dto';
import { Claim, ClaimStatus } from './claim.entity';
import { ClaimRepository } from './claim.repository';
import { ClaimsResolver, WhoToAsk } from './claims-resolver.entity';
import { ClaimsResolverRepository } from './claims-resolver.repository';

@Injectable()
export class ClaimService {
  constructor(
    @InjectRepository(ClientRepository)
    private clientRepository: ClientRepository,
    @InjectRepository(ClaimRepository)
    private claimRepository: ClaimRepository,
    @InjectRepository(ClaimsResolverRepository)
    private claimsResolverRepository: ClaimsResolverRepository,
    private claimNumberGenerator: ClaimNumberGenerator,
    @Inject(forwardRef(() => AwardsService))
    private awardsService: AwardsService,
    private clientNotificationService: ClientNotificationService,
    private driverNotificationService: DriverNotificationService,
    private appProperties: AppProperties,
    private transitDetailsFacade: TransitDetailsFacade,
  ) {}

  public async create(claimDTO: ClaimDTO): Promise<Claim> {
    let claim = new Claim();
    claim.setCreationDate(Date.now());
    claim.setClaimNo(await this.claimNumberGenerator.generate(claim));
    claim = await this.update(claimDTO, claim);
    return claim;
  }

  public async find(id: string): Promise<Claim> {
    const claim = await this.claimRepository.findOne(id);
    if (!claim) {
      throw new NotFoundException('Claim does not exists');
    }
    return claim;
  }

  public async update(claimDTO: ClaimDTO, claim: Claim) {
    const client = await this.clientRepository.findOne(claimDTO.getClientId());
    const transit = await this.transitDetailsFacade.find(
      claimDTO.getTransitId(),
    );

    if (client == null) {
      throw new NotFoundException('Client does not exists');
    }
    if (transit == null) {
      throw new NotFoundException('Transit does not exists');
    }
    if (claimDTO.isDraft()) {
      claim.setStatus(ClaimStatus.DRAFT);
    } else {
      claim.setStatus(ClaimStatus.NEW);
    }
    claim.setOwnerId(client.getId());
    claim.setTransit(transit.transitId);
    claim.setTransitPrice(transit.price);
    claim.setCreationDate(Date.now());
    claim.setReason(claimDTO.getReason());
    claim.setIncidentDescription(claimDTO.getIncidentDescription());
    return this.claimRepository.save(claim);
  }

  public async setStatus(newStatus: ClaimStatus, id: string) {
    const claim = await this.find(id);
    claim.setStatus(newStatus);
    await this.claimRepository.save(claim);
    return claim;
  }

  public async tryToResolveAutomatically(id: string): Promise<Claim> {
    const claim = await this.find(id);

    const claimsResolver = await this.findOrCreateResolver(claim.getOwnerId());
    const transitsDoneByClient = await this.transitDetailsFacade.findByClient(
      claim.getOwnerId(),
    );
    const client = await this.clientRepository.findOne(claim.getOwnerId());

    if (!client) {
      throw new NotFoundException('Client does not exists');
    }

    const clientType = client.getType();

    const automaticRefundForVipThreshold =
      this.appProperties.getAutomaticRefundForVipThreshold();
    const noOfTransitsForClaimAutomaticRefund =
      this.appProperties.getNoOfTransitsForClaimAutomaticRefund();

    const result = claimsResolver.resolve(
      claim,
      clientType,
      automaticRefundForVipThreshold,
      transitsDoneByClient.length,
      noOfTransitsForClaimAutomaticRefund,
    );

    if (result.decision === ClaimStatus.REFUNDED) {
      claim.refund();

      this.clientNotificationService.notifyClientAboutRefund(
        claim.getClaimNo(),
        claim.getOwnerId(),
      );

      if (clientType === Type.VIP) {
        await this.awardsService.registerNonExpiringMiles(
          claim.getOwnerId(),
          10,
        );
      }
    }

    if (result.decision === ClaimStatus.ESCALATED) {
      claim.escalate();
    }

    if (result.whoToAsk === WhoToAsk.ASK_DRIVER) {
      const transitDetailsDto = await this.transitDetailsFacade.find(
        claim.getTransitId(),
      );

      await this.driverNotificationService.askDriverForDetailsAboutClaim(
        claim.getClaimNo(),
        transitDetailsDto.driverId,
      );
    }

    if (result.whoToAsk === WhoToAsk.ASK_CLIENT) {
      await this.clientNotificationService.askForMoreInformation(
        claim.getClaimNo(),
        claim.getOwnerId(),
      );
    }

    await this.claimRepository.save(claim);
    await this.claimsResolverRepository.save(claimsResolver);

    return claim;
  }

  public async getNumberOfClaims(clientId: string) {
    return (await this.claimRepository.findAllByOwnerId(clientId)).length;
  }

  private async findOrCreateResolver(
    clientId: string,
  ): Promise<ClaimsResolver> {
    const resolver = await this.claimsResolverRepository.findByClientId(
      clientId,
    );

    if (!resolver) {
      return this.claimsResolverRepository.save(new ClaimsResolver(clientId));
    }

    return resolver;
  }
}

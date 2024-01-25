import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { AppProperties } from '../config/app-properties.config';
import { ClaimDto } from '../dto/claim.dto';
import { Claim, ClaimStatus } from '../entity/claim.entity';
import { ClaimsResolver, WhoToAsk } from '../entity/claims-resolver.entity';
import { Client, Type } from '../entity/client.entity';
import { ClaimRepository } from '../repository/claim.repository';
import { ClaimsResolverRepository } from '../repository/claims-resolver.repository';
import { ClientRepository } from '../repository/client.repository';
import { TransitRepository } from '../repository/transit.repository';

import { AwardsService } from './awards.service';
import { ClaimNumberGenerator } from './claim-number-generator.service';
import { ClientNotificationService } from './client-notification.service';
import { DriverNotificationService } from './driver-notification.service';

@Injectable()
export class ClaimService {
  constructor(
    @InjectRepository(ClientRepository)
    private clientRepository: ClientRepository,
    @InjectRepository(TransitRepository)
    private transitRepository: TransitRepository,
    @InjectRepository(ClaimRepository)
    private claimRepository: ClaimRepository,
    @InjectRepository(ClaimsResolverRepository)
    private claimsResolverRepository: ClaimsResolverRepository,
    private claimNumberGenerator: ClaimNumberGenerator,
    private awardsService: AwardsService,
    private clientNotificationService: ClientNotificationService,
    private driverNotificationService: DriverNotificationService,
    private appProperties: AppProperties,
  ) {}

  public async create(claimDTO: ClaimDto): Promise<Claim> {
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

  public async update(claimDTO: ClaimDto, claim: Claim) {
    const client = await this.clientRepository.findOne(claimDTO.getClientId());
    const transit = await this.transitRepository.findOne(
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
    claim.setOwner(client);
    claim.setTransit(transit);
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

    const claimsResolver = await this.findOrCreateResolver(claim.getOwner());
    const transitsDoneByClient = await this.transitRepository.findByClient(
      claim.getOwner(),
    );

    const automaticRefundForVipThreshold =
      this.appProperties.getAutomaticRefundForVipThreshold();
    const noOfTransitsForClaimAutomaticRefund =
      this.appProperties.getNoOfTransitsForClaimAutomaticRefund();

    const result = claimsResolver.resolve(
      claim,
      automaticRefundForVipThreshold,
      transitsDoneByClient.length,
      noOfTransitsForClaimAutomaticRefund,
    );

    if (result.decision === ClaimStatus.REFUNDED) {
      claim.refund();

      this.clientNotificationService.notifyClientAboutRefund(
        claim.getClaimNo(),
        claim.getOwner().getId(),
      );

      if (claim.getOwner().getType() === Type.VIP) {
        await this.awardsService.registerNonExpiringMiles(
          claim.getOwner().getId(),
          10,
        );
      }
    }

    if (result.decision === ClaimStatus.ESCALATED) {
      claim.escalate();
    }

    if (result.whoToAsk === WhoToAsk.ASK_DRIVER) {
      const driver = claim.getTransit().getDriver();

      if (driver) {
        await this.driverNotificationService.askDriverForDetailsAboutClaim(
          claim.getClaimNo(),
          driver.getId(),
        );
      }
    }

    if (result.whoToAsk === WhoToAsk.ASK_CLIENT) {
      await this.clientNotificationService.askForMoreInformation(
        claim.getClaimNo(),
        claim.getOwner().getId(),
      );
    }

    await this.claimRepository.save(claim);
    await this.claimsResolverRepository.save(claimsResolver);

    return claim;
  }

  private async findOrCreateResolver(client: Client): Promise<ClaimsResolver> {
    const clientId = client.getId();
    const resolver = await this.claimsResolverRepository.findByClientId(
      clientId,
    );

    if (!resolver) {
      return this.claimsResolverRepository.save(new ClaimsResolver(clientId));
    }

    return resolver;
  }
}

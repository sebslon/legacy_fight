import { Body, Controller, Get, Param, Post } from '@nestjs/common';

import { CreateClaimDto } from '../../dto/create-claim.dto';

import { ClaimDTO } from './claim.dto';
import { Claim, ClaimStatus } from './claim.entity';
import { ClaimService } from './claim.service';

@Controller('claims')
export class ClaimController {
  constructor(private claimService: ClaimService) {}

  @Post('createDraft')
  public async create(@Body() createClaimDto: CreateClaimDto) {
    const created = await this.claimService.create(
      new ClaimDTO(createClaimDto),
    );
    return this.toDto(created);
  }

  @Post('send')
  public async sendNew(@Body() createClaimDto: CreateClaimDto) {
    const claimDto = new ClaimDTO(createClaimDto);
    claimDto.setDraft(false);
    const claim = await this.claimService.create(claimDto);
    return this.toDto(claim);
  }

  @Post(':claimId/markInProcess')
  public async markAsInProcess(@Param('claimId') claimId: string) {
    const claim = await this.claimService.setStatus(
      ClaimStatus.IN_PROCESS,
      claimId,
    );
    return this.toDto(claim);
  }

  @Get(':claimId')
  public async find(@Param('claimId') claimId: string) {
    const claim = await this.claimService.find(claimId);
    const dto = this.toDto(claim);
    return dto;
  }

  @Post('/claims/:claimId')
  public async tryToAutomaticallyResolve(@Param('claimId') claimId: string) {
    const claim = await this.claimService.tryToResolveAutomatically(claimId);
    return this.toDto(claim);
  }

  private toDto(claim: Claim) {
    return new ClaimDTO(claim);
  }
}

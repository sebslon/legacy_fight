import { CreateClaimDto } from '../../dto/create-claim.dto';

import { Claim, ClaimStatus, ClaimCompletionMode } from './claim.entity';

export class ClaimDTO {
  private claimID: string;

  private clientId: string;

  private transitId: string;

  private reason: string;

  private incidentDescription: string | null;

  private _isDraft: boolean;

  private creationDate: number;

  private completionDate: number | null;

  private changeDate: number | null;

  private completionMode: ClaimCompletionMode | null;

  private status: ClaimStatus;

  private claimNo: string;

  public static createFromRawData(
    claimID: string,
    ownerId: string,
    transitId: string,
    reason: string,
    incidentDescription: string | null,
    creationDate: number,
    completionDate: number | null,
    changeDate: number | null,
    completionMode: ClaimCompletionMode | null,
    status: ClaimStatus,
    claimNo: string,
  ): ClaimDTO {
    const claim = new ClaimDTO();
    claim.setClaimID(claimID);
    claim.setClientId(ownerId);
    claim.setTransitId(transitId);
    claim.setReason(reason);
    claim.setIncidentDescription(incidentDescription);
    claim.setCreationDate(creationDate);
    claim._isDraft = status === ClaimStatus.DRAFT;
    claim.setCompletionDate(completionDate);
    claim.setChangeDate(changeDate);
    claim.setCompletionMode(completionMode);
    claim.setStatus(status);
    claim.setClaimNo(claimNo);
    return claim;
  }

  public constructor(claim?: Claim | CreateClaimDto) {
    if (!claim) {
      return this;
    }

    if (!(claim instanceof Claim)) {
      this.setClaimID(claim.clientId);
      this.setReason(claim.reason);
      this.setDraft(true);
      this.setIncidentDescription(claim.incidentDescription);
    } else {
      this.setDraft(claim.getStatus() === ClaimStatus.DRAFT);
      this.setClaimID(claim.getId());
      this.setReason(claim.getReason());
      this.setIncidentDescription(claim.getIncidentDescription());
      this.setTransitId(claim.getTransitId());
      this.setClientId(claim.getOwnerId());
      this.setCompletionDate(claim.getCompletionDate());
      this.setChangeDate(claim.getChangeDate());
      this.setClaimNo(claim.getClaimNo());
      this.setStatus(claim.getStatus());
      this.setCompletionMode(claim.getCompletionMode());
      this.setCreationDate(claim.getCreationDate());
    }
  }

  public getCreationDate() {
    return this.creationDate;
  }

  public setCreationDate(creationDate: number) {
    this.creationDate = creationDate;
  }

  public getCompletionDate() {
    return this.completionDate;
  }

  public setCompletionDate(completionDate: number | null) {
    this.completionDate = completionDate;
  }

  public getChangeDate() {
    return this.changeDate;
  }

  public setChangeDate(changeDate: number | null) {
    this.changeDate = changeDate;
  }

  public getCompletionMode() {
    return this.completionMode;
  }

  public setCompletionMode(completionMode: ClaimCompletionMode | null) {
    this.completionMode = completionMode;
  }

  public getStatus() {
    return this.status;
  }

  public setStatus(status: ClaimStatus) {
    this.status = status;
  }

  public getClaimNo() {
    return this.claimNo;
  }

  public setClaimNo(claimNo: string) {
    this.claimNo = claimNo;
  }

  public getClaimID() {
    return this.claimID;
  }

  public setClaimID(claimID: string) {
    this.claimID = claimID;
  }

  public getClientId() {
    return this.clientId;
  }

  public setClientId(clientId: string) {
    this.clientId = clientId;
  }

  public getTransitId() {
    return this.transitId;
  }

  public setTransitId(transitId: string) {
    this.transitId = transitId;
  }

  public getReason() {
    return this.reason;
  }

  public setReason(reason: string) {
    this.reason = reason;
  }

  public getIncidentDescription() {
    return this.incidentDescription;
  }

  public setIncidentDescription(incidentDescription: string | null) {
    this.incidentDescription = incidentDescription;
  }

  public isDraft() {
    return this._isDraft;
  }

  public setDraft(draft: boolean) {
    this._isDraft = draft;
  }
}

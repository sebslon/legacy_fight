import { ContractAttachmentStatus } from '../../src/agreements/contract-attachment.entity';
import { Contract, ContractStatus } from '../../src/agreements/contract.entity';

describe('Contract Lifecycle', () => {
  const uniquePartnerName = 'partnerWithUniqueName';

  it('Can create contract', async () => {
    const contract = createContract(uniquePartnerName, 'subject');

    expect(contract.getPartnerName()).toBe(uniquePartnerName);
    expect(contract.getSubject()).toBe('subject');
    expect(contract.getStatus()).toBe(ContractStatus.NEGOTIATIONS_IN_PROGRESS);
    expect(contract.getCreationDate()).toBeLessThanOrEqual(Date.now());
    expect(contract.getChangeDate()).toBeUndefined();
    expect(contract.getAcceptedAt()).toBeUndefined();
    expect(contract.getRejectedAt()).toBeUndefined();
  });

  it('Can add attachment to contract', () => {
    const contract = createContract(uniquePartnerName, 'subject');
    const attachment = contract.proposeAttachment();

    expect(contract.getAttachmentIds().length).toBe(1);
    expect(
      contract
        .findAttachment(attachment.getContractAttachmentNo())
        ?.getStatus(),
    ).toBe(ContractAttachmentStatus.PROPOSED);
  });

  it('Can remove attachment from contract', () => {
    const contract = createContract(uniquePartnerName, 'subject');
    const attachment = contract.proposeAttachment();

    contract.remove(attachment.getContractAttachmentNo());

    expect(contract.getAttachmentIds().length).toBe(0);
  });

  it('Can accept attachment by one side', () => {
    const contract = createContract(uniquePartnerName, 'subject');
    const attachment = contract.proposeAttachment();

    contract.acceptAttachment(attachment.getContractAttachmentNo());

    expect(contract.getAttachmentIds().length).toBe(1);
    expect(
      contract
        .findAttachment(attachment.getContractAttachmentNo())
        ?.getStatus(),
    ).toBe(ContractAttachmentStatus.ACCEPTED_BY_ONE_SIDE);
  });

  it('Can accept attachment by two sides', () => {
    const contract = createContract(uniquePartnerName, 'subject');
    const attachment = contract.proposeAttachment();

    contract.acceptAttachment(attachment.getContractAttachmentNo());
    contract.acceptAttachment(attachment.getContractAttachmentNo());

    expect(contract.getAttachmentIds().length).toBe(1);
    expect(
      contract
        .findAttachment(attachment.getContractAttachmentNo())
        ?.getStatus(),
    ).toBe(ContractAttachmentStatus.ACCEPTED_BY_BOTH_SIDES);
  });

  it('Can reject attachment', () => {
    const contract = createContract(uniquePartnerName, 'subject');
    const attachment = contract.proposeAttachment();

    contract.rejectAttachment(attachment.getContractAttachmentNo());

    expect(contract.getAttachmentIds().length).toBe(1);
    expect(
      contract
        .findAttachment(attachment.getContractAttachmentNo())
        ?.getStatus(),
    ).toBe(ContractAttachmentStatus.REJECTED);
  });

  it('Can accept contract when all attachments are accepted', () => {
    const contract = createContract(uniquePartnerName, 'subject');
    const attachment = contract.proposeAttachment();

    contract.acceptAttachment(attachment.getContractAttachmentNo());
    contract.acceptAttachment(attachment.getContractAttachmentNo());

    contract.accept();

    expect(contract.getStatus()).toBe(ContractStatus.ACCEPTED);
  });

  it('Can reject contract', () => {
    const contract = createContract(uniquePartnerName, 'subject');
    const attachment = contract.proposeAttachment();

    contract.acceptAttachment(attachment.getContractAttachmentNo());
    contract.acceptAttachment(attachment.getContractAttachmentNo());

    contract.reject();

    expect(contract.getStatus()).toBe(ContractStatus.REJECTED);
  });

  it("Can't accept contract when not all attachments are accepted", () => {
    const contract = createContract(uniquePartnerName, 'subject');
    const attachment = contract.proposeAttachment();

    contract.acceptAttachment(attachment.getContractAttachmentNo());

    expect(() => contract.accept()).toThrowError(
      'Not all attachments accepted by both sides',
    );
    expect(contract.getStatus()).not.toBe(ContractStatus.ACCEPTED);
  });

  function createContract(partnerName: string, subject: string) {
    return new Contract(partnerName, subject, 'no');
  }
});

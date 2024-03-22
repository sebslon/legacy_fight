import { randomUUID } from 'crypto';

import { Test, TestingModule } from '@nestjs/testing';
import { getConnection } from 'typeorm';

import { ContractAttachmentDto } from '../../src/agreements/contract-attachment.dto';
import { ContractAttachmentStatus } from '../../src/agreements/contract-attachment.entity';
import { ContractDTO } from '../../src/agreements/contract.dto';
import { ContractStatus } from '../../src/agreements/contract.entity';
import { ContractService } from '../../src/agreements/contract.service';
import { AppModule } from '../../src/app.module';
import { CreateContractAttachmentDTO } from '../../src/dto/create-contract-attachment.dto';
import { CreateContractDTO } from '../../src/dto/create-contract.dto';

describe('Contracts lifecycle', () => {
  let contractService: ContractService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    contractService = module.get<ContractService>(ContractService);
  });

  afterAll(async () => {
    await getConnection().query('TRUNCATE TABLE contract CASCADE');
    await getConnection().query('TRUNCATE TABLE contract_attachment CASCADE');
    await getConnection().close();
  });

  it('Can create contract', async () => {
    const created = await createContract('partner_with_unique_name', 'subject');
    const loaded = await loadContract(created.getId());

    expect(loaded.getPartnerName()).toEqual('partner_with_unique_name');
    expect(loaded.getSubject()).toEqual('subject');
    expect(loaded.getStatus()).toEqual(ContractStatus.NEGOTIATIONS_IN_PROGRESS);
    expect(loaded.getId()).not.toBeNull();
    expect(loaded.getCreationDate()).not.toBeNull();
    expect(loaded.getChangeDate()).toBeNull();
    expect(loaded.getAcceptedAt()).toBeNull();
    expect(loaded.getRejectedAt()).toBeNull();
  });

  it('Second contract for the same partner has correct number', async () => {
    const id1 = randomUUID();

    const first = await createContract(id1, 'subject');
    const second = await createContract(id1, 'subject');

    const loadedFirst = await loadContract(first.getId());
    const loadedSecond = await loadContract(second.getId());

    expect(loadedFirst.getPartnerName()).toEqual(id1);
    expect(loadedSecond.getPartnerName()).toEqual(id1);
    expect(loadedFirst.getContractNo()).toEqual(`C/1/${id1}`);
    expect(loadedSecond.getContractNo()).toEqual(`C/2/${id1}`);
  });

  it('Can add attachment to contract', async () => {
    const created = await createContract('partner_with_unique_name', 'subject');

    await addAttachmentToContract(created, 'content');

    const loaded = await loadContract(created.getId());

    const byteContent = Buffer.from(
      '\\x' + Buffer.from('content', 'base64').toString('hex'),
    ).toString();

    expect(loaded.getAttachments().length).toEqual(1);
    expect(loaded.getAttachments()[0].getData().toString()).toEqual(
      byteContent,
    );
    expect(loaded.getAttachments()[0].getStatus()).toEqual(
      ContractAttachmentStatus.PROPOSED,
    );
  });

  it('Can remove attachment from contract', async () => {
    const created = await createContract('partner_with_unique_name', 'subject');
    const attachment = await addAttachmentToContract(created, 'content');

    await removeAttachmentFromContract(created, attachment.getId());

    const loaded = await loadContract(created.getId());

    expect(loaded.getAttachments().length).toEqual(0);
  });

  it('Can accept attachment by one side', async () => {
    const created = await createContract('partner_with_unique_name', 'subject');
    const attachment = await addAttachmentToContract(created, 'content');

    await acceptAttachment(attachment);

    const loaded = await loadContract(created.getId());

    expect(loaded.getAttachments().length).toEqual(1);
    expect(loaded.getAttachments()[0].getStatus()).toEqual(
      ContractAttachmentStatus.ACCEPTED_BY_ONE_SIDE,
    );
  });

  it('Can accept attachment by both sides', async () => {
    const created = await createContract('partner_with_unique_name', 'subject');
    const attachment = await addAttachmentToContract(created, 'content');

    await acceptAttachment(attachment);
    await acceptAttachment(attachment);

    const loaded = await loadContract(created.getId());

    expect(loaded.getAttachments().length).toEqual(1);
    expect(loaded.getAttachments()[0].getStatus()).toEqual(
      ContractAttachmentStatus.ACCEPTED_BY_BOTH_SIDES,
    );
  });

  it('Can reject attachment', async () => {
    const created = await createContract('partner_with_unique_name', 'subject');
    const attachment = await addAttachmentToContract(created, 'content');

    await rejectAttachment(created, attachment.getId());

    const loaded = await loadContract(created.getId());
    expect(loaded.getAttachments().length).toEqual(1);
    expect(loaded.getAttachments()[0].getStatus()).toEqual(
      ContractAttachmentStatus.REJECTED,
    );
  });

  it('Can accept contract when all attachments are accepted', async () => {
    const created = await createContract('partner_with_unique_name', 'subject');
    const attachment = await addAttachmentToContract(created, 'content');

    await acceptAttachment(attachment);
    await acceptAttachment(attachment);

    await acceptContract(created);

    const loaded = await loadContract(created.getId());
    expect(loaded.getStatus()).toEqual(ContractStatus.ACCEPTED);
  });

  it('Can reject contract', async () => {
    const created = await createContract('partner_with_unique_name', 'subject');
    const attachment = await addAttachmentToContract(created, 'content');

    await acceptAttachment(attachment);
    await acceptAttachment(attachment);

    await rejectContract(created);

    const loaded = await loadContract(created.getId());
    expect(loaded.getStatus()).toEqual(ContractStatus.REJECTED);
  });

  it('Can not accept contract when not all attachments are accepted', async () => {
    const created = await createContract('partner_with_unique_name', 'subject');
    const attachment = await addAttachmentToContract(created, 'content');

    await acceptAttachment(attachment);

    expect(() => acceptContract(created)).rejects.toThrowError(
      'Not all attachments accepted by both sides',
    );

    const loaded = await loadContract(created.getId());

    expect(loaded.getStatus()).not.toEqual(ContractStatus.ACCEPTED);
  });

  // HELPER FUNCTIONS

  async function loadContract(id: string) {
    return contractService.findDto(id);
  }

  async function createContract(partnerName: string, subject: string) {
    const dto = new CreateContractDTO();

    dto.partnerName = partnerName;
    dto.subject = subject;

    const contract = await contractService.createContract(dto);

    return loadContract(contract.getId());
  }

  async function addAttachmentToContract(
    created: ContractDTO,
    content: string,
  ) {
    const contractAttachmentDto = new CreateContractAttachmentDTO();

    contractAttachmentDto.data = content;

    return contractService.proposeAttachment(
      created.getId(),
      contractAttachmentDto,
    );
  }

  async function removeAttachmentFromContract(
    created: ContractDTO,
    attachmentId: string,
  ) {
    return contractService.removeAttachment(created.getId(), attachmentId);
  }

  async function acceptAttachment(attachment: ContractAttachmentDto) {
    return contractService.acceptAttachment(attachment.getId());
  }

  async function rejectAttachment(created: ContractDTO, attachmentId: string) {
    return contractService.rejectAttachment(attachmentId);
  }

  async function acceptContract(created: ContractDTO) {
    return contractService.acceptContract(created.getId());
  }

  async function rejectContract(created: ContractDTO) {
    return contractService.rejectContract(created.getId());
  }
});

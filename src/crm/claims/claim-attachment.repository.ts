import { EntityRepository, Repository } from 'typeorm';

import { ClaimAttachment } from './claim-attachment.entity';

@EntityRepository(ClaimAttachment)
export class ClaimAttachmentRepository extends Repository<ClaimAttachment> {}

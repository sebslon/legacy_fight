import { EventEmitter2 } from '@nestjs/event-emitter';

import { ChangeVerifier } from '../config/actions/change-verifier';
import { PublishEvent } from '../config/actions/publish-event';
import { DocumentPublished } from '../config/events/document-published';
import { AuthorIsNotAVerifier } from '../config/predicates/state-change/author-is-not-a-verifier.verifier';
import { ContentNotEmptyVerifier } from '../config/predicates/state-change/content-not-empty.verifier';
import { StateBuilder } from '../state-builder';
import { StateConfig } from '../state-config.interface';

/**
 * Sample static config.
 */
export class AcmeContractStateAssembler {
  public static readonly VERIFIED = 'verified';
  public static readonly DRAFT = 'draft';
  public static readonly PUBLISHED = 'published';
  public static readonly ARCHIVED = 'archived';

  public static PARAM_VERIFIER = ChangeVerifier.PARAM_VERIFIER;

  private readonly publisher: EventEmitter2;

  public constructor(publisher: EventEmitter2) {
    this.publisher = publisher;
  }

  public assemble(): StateConfig {
    const builder = new StateBuilder();

    builder
      .beginWith(AcmeContractStateAssembler.DRAFT)
      .check(new ContentNotEmptyVerifier())
      .check(new AuthorIsNotAVerifier())
      .to(AcmeContractStateAssembler.VERIFIED)
      .action(new ChangeVerifier());

    builder
      .from(AcmeContractStateAssembler.DRAFT)
      .whenContentChanged()
      .to(AcmeContractStateAssembler.DRAFT);

    builder
      .from(AcmeContractStateAssembler.VERIFIED)
      .check(new ContentNotEmptyVerifier())
      .to(AcmeContractStateAssembler.PUBLISHED)
      .action(new PublishEvent(DocumentPublished, this.publisher));

    builder
      .from(AcmeContractStateAssembler.VERIFIED)
      .whenContentChanged()
      .to(AcmeContractStateAssembler.DRAFT);

    builder
      .from(AcmeContractStateAssembler.DRAFT)
      .to(AcmeContractStateAssembler.ARCHIVED);
    builder
      .from(AcmeContractStateAssembler.VERIFIED)
      .to(AcmeContractStateAssembler.ARCHIVED);
    builder
      .from(AcmeContractStateAssembler.PUBLISHED)
      .to(AcmeContractStateAssembler.ARCHIVED)
      .action(new PublishEvent(DocumentPublished, this.publisher));

    return builder;
  }
}

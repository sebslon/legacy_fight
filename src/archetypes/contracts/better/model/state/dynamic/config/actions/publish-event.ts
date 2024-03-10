import { EventEmitter2 } from '@nestjs/event-emitter';

import { DocumentHeader } from '../../../../document-header';
import { ChangeCommand } from '../../change-command';
import { DocumentEvent } from '../events/document.event';
import { BiFunction } from '../predicates/state-change/content-not-empty.verifier';

export class PublishEvent
  implements BiFunction<DocumentHeader, ChangeCommand, void>
{
  public constructor(
    private eventClass: typeof DocumentEvent,
    private eventEmitter: EventEmitter2,
  ) {}

  public apply(documentHeader: DocumentHeader, command: ChangeCommand): void {
    let event: DocumentEvent;
    try {
      event = Reflect.construct(this.eventClass, [
        command.getParam('documentId'),
        documentHeader.getStateDescriptor(),
        documentHeader.getContentId(),
        documentHeader.getId(),
      ]);
    } catch (error) {
      throw new Error('Error creating event');
    }

    this.eventEmitter.emit(event.constructor.name, event);
  }
}

import { DocumentHeader } from '../../../../document-header';
import { ChangeCommand } from '../../change-command';
import { BiFunction } from '../predicates/state-change/content-not-empty.verifier';

export class ChangeVerifier
  implements BiFunction<DocumentHeader, ChangeCommand, null>
{
  public static readonly PARAM_VERIFIER = 'verifier';

  public apply(documentHeader: DocumentHeader, command: ChangeCommand): null {
    documentHeader.setVerifierId(
      command.getParam(ChangeVerifier.PARAM_VERIFIER),
    );
    return null;
  }
}

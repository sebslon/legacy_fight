import {
  Document,
  DocumentStatus,
} from '../../../../src/archetypes/contracts/legacy/document';
import { User } from '../../../../src/archetypes/contracts/legacy/user';

describe('Document - LEGACY', () => {
  const ANY_NUMBER = 'number';
  const ANY_USER = new User();
  const OTHER_USER = new User();
  const TITLE = 'title';

  test('Draft can be verified by user other than creator', () => {
    const doc = new Document(ANY_NUMBER, ANY_USER);

    doc.verifyBy(OTHER_USER);

    expect(doc.getStatus()).toBe(DocumentStatus.VERIFIED);
  });

  test('Can not change published', () => {
    const doc = new Document(ANY_NUMBER, ANY_USER);
    doc.changeTitle(TITLE);
    doc.verifyBy(OTHER_USER);
    doc.publish();

    expect(() => {
      doc.changeTitle('');
    }).toThrowError();
    expect(doc.getTitle()).toBe(TITLE);
  });

  test('Changing verified moves to draft', () => {
    const doc = new Document(ANY_NUMBER, ANY_USER);
    doc.changeTitle(TITLE);
    doc.verifyBy(OTHER_USER);

    doc.changeTitle('');

    expect(doc.getStatus()).toBe(DocumentStatus.DRAFT);
  });
});

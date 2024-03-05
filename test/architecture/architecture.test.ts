import { filesOfProject } from 'tsarch';

describe('Architecture', () => {
  jest.setTimeout(30000);

  it('Business/Services logic should not depend on the controllers', async () => {
    const rule = filesOfProject()
      .inFolder('service')
      .shouldNot()
      .dependOnFiles()
      .inFolder('controllers');

    const violations = await rule.check();

    await expect(violations).toHaveLength(0);
  });
});

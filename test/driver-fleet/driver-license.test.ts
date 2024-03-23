import { DriverLicense } from '../../src/driver-fleet/driver-license';

describe('DriverLicense', () => {
  const validLicense = 'FARME100165AB5EW';
  it("Can't create invalid license", () => {
    expect(() => DriverLicense.withLicense('invalid')).toThrow();
    expect(() => DriverLicense.withLicense('')).toThrow();
  });

  it('Can create valid license', () => {
    const license = DriverLicense.withLicense(validLicense);

    expect(license.asString()).toEqual(validLicense);
  });

  it('Can create invalid license explicitly', () => {
    const license = DriverLicense.withoutValidation('invalid');

    expect(license.asString()).toEqual('invalid');
  });
});

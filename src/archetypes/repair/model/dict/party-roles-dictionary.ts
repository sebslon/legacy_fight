enum PartyRoles {
  INSURER = 'INSURER',
  INSURED = 'INSURED',
  GUARANTOR = 'GUARANTOR',
  CUSTOMER = 'CUSTOMER',
}

abstract class PartyBasedRole {
  public abstract getRoleName(): string;
}

export class ExtendedInsurance implements PartyBasedRole {
  public getRoleName() {
    return PartyRoles.INSURER;
  }
}

export class Insured implements PartyBasedRole {
  public getRoleName() {
    return PartyRoles.INSURED;
  }
}

export class Warranty implements PartyBasedRole {
  public getRoleName() {
    return PartyRoles.GUARANTOR;
  }
}

export class Customer implements PartyBasedRole {
  public getRoleName() {
    return PartyRoles.CUSTOMER;
  }
}

export class PartyRolesDictionary {
  private readonly name: string;

  public static readonly INSURER = new PartyRolesDictionary(
    new ExtendedInsurance(),
  );
  public static readonly INSURED = new PartyRolesDictionary(new Insured());
  public static readonly GUARANTOR = new PartyRolesDictionary(new Warranty());
  public static readonly CUSTOMER = new PartyRolesDictionary(new Customer());

  private constructor(role: PartyBasedRole) {
    this.name = role.getRoleName();
  }

  public getRoleName(): string {
    return this.name;
  }
}

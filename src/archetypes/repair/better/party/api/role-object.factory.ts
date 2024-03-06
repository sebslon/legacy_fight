import { PartyRelationship } from '../model/party/party-relationship';
import { PartyBasedRole } from '../model/role/party-based-role';

/**
 * Sample impl based on Class-Instance map.
 * More advanced impls can be case on a DI container: getRole can obtain role instance from the container.
 *
 * TODO introduce an interface to convert to Abstract Factory Pattern to be able to choose factory impl
 */
export class RoleObjectFactory {
  // <object type/class name, object instance>
  private readonly roleMap: Map<string, PartyBasedRole> = new Map(); // PolymporphicHashMap

  public hasRole(role: string): boolean {
    return this.roleMap.has(role);
  }

  public static from(partyRelationship: PartyRelationship) {
    const roleObject = new RoleObjectFactory();
    roleObject.add(partyRelationship);
    return roleObject;
  }

  private add(partyRelationship: PartyRelationship) {
    // fix this - should be more like a reflection in JAVA, should create a proper type
    const roleA = partyRelationship.getRoleA();
    const roleB = partyRelationship.getRoleB();
    const partyA = partyRelationship.getPartyA();
    const partyB = partyRelationship.getPartyB();

    this.roleMap.set(roleA, new PartyBasedRole(partyA));
    this.roleMap.set(roleB, new PartyBasedRole(partyB));
  }

  public getRole<T>(role: string): T | undefined {
    return this.roleMap.get(role) as T | undefined;
  }
}

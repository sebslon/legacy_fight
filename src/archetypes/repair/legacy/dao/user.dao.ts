import { Parts } from '../parts/parts';
import { EmployeeDriverWithOwnCar } from '../user/employee-driver-with-own-car';
import { SignedContract } from '../user/signed-contract';

/*
  Fake impl that fakes graph query and determining CommonBaseAbstractUser type
 */
// @EntityRepository()
export class UserDAO {
  public getOne(userId: string) {
    console.log(userId);

    const contract = new SignedContract();

    contract.setCoveredParts(new Set(Object.values(Parts)));
    contract.setCoverageRatio(100);

    const user = new EmployeeDriverWithOwnCar();
    user.setContract(contract);

    return user;
  }
}

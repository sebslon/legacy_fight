import { CarTypeDTO } from '../../../src/dto/car-type.dto';
import { CarClass, CarType } from '../../../src/entity/car-type.entity';
import { CarTypeService } from '../../../src/service/car-type.service';

export class CarTypeFixture {
  constructor(private carTypeService: CarTypeService) {
    this.carTypeService = carTypeService;
  }

  public async createActiveCarCategory(carClass: CarClass) {
    const randomNumberFrom1to5 = Math.floor(Math.random() * 5) + 1;

    const carTypeObj = new CarType(
      carClass,
      'description',
      randomNumberFrom1to5,
    );
    const carTypeDTO = new CarTypeDTO(carTypeObj);

    const carType = await this.carTypeService.create(carTypeDTO);

    for (let i = 1; i < carType.getMinNoOfCarsToActivateClass() + 1; i += 1) {
      await this.carTypeService.registerCar(carType.getCarClass());
    }

    await this.carTypeService.activate(carType.getId());

    return carType;
  }
}

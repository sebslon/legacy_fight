import { Test, TestingModule } from '@nestjs/testing';
import { getConnection } from 'typeorm';

import { AppModule } from '../../src/app.module';
import { CarTypeDto } from '../../src/dto/car-type.dto';
import { CarClass } from '../../src/entity/car-type.entity';
import { CarTypeService } from '../../src/service/car-type.service';

describe('Car Type Update', () => {
  let carTypeService: CarTypeService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    carTypeService = module.get<CarTypeService>(CarTypeService);
  });

  afterAll(async () => {
    await getConnection().close();
  });

  it('Can create Car Type', async () => {
    await ensureThereIsNoCarClassInTheSystem(CarClass.VAN);

    const created = await createCarClass('Big And Nice', CarClass.VAN);
    const loaded = await loadCarType(created.getId());

    expect(loaded.getCarClass()).toEqual(CarClass.VAN);
    expect(loaded.getDescription()).toEqual('Big And Nice');
    expect(loaded.getActiveCarsCounter()).toEqual(0);
    expect(loaded.getCarsCounter()).toEqual(0);
  });

  it('Can change car type description', async () => {
    await ensureThereIsNoCarClassInTheSystem(CarClass.VAN);

    createCarClass('Big And Nice', CarClass.VAN);

    const changed = await createCarClass('Big And Ugly', CarClass.VAN);

    const loaded = await loadCarType(changed.getId());

    expect(loaded.getCarClass()).toEqual(CarClass.VAN);
    expect(loaded.getDescription()).toEqual('Big And Ugly');
    expect(loaded.getActiveCarsCounter()).toEqual(0);
    expect(loaded.getCarsCounter()).toEqual(0);
  });

  it('Can register active cars', async () => {
    const created = await createCarClass('Big And Nice', CarClass.VAN);

    let loaded = await loadCarType(created.getId());
    const currentActiveCarsCount = loaded.getActiveCarsCounter();

    await registerActiveCar(CarClass.VAN);

    loaded = await loadCarType(created.getId());

    expect(loaded.getActiveCarsCounter()).toEqual(currentActiveCarsCount + 1);
  });

  it('Can unregister active cars', async () => {
    const created = await createCarClass('Big And Nice', CarClass.VAN);

    let loaded = await loadCarType(created.getId());
    const currentActiveCarsCount = loaded.getActiveCarsCounter();

    await unregisterActiveCar(CarClass.VAN);

    loaded = await loadCarType(created.getId());

    expect(loaded.getActiveCarsCounter()).toEqual(currentActiveCarsCount - 1);
  });

  // HELPER FUNCTIONS

  async function ensureThereIsNoCarClassInTheSystem(carClass: CarClass) {
    await carTypeService.removeCarType(carClass);
  }

  async function createCarClass(description: string, carClass: CarClass) {
    const carTypeDTO = new CarTypeDto();

    carTypeDTO.setCarClass(carClass);
    carTypeDTO.setDescription(description);

    return carTypeService.loadDto(
      (await carTypeService.create(carTypeDTO)).getId(),
    );
  }

  async function loadCarType(id: string) {
    return carTypeService.loadDto(id);
  }

  async function registerActiveCar(carClass: CarClass) {
    return carTypeService.registerActiveCar(carClass);
  }

  async function unregisterActiveCar(carClass: CarClass) {
    return carTypeService.unregisterActiveCar(carClass);
  }
});

import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { Clock } from '../common/clock';
import { AppProperties } from '../config/app-properties.config';
import { AwardsAccountDto } from '../dto/awards-account.dto';
import { Type } from '../entity/client.entity';
import { AwardedMiles } from '../miles/awarded-miles.entity';
import { AwardsAccount } from '../miles/awards-account.entity';
import { AwardsAccountRepository } from '../repository/awards-account.repository';
import { ClientRepository } from '../repository/client.repository';
import { TransitRepository } from '../repository/transit.repository';

export interface MilesSortingStrategy {
  comparators: ((m: AwardedMiles) => number | boolean | null | undefined)[];
  orders?: ('asc' | 'desc' | boolean)[];
}

export interface IAwardsService {
  findBy: (clientId: string) => Promise<AwardsAccountDto>;

  registerToProgram: (clientId: string) => Promise<void>;

  activateAccount: (clientId: string) => Promise<void>;

  deactivateAccount: (clientId: string) => Promise<void>;

  registerMiles: (
    clientId: string,
    transitId: string,
  ) => Promise<AwardedMiles | null>;

  registerNonExpiringMiles: (
    clientId: string,
    miles: number,
  ) => Promise<AwardedMiles>;

  removeMiles: (clientId: string, miles: number) => Promise<void>;

  calculateBalance: (clientId: string) => Promise<number>;

  transferMiles: (
    fromClientId: string,
    toClientId: string,
    miles: number,
  ) => Promise<void>;
}

@Injectable()
export class AwardsService implements IAwardsService {
  constructor(
    @InjectRepository(ClientRepository)
    private clientRepository: ClientRepository,
    @InjectRepository(TransitRepository)
    private transitRepository: TransitRepository,
    @InjectRepository(AwardsAccountRepository)
    private accountRepository: AwardsAccountRepository,
    private appProperties: AppProperties,
  ) {}

  public async findBy(clientId: string): Promise<AwardsAccountDto> {
    const client = await this.clientRepository.findOne(clientId);

    if (!client) {
      throw new NotFoundException('Client does not exists, id = ' + clientId);
    }

    const account = await this.accountRepository.findByClientOrThrow(client);

    return new AwardsAccountDto(account);
  }

  public async registerToProgram(clientId: string) {
    const client = await this.clientRepository.findOne(clientId);

    if (!client) {
      throw new NotFoundException('Client does not exists, id = ' + clientId);
    }

    const account = AwardsAccount.notActiveAccount(client, Clock.currentDate());

    await this.accountRepository.save(account);
  }

  public async activateAccount(clientId: string) {
    const client = await this.clientRepository.findOne(clientId);

    if (!client) {
      throw new NotFoundException('Client does not exists, id = ' + clientId);
    }

    const account = await this.accountRepository.findByClientOrThrow(client);

    account.activate();

    await this.accountRepository.save(account);
  }

  public async deactivateAccount(clientId: string) {
    const client = await this.clientRepository.findOne(clientId);
    const account = await this.accountRepository.findByClient(client);

    if (!account) {
      throw new NotFoundException(`Account does not exists, id = ${clientId}`);
    }

    account.deactivate();

    await this.accountRepository.save(account);
  }

  public async registerMiles(clientId: string, transitId: string) {
    const client = await this.clientRepository.findOne(clientId);
    const account = await this.accountRepository.findByClient(client);

    const transit = await this.transitRepository.findOne(transitId);
    if (!transit) {
      throw new NotFoundException('Transit does not exist, id = ' + transitId);
    }

    const now = Clock.currentDate();

    const milesExpirationInDays = this.appProperties.getMilesExpirationInDays();
    const defaultMilesBonus = this.appProperties.getDefaultMilesBonus();

    if (!account || !account.isAwardActive()) {
      return null;
    } else {
      const expireAt = Clock.addDays(now, milesExpirationInDays);

      const miles = account.addExpiringMiles(
        defaultMilesBonus,
        expireAt,
        transitId,
        now,
      );

      await this.accountRepository.save(account);
      return miles;
    }
  }

  public async registerNonExpiringMiles(clientId: string, milesAmount: number) {
    const client = await this.clientRepository.findOne(clientId);

    if (!client) {
      throw new NotFoundException(
        `Client with id ${clientId} doest not exists`,
      );
    }

    const account = await this.accountRepository.findByClientOrThrow(client);
    const miles = account.addNonExpiringMiles(milesAmount, Clock.currentDate());

    await this.accountRepository.save(account);
    return miles;
  }

  public async removeMiles(clientId: string, miles: number) {
    const client = await this.clientRepository.findOne(clientId, {
      relations: ['claims'],
    });

    if (!client) {
      throw new NotFoundException(
        `Client with id ${clientId} doest not exists`,
      );
    }

    const account = await this.accountRepository.findByClientOrThrow(client);
    const transits = await this.transitRepository.findByClient(client);

    account.removeMiles(
      miles,
      Clock.currentDate(),
      this.chooseSortingStrategy(
        transits.length,
        client.getClaims().length,
        client.getType(),
        this.isSunday(),
      ),
    );

    await this.accountRepository.save(account);
  }

  public async calculateBalance(clientId: string) {
    const client = await this.clientRepository.findOne(clientId);

    if (!client) {
      throw new NotFoundException(
        `Client with id ${clientId} doest not exists`,
      );
    }

    const account = await this.accountRepository.findByClientOrThrow(client);

    return account.calculateBalance(Clock.currentDate());
  }

  public async transferMiles(
    fromClientId: string,
    toClientId: string,
    miles: number,
  ) {
    const fromClient = await this.clientRepository.findOne(fromClientId);
    const toClient = await this.clientRepository.findOne(toClientId);

    if (!fromClient) {
      throw new NotFoundException(
        `Client with id ${fromClientId} doest not exists`,
      );
    }
    if (!toClient) {
      throw new NotFoundException(
        `Client with id ${toClientId} doest not exists`,
      );
    }

    const accountFrom = await this.accountRepository.findByClientOrThrow(
      fromClient,
    );
    const accountTo = await this.accountRepository.findByClientOrThrow(
      toClient,
    );

    accountFrom.moveMilesTo(accountTo, miles, Clock.currentDate());

    await Promise.all([
      this.accountRepository.save(accountFrom),
      this.accountRepository.save(accountTo),
    ]);
  }

  private chooseSortingStrategy(
    transitsCounter: number,
    claimsCounter: number,
    clientType: Type,
    isSunday: boolean,
  ): MilesSortingStrategy {
    if (claimsCounter >= 3) {
      return {
        comparators: [
          (m) =>
            m.getExpirationDate() ? m.getExpirationDate()?.getTime() : null,
        ],
        orders: ['desc', 'asc'],
      };
    } else if (clientType === Type.VIP) {
      return {
        comparators: [
          (m) => m.cantExpire(),
          (m) =>
            m.getExpirationDate() ? m.getExpirationDate()?.getTime() : null,
        ],
      };
    } else if (transitsCounter >= 15 && isSunday) {
      return {
        comparators: [
          (m) => m.cantExpire(),
          (m) =>
            m.getExpirationDate() ? m.getExpirationDate()?.getTime() : null,
        ],
      };
    } else if (transitsCounter >= 15) {
      return {
        comparators: [(m) => m.cantExpire(), (m) => m.getDate()],
      };
    } else {
      return {
        comparators: [(m) => m.getDate()],
      };
    }
  }

  private isSunday() {
    return Clock.currentDate().getDay() === 0;
  }
}

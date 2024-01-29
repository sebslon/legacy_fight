import {
  Injectable,
  NotFoundException,
  NotAcceptableException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as dayjs from 'dayjs';
import { orderBy } from 'lodash';

import { AppProperties } from '../config/app-properties.config';
import { AwardsAccountDto } from '../dto/awards-account.dto';
import { Client, Type } from '../entity/client.entity';
import { AwardedMiles } from '../miles/awarded-miles.entity';
import { AwardsAccount } from '../miles/awards-account.entity';
import { MilesConstantUntil } from '../miles/miles-constant-until';
import { AwardedMilesRepository } from '../repository/awarded-miles.repository';
import { AwardsAccountRepository } from '../repository/awards-account.repository';
import { ClientRepository } from '../repository/client.repository';
import { TransitRepository } from '../repository/transit.repository';

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
    @InjectRepository(AwardedMilesRepository)
    private milesRepository: AwardedMilesRepository,
    private appProperties: AppProperties,
  ) {}

  public async findBy(clientId: string): Promise<AwardsAccountDto> {
    const account = await this.getAccountForClient(clientId);

    return new AwardsAccountDto(account);
  }

  public async registerToProgram(clientId: string) {
    const client = await this.clientRepository.findOne(clientId);

    if (!client) {
      throw new NotFoundException('Client does not exists, id = ' + clientId);
    }

    const account = new AwardsAccount();

    account.setClient(client);
    account.setActive(false);
    account.setDate(Date.now());

    await this.accountRepository.save(account);
  }

  public async activateAccount(clientId: string) {
    const account = await this.getAccountForClient(clientId);

    account.setActive(true);

    await this.accountRepository.save(account);
  }

  public async deactivateAccount(clientId: string) {
    const account = await this.getAccountForClient(clientId);

    account.setActive(false);

    await this.accountRepository.save(account);
  }

  public async registerMiles(clientId: string, transitId: string) {
    const client = await this.clientRepository.findOne(clientId);
    const transit = await this.transitRepository.findOne(transitId);
    const account = await this.accountRepository.findByClient(client);

    if (!transit) {
      throw new NotFoundException('transit does not exists, id = ' + transitId);
    }

    const now = Date.now();

    const milesExpirationInDays = this.appProperties.getMilesExpirationInDays();
    const defaultMilesBonus = this.appProperties.getDefaultMilesBonus();

    if (!account || !account.isAwardActive()) {
      return null;
    } else {
      const miles = new AwardedMiles();
      miles.setTransit(transit);
      miles.setDate(Date.now());
      miles.setClient(account.getClient());
      miles.setMiles(
        MilesConstantUntil.constantUntil(
          defaultMilesBonus,
          dayjs(now).add(milesExpirationInDays, 'days').toDate(),
        ),
      );
      account.increaseTransactions();

      await this.milesRepository.save(miles);
      await this.accountRepository.save(account);
      return miles;
    }
  }

  public async registerNonExpiringMiles(clientId: string, miles: number) {
    const account = await this.getAccountForClient(clientId);

    const _miles = new AwardedMiles();
    _miles.setTransit(null);
    _miles.setClient(account.getClient());
    _miles.setMiles(MilesConstantUntil.constantForever(miles));
    _miles.setDate(Date.now());
    account.increaseTransactions();
    await this.milesRepository.save(_miles);
    await this.accountRepository.save(account);
    return _miles;
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

    const account = await this.accountRepository.findByClient(client);

    if (!account) {
      throw new NotFoundException(
        `Awards account for client id ${clientId} doest not exists`,
      );
    } else {
      const balance = await this.calculateBalance(clientId);

      if (balance >= miles && account.isAwardActive()) {
        let milesList = await this.milesRepository.findAllByClient(client);
        const transitsCounter = (
          await this.transitRepository.findByClient(client)
        ).length;

        if (client.getClaims().length >= 3) {
          milesList = orderBy(
            milesList,
            [(m) => m.getExpirationDate() ?? m.getExpirationDate()?.getTime()],
            ['desc', 'asc'],
          );
        } else if (client.getType() === Type.VIP) {
          milesList = orderBy(milesList, [
            (m) => m.cantExpire(),
            (m) => m.getExpirationDate() ?? m.getExpirationDate()?.getTime(),
          ]);
        } else if (transitsCounter >= 15 && this.isSunday()) {
          milesList = orderBy(milesList, [
            (m) => m.cantExpire(),
            (m) => m.getExpirationDate() ?? m.getExpirationDate()?.getTime(),
          ]);
        } else if (transitsCounter >= 15) {
          milesList = orderBy(milesList, [
            (m) => m.cantExpire(),
            (m) => m.getDate(),
          ]);
        } else {
          milesList = orderBy(milesList, (m) => m.getDate());
        }

        const now = new Date();

        for (const m of milesList) {
          if (miles <= 0) {
            break;
          }

          const cantExpire = m.cantExpire();
          const isNotExpired = m.getExpirationDate()
            ? dayjs(m.getExpirationDate()).isAfter(dayjs())
            : false;

          if (cantExpire || isNotExpired) {
            const milesAmount = m.getMilesAmount(now);

            if (milesAmount <= miles) {
              miles -= milesAmount;
              m.removeAll(now);
            } else {
              m.subtract(miles, now);
              miles = 0;
            }

            await this.milesRepository.save(m);
          }
        }
      } else {
        throw new NotAcceptableException(
          'Insufficient miles, id = ' +
            clientId +
            ', miles requested = ' +
            miles,
        );
      }
    }
  }

  public async calculateBalance(clientId: string) {
    const client = await this.clientRepository.findOne(clientId);
    const now = Date.now();

    if (!client) {
      throw new NotFoundException(
        `Client with id ${clientId} doest not exists`,
      );
    }

    const milesList = await this.milesRepository.findAllByClient(client);

    const sum = milesList
      .filter((mile) => {
        const expirationDate = mile.getExpirationDate();
        const isNotExpired =
          expirationDate && dayjs(expirationDate.getTime()).isAfter(dayjs(now));

        const isMileValid = mile.cantExpire() || isNotExpired;
        return isMileValid;
      })
      .map((t) => t.getMilesAmount(dayjs(now).toDate()))
      .reduce((prev, curr) => prev + curr, 0);

    return sum;
  }

  public async transferMiles(
    fromClientId: string,
    toClientId: string,
    miles: number,
  ) {
    const fromClient = await this.clientRepository.findOne(fromClientId);
    if (!fromClient) {
      throw new NotFoundException(
        `Client with id ${fromClientId} doest not exists`,
      );
    }
    const accountFrom = await this.getAccountForClient(fromClient);
    const accountTo = await this.getAccountForClient(toClientId);

    const balanceFromClient = await this.calculateBalance(fromClientId);
    if (balanceFromClient >= miles && accountFrom.isAwardActive()) {
      const milesList = await this.milesRepository.findAllByClient(fromClient);
      const now = new Date();

      for (const m of milesList) {
        if (
          m.cantExpire() ||
          dayjs(m.getExpirationDate()?.getTime()).isAfter(dayjs())
        ) {
          const milesAmount = m.getMilesAmount(now);

          if (milesAmount <= miles) {
            m.setClient(accountTo.getClient());
            miles -= milesAmount;
          } else {
            m.subtract(miles, now);
            const _miles = new AwardedMiles();

            _miles.setClient(accountTo.getClient());
            _miles.setMiles(m.getMiles());

            miles -= milesAmount;

            await this.milesRepository.save(_miles);
          }
          await this.milesRepository.save(m);
        }
      }

      accountFrom.increaseTransactions();
      accountTo.increaseTransactions();

      await this.accountRepository.save(accountFrom);
      await this.accountRepository.save(accountTo);
    }
  }

  private isSunday() {
    return dayjs(Date.now()).get('day') === 0;
  }

  private async getAccountForClient(clientId: string | Client) {
    const client =
      typeof clientId === 'string'
        ? await this.clientRepository.findOne(clientId)
        : clientId;
    if (!client) {
      throw new NotFoundException(
        `Client with id ${clientId} doest not exists`,
      );
    }

    const account = await this.accountRepository.findByClient(client);

    if (!account) {
      throw new NotFoundException(
        `Awards account for client id ${clientId} doest not exists`,
      );
    }

    return account;
  }
}

import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { Clock } from '../common/clock';
import { AppProperties } from '../config/app-properties.config';
import { ClaimService } from '../crm/claims/claim.service';
import { Type } from '../crm/client.entity';
import { ClientService } from '../crm/client.service';
import { TransitRepository } from '../repository/transit.repository';

import { AwardedMiles } from './awarded-miles.entity';
import { AwardsAccountDTO } from './awards-account.dto';
import { AwardsAccount } from './awards-account.entity';
import { AwardsAccountRepository } from './awards-account.repository';

export interface MilesSortingStrategy {
  comparators: ((m: AwardedMiles) => number | boolean | null | undefined)[];
  orders?: ('asc' | 'desc' | boolean)[];
}

export interface IAwardsService {
  findBy: (clientId: string) => Promise<AwardsAccountDTO>;

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
    @InjectRepository(TransitRepository)
    private transitRepository: TransitRepository,
    @InjectRepository(AwardsAccountRepository)
    private accountRepository: AwardsAccountRepository,
    private appProperties: AppProperties,
    private readonly clientService: ClientService,
    @Inject(forwardRef(() => ClaimService))
    private readonly claimService: ClaimService,
  ) {}

  public async findBy(clientId: string): Promise<AwardsAccountDTO> {
    const client = await this.clientService.load(clientId);
    const account = await this.accountRepository.findByClientIdOrThrow(
      clientId,
    );

    return new AwardsAccountDTO(account, client);
  }

  public async registerToProgram(clientId: string) {
    const client = await this.clientService.load(clientId);

    const account = AwardsAccount.notActiveAccount(
      client.getId(),
      Clock.currentDate(),
    );

    await this.accountRepository.save(account);
  }

  public async activateAccount(clientId: string) {
    const account = await this.accountRepository.findByClientIdOrThrow(
      clientId,
    );

    account.activate();

    await this.accountRepository.save(account);
  }

  public async deactivateAccount(clientId: string) {
    const account = await this.accountRepository.findByClientIdOrThrow(
      clientId,
    );

    account.deactivate();

    await this.accountRepository.save(account);
  }

  public async registerMiles(clientId: string, transitId: string) {
    const now = Clock.currentDate();

    const account = await this.accountRepository.findByClientId(clientId);

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
    const account = await this.accountRepository.findByClientIdOrThrow(
      clientId,
    );
    const miles = account.addNonExpiringMiles(milesAmount, Clock.currentDate());

    await this.accountRepository.save(account);
    return miles;
  }

  public async removeMiles(clientId: string, miles: number) {
    const client = await this.clientService.load(clientId);
    const account = await this.accountRepository.findByClientIdOrThrow(
      clientId,
    );
    const numberOfClaims = await this.claimService.getNumberOfClaims(clientId);
    const transits = await this.transitRepository.findByClientId(clientId);

    account.removeMiles(
      miles,
      Clock.currentDate(),
      this.chooseSortingStrategy(
        transits.length,
        numberOfClaims,
        client.getType(),
        this.isSunday(),
      ),
    );

    await this.accountRepository.save(account);
  }

  public async calculateBalance(clientId: string) {
    const account = await this.accountRepository.findByClientIdOrThrow(
      clientId,
    );

    return account.calculateBalance(Clock.currentDate());
  }

  public async transferMiles(
    fromClientId: string,
    toClientId: string,
    miles: number,
  ) {
    const accountFrom = await this.accountRepository.findByClientIdOrThrow(
      fromClientId,
    );
    const accountTo = await this.accountRepository.findByClientIdOrThrow(
      toClientId,
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

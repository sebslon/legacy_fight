import { Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';

import { Clock } from '../common/clock';
import { Distance } from '../distance/distance';
import { AddressDTO } from '../dto/address.dto';
import { ClaimDTO } from '../dto/claim.dto';
import { DriverReport } from '../dto/driver-report.dto';
import { DriverSessionDTO } from '../dto/driver-session.dto';
import { DriverDTO } from '../dto/driver.dto';
import { TransitDTO } from '../dto/transit.dto';
import { CarClass } from '../entity/car-type.entity';
import { ClaimCompletionMode, ClaimStatus } from '../entity/claim.entity';
import { DriverAttributeName } from '../entity/driver-attribute.entity';
import { DriverStatus, DriverType } from '../entity/driver.entity';
import { TransitStatus } from '../entity/transit.entity';

interface QueryForDriverWithAttributesResult {
  id: string;
  firstName: string;
  lastName: string;
  driverLicense: string;
  photo: string;
  status: DriverStatus;
  type: string;
  name: DriverAttributeName;
  value: string;
}

interface QueryForSessionsResult {
  loggedAt: number;
  loggedOutAt: number;
  platesNumber: string;
  carClass: CarClass;
  carBrand: string;
  transitId: string;
  transitStatus: TransitStatus;
  km: number;
  price: number;
  driversFee: number;
  estimatedPrice: number;
  dateTime: number;
  published: number;
  acceptedAt: number;
  started: number;
  completeAt: number;
  completionMode: ClaimCompletionMode;
  changeDate: number;
  carType: CarClass;
  kmRate: number;
  tariffName: string;
  baseFee: number;
  claimId: string;
  claimNo: string;
  ownerId: string;
  reason: string;
  incidentDescription: string;
  claimStatus: ClaimStatus;
  creationDate: number;
  afCountry: string;
  afCity: string;
  afStreet: string;
  afNumber: number;
  afPostalCode: string;
  atoCountry: string;
  atoCity: string;
  atoStreet: string;
  atoNumber: number;
  atoPostalCode: string;
}

@Injectable()
export class SQLBasedDriverReportCreator {
  private QUERY_FOR_DRIVER_WITH_ATTRS = `
    SELECT d.id, d."firstName", d."lastName", d."driverLicense", d.photo, d.status, d.type, attr.name, attr.value
    FROM driver d
    LEFT JOIN driver_attribute attr ON d.id = attr."driverId"
    WHERE d.id = $1 AND attr.name != $2
  `;

  private QUERY_FOR_SESSIONS = `
    SELECT 
      ds."loggedAt", ds."loggedOutAt", ds."platesNumber", ds."carClass", ds."carBrand", 
      t.id AS "transitId", t.status AS "transitStatus", t.km, t.price, t."driversFee", 
      t."estimatedPrice", t."dateTime", t.published, t."acceptedAt", t.started, t."completeAt", t."carType",
      tar."kmRate", tar.name AS "tariffName", tar."baseFee",
      cl.id as "claimId", cl."ownerId", cl.reason, cl."incidentDescription", cl.status as "claimStatus", cl."creationDate", cl."completionMode", cl."claimNo", cl."changeDate",
      af.country as "afCountry", af.city as "afCity", af.street as "afStreet", af."buildingNumber" as "afNumber", af."postalCode" as "afPostalCode",
      ato.country as "atoCountry", ato.city as "atoCity", ato.street as "atoStreet", ato."buildingNumber" as "atoNumber", ato."postalCode" as "atoPostalCode"
    FROM driver_session ds
    LEFT JOIN transit t ON t."driverId" = ds."driverId"
    LEFT JOIN tariff tar ON t."tariffId" = tar.id
    LEFT JOIN address af ON t."fromId" = af.id
    LEFT JOIN address ato ON t."toId" = ato.id
    LEFT JOIN claim cl ON cl."transitId" = t.id
    WHERE ds."driverId" = $1 AND t.status = $2
    AND ds."loggedAt" >= $3
    AND t."completeAt" >= ds."loggedAt" AND t."completeAt" <= ds."loggedOutAt"
    GROUP BY ds.id, t.id, tar.name, tar."kmRate", tar."baseFee", cl.id, af.country, af.city, af.street, af."buildingNumber", af."postalCode", ato.country, ato.city, ato.street, ato."buildingNumber", ato."postalCode";
  `;

  private entityManager: EntityManager;

  public constructor(entityManager: EntityManager) {
    this.entityManager = entityManager;
  }

  public async createReport(driverId: string, lastDays: number) {
    const driverReport = new DriverReport();

    const driverInfo = (await this.entityManager.query(
      this.QUERY_FOR_DRIVER_WITH_ATTRS,
      [driverId, DriverAttributeName.MEDICAL_EXAMINATION_REMARKS],
    )) as QueryForDriverWithAttributesResult[];

    driverInfo.forEach((obj) =>
      this.addAttrToReport(driverReport, { name: obj.name, value: obj.value }),
    );
    driverInfo.forEach((obj) => this.addDriverToReport(driverReport, obj));

    const sessionsInfo = await this.entityManager.query(
      this.QUERY_FOR_SESSIONS,
      [
        driverId,
        TransitStatus.COMPLETED,
        this.calculateStartingPoint(lastDays),
      ],
    );

    const sessions = new Map<DriverSessionDTO, TransitDTO[]>();

    for await (const object of sessionsInfo) {
      const session = this.retriveDrivingSession(object);
      const transit = this.retrieveTransit(object);

      if (sessions.has(session)) {
        sessions.get(session)?.push(transit);
      } else {
        sessions.set(session, [transit]);
      }
    }

    driverReport.setSessions(sessions);

    return driverReport;
  }

  private retrieveTransit(object: QueryForSessionsResult) {
    const transitDto = TransitDTO.createFromRawData(
      object['transitId'] as string,
      object['tariffName'] as string,
      object['transitStatus'] as TransitStatus,
      null,
      Distance.fromKm(object['km'] as number),
      object['kmRate'] as number,
      object['price'] as number,
      object['driversFee'] as number,
      object['estimatedPrice'] as number,
      object['baseFee'] as number,
      object['dateTime'] as number,
      object['published'] as number,
      object['acceptedAt'] as number,
      object['started'] as number,
      object['completeAt'] as number,
      this.retrieveClaim(object),
      null,
      this.retrieveFromAddress(object),
      this.retrieveToAddress(object),
      object['carType'] as CarClass,
      null,
    );

    return transitDto;
  }

  private retriveDrivingSession(object: QueryForSessionsResult) {
    const driverSessionDto = DriverSessionDTO.createFromRawData(
      object['loggedAt'] as number,
      object['loggedOutAt'] as number,
      object['platesNumber'] as string,
      object['carClass'] as CarClass,
      object['carBrand'] as string,
    );

    return driverSessionDto;
  }

  private retrieveToAddress(object: QueryForSessionsResult) {
    return new AddressDTO({
      country: object['atoCountry'] as string,
      city: object['atoCity'] as string,
      street: object['atoStreet'] as string,
      buildingNumber: object['atoNumber'] as number,
      postalCode: object['atoPostalCode'] as string,
    });
  }

  private retrieveFromAddress(object: QueryForSessionsResult) {
    return new AddressDTO({
      country: object['afCountry'] as string,
      city: object['afCity'] as string,
      street: object['afStreet'] as string,
      buildingNumber: object['afNumber'] as number,
      postalCode: object['afPostalCode'] as string,
    });
  }

  private retrieveClaim(object: QueryForSessionsResult) {
    const claimId = object['claimId'];

    if (claimId == null || typeof claimId !== 'string') {
      return null;
    }

    const claimDto = ClaimDTO.createFromRawData(
      claimId,
      object['ownerId'] as string,
      object['transitId'] as string,
      object['reason'] as string,
      object['incidentDescription'] as string,
      object['creationDate'] as number,
      (object['completeAt'] ? object['completeAt'] : null) as number | null,
      (object['changeDate'] ? object['changeDate'] : null) as number | null,
      (object['completionMode']
        ? object['completionMode']
        : null) as ClaimCompletionMode | null,
      object['claimStatus'] as ClaimStatus,
      object['claimNo'] as string,
    );

    return claimDto;
  }

  private calculateStartingPoint(lastDays: number) {
    const beginningOfToday = Clock.currentDate().setHours(0, 0, 0, 0);
    const since = beginningOfToday - lastDays * 24 * 60 * 60 * 1000;

    return since;
  }

  private addDriverToReport(
    driverReport: DriverReport,
    driverInfo: QueryForDriverWithAttributesResult,
  ) {
    const driverType = driverInfo.type;

    driverReport.setDriverDTO(
      DriverDTO.createFromRawData(
        driverInfo.id,
        driverInfo.firstName,
        driverInfo.lastName,
        driverInfo.driverLicense,
        driverInfo.photo,
        driverInfo.status,
        driverType
          ? DriverType[driverType.toUpperCase() as keyof typeof DriverType]
          : DriverType.REGULAR,
      ),
    );
  }

  private addAttrToReport(
    driverReport: DriverReport,
    attributeData: { name: DriverAttributeName; value: string },
  ) {
    driverReport.addAttr(attributeData.name, attributeData.value);
  }
}
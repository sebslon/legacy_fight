import { Injectable } from '@nestjs/common';

import { Clock } from '../../common/clock';
import { Distance } from '../../distance/distance';
import { DriverPosition } from '../../entity/driver-position.entity';
import { DistanceCalculator } from '../../service/distance-calculator.service';

import { TimeSlot } from './time-slot';
import { TravelledDistance } from './travelled-distance.entity';
import { TravelledDistanceRepository } from './travelled-distance.repository';

@Injectable()
export class TravelledDistanceService {
  public constructor(
    private readonly travelledDistanceRepository: TravelledDistanceRepository,
    private readonly distanceCalculator: DistanceCalculator,
  ) {}

  public async calculateDistance(driverId: string, from: Date, to: Date) {
    const left = TimeSlot.slotThatContains(from);
    const right = TimeSlot.slotThatContains(to);

    return Distance.fromKm(
      await this.travelledDistanceRepository.calculateDistance(
        left.getBeginning(),
        right.getEnd(),
        driverId,
      ),
    );
  }

  public async addPosition(driverPosition: DriverPosition) {
    const driverId = driverPosition.getDriver().getId();
    const matchedSlot =
      await this.travelledDistanceRepository.findTravelledDistanceTimeSlotByTime(
        new Date(driverPosition.getSeenAt()),
        driverId,
      );
    const now = Clock.currentDate();

    if (matchedSlot) {
      if (matchedSlot.contains(now)) {
        this.addDistanceToSlot(driverPosition, matchedSlot);

        await this.travelledDistanceRepository.save(matchedSlot);
      } else if (matchedSlot.isBefore(now)) {
        const newDistance = await this.recalculateDistanceFor(
          matchedSlot,
          driverId,
        );

        matchedSlot.addDistance(
          Distance.fromKm(newDistance),
          driverPosition.getLatitude(),
          driverPosition.getLongitude(),
        );

        await this.travelledDistanceRepository.save(matchedSlot);
      }
    } else {
      const currentTimeSlot = TimeSlot.slotThatContains(now);
      const prev = currentTimeSlot.prev();

      const prevTravelledDistance =
        await this.travelledDistanceRepository.findTravelledDistanceByTimeSlotAndDriverId(
          prev,
          driverId,
        );

      if (prevTravelledDistance) {
        if (
          prevTravelledDistance.endsAt(new Date(driverPosition.getSeenAt()))
        ) {
          this.addDistanceToSlot(driverPosition, prevTravelledDistance);

          await this.travelledDistanceRepository.save(prevTravelledDistance);
        }
      }

      await this.createSlotForNow(driverPosition, driverId, currentTimeSlot);
    }
  }

  private addDistanceToSlot(
    driverPosition: DriverPosition,
    aggregatedDistance: TravelledDistance,
  ) {
    const travelled = Distance.fromKm(
      this.distanceCalculator.calculateByGeo(
        driverPosition.getLatitude(),
        driverPosition.getLongitude(),
        aggregatedDistance.getLastLatitude(),
        aggregatedDistance.getLastLongitude(),
      ),
    );

    aggregatedDistance.addDistance(
      travelled,
      driverPosition.getLatitude(),
      driverPosition.getLongitude(),
    );
  }

  private recalculateDistanceFor(
    aggregatedDistance: TravelledDistance,
    driverId: string,
  ) {
    const beginning = aggregatedDistance.getTimeSlot().getBeginning();
    const end = aggregatedDistance.getTimeSlot().getEnd();

    return this.travelledDistanceRepository.calculateDistance(
      beginning,
      end,
      driverId,
    );
  }

  private createSlotForNow(
    driverPosition: DriverPosition,
    driverId: string,
    timeSlot: TimeSlot,
  ) {
    const newSlot = new TravelledDistance(driverId, timeSlot, driverPosition);

    return this.travelledDistanceRepository.save(newSlot);
  }
}

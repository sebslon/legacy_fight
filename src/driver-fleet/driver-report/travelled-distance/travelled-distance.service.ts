import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { Clock } from '../../../common/clock';
import { Distance } from '../../../geolocation/distance';
import { DistanceCalculator } from '../../../geolocation/distance-calculator.service';

import { TimeSlot } from './time-slot';
import { TravelledDistance } from './travelled-distance.entity';
import { TravelledDistanceRepository } from './travelled-distance.repository';

@Injectable()
export class TravelledDistanceService {
  public constructor(
    @InjectRepository(TravelledDistanceRepository)
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

  public async addPosition(
    driverId: string,
    latitude: number,
    longitude: number,
    seenAt: Date,
  ) {
    const matchedSlot =
      await this.travelledDistanceRepository.findTravelledDistanceTimeSlotByTime(
        seenAt,
        driverId,
      );
    const now = Clock.currentDate();

    if (matchedSlot) {
      if (matchedSlot.contains(now)) {
        this.addDistanceToSlot(matchedSlot, latitude, longitude);

        await this.travelledDistanceRepository.save(matchedSlot);
      } else if (matchedSlot.isBefore(now)) {
        const newDistance = await this.recalculateDistanceFor(
          matchedSlot,
          driverId,
        );

        matchedSlot.addDistance(
          Distance.fromKm(newDistance),
          latitude,
          longitude,
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
        if (prevTravelledDistance.endsAt(seenAt)) {
          this.addDistanceToSlot(prevTravelledDistance, latitude, longitude);

          await this.travelledDistanceRepository.save(prevTravelledDistance);
        }
      }

      await this.createSlotForNow(
        driverId,
        currentTimeSlot,
        latitude,
        longitude,
      );
    }
  }

  private addDistanceToSlot(
    aggregatedDistance: TravelledDistance,
    latitude: number,
    longitude: number,
  ) {
    const travelled = Distance.fromKm(
      this.distanceCalculator.calculateByGeo(
        latitude,
        longitude,
        aggregatedDistance.getLastLatitude(),
        aggregatedDistance.getLastLongitude(),
      ),
    );

    aggregatedDistance.addDistance(travelled, latitude, longitude);
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
    driverId: string,
    timeSlot: TimeSlot,
    latitude: number,
    longitude: number,
  ) {
    const newSlot = new TravelledDistance(
      driverId,
      timeSlot,
      latitude,
      longitude,
    );

    return this.travelledDistanceRepository.save(newSlot);
  }
}

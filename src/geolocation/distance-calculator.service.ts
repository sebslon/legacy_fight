import { Injectable } from '@nestjs/common';

import { Coordinates } from './coordinates';

// TODO: Remove class when Coordinates will replace it
@Injectable()
export class DistanceCalculator {
  public static degreesToRadians(degrees: number) {
    return Coordinates.degreesToRadians(degrees);
  }

  public calculateByMap(
    latitudeFrom: number,
    longitudeFrom: number,
    latitudeTo: number,
    longitudeTo: number,
  ) {
    // ...
    console.log({ latitudeFrom, longitudeFrom, latitudeTo, longitudeTo });
    return 42;
  }

  public calculateByGeo(
    latitudeFrom: number,
    longitudeFrom: number,
    latitudeTo: number,
    longitudeTo: number,
  ) {
    const coordinates = new Coordinates(latitudeFrom, longitudeFrom);
    const otherCoordinates = new Coordinates(latitudeTo, longitudeTo);

    return coordinates.distanceTo(otherCoordinates).toKmInFloat();
  }
}

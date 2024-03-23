import { Distance } from '../geolocation/distance';

export class Coordinates {
  private latitude: number;
  private longitude: number;

  public constructor(latitude: number, longitude: number) {
    this.latitude = latitude;
    this.longitude = longitude;
  }

  public distanceTo(other: Coordinates): Distance {
    // https://www.geeksforgeeks.org/program-distance-two-points-earth/
    // The math module contains a function
    // named toRadians which converts from
    // degrees to radians.
    const lon1 = Coordinates.degreesToRadians(this.longitude);
    const lon2 = Coordinates.degreesToRadians(other.longitude);
    const lat1 = Coordinates.degreesToRadians(this.latitude);
    const lat2 = Coordinates.degreesToRadians(other.latitude);

    // Haversine formula
    const dlon = lon2 - lon1;
    const dlat = lat2 - lat1;
    const a =
      Math.pow(Math.sin(dlat / 2), 2) +
      Math.cos(lat1) * Math.cos(lat2) * Math.pow(Math.sin(dlon / 2), 2);

    const c = 2 * Math.asin(Math.sqrt(a));

    // Radius of earth in kilometers. Use 3956 for miles
    const r = 6371;

    // calculate the result
    const distanceInKMeters = c * r;

    return Distance.fromKm(distanceInKMeters);
  }

  // make private when removed from distance-calculator.service.ts
  public static degreesToRadians(degrees: number) {
    return degrees * (Math.PI / 180);
  }

  public getLatitude(): number {
    return this.latitude;
  }

  public getLongitude(): number {
    return this.longitude;
  }
}

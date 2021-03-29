import { Coordinate } from 'ol/coordinate';

export class OSMCoordinate {
  public constructor(public lat: number = 0, public lon: number = 0) {}

  public static FromMapCoordinates(coordinate: Coordinate): OSMCoordinate {
    return {
      lon: coordinate[0],
      lat: coordinate[1],
    };
  }

  public static ToMapCoordinates(coordinate: OSMCoordinate): Coordinate {
    return [coordinate.lon, coordinate.lat];
  }
}

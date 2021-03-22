import { Coordinate } from 'ol/coordinate';

export class OSMCoordinate {
  lat: number;
  lon: number;

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

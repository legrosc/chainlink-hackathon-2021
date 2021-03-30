import { OSMCoordinate } from '@services/nominatim/models/osm-coordinate';

export class FocusPoint {
  public constructor(
    public center: OSMCoordinate = new OSMCoordinate(),
    public zoom: number = 0
  ) {}
}

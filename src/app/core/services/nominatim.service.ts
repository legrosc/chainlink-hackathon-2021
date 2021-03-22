import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { OSMCoordinate } from './models/osm-coordinate';
import { OSMSearchResult } from './models/osm-search-result';

@Injectable({
  providedIn: 'root',
})
export class NominatimService {
  constructor(private readonly httpClient: HttpClient) {}

  /**
   * Returns the closest location for the provided coordinates.
   * @param coordinates The coordinates in `EPSG:4326` format.
   */
  public reverseGeocode(
    coordinates: OSMCoordinate
  ): Observable<OSMSearchResult> {
    return this.httpClient.get<OSMSearchResult>(
      `https://nominatim.openstreetmap.org/reverse?lat=${coordinates.lat}&lon=${coordinates.lon}&format=json`
    );
  }

  public search(value: string): Observable<OSMSearchResult[]> {
    return this.httpClient.get<OSMSearchResult[]>(
      `https://nominatim.openstreetmap.org/search?q=${value}&format=json&addressdetails=1`
    );
  }
}

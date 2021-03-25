import { OSMAddress } from './osm-address';

export class OSMSearchResult {
  public address: OSMAddress;
  public boundingbox: string[];
  public class: string;
  public display_name: string;
  public importance: number;
  public lat: string;
  public licence: string;
  public lon: string;
  public osm_id: string;
  public osm_type: string;
  public place_id: string;
  public svg: string;
  public type: string;
  public error: string | undefined;
}

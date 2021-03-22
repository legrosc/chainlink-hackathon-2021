import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  Input,
  AfterViewInit,
  NgZone,
  ChangeDetectorRef,
} from '@angular/core';
import { Output, EventEmitter } from '@angular/core';

import { Map, View } from 'ol';
import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';
import Zoom from 'ol/control/Zoom';
import MousePosition from 'ol/control/MousePosition';
import { OSMCoordinate } from 'src/app/core/services/models/osm-coordinate';

@Component({
  selector: 'app-ol-map',
  templateUrl: './ol-map.component.html',
  styleUrls: ['./ol-map.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OlMapComponent implements AfterViewInit {
  private map: Map;

  @Input() center: OSMCoordinate;
  @Input() zoom: number;

  /** Emits the coordinates of the place clicked on the map, in WGS84 projection */
  @Output()
  clickEvent: EventEmitter<OSMCoordinate> = new EventEmitter<OSMCoordinate>();

  constructor(private zone: NgZone, private cd: ChangeDetectorRef) {}

  ngAfterViewInit(): void {
    if (!this.map) {
      this.zone.runOutsideAngular(() => this.initMap());
    }
  }

  initMap(): void {
    this.map = new Map({
      target: 'map',
      layers: [
        new TileLayer({
          source: new OSM(),
        }),
      ],
      view: new View({
        projection: 'EPSG:4326',
        center: [0, 0],
        zoom: 0,
      }),
      controls: [new Zoom(), new MousePosition()],
    });

    this.map.on('click', (event) => {
      this.clickEvent.emit(OSMCoordinate.FromMapCoordinates(event.coordinate));
    });
  }
}

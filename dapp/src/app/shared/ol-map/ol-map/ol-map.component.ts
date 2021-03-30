import {
  Component,
  ChangeDetectionStrategy,
  Input,
  AfterViewInit,
  NgZone,
} from '@angular/core';
import { Output, EventEmitter } from '@angular/core';

import { Feature, Map, View } from 'ol';
import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';
import Zoom from 'ol/control/Zoom';
import MousePosition from 'ol/control/MousePosition';
import { OSMCoordinate } from '@services/nominatim/models/osm-coordinate';
import { FocusPoint } from '../models/focus-point';
import { Vector as LayerVector } from 'ol/layer';
import { Vector as SourceVector } from 'ol/source';
import Circle from 'ol/geom/Circle';
import Style from 'ol/style/Style';
import Stroke from 'ol/style/Stroke';
import Fill from 'ol/style/Fill';
import Icon from 'ol/style/Icon';
import Point from 'ol/geom/Point';

@Component({
  selector: 'app-ol-map',
  templateUrl: './ol-map.component.html',
  styleUrls: ['./ol-map.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OlMapComponent implements AfterViewInit {
  private map: Map | null = null;
  private circleLayer: LayerVector | null = null;
  private markerLayer: LayerVector | null = null;

  private focusPoint: FocusPoint = new FocusPoint();
  @Input('focusPoint') set focusPointSetter(value: FocusPoint) {
    this.focusPoint = value;

    if (this.map == null) {
      return;
    }

    // Remove previous layers
    if (this.markerLayer != null) {
      this.map.removeLayer(this.markerLayer);
      this.map.removeLayer(this.circleLayer);
    }

    // Create circle
    let circleRadius: number =
      50000 / this.map.getView().getProjection().getMetersPerUnit();

    this.circleLayer = new LayerVector({
      source: new SourceVector({
        features: [
          new Feature(
            new Circle(
              OSMCoordinate.ToMapCoordinates(this.focusPoint.center),
              circleRadius
            )
          ),
        ],
      }),
      style: [
        new Style({
          stroke: new Stroke({
            color: 'blue',
            width: 3,
          }),
          fill: new Fill({
            color: 'rgba(0, 0, 255, 0.1)',
          }),
        }),
      ],
    });

    // Create marker
    let marker = new Feature({
      geometry: new Point(
        OSMCoordinate.ToMapCoordinates(this.focusPoint.center)
      ),
    });
    marker.setStyle(
      new Style({
        image: new Icon({
          anchor: [0.5, 1],
          src: './assets/img/map-marker-solid.svg',
          scale: 0.05,
          color: 'blue',
        }),
      })
    );

    this.markerLayer = new LayerVector({
      source: new SourceVector({
        features: [marker],
      }),
    });

    // Add layers
    this.map.addLayer(this.circleLayer);
    this.map.addLayer(this.markerLayer);

    // Zoom
    this.map.getView().animate({
      zoom: this.focusPoint.zoom,
      center: OSMCoordinate.ToMapCoordinates(this.focusPoint.center),
    });
  }

  /** Emits the coordinates of the place clicked on the map, in WGS84 projection */
  @Output()
  clickEvent: EventEmitter<OSMCoordinate> = new EventEmitter<OSMCoordinate>();

  constructor(private zone: NgZone) {}

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
        center: OSMCoordinate.ToMapCoordinates(this.focusPoint.center),
        zoom: this.focusPoint.zoom,
      }),
      controls: [new Zoom(), new MousePosition()],
    });

    this.map.on('click', (event) => {
      this.clickEvent.emit(OSMCoordinate.FromMapCoordinates(event.coordinate));
    });
  }
}

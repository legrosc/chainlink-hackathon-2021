import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
} from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { HedgeMeService } from '@services/hedge-me/hedge-me.service';
import { OSMCoordinate } from '@services/nominatim/models/osm-coordinate';
import { OSMSearchResult } from '@services/nominatim/models/osm-search-result';
import { NominatimService } from '@services/nominatim/nominatim.service';
import { Observable } from 'rxjs';
import { debounceTime, startWith, switchMap } from 'rxjs/operators';
import { FocusPoint } from 'src/app/shared/ol-map/models/focus-point';
import { PolicyHolder } from '../models/policy-holder';
import { PolicyHolderRegistrationForm } from '../models/policy-holder.form';
import { Weather } from '../models/weather';

@Component({
  selector: 'app-register-form',
  templateUrl: './register-form.component.html',
  styleUrls: ['./register-form.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RegisterFormComponent implements OnInit {
  form: PolicyHolderRegistrationForm;
  filteredOptions: Observable<OSMSearchResult[]>;

  fieldAppearance: 'standard' | 'fill' | 'outline' = 'outline';

  mapFocus: FocusPoint = new FocusPoint();

  Weather: typeof Weather = Weather;
  weatherValues: Weather[] = Object.values(Weather)
    .map((v) => Number(v))
    .filter((v) => !isNaN(v));

  constructor(
    formBuilder: FormBuilder,
    private readonly nominatimService: NominatimService,
    private cd: ChangeDetectorRef,
    private readonly hedgeMeService: HedgeMeService
  ) {
    this.form = new PolicyHolderRegistrationForm(formBuilder);
  }

  ngOnInit(): void {
    this.filteredOptions = this.form.get('location').valueChanges.pipe(
      startWith(''),
      debounceTime(500),
      switchMap((value: string) => this.nominatimService.search(value))
    );
  }

  public async submit(): Promise<void> {
    console.log('submit form: ', this.form.value);
    let policyHolder: PolicyHolder = {
      amount: this.form.amount,
      start: this.form.startDate,
      duration: this.form.endDate - this.form.startDate,
      latitude: this.form.latitude,
      longitude: this.form.longitude,
      weather: this.form.weather,
    };
    console.log('submit value: ', policyHolder);
    await this.hedgeMeService.register(policyHolder);
  }

  public async fillAddress(coordinate: OSMCoordinate): Promise<void> {
    const result: OSMSearchResult = await this.nominatimService
      .reverseGeocode(coordinate)
      .toPromise();

    if (result.error) {
      // Address not found: do nothing
      return;
    }

    this.form.patchValue({
      location: result,
    });

    this.mapFocus = new FocusPoint(
      new OSMCoordinate(parseFloat(result.lat), parseFloat(result.lon)),
      9
    );

    this.cd.detectChanges();
  }

  public async setOnMap(selectedAddress: OSMSearchResult) {
    this.mapFocus = new FocusPoint(
      new OSMCoordinate(
        parseFloat(selectedAddress.lat),
        parseFloat(selectedAddress.lon)
      ),
      9
    );

    this.cd.detectChanges();
  }

  public getAddressLabel(selectedValue: OSMSearchResult) {
    return selectedValue.display_name;
  }

  // TODO: move weather methods elsewhere
  public weatherDescription(weather: Weather): string {
    switch (weather) {
      case Weather.DROUGHT:
        return '(more than 30°C during 24h)';
      case Weather.FROST:
        return '(less than 2°C during 24h)';
    }
  }

  public weatherName(weather: Weather): string {
    switch (weather) {
      case Weather.DROUGHT:
        return '☀ Drought';
      case Weather.FROST:
        return '❄ Frost';
    }
  }
}

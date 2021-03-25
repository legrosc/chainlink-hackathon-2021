import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Observable } from 'rxjs';
import { debounceTime, startWith, switchMap } from 'rxjs/operators';
import { OSMCoordinate } from '@services/nominatim/models/osm-coordinate';
import { OSMSearchResult } from '@services/nominatim/models/osm-search-result';
import { NominatimService } from '@services/nominatim/nominatim.service';
import { Web3Service } from '@services/web3/web3.service';
import { FocusPoint } from 'src/app/shared/ol-map/models/focus-point';

@Component({
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
})
export class HomeComponent implements OnInit {
  form: FormGroup;
  filteredOptions: Observable<OSMSearchResult[]>;

  fieldAppearance: 'standard' | 'fill' | 'outline' = 'outline';

  mapFocus: FocusPoint = new FocusPoint();

  constructor(
    private readonly formBuilder: FormBuilder,
    private readonly nominatimService: NominatimService,
    private readonly web3Service: Web3Service,
    private cd: ChangeDetectorRef
  ) {
    this.form = formBuilder.group({
      amount: [null, Validators.required],
      risk: ['', Validators.required],
      location: ['', Validators.required],
      startDate: ['', Validators.required],
      endDate: ['', Validators.required],
    });
  }

  ngOnInit(): void {
    this.filteredOptions = this.form.get('location').valueChanges.pipe(
      startWith(''),
      debounceTime(500),
      switchMap((value: string) => this.nominatimService.search(value))
    );

    this.web3Service
      .getAccounts()
      .then((value) => console.log('Got accounts:', value));

    this.web3Service
      .getGreeting()
      .then((value) => console.log('Got greeting:', value));
  }

  public submit(): void {
    console.log('submit: ', this.form.value);
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
      10
    );

    this.cd.detectChanges();
  }

  public async setOnMap(selectedAddress: OSMSearchResult) {
    this.mapFocus = new FocusPoint(
      new OSMCoordinate(
        parseFloat(selectedAddress.lat),
        parseFloat(selectedAddress.lon)
      ),
      10
    );

    this.cd.detectChanges();
  }

  public getAddressLabel(selectedValue: OSMSearchResult) {
    return selectedValue.display_name;
  }
}

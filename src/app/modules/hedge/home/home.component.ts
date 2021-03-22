import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Observable } from 'rxjs';
import { debounceTime, map, startWith, switchMap } from 'rxjs/operators';
import { OSMCoordinate } from 'src/app/core/services/models/osm-coordinate';
import { OSMSearchResult } from 'src/app/core/services/models/osm-search-result';
import { NominatimService } from 'src/app/core/services/nominatim.service';

@Component({
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
})
export class HomeComponent implements OnInit {
  form: FormGroup;
  options = ['Paris', 'London', 'Madrid'];
  filteredOptions: Observable<string[]>;

  fieldAppearance: 'standard' | 'fill' | 'outline' = 'outline';

  constructor(
    private readonly formBuilder: FormBuilder,
    private readonly nominatimService: NominatimService
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
      switchMap((value: string) => this.nominatimService.search(value)),
      map((result: OSMSearchResult[]) => result.map((r) => r.display_name))
    );
  }

  private filterLocations(value: string): string[] {
    return this.options.filter((option) =>
      option.toLowerCase().includes(value.toLowerCase())
    );
  }

  public submit(): void {
    console.log('submit: ', this.form.value);
  }

  public async fillAddress(coordinate: OSMCoordinate): Promise<void> {
    const result: OSMSearchResult = await this.nominatimService
      .reverseGeocode(coordinate)
      .toPromise();

    this.form.patchValue({
      location: result.display_name,
    });

    // TODO: On location change, zoom on the map + draw the 50km radius circle
  }
}

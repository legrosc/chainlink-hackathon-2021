import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';

@Component({
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
})
export class HomeComponent implements OnInit {
  form: FormGroup;
  options = ['Paris', 'London', 'Madrid'];
  filteredOptions: Observable<string[]>;

  fieldAppearance: 'standard' | 'fill' | 'outline' = 'outline';

  constructor(private formBuilder: FormBuilder) {
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
      map((value) => this.filterLocations(value))
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
}

import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { OSMSearchResult } from '@services/nominatim/models/osm-search-result';
import { BigNumberish, ethers } from 'ethers';
import { Weather } from './weather';

export class PolicyHolderRegistrationForm extends FormGroup {
  constructor(fb: FormBuilder) {
    const formGroup: FormGroup = fb.group({
      amount: ['', Validators.required],
      weather: [Weather.FROST, Validators.required],
      location: ['', Validators.required],
      startDate: ['', Validators.required],
      endDate: ['', Validators.required],
    });
    super(formGroup.controls);
  }

  /**
   * Returns the selected start date as a unix timestamp.
   */
  public get startDate(): number {
    return (this.get('startDate').value as moment.Moment).unix();
  }

  /**
   * Returns the selected end date as a unix timestamp.
   */
  public get endDate(): number {
    return (this.get('endDate').value as moment.Moment).unix();
  }

  /**
   * Returns the selected amount as a number of wei.
   */
  public get amount(): BigNumberish {
    return ethers.utils.parseEther(this.get('amount').value);
  }

  /**
   * Returns the selected weather.
   */
  public get weather(): Weather {
    return this.get('weather').value;
  }

  /**
   * Returns the selected location.
   */
  public get location(): OSMSearchResult {
    return this.get('location').value;
  }

  public get latitude(): BigNumberish {
    // TODO: parse the value correctly and return it
    return ethers.utils.parseUnits('10.25', 2);
  }

  public get longitude(): BigNumberish {
    // TODO: parse the value correctly and return it
    return ethers.utils.parseUnits('-0.54', 2);
  }
}

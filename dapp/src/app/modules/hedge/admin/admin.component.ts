import { Component, OnInit } from '@angular/core';
import { FormArray, FormBuilder } from '@angular/forms';
import { HedgeMeService } from '@services/hedge-me/hedge-me.service';

@Component({
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.css'],
})
export class AdminComponent implements OnInit {
  public weatherDays: FormArray;

  constructor(
    private readonly hedgeMeService: HedgeMeService,
    private readonly formBuilder: FormBuilder
  ) {}

  ngOnInit(): void {
    this.weatherDays = this.formBuilder.array([
      this.formBuilder.control(0),
      this.formBuilder.control(0),
      this.formBuilder.control(0),
      this.formBuilder.control(0),
      this.formBuilder.control(0),
      this.formBuilder.control(0),
      this.formBuilder.control(0),
    ]);
  }

  public async setOracle(): Promise<void> {
    await this.hedgeMeService.setContractOracle();
  }

  public async requestWeather(): Promise<void> {
    let weatherValues: string = this.weatherDays.getRawValue().join('');
    await this.hedgeMeService.requestWeather(weatherValues);
  }

  public async fund(): Promise<void> {
    await this.hedgeMeService.fundWithLink();
  }
}

import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { BigNumberish } from '@ethersproject/bignumber';
import { HedgeMeService } from '@services/hedge-me/hedge-me.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-insurance-counter',
  templateUrl: './insurance-counter.component.html',
  styleUrls: ['./insurance-counter.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InsuranceCounterComponent implements OnInit {
  public insuranceFund$: Observable<BigNumberish>;

  constructor(private readonly hedgeMeService: HedgeMeService) {}

  ngOnInit(): void {
    this.insuranceFund$ = this.hedgeMeService.insuranceFund$;
  }
}

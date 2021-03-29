import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { BigNumberish } from '@ethersproject/bignumber';
import { InsurpoolService } from '@services/insurpool/insurpool.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-insurance-counter',
  templateUrl: './insurance-counter.component.html',
  styleUrls: ['./insurance-counter.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InsuranceCounterComponent implements OnInit {
  public insuranceFund$: Observable<BigNumberish>;

  constructor(private readonly insurpoolService: InsurpoolService) {}

  ngOnInit(): void {
    this.insuranceFund$ = this.insurpoolService.insuranceFund$;
  }
}

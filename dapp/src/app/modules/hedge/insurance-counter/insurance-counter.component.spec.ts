import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InsuranceCounterComponent } from './insurance-counter.component';

describe('InsuranceCounterComponent', () => {
  let component: InsuranceCounterComponent;
  let fixture: ComponentFixture<InsuranceCounterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ InsuranceCounterComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(InsuranceCounterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

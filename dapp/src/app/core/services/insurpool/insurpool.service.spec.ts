import { TestBed } from '@angular/core/testing';

import { InsurpoolService } from './insurpool.service';

describe('InsurpoolService', () => {
  let service: InsurpoolService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(InsurpoolService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

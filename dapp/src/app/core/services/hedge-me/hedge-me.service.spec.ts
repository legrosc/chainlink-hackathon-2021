import { TestBed } from '@angular/core/testing';

import { HedgeMeService } from './hedge-me.service';

describe('HedgeMeService', () => {
  let service: HedgeMeService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(HedgeMeService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

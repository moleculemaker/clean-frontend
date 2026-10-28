import { HttpClientTestingModule } from '@angular/common/http/testing';
import { EnvironmentService } from './services/environment.service';
import { ApiModule, Configuration } from './api/mmli-backend/v1';
import { TestBed } from '@angular/core/testing';

import { ResultService } from './result.service';

describe('ResultService', () => {
  let service: ResultService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ HttpClientTestingModule, ApiModule.forRoot(() => new Configuration()) ],
      providers: [ EnvironmentService ]
    });
    service = TestBed.inject(ResultService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

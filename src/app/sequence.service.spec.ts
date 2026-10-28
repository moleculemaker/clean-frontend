import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NgxMatomoTrackerModule } from '@ngx-matomo/tracker';
import { EnvironmentService } from './services/environment.service';
import { ApiModule, Configuration } from './api/mmli-backend/v1';
import { TestBed } from '@angular/core/testing';

import { SequenceService } from './sequence.service';

describe('SequenceService', () => {
  let service: SequenceService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ HttpClientTestingModule, ApiModule.forRoot(() => new Configuration()), NgxMatomoTrackerModule.forRoot({ disabled: true, siteId: 0, trackerUrl: '' }) ],
      providers: [ EnvironmentService ]
    });
    service = TestBed.inject(SequenceService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

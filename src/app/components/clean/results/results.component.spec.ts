import { NO_ERRORS_SCHEMA } from '@angular/core';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { EnvironmentService } from '../../../services/environment.service';
import { ApiModule, Configuration, Job, JobStatus } from '../../../api/mmli-backend/v1';
import { HttpClient } from '@angular/common/http';
import { ComponentFixture, fakeAsync, flush, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { config, of, Subject, takeUntil } from 'rxjs';

import { TableModule } from 'primeng/table';

import { ResultsComponent } from './results.component';
import { ResultService } from 'src/app/result.service';

describe('ResultsComponent', () => {
  let component: ResultsComponent;
  let fixture: ComponentFixture<ResultsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ TableModule, HttpClientTestingModule, ApiModule.forRoot(() => new Configuration()) ],
      providers: [ EnvironmentService ],
      schemas: [ NO_ERRORS_SCHEMA ],
      declarations: [ ResultsComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ResultsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

describe('ResultsComponent job status polling', () => {
  let fixture: ComponentFixture<ResultsComponent>;
  let polls: Subject<Job[]>;
  let stopPolling: Subject<void>;
  let resultService: jasmine.SpyObj<ResultService>;

  const job = (phase: JobStatus): Job => ({
    job_id: 'abc',
    phase,
    time_created: 0,
    job_info: JSON.stringify({ input_fasta: ['>seq1'] }),
  });

  beforeEach(async () => {
    polls = new Subject<Job[]>();
    stopPolling = new Subject<void>();
    resultService = jasmine.createSpyObj<ResultService>('ResultService', ['getResult', 'gotEndResult', 'getResponse']);
    // Mirror ResultService: the polling stream completes once gotEndResult() is called.
    resultService.getResult.and.returnValue(polls.pipe(takeUntil(stopPolling)));
    resultService.gotEndResult.and.callFake(() => stopPolling.next());
    resultService.getResponse.and.returnValue(of('[]') as any);

    await TestBed.configureTestingModule({
      declarations: [ ResultsComponent ],
      providers: [
        { provide: ResultService, useValue: resultService },
        { provide: Router, useValue: {} },
        { provide: HttpClient, useValue: {} },
      ],
      schemas: [ NO_ERRORS_SCHEMA ],
    })
    .compileComponents();

    fixture = TestBed.createComponent(ResultsComponent);
    fixture.detectChanges();
  });

  it('stops polling and shows the failure message when the job errors', () => {
    polls.next([job(JobStatus.Error)]);
    fixture.detectChanges();

    expect(resultService.gotEndResult).toHaveBeenCalled();
    expect(polls.observed).toBeFalse();
    expect(fixture.componentInstance.failedJob).toBeTrue();
    expect(resultService.getResponse).not.toHaveBeenCalled();
    expect(fixture.nativeElement.querySelector('.failJob')).not.toBeNull();
  });

  it('stops polling for an errored job even when job_info is missing', fakeAsync(() => {
    // RxJS reports errors thrown in a next handler here, on a timeout, instead of ending the subscription.
    const onUnhandledError = config.onUnhandledError;
    config.onUnhandledError = jasmine.createSpy('onUnhandledError');
    try {
      polls.next([{ ...job(JobStatus.Error), job_info: undefined }]);
      fixture.detectChanges();
      flush();

      expect(config.onUnhandledError).toHaveBeenCalled();
      expect(resultService.gotEndResult).toHaveBeenCalled();
      expect(polls.observed).toBeFalse();
      expect(fixture.componentInstance.failedJob).toBeTrue();
    } finally {
      config.onUnhandledError = onUnhandledError;
    }
  }));

  it('stops polling and fetches results when the job completes', () => {
    polls.next([job(JobStatus.Completed)]);
    fixture.detectChanges();

    expect(resultService.gotEndResult).toHaveBeenCalled();
    expect(polls.observed).toBeFalse();
    expect(fixture.componentInstance.failedJob).toBeFalse();
    expect(resultService.getResponse).toHaveBeenCalled();
    expect(fixture.nativeElement.querySelector('.failJob')).toBeNull();
  });

  it('keeps polling while the job is processing', () => {
    polls.next([job(JobStatus.Processing)]);

    expect(resultService.gotEndResult).not.toHaveBeenCalled();
    expect(polls.observed).toBeTrue();
  });
});

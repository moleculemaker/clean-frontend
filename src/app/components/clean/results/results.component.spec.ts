import { Component, NO_ERRORS_SCHEMA } from '@angular/core';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { EnvironmentService } from '../../../services/environment.service';
import { ApiModule, Configuration, Job, JobStatus } from '../../../api/mmli-backend/v1';
import { HttpClient } from '@angular/common/http';
import { ComponentFixture, fakeAsync, flush, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
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
      providers: [
        EnvironmentService,
        { provide: ActivatedRoute, useValue: { paramMap: of(convertToParamMap({ id: 'abc' })) } },
      ],
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
        { provide: ActivatedRoute, useValue: { paramMap: of(convertToParamMap({ id: 'abc' })) } },
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

      expect(config.onUnhandledError).not.toHaveBeenCalled();
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

  it('does not throw when a processing job has no job_info', fakeAsync(() => {
    const onUnhandledError = config.onUnhandledError;
    config.onUnhandledError = jasmine.createSpy('onUnhandledError');
    try {
      polls.next([{ ...job(JobStatus.Processing), job_info: undefined }]);
      flush();

      expect(config.onUnhandledError).not.toHaveBeenCalled();
    } finally {
      config.onUnhandledError = onUnhandledError;
    }
  }));

  it('stops polling and shows the failure message when the job has no phase', () => {
    polls.next([{ ...job(JobStatus.Processing), phase: undefined }]);
    fixture.detectChanges();

    expect(polls.observed).toBeFalse();
    expect(fixture.nativeElement.querySelector('.failJob')).not.toBeNull();
  });

  it('stops polling and shows the failure message when the job is canceled', () => {
    // The backend's JobStatus has 'canceled'; the generated client enum does not.
    polls.next([job('canceled' as JobStatus)]);
    fixture.detectChanges();

    expect(polls.observed).toBeFalse();
    expect(fixture.nativeElement.querySelector('.failJob')).not.toBeNull();
  });

  it('shows the failure message when status polling errors', () => {
    polls.error(new Error('404'));
    fixture.detectChanges();

    expect(fixture.componentInstance.failedJob).toBeTrue();
    expect(fixture.nativeElement.querySelector('.failJob')).not.toBeNull();
  });

  it('stops polling when the component is destroyed', () => {
    polls.next([job(JobStatus.Processing)]);
    fixture.destroy();

    expect(polls.observed).toBeFalse();
  });

  it('stops polling and shows the failure message when the job is not found', () => {
    polls.next([]);
    fixture.detectChanges();

    expect(polls.observed).toBeFalse();
    expect(fixture.nativeElement.querySelector('.failJob')).not.toBeNull();
  });
});

describe('ResultsComponent navigation between jobs', () => {
  @Component({ template: '<router-outlet></router-outlet>' })
  class HostComponent {}

  let resultService: jasmine.SpyObj<ResultService>;

  beforeEach(async () => {
    resultService = jasmine.createSpyObj<ResultService>('ResultService', ['getResult', 'gotEndResult', 'getResponse']);
    resultService.getResult.and.returnValue(new Subject<Job[]>());

    await TestBed.configureTestingModule({
      imports: [ RouterTestingModule.withRoutes([{ path: 'results/:id', component: ResultsComponent }]) ],
      declarations: [ HostComponent, ResultsComponent ],
      providers: [
        { provide: ResultService, useValue: resultService },
        { provide: HttpClient, useValue: {} },
      ],
      schemas: [ NO_ERRORS_SCHEMA ],
    })
    .compileComponents();
  });

  it('loads the new job when navigating from one job\'s results to another', fakeAsync(() => {
    const fixture = TestBed.createComponent(HostComponent);
    const router = TestBed.inject(Router);

    router.navigate(['/results', 'A']);
    flush();
    fixture.detectChanges();
    router.navigate(['/results', 'B']);
    flush();
    fixture.detectChanges();

    expect(resultService.getResult).toHaveBeenCalledTimes(2);
  }));
});

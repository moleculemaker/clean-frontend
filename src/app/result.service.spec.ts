import { HttpErrorResponse } from '@angular/common/http';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { EnvironmentService } from './services/environment.service';
import { ApiModule, Configuration, JobsService, JobStatus } from './api/mmli-backend/v1';
import { discardPeriodicTasks, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { of, throwError } from 'rxjs';

import { ResultService } from './result.service';

const httpError = (status: number) => new HttpErrorResponse({ status });

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

  it('waits before retrying a failed status request', fakeAsync(() => {
    const listJobs = spyOn(TestBed.inject(JobsService), 'listJobsByTypeAndJobIdJobTypeJobsJobIdGet')
      .and.returnValue(throwError(() => httpError(500)));
    const subscription = service.getResult('abc').subscribe();

    tick(1);
    expect(listJobs).toHaveBeenCalledTimes(1);
    tick(10000);
    expect(listJobs).toHaveBeenCalledTimes(1);
    tick(1);
    expect(listJobs).toHaveBeenCalledTimes(2);

    subscription.unsubscribe();
    discardPeriodicTasks();
  }));

  // From review: a backend outage of a minute or more must not fail a job that is still running.
  for (const [what, error] of [['503s', httpError(503)], ['network errors', httpError(0)]] as const) {
    it(`keeps polling through ten minutes of ${what}`, fakeAsync(() => {
      const processing = [{ job_id: 'abc', phase: JobStatus.Processing }];
      let calls = 0;
      spyOn(TestBed.inject(JobsService), 'listJobsByTypeAndJobIdJobTypeJobsJobIdGet')
        .and.callFake((() => ++calls <= 60 ? throwError(() => error) : of(processing)) as any);
      const onNext = jasmine.createSpy('onNext');
      const onError = jasmine.createSpy('onError');
      const subscription = service.getResult('abc').subscribe({ next: onNext, error: onError });

      tick(11 * 60 * 1000);

      expect(onError).not.toHaveBeenCalled();
      expect(onNext).toHaveBeenCalledWith(processing);

      subscription.unsubscribe();
      discardPeriodicTasks();
    }));
  }

  it('surfaces a client error to the subscriber without retrying', fakeAsync(() => {
    const listJobs = spyOn(TestBed.inject(JobsService), 'listJobsByTypeAndJobIdJobTypeJobsJobIdGet')
      .and.returnValue(throwError(() => httpError(404)));
    const onError = jasmine.createSpy('onError');
    const subscription = service.getResult('abc').subscribe({ error: onError });

    tick(1);
    expect(onError).toHaveBeenCalled();
    tick(60 * 1000);
    expect(listJobs).toHaveBeenCalledTimes(1);

    subscription.unsubscribe();
    discardPeriodicTasks();
  }));
});

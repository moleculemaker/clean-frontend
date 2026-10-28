import { HttpClientTestingModule } from '@angular/common/http/testing';
import { EnvironmentService } from './services/environment.service';
import { ApiModule, Configuration, JobsService } from './api/mmli-backend/v1';
import { discardPeriodicTasks, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { throwError } from 'rxjs';

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

  it('waits before retrying a failed status request', fakeAsync(() => {
    const listJobs = spyOn(TestBed.inject(JobsService), 'listJobsByTypeAndJobIdJobTypeJobsJobIdGet')
      .and.returnValue(throwError(() => new Error('500')));
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

  it('surfaces the error to the subscriber when status requests keep failing', fakeAsync(() => {
    spyOn(TestBed.inject(JobsService), 'listJobsByTypeAndJobIdJobTypeJobsJobIdGet')
      .and.returnValue(throwError(() => new Error('404')));
    const onError = jasmine.createSpy('onError');
    const subscription = service.getResult('abc').subscribe({ error: onError });

    tick(10 * 60 * 1000);
    expect(onError).toHaveBeenCalled();

    subscription.unsubscribe();
    discardPeriodicTasks();
  }));
});

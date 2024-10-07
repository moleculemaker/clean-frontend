import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of, delay, timer, Subscription, Subject } from 'rxjs';
import { PollingResponseStatus, PollingResponseResult } from './models';
import { switchMap, tap, share, retry, takeUntil } from 'rxjs/operators';
import {EnvVars} from "./models/envvars";
import {EnvironmentService} from "./services/environment.service";
import {FilesService, Job, JobsService} from "./api/mmli-backend/v1";

@Injectable({
  providedIn: 'root'
})
export class ResultService {
  private resuts$: Observable<Array<Job>>;
  private stopPolling = new Subject();

  private envs: EnvVars;

  get hostname() {
    return this.envs?.hostname || 'https://jobmgr.mmli1.ncsa.illinois.edu';
  }
  get apiBasePath() {
    return this.envs?.basePath || 'api/v1';
  }
  get _url_status(): string {
    return `${this.hostname}/${this.apiBasePath}/job/status`;
  }
  get _url_result(): string {
    return `${this.hostname}/${this.apiBasePath}/job/result`;
  }
  jobID: string;
  dummyChooseArray: number[] = [0, 0, 0, 0, 0];
  private dummyRunningResult: PollingResponseResult = {
    jobId: "1",
    url: "mmli.clean.com/jobId/b01f8a6b-2f3e-4160-8f5d-c9a2c5eead78",
    status: "executing",
    created_at: "2020-01-01 10:10:10",
    results: []
  };

  private dummyFailedResult: PollingResponseResult = {
    jobId: "2",
    url: "mmli.clean.com/jobId/b01f8a6b-2f3e-4160-8f5d-c9a2c5eead78",
    status: "failed",
    created_at: "2020-01-01 10:10:10",
    results: []
  };

  private dummyCompleteResult: PollingResponseResult = {
    jobId: "1",
    url: "mmli.clean.com/jobId/b01f8a6b-2f3e-4160-8f5d-c9a2c5eead78",
    status: "completed",
    created_at: "2020-01-01 10:10:10",
    results: [
      {
        sequence: "header1",
        result: [
          {
            ecNumber: "EC:1.3.8.1",
            score: 10.3423
          },
          {
            ecNumber: "EC:1.3.8.2",
            score: 5.8673
          }
        ]
      },
      {
        sequence: "header2",
        result: [
          {
            ecNumber: "EC:1.3.8.3",
            score: 2.4593
          }
        ]
      }
    ]
  };

  constructor(private http: HttpClient,
              private envService: EnvironmentService,
              private jobsApi: JobsService,
              private filesApi: FilesService) {

    this.envs = this.envService.getEnvConfig();
    this.resuts$ = timer(1, 10000).pipe(
      switchMap((x) =>
        this.jobsApi.listJobsByTypeAndJobIdJobTypeJobsJobIdGet('clean', this.jobID)
        //this.http.post<PollingResponseResult>(this._url_status, {'jobId' : this.jobID}, { withCredentials: true })
        // this.tempSelectResult()
      ),
      retry(),
      takeUntil(this.stopPolling)
    );
  }

  // tempSelectResult(): Observable<PollingResponseResult> {
    // const runningRespond = of(this.dummyRunningResult);
    // const dealyRunningRespond = runningRespond.pipe(delay(200));

    // const failedResult = of(this.dummyFailedResult);
    // const dealyFailedRespond = failedResult.pipe(delay(200));

    // const completeResult = of(this.dummyCompleteResult);
    // const dealyCompleteResult = completeResult.pipe(delay(200));

    // if (choseResponse == 0) {
    //   return dealyRunningRespond;
    // }
    // else if (choseResponse == 1) {
    //   return dealyCompleteResult;
    // }
    // else {
    //   return dealyFailedRespond;
    // }
    // return this.http.post<PollingResponseResult>(this._url_status, this.jobID);
  // }

  // getResult(responseNumber: number): Observable<PollingResponseResult> {
  //   this.dummyChooseArray.push(responseNumber);
  //   return this.resuts$;
  // }

  gotEndResult() {
    this.stopPolling.next(1);
  }

  ngOnDestroy() {
    this.stopPolling.next(1);
  }

  getResponse(jobID: any): Observable<string>{
    this.jobID = jobID;
    //return this.http.post<PollingResponseResult>(this._url_result, {'jobId' : jobID}, { withCredentials: true }) //should return a jobID
    return this.filesApi.getResultsBucketNameResultsJobIdGet('clean', this.jobID)
  }
  getResult(jobID: any): Observable<Array<Job>>{
    this.jobID = jobID;
    return this.resuts$;
    // return this.http.post<PollingResponseStatus>(this._url_status, jobID);
  }

}

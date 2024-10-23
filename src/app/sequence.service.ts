import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of, delay } from 'rxjs';

import { PostResponse, PostSeqData, ExampleData, PostEmailResponse } from './models';
import { EnvironmentService } from "./services/environment.service";
import { EnvVars } from "./models/envvars";
import {Job, JobsService} from "./api/mmli-backend/v1";
import { TrackingService } from './tracking.service';

@Injectable({
  providedIn: 'root'
})
export class SequenceService {

  // jobId: number = 3;

  responseFromBackend: PostResponse = {
    jobId: "1",
    url: "mmli.clean.com/jobId/b01f8a6b-2f3e-4160-8f5d-c9a2c5eead78",
    status: 1,
    created_at: "2020-01-01 10:10:10"
  };

  responseFromExample: PostResponse = {
    jobId: "price149",
    url: "mmli.clean.com/jobId/b01f8a6b-2f3e-4160-8f5d-c9a2c5eead78",
    status: 1,
    created_at: "2020-01-01 10:10:10"
  };

  private envs: EnvVars;

  get hostname() {
    return this.envs?.hostname || 'https://mmli.fastapi.mmli1.ncsa.illinois.edu';
  }
  get apiBasePath() {
    return this.envs?.basePath || '';
  }
  get _url(): string {
    return `${this.hostname}/${this.apiBasePath}`;
  }

  constructor(
    private http: HttpClient,
    private envService: EnvironmentService,
    private jobsApi: JobsService,
    private trackingService: TrackingService
  ) {
    this.envs = this.envService.getEnvConfig();
  }

  // getResponse(sequenceData: PostSeqData): Observable<PostResponse>{
  //   const respond = of(this.responseFromBackend);
  //   const dealyRespond = respond.pipe(delay(200));
  //   return dealyRespond;
  // }

  getExampleResponse(dataLabel: string): Observable<PostResponse>{
    this.responseFromExample.jobId = dataLabel;
    const respond = of(this.responseFromExample);
    return respond;
  }


  getResponse(sequenceData: PostSeqData): Observable<Job>{
    this.trackingService.trackJobSubmission(sequenceData);
    return this.jobsApi.createJobJobTypeJobsPost('clean', {
      email: sequenceData.user_email,
      job_info: JSON.stringify({ 'input_fasta': sequenceData.input_fasta })
    });
    //return this.http.post<PostResponse>(this._url + '/job/submit', sequenceData, { withCredentials: true }); //should return a jobID
  }

  addEmail(userEmail: string): Observable<PostEmailResponse>{
    return this.http.post<PostEmailResponse>(this._url  + '/mailing/add', {"email": userEmail}, { withCredentials: true });
  }

  removeEmail(userEmail: string): Observable<PostEmailResponse>{
    return this.http.post<PostEmailResponse>(this._url  + '/mailing/delete', {"email": userEmail}, { withCredentials: true });
  }
}

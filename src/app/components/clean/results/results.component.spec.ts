import { NO_ERRORS_SCHEMA } from '@angular/core';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { EnvironmentService } from '../../../services/environment.service';
import { ApiModule, Configuration } from '../../../api/mmli-backend/v1';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TableModule } from 'primeng/table';

import { ResultsComponent } from './results.component';

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

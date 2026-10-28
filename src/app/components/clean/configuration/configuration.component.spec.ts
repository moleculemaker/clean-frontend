import { FormsModule } from '@angular/forms';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NgxMatomoTrackerModule } from '@ngx-matomo/tracker';
import { NgHcaptchaService } from 'ng-hcaptcha';
import { EnvironmentService } from '../../../services/environment.service';
import { ApiModule, Configuration } from '../../../api/mmli-backend/v1';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InputTextareaModule } from 'primeng/inputtextarea';
import { SelectButtonModule } from 'primeng/selectbutton';
import { RadioButtonModule } from 'primeng/radiobutton';
import { CheckboxModule } from 'primeng/checkbox';

import { ConfigurationComponent } from './configuration.component';

describe('ConfigurationComponent', () => {
  let component: ConfigurationComponent;
  let fixture: ComponentFixture<ConfigurationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        FormsModule,
        InputTextareaModule,
        SelectButtonModule,
        RadioButtonModule,
        CheckboxModule,
        HttpClientTestingModule,
        ApiModule.forRoot(() => new Configuration()),
        NgxMatomoTrackerModule.forRoot({ disabled: true, siteId: 0, trackerUrl: '' })
      ],
      providers: [ EnvironmentService, { provide: NgHcaptchaService, useValue: {} } ],
      schemas: [ NO_ERRORS_SCHEMA ],
      declarations: [ ConfigurationComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ConfigurationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

import { Subscription } from 'rxjs';
import { AppSettings, LoadTypes } from './../common/app settings/AppSettings';
import { SharedService, FormDataPackage } from './../common/services/shared.service';
import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, FormControl, Validators } from '@angular/forms'
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Title } from '@angular/platform-browser';
import { ConfigFormValidators } from '../common/Validators/ConfigFormValidators';
import { animate, state, style, transition, trigger } from '@angular/animations';


@Component({
  selector: 'setup-form',
  templateUrl: './setup-form.component.html',
  styleUrls: ['./setup-form.component.css'],
  animations: [
    trigger('animationState', [
      state('show', style({ opacity: 1 })),
      state('hide', style({ opacity: 0 })),
      transition('show => hide', animate('150ms ease-out')),
      transition('hide => show', animate('400ms ease-in'))
    ])
  ]
})
export class SetupFormComponent implements OnInit {

  setupForm: FormGroup;
  submitted: boolean = false;
  showErrorAlert = false;
  responseReceived = false;

  constructor(private fb: FormBuilder, private readonly http: HttpClient, private titleService: Title, private sharedService: SharedService) { }

  ngOnInit(): void {
    this.titleService.setTitle("Setup Configurations");
    this.initializeForm();
  }

  initializeForm(): void {
    this.setupForm = this.fb.group({
      script_bucket: new FormControl('', [Validators.required]),
      test_data_bucket: new FormControl('', [Validators.required]),
      test_data_access_secret: new FormControl('', [Validators.required]),
      tenant_id: new FormControl(''),
      client_id: new FormControl(''),
      client_secret: new FormControl('')
    });
  }

  get script_bucket() {
    return this.setupForm.get('script_bucket');
  }
  get test_data_bucket() {
    return this.setupForm.get('test_data_bucket');
  }
  get test_data_access_secret() {
    return this.setupForm.get('test_data_access_secret');
  }
  get tenant_id() {
    return this.setupForm.get('tenant_id');
  }
  get client_id() {
    return this.setupForm.get('client_id');
  }
  get client_secret() {
    return this.setupForm.get('client_secret');
  }
  get isValid() {
    return this.setupForm.valid;
  }

  onSubmit(): void {

    if (this.setupForm.valid) {
      AppSettings.addingPrefix = true;
      //append the necessary data to formData and send to Flask server
      const formData = new FormData();
      formData.append("button", "setup_config");
      formData.append('form', JSON.stringify(this.setupForm.getRawValue()));
      this.postFormToServer(formData);
      this.submitted = true;
    }
  }

  postFormToServer(formData: FormData) {
    this.http.post(AppSettings.serverIp, formData).toPromise();
  }

  getExistingConfigFromServer() {
    this.http.get(AppSettings.serverIp).subscribe(response => this.processGetResponse(response), (err) => { this.onError(err) });
  }

  processPostResponse(response: object, formData: FormData) {
    
  }

  processGetResponse(response: object) {
    
  }

  onError(error) {
    console.log(error);
    this.toggleErrorMessage();
    this.submitted = false;
    this.responseReceived = false;
    setTimeout(() => this.toggleErrorMessage(), 3000);
  }

  toggleErrorMessage() {
    this.showErrorAlert = !this.showErrorAlert;
  }
}

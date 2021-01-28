import { Subscription } from 'rxjs';
import { AppSettings } from './../common/app settings/AppSettings';
import { SharedService, FormDataPackage } from './../common/services/shared.service';
import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, FormControl, Validators } from '@angular/forms'
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Title } from '@angular/platform-browser';
import { animate, state, style, transition, trigger } from '@angular/animations';
import { ConfigFormValidators } from '../common/Validators/ConfigFormValidators';

enum returnStatus { Success, Failure, PartialSuccess }

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
  showAlert = false;
  alertClass = "";
  alertText = "";
  submitButtonText = "Submit Configurations";
  
  constructor(private fb: FormBuilder, private readonly http: HttpClient, private titleService: Title, private sharedService: SharedService) { }

  ngOnInit(): void {
    this.titleService.setTitle("Setup Configurations");
    this.initializeForm();
    this.getExistingConfigFromServer();
  }

  initializeForm(): void {
    this.setupForm = this.fb.group({
      region: AppSettings.regions[0],
      script_bucket: new FormControl('', [Validators.required, Validators.pattern(/^[0-9a-z.-]*$/), ConfigFormValidators.cannotContainSpaces]),
      test_data_bucket: new FormControl('', [Validators.required, Validators.pattern(/^[0-9a-z.-]*$/), ConfigFormValidators.cannotContainSpaces]),
      upload_test_data: false,
      test_data_access_secret: new FormControl('', [Validators.required]),
      tenant_id: new FormControl(''),
      client_id: new FormControl(''),
      client_secret: new FormControl('')
    });
  }

  get region() {
    return this.setupForm.get('region');
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
  get animState() {
    return this.showAlert ? 'show' : 'hide';
  }
  get regions() {
    return AppSettings.regions;
  }

  onSubmit(): void {

    if (this.setupForm.valid) {
      this.trimInput();
      const formData = new FormData();
      formData.append("button", "setup_config");
      formData.append('form', JSON.stringify(this.setupForm.getRawValue()));
      this.postFormToServer(formData);
      this.submitted = true;
      this.lockForm();
    }
  }

  postFormToServer(formData: FormData) {
    this.http.post(AppSettings.serverIp, formData).subscribe(response => this.processPostResponse(response), (err) => { this.onErrorSubmitting(err) });
  }


  processPostResponse(response: object) {
    if(response['response'] == "UPLOADFAILED") {
      this.toggleAlert(returnStatus.PartialSuccess);
    } else {
      this.toggleAlert(returnStatus.Success);
    }
    this.submitted = true;
    this.unlockForm();
    setTimeout(() => this.toggleAlert(), 3000);
  }

  getExistingConfigFromServer() {
    this.http.get(AppSettings.serverIp, { params: { request_type: 'config_fields' } }).subscribe(response => this.processGetResponse(response), (err) => { this.onErrorRetrievingData(err) });
  }

  processGetResponse(response: object) {
    this.setFormFieldsFromServerData(response);
  }

  setFormFieldsFromServerData(serverData) {
    if(AppSettings.regions.includes(serverData['region'])) {
      this.region.setValue(serverData['region']);
    }
    this.script_bucket.setValue(serverData['script_bucket']);
    this.test_data_bucket.setValue(serverData['test_data_bucket']);
    this.test_data_access_secret.setValue(serverData['test_data_access_secret']);
    this.tenant_id.setValue(serverData['tenant_id']);
    this.client_id.setValue(serverData['client_id']);
    this.client_secret.setValue(serverData['client_secret']);
    this.setupForm.updateValueAndValidity();
  }

  onErrorSubmitting(error) {
    console.log(error);
    this.toggleAlert(returnStatus.Failure);
    this.submitted = false;
    this.unlockForm();
    setTimeout(() => this.toggleAlert(), 3000);
  }

  onErrorRetrievingData(error) {
    console.log("Setup Form Component: Error retrieving current config field values from server. Is the server running?");
  }

  toggleAlert(status?: returnStatus) {

    if (status == returnStatus.Success) {
      this.alertClass = "alert-success";
      this.alertText = "Success! Configuration updated"
    } else if (status == returnStatus.Failure) {
      this.alertClass = "alert-danger";
      this.alertText = "Error submitting to server"
    } else if (status == returnStatus.PartialSuccess) {
      this.alertClass = "alert-warning";
      this.alertText = "Config file successfully updated, but upload to S3 failed."
    }
    this.showAlert = !this.showAlert;
  }

  lockForm() {
    this.submitButtonText = "Submitting Configuration..."
    this.setupForm.disable();
  }

  unlockForm() {
    this.submitButtonText = "Submit Configurations"
    this.setupForm.enable();
  }

  trimInput() {
    Object.keys(this.setupForm.controls).forEach(key => {
      if(key != 'upload_test_data') {
        this.setupForm.get(key).setValue(this.setupForm.get(key).value.trim().replace(/\s+/g, ' '));
      }
    });
  }
}
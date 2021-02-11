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

enum ReturnStatus { Success, Failure, PartialSuccess , UpdateSuccessful, UpdateFailure }
enum LockType { Submit, Update }
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
  updateButtonText = "Update"
  public submitPopoverTitle: string = "Please Confirm";
  public submitPopoverMessage: string = "The configurations input above will overwrite previous configurations.";
  public updatePopoverMessage: string = "This will update this project, please do not run tests during update. Service may be interrupted for a short period.";
  
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
  get formEnabled() {
    return this.setupForm.enabled;
  }

  onSubmit(): void {

    if (this.setupForm.valid) {
      this.trimInput();
      const formData = new FormData();
      formData.append("button", "setup_config");
      formData.append('form', JSON.stringify(this.setupForm.getRawValue()));
      this.postFormToServer(formData);
      this.submitted = true;
      this.lockForm(LockType.Submit);
    }
  }

  postFormToServer(formData: FormData) {
    this.http.post(AppSettings.serverIp, formData).subscribe(response => this.processPostResponse(response), (err) => { this.onErrorSubmitting(err) });
  }

  processPostResponse(response: object) {
    if(response['response'] == "UPLOADFAILED") {
      this.toggleAlert(ReturnStatus.PartialSuccess);
    } else {
      this.toggleAlert(ReturnStatus.Success);
    }
    this.submitted = true;
    this.unlockForm(LockType.Submit);
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
    this.toggleAlert(ReturnStatus.Failure);
    this.submitted = false;
    this.unlockForm(LockType.Submit);
  }

  onErrorRetrievingData(error) {
    console.log("Setup Form Component: Error retrieving current config field values from server. Is the server running?");
  }

  toggleAlert(status?: ReturnStatus) {

    if (status == ReturnStatus.Success) {
      this.alertClass = "alert-success";
      this.alertText = "Success! Configuration updated"
    } else if (status == ReturnStatus.Failure) {
      this.alertClass = "alert-danger";
      this.alertText = "Error submitting to server"
    } else if (status == ReturnStatus.PartialSuccess) {
      this.alertClass = "alert-warning";
      this.alertText = "Config file successfully updated, but upload to S3 failed."
    } else if (status == ReturnStatus.UpdateSuccessful) {
      this.alertClass = "alert-success";
      this.alertText = "Success! Project Updated"
    } else if (status == ReturnStatus.UpdateFailure) {
      this.alertClass = "alert-danger";
      this.alertText = "Error updating project"
    }
    this.showAlert = !this.showAlert;
    setTimeout(() => (this.showAlert = !this.showAlert), 3000);

  }

  lockForm(lockType: LockType) {
    this.setupForm.disable();

    if(lockType == LockType.Submit) {
      this.submitButtonText = "Submitting Configuration...";
    } else if (lockType == LockType.Update) {
      this.updateButtonText = "Updating, this may take a few minutes...";
      this.sharedService.updating = true;
    }
  }

  unlockForm(lockType: LockType) {
    this.setupForm.enable();

    if(lockType == LockType.Submit) {
      this.submitButtonText = "Submit Configurations";
    } else if (lockType == LockType.Update) {
      this.updateButtonText = "Update";
      this.sharedService.updating = false;
    }
  }

  trimInput() {
    Object.keys(this.setupForm.controls).forEach(key => {
      if(key != 'upload_test_data') {
        this.setupForm.get(key).setValue(this.setupForm.get(key).value.trim().replace(/\s+/g, ' '));
      }
    });
  }

  onUpdatePressed() {
    this.lockForm(LockType.Update);
    this.postUpdateRequest();
  }

  postUpdateRequest() {
    const formData = new FormData();
    formData.append("button", "update");
    this.http.post(AppSettings.serverIp, formData).subscribe(response => this.onSuccessUpdating(response), (err) => { this.onErrorUpdating(err) });
  }

  onSuccessUpdating(response) {
    this.unlockForm(LockType.Update);
    this.toggleAlert(ReturnStatus.UpdateSuccessful);
  }

  onErrorUpdating(error) {
    console.log(error);
    this.unlockForm(LockType.Update);
    this.toggleAlert(ReturnStatus.UpdateFailure);
  }
}
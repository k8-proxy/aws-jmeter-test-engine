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
  selector: 'config-form',
  templateUrl: './config-form.component.html',
  styleUrls: ['./config-form.component.css'],
  animations: [
    trigger('animationState', [
      state('show', style({ opacity: 1 })),
      state('hide', style({ opacity: 0 })),
      transition('show => hide', animate('150ms ease-out')),
      transition('hide => show', animate('400ms ease-in'))
    ])
  ]
})

export class ConfigFormComponent implements OnInit {
  testsStoppedSubscription: Subscription;
  configForm: FormGroup;
  submitted = false;
  responseReceived = false;
  portDefault = '443';
  enableCheckboxes = true;
  enableSharePointHostsField = false;
  enableIgnoreErrorCheckbox = true;
  LoadTypeFieldTitle = AppSettings.loadTypeFieldTitles[LoadTypes.Direct];
  endPointFieldPlaceholder = AppSettings.endPointFieldPlaceholders[LoadTypes.Direct]
  endPointFieldDescription = AppSettings.endPointFieldDescriptions[LoadTypes.Direct]
  showErrorAlert = false;
  hideSubmitMessages = false;
  GenerateLoadButtonText = "Generate Load";

  constructor(private fb: FormBuilder, private readonly http: HttpClient, private router: Router, private titleService: Title, private sharedService: SharedService) {
    this.testsStoppedSubscription = this.sharedService.getStopSingleEvent().subscribe((prefix) => this.onTestStopped(prefix));
  }

  ngOnInit(): void {
    this.initializeForm();
    this.setTitle("ICAP Performance Test");
    this.configForm.valueChanges.subscribe((data) => {
      this.hideSubmitMessages = true;
    });
    this.setValidatorsDependingOnLoadType();
  }

  setValidatorsDependingOnLoadType() {
    this.configForm.get('load_type').valueChanges.subscribe(loadType => {
      if (loadType == AppSettings.loadTypeNames[LoadTypes.Direct]) {
        this.sharepoint_hosts.setValidators([]);
        this.icap_endpoint_url.setValidators([Validators.required, ConfigFormValidators.cannotContainSpaces]);
      } else if (loadType == AppSettings.loadTypeNames[LoadTypes.ProxyOffline]) {
        this.sharepoint_hosts.setValidators([]);
        this.icap_endpoint_url.setValidators([Validators.required, ConfigFormValidators.cannotContainSpaces, Validators.pattern(/^(([1-9]?\d|1\d\d|2[0-5][0-5]|2[0-4]\d)\.){3}([1-9]?\d|1\d\d|2[0-5][0-5]|2[0-4]\d)$/)]);
      } else if (loadType == AppSettings.loadTypeNames[LoadTypes.ProxySharePoint]) {
        this.sharepoint_hosts.setValidators([Validators.required]);
        this.icap_endpoint_url.setValidators([Validators.required]);
      }
      this.configForm.get('sharepoint_hosts').updateValueAndValidity();
      this.configForm.get('icap_endpoint_url').updateValueAndValidity();
    })
  }

  // setEndPointFieldValidation() {
  //   //in order: direct, proxy, proxy sharepoint
  //   this.configForm.get('load_type').valueChanges.subscribe(loadType => {
  //     if (loadType == AppSettings.loadTypeNames[LoadTypes.Direct]) {
  //       this.icap_endpoint_url.setValidators([Validators.required, ConfigFormValidators.cannotContainSpaces]);
  //     } else if (loadType == AppSettings.loadTypeNames[LoadTypes.ProxyOffline]) {
  //       this.icap_endpoint_url.setValidators([Validators.required, ConfigFormValidators.cannotContainSpaces, Validators.pattern(/^(([1-9]?\d|1\d\d|2[0-5][0-5]|2[0-4]\d)\.){3}([1-9]?\d|1\d\d|2[0-5][0-5]|2[0-4]\d)$/)]);
  //     } else if (loadType == AppSettings.loadTypeNames[2]) {
  //       this.icap_endpoint_url.setValidators([Validators.required]);
  //     }
  //     this.configForm.get('icap_endpoint_url').updateValueAndValidity();
  //   })
  // }

  setTitle(newTitle: string) {
    this.titleService.setTitle(newTitle);
  }

  initializeForm(): void {
    this.configForm = this.fb.group({
      total_users: new FormControl('', [Validators.pattern(/^(?=.*\d)[\d ]+$/), ConfigFormValidators.cannotContainSpaces, ConfigFormValidators.hasNumberLimit]),
      duration: new FormControl('', [Validators.pattern(/^(?=.*\d)[\d ]+$/), ConfigFormValidators.cannotContainSpaces]),
      ramp_up_time: new FormControl('', [Validators.pattern(/^(?=.*\d)[\d ]+$/), ConfigFormValidators.cannotContainSpaces]),
      load_type: AppSettings.loadTypeNames[LoadTypes.Direct],
      icap_endpoint_url: new FormControl('', [Validators.required, ConfigFormValidators.cannotContainSpaces]),
      sharepoint_hosts: new FormControl(''),
      prefix: new FormControl('', [ConfigFormValidators.cannotContainSpaces, ConfigFormValidators.cannotContainDuplicatePrefix, Validators.required]),
      enable_tls: true,
      tls_ignore_error: true,
      port: new FormControl('', [Validators.pattern(/^(?=.*\d)[\d ]+$/), ConfigFormValidators.cannotContainSpaces]),
    });
  }

  onLoadTypeChange() {
    //in order: direct, proxy, proxy sharepoint
    if (this.configForm.get('load_type').value == AppSettings.loadTypeNames[LoadTypes.Direct]) {
      this.enableCheckboxes = true;
      this.enableSharePointHostsField = false;
      this.LoadTypeFieldTitle = AppSettings.loadTypeFieldTitles[LoadTypes.Direct];
      this.endPointFieldPlaceholder = AppSettings.endPointFieldPlaceholders[LoadTypes.Direct]
      this.endPointFieldDescription = AppSettings.endPointFieldDescriptions[LoadTypes.Direct]
    } else if (this.configForm.get('load_type').value == AppSettings.loadTypeNames[LoadTypes.ProxyOffline]) {
      this.enableCheckboxes = false;
      this.enableSharePointHostsField = false;
      this.LoadTypeFieldTitle = AppSettings.loadTypeFieldTitles[LoadTypes.ProxyOffline];
      this.endPointFieldPlaceholder = AppSettings.endPointFieldPlaceholders[LoadTypes.ProxyOffline]
      this.endPointFieldDescription = AppSettings.endPointFieldDescriptions[LoadTypes.ProxyOffline]
    } else if (this.configForm.get('load_type').value == AppSettings.loadTypeNames[LoadTypes.ProxySharePoint]) {
      this.enableCheckboxes = false;
      this.enableSharePointHostsField = true;
      this.LoadTypeFieldTitle = AppSettings.loadTypeFieldTitles[LoadTypes.ProxySharePoint];
      this.endPointFieldPlaceholder = AppSettings.endPointFieldPlaceholders[LoadTypes.ProxySharePoint]
      this.endPointFieldDescription = AppSettings.endPointFieldDescriptions[LoadTypes.ProxySharePoint]
    }
    this.setValidatorsDependingOnLoadType();
  }

  onTlsChange() {
    if (this.configForm.get('enable_tls').value == true) {
      this.portDefault = '443';
      this.enableIgnoreErrorCheckbox = true;
    } else {
      this.portDefault = '1344';
      this.enableIgnoreErrorCheckbox = false;
    }
  }

  //getter methods used in html so we can refer cleanly and directly to these fields 
  get total_users() {
    return this.configForm.get('total_users');
  }
  get duration() {
    return this.configForm.get('duration');
  }
  get ramp_up_time() {
    return this.configForm.get('ramp_up_time');
  }
  get icap_endpoint_url() {
    return this.configForm.get('icap_endpoint_url');
  }
  get port() {
    return this.configForm.get('port');
  }
  get prefix() {
    return this.configForm.get('prefix');
  }
  get sharepoint_hosts() {
    return this.configForm.get('sharepoint_hosts');
  }
  get isValid() {
    return this.configForm.valid;
  }
  get formSubmitted() {
    return this.submitted;
  }
  get gotResponse() {
    return this.responseReceived;
  }
  get animState() {
    return this.showErrorAlert ? 'show' : 'hide';
  }
  get cookiesExist(): boolean {
    return AppSettings.cookiesExist;
  }
  get loadTypes() {
    return AppSettings.loadTypeNames;
  }

  processResponse(response: object, formData: FormData) {
    let formAsString = formData.get('form');
    this.responseReceived = true;

    //pack up form data and response URL, fire form submitted event and send to subscribers
    const dataPackage: FormDataPackage = { formAsJsonString: formAsString.toString(), grafanaUrlResponse: response['url'], stackName: response['stack_name'] }
    this.sharedService.sendSubmitEvent(dataPackage);
    this.unlockForm();
    this.submitted = false;
  }

  resetForm() {
    this.configForm.reset();
    this.initializeForm();
    this.onLoadTypeChange();
    this.hideSubmitMessages = true;
  }

  postFormToServer(formData: FormData) {
    this.http.post(AppSettings.serverIp, formData).subscribe(response => this.processResponse(response, formData), (err) => { this.onError(err) });
  }

  postStopRequestToServer(formData: FormData) {
    this.http.post(AppSettings.serverIp, formData).toPromise();
  }

  onSubmit(): void {
    this.setFormDefaults();
    this.hideSubmitMessages = false;
    if (this.configForm.valid) {
      AppSettings.addingPrefix = true;
      AppSettings.testPrefixSet.add(this.prefix.value);
      this.trimEndPointField();
      //append the necessary data to formData and send to Flask server
      const formData = new FormData();
      formData.append("button", "generate_load");
      formData.append('form', JSON.stringify(this.configForm.getRawValue()));
      this.postFormToServer(formData);
      this.submitted = true;
      this.lockForm();
    }
  }

  trimEndPointField() {
    this.configForm.get('sharepoint_hosts').setValue(this.configForm.get('sharepoint_hosts').value.trim().replace(/\s+/g, ' '))
  }

  lockForm() {
    this.GenerateLoadButtonText = "Generating Load..."
    this.prefix.reset();
    this.configForm.disable();
  }

  unlockForm() {
    this.GenerateLoadButtonText = "Generate Load"
    this.configForm.enable();
  }

  setFormDefaults() {
    //if user enters less that 1 total_users, default to 1. Otherwise if no input, default to 25.
    if (this.total_users.value === '') {
      this.total_users.setValue('25');
    } else if (this.total_users.value < 1) {
      this.total_users.setValue('1');
    }

    //if user enters no ramp up time, default is 300.
    if (this.ramp_up_time.value === '') {
      this.ramp_up_time.setValue('300');
    }

    //if user enters no duration, default is 900. If they enter a less than 60 second duration, default to 60.
    if (this.duration.value === '') {
      this.duration.setValue('900');
    }
    else if (this.duration.value < 60) {
      this.duration.setValue('60');
    }
  }

  onError(error) {
    console.log(error);
    this.toggleErrorMessage();
    this.submitted = false;
    this.responseReceived = false;
    setTimeout(() => this.toggleErrorMessage(), 3000);
    this.unlockForm();
    AppSettings.addingPrefix = false;
  }

  toggleErrorMessage() {
    this.showErrorAlert = !this.showErrorAlert;
  }

  //used to revalidate prefix if a test is stopped. So in instances where a prefix is invalid due to an existing test, it being deleted will make that prefix valid again.
  onTestStopped(prefix: string) {
    if (this.prefix.value === prefix) {
      this.prefix.markAsPristine();
      this.prefix.markAsUntouched();
      this.prefix.updateValueAndValidity();
      this.configForm.updateValueAndValidity();
    }
  }
}
import { Subscription } from 'rxjs';
import { AppSettings, LoadTypes, testTableAlertType } from './../common/app settings/AppSettings';
import { SharedService, FormDataPackage } from './../common/services/shared.service';
import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, FormControl, Validators } from '@angular/forms'
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
  alertClass = "";
  alertText = "";
  configForm: FormGroup;
  submitted = false;
  responseReceived = false;
  portDefaultPlaceHolder = 'Default: 443';
  enableCheckboxes = true;
  enableSharePointHostsField = false;
  enableIgnoreErrorCheckbox = true;
  endPointFieldTitle = AppSettings.endPointFieldTitles[LoadTypes.Direct];
  endPointFieldPlaceholder = AppSettings.endPointFieldPlaceholders[LoadTypes.Direct]
  endPointFieldDescription = "*this field is required, endpoint should not begin with http(s)://"
  showAlert = false;
  hideSubmitMessages = false;
  GenerateLoadButtonText = "Generate Load";
  enablePortField = true;
  public popoverTitle: string = "Please Confirm";
  public popoverMessage: string = "Are you sure you wish to stop all load?";
  public confirmClicked: boolean = false;
  public cancelClicked: boolean = false;

  constructor(private fb: FormBuilder, private readonly http: HttpClient, private titleService: Title, private sharedService: SharedService) {
    this.testsStoppedSubscription = this.sharedService.getStopSingleEvent().subscribe((prefix) => this.onTestStopped(prefix));
  }

  ngOnInit(): void {
    this.initializeForm();
    this.setTitle("ICAP Performance Test");
    this.configForm.valueChanges.subscribe((data) => {
      this.hideSubmitMessages = true;
    });
    this.setValidatorsDependingOnLoadType(this.loadType.value);
    this.loadType.valueChanges.subscribe(loadType => {this.setValidatorsDependingOnLoadType(loadType)})
  }

  setValidatorsDependingOnLoadType(loadType) {
      this.sharepoint_hosts.clearValidators();
      this.icap_endpoint_url.setValidators([Validators.required, ConfigFormValidators.cannotContainSpaces, ConfigFormValidators.cannotStartWithHttp]);
      
      if (loadType == AppSettings.loadTypeNames[LoadTypes.ProxySharePoint]) {
        this.sharepoint_hosts.setValidators([Validators.required]);
      } else if (loadType == AppSettings.loadTypeNames[LoadTypes.Proxy]) {
        this.icap_endpoint_url.setValidators([Validators.required, ConfigFormValidators.cannotContainSpaces, Validators.pattern(/^(([1-9]?\d|1\d\d|2[0-5][0-5]|2[0-4]\d)\.){3}([1-9]?\d|1\d\d|2[0-5][0-5]|2[0-4]\d)$/)]);
      } else {
      }
      this.configForm.get('sharepoint_hosts').updateValueAndValidity();
      this.configForm.get('icap_endpoint_url').updateValueAndValidity();
  }

  setTitle(newTitle: string) {
    this.titleService.setTitle(newTitle);
  }

  initializeForm(): void {
    this.configForm = this.fb.group({
      total_users: new FormControl('', [Validators.pattern(/^(?=.*\d)[\d ]+$/), ConfigFormValidators.cannotContainSpaces]),
      duration: new FormControl('', [Validators.pattern(/^(?=.*\d)[\d ]+$/), ConfigFormValidators.cannotContainSpaces]),
      ramp_up_time: new FormControl('', [Validators.pattern(/^(?=.*\d)[\d ]+$/), ConfigFormValidators.cannotContainSpaces]),
      load_type: AppSettings.loadTypeNames[LoadTypes.Direct],
      icap_endpoint_url: new FormControl('', [Validators.required, ConfigFormValidators.cannotContainSpaces, ConfigFormValidators.cannotStartWithHttp]),
      sharepoint_hosts: new FormControl(''),
      prefix: new FormControl('', [Validators.required, Validators.pattern(/^([A-Za-z\s])[0-9a-zA-Z_-\s]*$/)]),
      enable_tls: true,
      tls_ignore_error: true,
      port: new FormControl('', [Validators.pattern(/^(?=.*\d)[\d ]+$/), ConfigFormValidators.cannotContainSpaces]),
    });
  }

  onLoadTypeChange() {

  this.endPointFieldDescription = "*this field is required, endpoint should not begin with http(s)://"

    //in order: direct, proxy, proxy sharepoint
    if (this.loadType.value == AppSettings.loadTypeNames[LoadTypes.Direct]) {
      this.endPointFieldTitle = AppSettings.endPointFieldTitles[LoadTypes.Direct];
      this.endPointFieldPlaceholder = AppSettings.endPointFieldPlaceholders[LoadTypes.Direct];
    }
    else if (this.loadType.value == AppSettings.loadTypeNames[LoadTypes.Proxy]) {
      this.endPointFieldTitle = AppSettings.endPointFieldTitles[LoadTypes.Proxy];
      this.endPointFieldPlaceholder = AppSettings.endPointFieldPlaceholders[LoadTypes.Proxy];
      this.endPointFieldDescription = "*this field is required, please input a valid IP address"
    }
    else if (this.loadType.value == AppSettings.loadTypeNames[LoadTypes.ProxySharePoint]) {
      this.endPointFieldTitle = AppSettings.endPointFieldTitles[LoadTypes.ProxySharePoint];
      this.endPointFieldPlaceholder = AppSettings.endPointFieldPlaceholders[LoadTypes.ProxySharePoint];
    }
    else if (this.loadType.value == AppSettings.loadTypeNames[LoadTypes.DirectSharePoint]) {
      this.endPointFieldTitle = AppSettings.endPointFieldTitles[LoadTypes.DirectSharePoint];
      this.endPointFieldPlaceholder = AppSettings.endPointFieldPlaceholders[LoadTypes.DirectSharePoint];
    } 
    else if (this.loadType.value == AppSettings.loadTypeNames[LoadTypes.RestApi]) {
      this.endPointFieldTitle = AppSettings.endPointFieldTitles[LoadTypes.RestApi];
      this.endPointFieldPlaceholder = AppSettings.endPointFieldPlaceholders[LoadTypes.RestApi];
    }
    this.enableCheckboxes = this.enablePortField = this.loadType.value == AppSettings.loadTypeNames[LoadTypes.Direct];
    this.enableSharePointHostsField = this.loadType.value == AppSettings.loadTypeNames[LoadTypes.ProxySharePoint];
  }

  onTlsChange() {
    if (this.configForm.get('enable_tls').value == true) {
      this.portDefaultPlaceHolder = 'Default: 443';
      this.enableIgnoreErrorCheckbox = true;
    } else {
      this.portDefaultPlaceHolder = 'Default: 1344';
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
    return this.showAlert ? 'show' : 'hide';
  }
  get cookiesExist(): boolean {
    return AppSettings.cookiesExist;
  }
  get loadType() {
    return this.configForm.get('load_type');
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
    if (this.loadType.value != "Direct") {
      this.port.setValue('');
    }
    this.setFormDefaults();
    this.hideSubmitMessages = false;
    if (this.configForm.valid) {
      this.formatPrefix();
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
      this.prefix.reset();
    }
  }

  formatPrefix() {
    let result = this.prefix.value.trim() as string;
    let arr = result.split(/[\s_-]+/);
    for(let i = 1; i < arr.length; i++) {
      if(arr[i] && isNaN(+arr[i].charAt(0))) {
        arr[i] = arr[i].charAt(0).toUpperCase() + arr[i].slice(1);
      }
    }

    result = arr.join("");
    console.log(result);
    this.prefix.setValue(result);
  }

  trimEndPointField() {
    this.configForm.get('sharepoint_hosts').setValue(this.configForm.get('sharepoint_hosts').value.trim().replace(/\s+/g, ' '))
  }

  lockForm() {
    this.GenerateLoadButtonText = "Generating Load..."
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

    //if user enters no duration, default is 900. If they enter a less than 300 second duration, default to 300.
    if (this.duration.value === '') {
      this.duration.setValue('900');
    }
    else if (this.duration.value < 300) {
      this.duration.setValue('300');
    }
  }

  onError(error) {
    console.log(error);
    this.toggleAlert(testTableAlertType.Error);
    this.submitted = false;
    this.responseReceived = false;
    this.unlockForm();
    AppSettings.addingPrefix = false;
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

  toggleAlert(status?: testTableAlertType) {

    if (status == testTableAlertType.StopAllTests) {
      this.alertClass = "alert-info";
      this.alertText = "Load generation stopped."
    } else if (status == testTableAlertType.Error) {
      this.alertClass = "alert-danger";
      this.alertText = "Error submitting to server"
    } 
    this.showAlert = !this.showAlert;
    setTimeout(() => (this.showAlert = !this.showAlert), 3000);
  }

  onStopTests() {
    const formData = new FormData();
    formData.append("button", "stop_tests");
    this.postStopRequestToServer(formData);
    this.sharedService.sendStopAllTestsEvent();
    this.toggleAlert(testTableAlertType.StopAllTests);
    this.submitted = false;
    this.responseReceived = false;
    AppSettings.testPrefixSet.clear();
  }
}

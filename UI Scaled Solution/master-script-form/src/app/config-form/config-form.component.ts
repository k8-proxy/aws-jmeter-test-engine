import { AppSettings } from './../common/app settings/AppSettings';
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
  configForm: FormGroup;
  submitted = false;
  generatingLoad = false;
  responseReceived = false;
  portDefault = '443';
  enableCheckboxes = true;
  enableIgnoreErrorCheckbox = true;
  IcapOrProxy = AppSettings.urlChoices[0];
  showStoppedAlert = false;
  hideSubmitMessages = false;
  GenerateLoadButtonText = "Generate Load";
  public popoverTitle: string = "Please Confirm";
  public popoverMessage: string = "Are you sure you wish to stop all load?";
  public confirmClicked: boolean = false;
  public cancelClicked: boolean = false;

  constructor(private fb: FormBuilder, private readonly http: HttpClient, private router: Router, private titleService: Title, private sharedService: SharedService) { }

  ngOnInit(): void {
    this.initializeForm();
    this.setTitle("ICAP Performance Test");
    this.configForm.valueChanges.subscribe((data) => {
      this.hideSubmitMessages = true;
    });
  }

  setTitle(newTitle: string) {
    this.titleService.setTitle(newTitle);
  }

  initializeForm(): void {
    this.configForm = this.fb.group({
      total_users: new FormControl('', [Validators.pattern(/^(?=.*\d)[\d ]+$/), ConfigFormValidators.cannotContainSpaces, ConfigFormValidators.hasNumberLimit]),
      duration: new FormControl('', [Validators.pattern(/^(?=.*\d)[\d ]+$/), ConfigFormValidators.cannotContainSpaces]),
      ramp_up_time: new FormControl('', [Validators.pattern(/^(?=.*\d)[\d ]+$/), ConfigFormValidators.cannotContainSpaces]),
      load_type: AppSettings.loadTypes[0],
      icap_endpoint_url: new FormControl('', [Validators.required, ConfigFormValidators.cannotContainSpaces]),
      prefix: new FormControl('', [ConfigFormValidators.cannotContainSpaces]),
      enable_tls: true,
      tls_ignore_error: true,
      port: new FormControl('', [Validators.pattern(/^(?=.*\d)[\d ]+$/), ConfigFormValidators.cannotContainSpaces]),
    });
  }

  onLoadTypeChange() {
    //if direct, else proxy
    if (this.configForm.get('load_type').value == AppSettings.loadTypes[0]) {
      this.enableCheckboxes = true;
      this.IcapOrProxy = AppSettings.urlChoices[0];
    } else if (this.configForm.get('load_type').value == AppSettings.loadTypes[1]) {
      this.enableCheckboxes = false;
      this.IcapOrProxy = AppSettings.urlChoices[1];
    }
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
    return this.showStoppedAlert ? 'show' : 'hide';
  }
  get cookiesExist(): boolean {
    return AppSettings.cookiesExist;
  }
  get loadTypes() {
    return AppSettings.loadTypes;
  }

  processResponse(response: object) {
    console.log("I got stack name " + response['stack_name']);
    this.responseReceived = true;

    //pack up form data and response URL, fire form submitted event and send to subscribers
    const dataPackage: FormDataPackage = { form: this.configForm, grafanaUrlResponse: response['url'], stackName: response['stack_name'] }
    this.sharedService.sendSubmitEvent(dataPackage);
    this.generatingLoad = false;
  }

  resetForm() {
    this.configForm.reset();
    this.initializeForm();
    this.onLoadTypeChange();
    this.hideSubmitMessages = true;
  }

  postFormToServer(formData: FormData) {
    this.http.post('http://127.0.0.1:5000/', formData).subscribe(response => this.processResponse(response));
  }

  postStopRequestToServer(formData: FormData) {
    this.http.post('http://127.0.0.1:5000/', formData).toPromise();
  }

  onSubmit(): void {
    this.setFormDefaults();
    this.hideSubmitMessages = false;
    if (this.configForm.valid) {
      //append the necessary data to formData and send to Flask server
      const formData = new FormData();
      formData.append("button", "generate_load");
      formData.append('form', JSON.stringify(this.configForm.getRawValue()));
      this.postFormToServer(formData);
      this.submitted = true;
      this.generatingLoad = true;
    }
  }

  setFormDefaults() {
    //if user enters less that 1 total_users, default to 1. Otherwise if no input, default to 25.
    if(this.total_users.value === '') {
      this.total_users.setValue('25');
    } else if (this.total_users.value < 1) {
      this.total_users.setValue('1');
    } 

    //if user enters no ramp up time, default is 300.
    if(this.ramp_up_time.value === '') {
      this.ramp_up_time.setValue('300');
    }

    //if user enters no duration, default is 900. If they enter a less than 60 second duration, default to 60.
    if(this.duration.value === '') {
      this.duration.setValue('900');
    }
    else if (this.duration.value < 60) {
      this.duration.setValue('60');
    }

    if(this.prefix.value === '') {
      this.prefix.setValue('demo');
    }
  }

  onStopTests() {
    const formData = new FormData();
    formData.append("button", "stop_tests");
    this.postStopRequestToServer(formData);
    this.toggleTerminationAlert();
    this.submitted = false;
    this.responseReceived = false;
    setTimeout(() => this.toggleTerminationAlert(), 3000);
    this.sharedService.sendStopAllTestsEvent();
  }

  toggleTerminationAlert() {
    this.showStoppedAlert = !this.showStoppedAlert;
  }
}
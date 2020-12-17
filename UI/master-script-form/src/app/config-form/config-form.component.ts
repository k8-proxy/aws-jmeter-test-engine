import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, FormControl, Validators } from '@angular/forms'
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Title } from '@angular/platform-browser';
import { ConfigFormValidators } from '../common/Validators/ConfigFormValidators';
import { animate, state, style, transition, trigger } from '@angular/animations';
import { CookieService } from 'ngx-cookie-service';

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
  regions: string[] = ['eu-west-1', 'eu-east-1', 'us-west-1', 'eu-west-2'];
  loadTypes: string[] = ['Direct', 'Proxy'];
  urlChoices: string[] = ["ICAP Server Endpoint URL*", "Proxy IP Address*"];
  configForm: FormGroup;
  fileToUpload: File = null;
  submitted = false;
  responseUrl = '';
  responseReceived = false;
  portDefault = '443';
  enableCheckboxes = true;
  enableIgnoreErrorCheckbox = true;
  IcapOrProxy = this.urlChoices[0];
  showStoppedAlert = false;
  hideSubmitMessages = false;
  public popoverTitle: string = "Please Confirm";
  public popoverMessage: string = "Are you sure you wish to stop all load?";
  public confirmClicked: boolean = false;
  public cancelClicked: boolean = false;

  constructor(private fb: FormBuilder, private readonly http: HttpClient, private router: Router, private titleService: Title, public cookieService: CookieService) { }

  ngOnInit(): void {
    this.initializeForm();
    this.setTitle("ICAP Performance Test");
    console.log(this.cookieService.getAll());
    this.configForm.valueChanges.subscribe((data) => {
      this.hideSubmitMessages = true;
    });
    setInterval(() => { this.getCookies(); }, 1000); //used to refresh list and remove expired tests.
    
  }

  setTitle(newTitle: string) {
    this.titleService.setTitle(newTitle);
  }

  initializeForm(): void {
    this.configForm = this.fb.group({
      total_users: new FormControl('', [Validators.pattern(/^(?=.*\d)[\d ]+$/), ConfigFormValidators.cannotContainSpaces, ConfigFormValidators.hasNumberLimit]),
      duration: new FormControl('', [Validators.pattern(/^(?=.*\d)[\d ]+$/), ConfigFormValidators.cannotContainSpaces]),
      ramp_up_time: new FormControl('', [Validators.pattern(/^(?=.*\d)[\d ]+$/), ConfigFormValidators.cannotContainSpaces]),
      load_type: this.loadTypes[0],
      icap_endpoint_url: new FormControl('', [Validators.required, ConfigFormValidators.cannotContainSpaces]),
      prefix: new FormControl('', [ConfigFormValidators.cannotContainSpaces]),
      enable_tls: true,
      tls_ignore_error: true,
      port: new FormControl('', [Validators.pattern(/^(?=.*\d)[\d ]+$/), ConfigFormValidators.cannotContainSpaces]),
    });
  }

  onLoadTypeChange() {
    //if direct, else proxy
    if (this.configForm.get('load_type').value == this.loadTypes[0]) {
      this.enableCheckboxes = true;
      this.IcapOrProxy = this.urlChoices[0];
    } else if (this.configForm.get('load_type').value == this.loadTypes[1]) {
      this.enableCheckboxes = false;
      this.IcapOrProxy = this.urlChoices[1];
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

  get getUrl() {
    return this.responseUrl;
  }

  get animState() {
    return this.showStoppedAlert ? 'show' : 'hide';
  }

  onFileChange(files: FileList) {
    this.fileToUpload = files.item(0);
  }

  processResponse(response: object) {
    this.responseUrl = response.toString();
    this.responseReceived = true;
    this.storeTestAsCookie(this.responseUrl);
  }

  

  storeTestAsCookie(dashboardUrl) {
    let currentTime = new Date();
    let expireTime = new Date(currentTime.getTime() + this.duration.value * 1000);
    let testTitle = this.IcapOrProxy === this.urlChoices[0] ? "ICAP Live Performance Dashboard" : "Proxy Site Live Performance Dashboard";
    let key = this.prefix.value === null ? testTitle : this.prefix.value + " " + testTitle;
    this.cookieService.set(key, dashboardUrl, expireTime);
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
      if (this.fileToUpload) {
        formData.append('file', this.fileToUpload, this.fileToUpload.name);
      }
      formData.append('form', JSON.stringify(this.configForm.getRawValue()));
      this.postFormToServer(formData);
      this.submitted = true;
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
    this.cookieService.deleteAll();
    this.toggleTerminationAlert();
    this.submitted = false;
    this.responseReceived = false;
    setTimeout(() => this.toggleTerminationAlert(), 3000);
  }

  toggleTerminationAlert() {
    this.showStoppedAlert = !this.showStoppedAlert;
  }

  cookiesExist(): boolean {
    return !(Object.keys(this.cookieService.getAll()).length === 0 && this.cookieService.getAll().constructor === Object);
  }

  getCookies() {
    return this.cookieService.getAll();
  }
}

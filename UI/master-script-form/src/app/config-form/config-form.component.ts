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
      state('show', style({opacity: 1})),
      state('show', style({opacity: 0})),
      transition('show => hide', animate('150ms ease-out')),
      transition('hide => show', animate('400ms ease-in'))
    ])
  ]
})
export class ConfigFormComponent implements OnInit {
  regions: string[] = ['eu-west-1', 'eu-east-1', 'us-west-1', 'eu-west-2'];
  loadTypes: string[] = ['Direct', 'Proxy'];
  configForm: FormGroup;
  fileToUpload: File = null;
  submitted = false;
  responseUrl = '';
  responseReceived = false;
  portDefault = '443';
  enableCheckboxes = true;
  enableIgnoreErrorCheckbox = true;
  hideStoppedAlert = true;
  public popoverTitle: string = "Please Confirm";
  public popoverMessage: string = "Are you sure you wish to stop tests?";
  public confirmClicked: boolean = false;
  public cancelClicked: boolean = false;
  cookiesMap;

  constructor(private fb: FormBuilder, private readonly http: HttpClient, private router: Router, private titleService: Title, public cookieService: CookieService) { }

  ngOnInit(): void {
    this.initializeForm();
    this.setTitle("ICAP Performance Test");
    this.populateCookiesMap();
    console.log(this.cookieService.getAll())
  }

  setTitle(newTitle: string) {
    this.titleService.setTitle(newTitle);
  }

  populateCookiesMap() {
    this.cookiesMap = this.cookieService.getAll();
  }

  initializeForm(): void {
    this.configForm = this.fb.group({
      total_users: new FormControl('', [Validators.pattern(/^(?=.*\d)[\d ]+$/), ConfigFormValidators.cannotContainSpaces]),
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
    if (this.configForm.get('load_type').value == this.loadTypes[0]) {
      this.enableCheckboxes = true;
    } else if (this.configForm.get('load_type').value == this.loadTypes[1]) {
      this.enableCheckboxes = false;
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
    return this.hideStoppedAlert ? 'show' : 'hide';
  }

  onFileChange(files: FileList) {
    this.fileToUpload = files.item(0);
  }

  processResponse(response: object) {
    this.responseUrl = response.toString();
    this.responseReceived = true;
    this.storeTest(this.responseUrl);
    this.resetForm();
  }

  storeTest(url) {
    var currentTime = new Date();
    var expireTime = new Date(currentTime.getTime() + this.duration.value*1000 + this.ramp_up_time.value*1000);
    let key = this.prefix.value === null ? "ICAP Live Performance Dashboard" : this.prefix.value + " ICAP Live Performance Dashboard";
    this.cookieService.set(key, url, expireTime);
    // console.log("created cookie at " + new Date(currentTime.getTime()) + ". It will expire at " + expireTime + ". Contents are (key,val): (" + this.prefix.value + ", " + url + ")");
    // console.log("Attempting to actually retrieve cookie gets us: " + this.cookieService.get(this.prefix.value));
  }

  resetForm() {
    var oldLoadType = this.configForm.get('load_type').value;
    var oldTls = this.configForm.get('enable_tls').value;
    var oldTlsIgnoreError = this.configForm.get('tls_ignore_error').value;
    this.configForm.reset();
    this.configForm.get('load_type').setValue(oldLoadType);
    this.configForm.get('enable_tls').setValue(oldTls);
    this.configForm.get('tls_ignore_error').setValue(oldTlsIgnoreError);

  }

  postFormToServer(formData: FormData) {
    this.http.post('http://127.0.0.1:5000/', formData).subscribe(response => this.processResponse(response));
  }

  postStopRequestToServer(formData: FormData) {
    this.http.post('http://127.0.0.1:5000/', formData).toPromise();
  }

  onSubmit(): void {
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
    this.hideStoppedAlert = !this.hideStoppedAlert;
  }

  cookiesExist(): boolean {
    return !(Object.keys(this.cookieService.getAll()).length === 0 && this.cookieService.getAll().constructor === Object);
  }

  getCookies() {
    return this.cookieService.getAll()
  }
}

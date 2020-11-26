import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, FormControl, Validators } from '@angular/forms'
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'config-form',
  templateUrl: './config-form.component.html',
  styleUrls: ['./config-form.component.css']
})
export class ConfigFormComponent implements OnInit {
  regions: string[] = ['eu-west-1', 'eu-east-1', 'us-west-1', 'eu-west-2'];
  loadTypes: string[] = ['Direct', 'Proxy'];
  configForm: FormGroup;
  fileToUpload: File = null;
  submitted = false;
  responseUrl='';
  responseReceived = false;

  constructor(private fb: FormBuilder, private readonly http: HttpClient, private router: Router) { }

  ngOnInit(): void {
    this.initializeForm();
  }

  initializeForm(): void {
    this.configForm = this.fb.group({
      total_users: new FormControl('', Validators.pattern(/^[0-9]\d*$/)),
      duration: new FormControl('', Validators.pattern(/^[0-9]\d*$/)),
      ramp_up_time: new FormControl('', Validators.pattern(/^[0-9]\d*$/)),
      load_type: this.loadTypes[0],
      icap_endpoint_url: new FormControl('', Validators.required),
      prefix: '',
      test_data_file: ''
    });
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
  get test_data_file() {
    return this.configForm.get('test_data_file');
  }

  get isValid () {
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

  onFileChange(files: FileList) {
    this.fileToUpload = files.item(0);
  }

  processResponse(response: object) {
    this.responseUrl = response.toString();
    this.responseReceived = true;
  }

  resetForm() {
    var oldLoadType = this.configForm.get('load_type').value;
    this.configForm.reset();
    this.configForm.get('load_type').setValue(oldLoadType);
  }

  onSubmit(): void {
    if (this.configForm.valid) {
      //append the necessary data to formData and send to Flask server
      const formData = new FormData();
      if (this.fileToUpload) {
        formData.append('file', this.fileToUpload, this.fileToUpload.name);
      } 
      formData.append('form', JSON.stringify(this.configForm.getRawValue()));
      this.http.post('http://127.0.0.1:5000/', formData).subscribe(response => this.processResponse(response));
      this.submitted = true;
      this.resetForm();
    } 
  }
}

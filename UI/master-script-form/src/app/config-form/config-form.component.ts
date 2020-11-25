import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, FormArray, FormControl, Validators } from '@angular/forms'
import { HttpClient, HttpHeaders } from '@angular/common/http';

@Component({
  selector: 'config-form',
  templateUrl: './config-form.component.html',
  styleUrls: ['./config-form.component.css']
})
export class ConfigFormComponent implements OnInit {
  regions: string[] = ['eu-west-1', 'eu-east-1', 'us-west-1', 'eu-west-2'];
  configForm: FormGroup;
  fileToUpload: File = null;

  constructor(private fb: FormBuilder, private readonly http: HttpClient) { }

  ngOnInit(): void {
    this.initializeForm();
  }

  initializeForm(): void {
    this.configForm = this.fb.group({
      total_users: '',
      duration:'',
      ramp_up_time: '',
      icap_endpoint_url: '',
      prefix: '',
      test_data_file: '',
      preserve_stack: false,
      exclude_dashboard: false
    });
  }

  get files(): FormArray {
    return this.configForm.get('uploadFile') as FormArray;
  }

  deleteFile() {
    console.log("deleting file");
  }

  onFileChange(files: FileList) {
    this.fileToUpload = files.item(0);
  }
  

  selectRegion(e: Event) {
    console.log("region selected: " + this.configForm.get('region').value);
  }

  onSubmit(): void {
    
    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type':  'application/json'
      })
    };

    //append the necessary data to formData and send to Flask server
    const formData = new FormData();
    formData.append('form', JSON.stringify(this.configForm.getRawValue()));
    formData.append('file', this.fileToUpload, this.fileToUpload.name);
    this.http.post('http://127.0.0.1:5000/', formData).subscribe();
  }
}

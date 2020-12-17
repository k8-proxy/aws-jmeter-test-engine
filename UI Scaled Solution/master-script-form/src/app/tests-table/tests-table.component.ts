import { Component, OnInit } from '@angular/core';
import { FormDataPackage, SharedService } from './../common/services/shared.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'tests-table',
  templateUrl: './tests-table.component.html',
  styleUrls: ['./tests-table.component.css']
})
export class TestsTableComponent implements OnInit {
  formSubmittedSubscription: Subscription;
  constructor(private sharedService: SharedService) { 
    this.formSubmittedSubscription = this.sharedService.getSubmitEvent().subscribe((str)=>this.onFormSubmitted(str));
  }

  ngOnInit(): void {
    console.log("initiated");
  }

  onFormSubmitted(formDataPack: FormDataPackage) {
    console.log("Hit");
    console.log(formDataPack.form.get('prefix').value);
    console.log(formDataPack.grafanaUrlResponse);
  }

}

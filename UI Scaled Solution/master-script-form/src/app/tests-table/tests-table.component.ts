import { AppSettings } from './../common/app settings/AppSettings';
import { Component, OnInit, ViewChild } from '@angular/core';
import { FormDataPackage, SharedService, testRowElement } from './../common/services/shared.service';
import { Subscription } from 'rxjs';
import { CookieService } from 'ngx-cookie-service';
import { MatTable } from '@angular/material/table';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'tests-table',
  templateUrl: './tests-table.component.html',
  styleUrls: ['./tests-table.component.css']
})

export class TestsTableComponent implements OnInit {

  @ViewChild('testTable') table: MatTable<Element>;
  
  formSubmittedSubscription: Subscription;
  testDatasourceReadySubscription: Subscription;
  dataSource: testRowElement[] = [];
  displayedColumns: string[] = ['testName', 'totalUsers', 'duration', 'startTime', 'endTime', 'stopTestButton']; //add and remove columns here before adding/remove in html
  testsExist: boolean;

  public popoverTitle: string = "Please Confirm";
  public popoverMessage: string = "Are you sure you wish to stop this test?";
  constructor(private readonly http: HttpClient, private sharedService: SharedService, private cookieService: CookieService) {
    
  }

  ngOnInit(): void {
    this.formSubmittedSubscription = this.sharedService.getSubmitEvent().subscribe((formDataPack) => this.onFormSubmitted(formDataPack));
    this.testDatasourceReadySubscription = this.sharedService.getResultsDatasourceReadyEvent().subscribe(() => this.onDataSourceReady());
  }

  onDataSourceReady() {
    this.dataSource = this.sharedService.testDataSource;
    this.testsExist = this.dataSource.length === 0 ? false : true;
    this.table.renderRows();
  }

  onFormSubmitted(formDataPack: FormDataPackage) {

  }

  stopTestButton(prefix: string) {
    let cookieJson = JSON.parse(this.cookieService.get(prefix));
    let stackToDelete = cookieJson.stackName;
    this.cookieService.delete(prefix);
    this.postStopSingleTestToServer(stackToDelete);
    this.table.renderRows();
    this.sharedService.sendStopSingleEvent(prefix);
  }

  postStopSingleTestToServer(stackName: string) {
    const formData = new FormData();
    formData.append("button", "stop_individual_test");
    formData.append("stack", stackName);
    this.http.post('http://127.0.0.1:5000/', formData).toPromise();
  }
}

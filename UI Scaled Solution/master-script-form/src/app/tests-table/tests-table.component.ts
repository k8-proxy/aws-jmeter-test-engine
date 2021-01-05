import { FormGroup } from '@angular/forms';
import { AppSettings } from './../common/app settings/AppSettings';
import { Component, OnInit, ViewChild } from '@angular/core';
import { FormDataPackage, SharedService } from './../common/services/shared.service';
import { Subscription } from 'rxjs';
import { CookieService } from 'ngx-cookie-service';
import { MatTable } from '@angular/material/table';
import { HttpClient } from '@angular/common/http';


export interface TestRowElement {
  position: number;
  prefix: string; //prefix stored to target tests when stopping them individually
  stackName: string; //gotten from back end, used to target stacks for deletion
  testName: string; //prefix plus name that depends on type of load
  totalUsers: number;
  duration: number;
  startTime: Date;
  endTime: Date;
  dashboardUrl: string;
}

export interface TestRowElement2 {
  //"startTime": str(start_time), "RunID": i, "RunTime": i, "RampUp": i, "Threads": i,
  // "TotalRequests": i, "SuccessfulRequests": i, "FailedRequests": i, "AverageResponseTime": i,
  // "MaxConcurrentPods": i
  startTime: Date;
  runID: string; 
  runTime: string; 
  rampUp: string; 
  threads: number;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  maxConcurrentPods: number;
  dashboardUrl: string;
}

@Component({
  selector: 'tests-table',
  templateUrl: './tests-table.component.html',
  styleUrls: ['./tests-table.component.css']
})

export class TestsTableComponent implements OnInit {

  @ViewChild('testTable') table: MatTable<Element>;
  
  formSubmittedSubscription: Subscription;
  

  dataSource: TestRowElement[] = [];
  dataSource2: TestRowElement2[] = [];
  // displayedColumns: string[] = ['testName', 'totalUsers', 'duration', 'startTime', 'endTime', 'stopTestButton']; //add and remove columns here before adding/remove in html
  displayedColumns: string[] = ['startTime', 'runID', 'runTime', 'rampUp', 'threads', 'totalRequests', 'successfulRequests', 'failedRequests', 'averageResponseTime', 'maxConcurrentPods']; //add and remove columns here before adding/remove in html
  testsExist: boolean;

  public popoverTitle: string = "Please Confirm";
  public popoverMessage: string = "Are you sure you wish to stop this test?";
  constructor(private readonly http: HttpClient, private sharedService: SharedService, private cookieService: CookieService) {
    this.formSubmittedSubscription = this.sharedService.getSubmitEvent().subscribe((formDataPack) => this.onFormSubmitted(formDataPack));
  }

  ngOnInit(): void {
    // this.getTestPrefixList();
    // this.updateCookiesExistAndPrefixSet();
    // setInterval(() => { this.updateCookiesExistAndPrefixSet(); }, 1000); //used to refresh list and remove expired tests.
    // this.generateDatasourceArray();
    this.getTestsFromDatabase();
  }

  getTestsFromDatabase() {
    this.http.get('http://127.0.0.1:5000/').subscribe(response => this.processRetrievedTestData(response), (err) => { this.onError(err) });
  }

  processRetrievedTestData(response) {
    console.log("got response back:")
    console.log(response);
    //this gets all the columns that will be used for display
    // for (const x of response.series[0]['columns']) {
    //   console.log(x);
    // }


    if (response.series[0]['values'].length === 0) {
      this.testsExist = false;
    } else {
      this.testsExist = true;
    }
    this.generateDatasourceArray2(response.series[0]['values'], response.series[0]['columns']);
  }

  onError(error) {
    console.log("got error")
    console.log(error);
  }

  onFormSubmitted(formDataPack: FormDataPackage) {
    this.storeTestAsCookie(formDataPack.formAsJsonString, formDataPack.grafanaUrlResponse, formDataPack.stackName);
  }

  storeTestAsCookie(formJsonString: string, dashboardUrl: string, stackName: string) {
    AppSettings.addingPrefix = true;
    let formAsJson = JSON.parse(formJsonString);

    let currentTime = new Date();
    let expireTime = new Date(currentTime.getTime() + formAsJson['duration'] * 1000);
    let prefix = formAsJson['prefix'];

    //convert the form to JSON to store as cookie. Add desired data to JSON (dashboard URL, expire time)
    formAsJson['dashboardUrl'] = dashboardUrl;
    formAsJson['startTime'] = currentTime;
    formAsJson['endTime'] = expireTime;
    formAsJson['stackName'] = stackName;

    this.cookieService.set(prefix, JSON.stringify(formAsJson), expireTime);
    this.generateDatasourceArray();
    AppSettings.addingPrefix = false;
  }

  generateDatasourceArray() {
    this.dataSource.length = 0;
    let cookieDict = this.getCookies();
    let posCounter = 0;
    for (const key in cookieDict) {
      posCounter++;
      if (cookieDict.hasOwnProperty(key)) {
        let cookie = cookieDict[key];
        let dataJson = JSON.parse(cookie);
        this.dataSource.push(this.buildDataRow(dataJson, posCounter));
      }
    }
  }

  buildDataRow(dataJson, counter): TestRowElement {
    let _testName = this.buildTestName(dataJson['prefix'], dataJson['load_type']);
    let pos = counter;
    let _totalUsers = dataJson['total_users'];
    let _duration = dataJson['duration'];
    let _startTime = dataJson['startTime'];
    let _endTime = dataJson['endTime'];
    let _dashboardUrl = dataJson['dashboardUrl'];
    let _prefix = dataJson['prefix'];
    let _stackName = dataJson['stackName'];
    let row: TestRowElement = {
      position: pos,
      prefix: _prefix,
      stackName: _stackName,
      testName: _testName,
      totalUsers: _totalUsers,
      duration: _duration,
      startTime: new Date(_startTime),
      endTime:  new Date(_endTime),
      dashboardUrl: _dashboardUrl
    };
    return row;
  }

  generateDatasourceArray2(arrayOfValueArrays, columnArray) {
    this.dataSource2.length = 0;
    for (const arr of arrayOfValueArrays) {
      // console.log(arr);
      this.dataSource2.push(this.buildDataRow2(arr, columnArray));
    }
    this.table.renderRows();
  }

  buildDataRow2(dataRow, columnArray): TestRowElement2 {
    let _startTime = dataRow[this.getDataItemIndex('StartTime', columnArray)];
    let _runID = dataRow[this.getDataItemIndex('RunID', columnArray)]; 
    let _runTime = dataRow[this.getDataItemIndex('RunTime', columnArray)]; 
    let _rampUp = dataRow[this.getDataItemIndex('RampUp', columnArray)]; 
    let _threads = dataRow[this.getDataItemIndex('Threads', columnArray)];
    let _totalRequests = dataRow[this.getDataItemIndex('TotalRequests', columnArray)];
    let _successfulRequests = dataRow[this.getDataItemIndex('SuccessfulRequests', columnArray)];
    let _failedRequests = dataRow[this.getDataItemIndex('FailedRequests', columnArray)];
    let _averageResponseTime = dataRow[this.getDataItemIndex('AverageResponseTime', columnArray)];
    let _maxConcurrentPods = dataRow[this.getDataItemIndex('MaxConcurrentPods', columnArray)];
    let _dashboardUrl = '';
    let row: TestRowElement2 = {
      startTime: new Date(_startTime),
      runID: _runID, 
      runTime: _runTime, 
      rampUp: _rampUp, 
      threads: _threads,
      totalRequests: _totalRequests,
      successfulRequests: _successfulRequests,
      failedRequests: _failedRequests,
      averageResponseTime: _averageResponseTime,
      maxConcurrentPods: _maxConcurrentPods,
      dashboardUrl: _dashboardUrl
    };
    return row;
  }

  //used because a row's data fields obtained from database is not in the order used when inserting the row
  getDataItemIndex(field: string, columnRow: string[]) {
    let counter = 0;
    for(const f of columnRow) {
      if(f === field) {
        return counter;
      } else {
        counter++;
      }
    }
  }

  buildTestName(prefix: string, loadType: string): string {
    let name = prefix;
    if (loadType === "Direct") {
      name += " ICAP Live Performance Dashboard"
    } else if (loadType === "Proxy") {
      name += " Proxy Site Live Performance Dashboard"
    }
    return name;
  }

  stopTestButton(prefix: string) {
    let cookieJson = JSON.parse(this.cookieService.get(prefix));
    let stackToDelete = cookieJson.stackName;
    this.cookieService.delete(prefix);
    this.postStopSingleTestToServer(stackToDelete);
    this.generateDatasourceArray();
    this.table.renderRows();
    this.updateCookiesExistAndPrefixSet();
    this.sharedService.sendStopSingleEvent(prefix);
  }

  postStopSingleTestToServer(stackName: string) {
    const formData = new FormData();
    formData.append("button", "stop_individual_test");
    formData.append("stack", stackName);
    this.http.post('http://127.0.0.1:5000/', formData).toPromise();
  }

  updateCookiesExistAndPrefixSet() {
    AppSettings.cookiesExist = !(Object.keys(this.cookieService.getAll()).length === 0 && this.cookieService.getAll().constructor === Object);
    this.checkForObsoletePrefixes();
  }

  getTestPrefixList() {
    //Insert any prefixes that are not already in our test prefix list.
    let cookieArray = this.getCookies();
    for(let key in cookieArray) {
      if(!AppSettings.testPrefixSet.has(key)) {
        AppSettings.testPrefixSet.add(key);
        console.log("added key " + key);
      } 
    }
  }

  checkForObsoletePrefixes() {
    //remove any obsolete prefixes.
    let cookieArray = this.getCookies();
    AppSettings.testPrefixSet.forEach((item) => {
      if (!(item in cookieArray) && !AppSettings.addingPrefix) 
      {
        AppSettings.testPrefixSet.delete(item);
      }
    });
  }

  get cookiesExist() {
    return AppSettings.cookiesExist;
  }

  getCookies() {
    return this.cookieService.getAll();
  }
}

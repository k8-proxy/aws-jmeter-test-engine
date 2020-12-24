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

@Component({
  selector: 'tests-table',
  templateUrl: './tests-table.component.html',
  styleUrls: ['./tests-table.component.css']
})

export class TestsTableComponent implements OnInit {

  @ViewChild('testTable') table: MatTable<Element>;
  
  formSubmittedSubscription: Subscription;
  

  dataSource: TestRowElement[] = [];
  displayedColumns: string[] = ['testName', 'totalUsers', 'duration', 'startTime', 'endTime', 'stopTestButton']; //add and remove columns here before adding/remove in html

  public popoverTitle: string = "Please Confirm";
  public popoverMessage: string = "Are you sure you wish to stop this test?";

  constructor(private readonly http: HttpClient, private sharedService: SharedService, private cookieService: CookieService) {
    this.formSubmittedSubscription = this.sharedService.getSubmitEvent().subscribe((formDataPack) => this.onFormSubmitted(formDataPack));
  }

  ngOnInit(): void {
    this.getTestPrefixList();
    this.updateCookiesExistAndPrefixSet();
    setInterval(() => { this.updateCookiesExistAndPrefixSet(); }, 1000); //used to refresh list and remove expired tests.
    this.generateDatasourceArray();
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
    this.table.renderRows();
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

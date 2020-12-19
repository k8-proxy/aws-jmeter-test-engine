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
  testName: string; //prefix plus name that depends on type of load
  totalUsers: number;
  duration: number;
  expireTime: string;
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
  testsStoppedSubscription: Subscription;

  dataSource: TestRowElement[] = [];
  displayedColumns: string[] = ['testName', 'totalUsers', 'duration', 'expireTime', 'stopTestButton']; //add and remove columns here before adding/remove in html

  constructor(private readonly http: HttpClient, private sharedService: SharedService, private cookieService: CookieService) {
    this.formSubmittedSubscription = this.sharedService.getSubmitEvent().subscribe((formDataPack) => this.onFormSubmitted(formDataPack));
    this.formSubmittedSubscription = this.sharedService.getStopAllTestsEvent().subscribe(() => this.onStopTests());
  }

  ngOnInit(): void {
    this.updateCookiesExist();
    setInterval(() => { this.updateCookiesExist(); }, 1000); //used to refresh list and remove expired tests.
    this.generateDatasourceArray();
  }

  onFormSubmitted(formDataPack: FormDataPackage) {
    this.storeTestAsCookie(formDataPack.form, formDataPack.grafanaUrlResponse);
  }

  storeTestAsCookie(form: FormGroup, dashboardUrl: string) {
    let currentTime = new Date();
    let expireTime = new Date(currentTime.getTime() + form.get('duration').value * 1000);
    let prefix = form.get('prefix').value;

    //convert the form to JSON to store as cookie. Add desired data to JSON (dashboard URL, expire time)
    let formAsJson = JSON.parse(JSON.stringify(form.getRawValue()));
    formAsJson['dashboardUrl'] = dashboardUrl;
    formAsJson['expireTime'] = expireTime;

    this.cookieService.set(prefix, JSON.stringify(formAsJson), expireTime);
    this.generateDatasourceArray();
    this.table.renderRows();
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
    let _expireTime = dataJson['expireTime'];
    let _dashboardUrl = dataJson['dashboardUrl'];
    let _prefix = dataJson['prefix'];
    let row: TestRowElement = {
      position: pos,
      prefix: _prefix,
      testName: _testName,
      totalUsers: _totalUsers,
      duration: _duration,
      expireTime: _expireTime,
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

  onStopTests() {
    this.cookieService.deleteAll();
    this.generateDatasourceArray();
    this.table.renderRows();
  }

  stopTestButton(prefix: string) {
    this.cookieService.delete(prefix);
    this.postStopSingleTestToServer(prefix);
    this.generateDatasourceArray();
    this.table.renderRows();
  }

  postStopSingleTestToServer(prefix: string) {
    const formData = new FormData();
    formData.append("button", "stop_individual_test");
    formData.append("prefix", prefix);
    this.http.post('http://127.0.0.1:5000/', formData).toPromise();
  }

  updateCookiesExist() {
    AppSettings.cookiesExist = !(Object.keys(this.cookieService.getAll()).length === 0 && this.cookieService.getAll().constructor === Object);
  }

  get cookiesExist() {
    return AppSettings.cookiesExist;
  }

  getCookies() {
    return this.cookieService.getAll();
  }
}

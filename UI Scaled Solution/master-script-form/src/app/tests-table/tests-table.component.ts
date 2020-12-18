import { FormGroup } from '@angular/forms';
import { AppSettings } from './../common/app settings/AppSettings';
import { Component, OnInit } from '@angular/core';
import { FormDataPackage, SharedService } from './../common/services/shared.service';
import { Subscription } from 'rxjs';
import { CookieService } from 'ngx-cookie-service';

@Component({
  selector: 'tests-table',
  templateUrl: './tests-table.component.html',
  styleUrls: ['./tests-table.component.css']
})
export class TestsTableComponent implements OnInit {
  
  formSubmittedSubscription: Subscription;
  testsStoppedSubscription: Subscription;

  constructor(private sharedService: SharedService, private cookieService: CookieService) { 
    this.formSubmittedSubscription = this.sharedService.getSubmitEvent().subscribe((formDataPack)=>this.onFormSubmitted(formDataPack));
    this.formSubmittedSubscription = this.sharedService.getStopTestsEvent().subscribe(()=>this.onStopTests());
  }

  ngOnInit(): void {
    this.updateCookiesExist();
    setInterval(() => { this.updateCookiesExist(); }, 1000); //used to refresh list and remove expired tests.
  }

  onFormSubmitted(formDataPack: FormDataPackage) {
    this.storeTestAsCookie(formDataPack.form, formDataPack.grafanaUrlResponse);
  }

  storeTestAsCookie(form: FormGroup, dashboardUrl: string) {
    let currentTime = new Date();
    let expireTime = new Date(currentTime.getTime() + form.get('duration').value * 1000);
    let testTitle = form.get('load_type').value === AppSettings.urlChoices[0] ? "ICAP Live Performance Dashboard" : "Proxy Site Live Performance Dashboard";
    let prefix = form.get('prefix').value;
    let key = prefix === null ? testTitle : prefix + " " + testTitle;
    this.cookieService.set(key, dashboardUrl, expireTime);
  }

  onStopTests() {
    this.cookieService.deleteAll();
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

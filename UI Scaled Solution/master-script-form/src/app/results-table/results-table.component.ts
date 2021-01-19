import { AppSettings } from './../common/app settings/AppSettings';
import { Component, OnInit, ViewChild } from '@angular/core';
import { FormDataPackage, SharedService, ResultsRowElement } from './../common/services/shared.service';
import { Subscription } from 'rxjs';
import { MatTable } from '@angular/material/table';

@Component({
  selector: 'results-table',
  templateUrl: './results-table.component.html',
  styleUrls: ['./results-table.component.css']
})

export class ResultsTableComponent implements OnInit {

  @ViewChild('testTable') table: MatTable<Element>;

  formSubmittedSubscription: Subscription;
  resultsDatasourceReadySubscription: Subscription;


  dataSource: ResultsRowElement[] = [];
  displayedColumns: string[] = ['testName', 'startTime', 'duration', 'totalRequests', 'successfulRequests', 'failedRequests', 'averageResponseTime']; //add and remove columns here before adding/remove in html
  testsExist: boolean;

  constructor(private sharedService: SharedService) {
    
  }

  ngOnInit(): void {
    this.formSubmittedSubscription = this.sharedService.getSubmitEvent().subscribe((formDataPack) => this.onFormSubmitted(formDataPack));
    this.resultsDatasourceReadySubscription = this.sharedService.getResultsDatasourceReadyEvent().subscribe(() => this.onDataSourceReady());
  }

  onFormSubmitted(formDataPack) {
    
  }

  onDataSourceReady() {
    this.dataSource = this.sharedService.resultsDataSource;
    this.testsExist = this.dataSource.length === 0 ? false : true;
    this.table.renderRows();
  }

  processRetrievedTestData(response) {
    console.log("got response back:")
    console.log(response);

    if (response.series[0]['values'].length === 0) {
      this.testsExist = false;
    } else {
      this.testsExist = true;
    }
  }

  onError(error) {
    console.log(error);
  }
  //used because a row's data fields obtained from database is not in the order used when inserting the row
  getDataItemIndex(field: string, columnRow: string[]) {
    let counter = 0;
    for (const f of columnRow) {
      if (f === field) {
        return counter;
      } else {
        counter++;
      }
    }
  }
}

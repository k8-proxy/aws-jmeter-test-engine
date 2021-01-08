/*
    This service is responsible for querying the database and storing retrieved data for use in other componenets
*/

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, Subject } from 'rxjs';

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

export interface ResultsRowElement {
    testName: string;
    startTime: Date;
    runId: string;
    runTime: string;
    rampUp: string;
    threads: number;
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    averageResponseTime: number;
    maxConcurrentPods: number;
    dashboardUrl: string;
    status: string;
}

export interface TestInfo {
    runId: string;
    duration: number;
    grafanaUid: string;
}

@Injectable({
    providedIn: 'root'
})

export class SharedService {
    private submitSubject = new Subject<any>();
    private stopAllSubject = new Subject<any>();
    private stopSingleTestSubject = new Subject<any>();
    private resultsDataSourceReadySubject = new Subject<any>();
    public resultsDataSource: ResultsRowElement[] = [];
    public testInfoArray: TestInfo[] = [];
    public grafanaUrl: string = "";

    constructor(private readonly http: HttpClient) {
        this.init();
    }

    init(): void {
        this.getTestsFromDatabase();
        // setInterval(() => { console.log("service running") }, 30000); //used to refresh list and remove expired tests.
    }

    getTestsFromDatabase() {
        this.http.get('http://127.0.0.1:5000/').subscribe(response => this.processRetrievedTestData(response), (err) => { this.onError(err) });
    }

    processRetrievedTestData(response) {
        this.grafanaUrl = response[2];
        this.generateDatabaseArrays(response);
    }

    onError(error) {
        console.log(error);
    }

    buildResultsDataRow(dataRow, columnArray): ResultsRowElement {
        let _testName = this.buildTestName(dataRow[this.getDataItemIndex('Prefix', columnArray)], dataRow[this.getDataItemIndex('LoadType', columnArray)]);
        let _startTime = new Date(dataRow[this.getDataItemIndex('StartTime', columnArray)]);
        let _runId = dataRow[this.getDataItemIndex('RunId', columnArray)];
        let _runTime = dataRow[this.getDataItemIndex('RunTime', columnArray)];
        let _rampUp = dataRow[this.getDataItemIndex('RampUp', columnArray)];
        let _threads = dataRow[this.getDataItemIndex('Threads', columnArray)];
        let _totalRequests = dataRow[this.getDataItemIndex('TotalRequests', columnArray)];
        let _successfulRequests = dataRow[this.getDataItemIndex('SuccessfulRequests', columnArray)];
        let _failedRequests = dataRow[this.getDataItemIndex('FailedRequests', columnArray)];
        let _averageResponseTime = dataRow[this.getDataItemIndex('AverageResponseTime', columnArray)];
        let _maxConcurrentPods = dataRow[this.getDataItemIndex('MaxConcurrentPods', columnArray)];
        let grafanaUid = this.lookUpGrafanaUid(_runId);
        let _dashboardUrl = this.buildGrafanaLink(dataRow[this.getDataItemIndex('Prefix', columnArray)], dataRow[this.getDataItemIndex('LoadType', columnArray)], _startTime, _runTime, grafanaUid);
        let _status = dataRow[this.getDataItemIndex('Status', columnArray)]
        let row: ResultsRowElement = {
            testName: _testName,
            startTime: _startTime,
            runId: _runId,
            runTime: _runTime,
            rampUp: _rampUp,
            threads: _threads,
            totalRequests: _totalRequests,
            successfulRequests: _successfulRequests,
            failedRequests: _failedRequests,
            averageResponseTime: _averageResponseTime,
            maxConcurrentPods: _maxConcurrentPods,
            dashboardUrl: _dashboardUrl,
            status: _status
        };
        return row;
    }

    lookUpGrafanaUid(runId: string): string {
        let result = "";
        for (const item of this.testInfoArray) {
            if (item.runId === runId) {
                result = item.grafanaUid;
                break;
            }
        }
        return result;
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

    generateDatabaseArrays(databseResponse) {
        let resultsFields = [];
        let resultsValues = [];
        if (databseResponse[0].series[0]) {
            resultsFields = databseResponse[0].series[0]['columns'];
            resultsValues = databseResponse[0].series[0]['values'];
        }

        let testInfoFields = [];
        let testInfoValues = [];

        if (databseResponse[1].series[0]) {
            testInfoFields = databseResponse[1].series[0]['columns'];
            testInfoValues = databseResponse[1].series[0]['values'];

        }

        this.testInfoArray.length = 0;
        for (const arr of testInfoValues) {
            this.testInfoArray.push(this.buildTestInfoRow(arr, testInfoFields));
        }

        // console.log(this.testInfoArray)

        this.resultsDataSource.length = 0;
        for (const arr of resultsValues) {
            this.resultsDataSource.push(this.buildResultsDataRow(arr, resultsFields));
        }

        this.sendResultsDatasourceReadyEvent();
    }

    buildTestInfoRow(dataRow, columnArray): TestInfo {
        let _runId = dataRow[this.getDataItemIndex('RunId', columnArray)];
        let _grafanaUid = dataRow[this.getDataItemIndex('GrafanaUid', columnArray)];
        let _duration = dataRow[this.getDataItemIndex('Duration', columnArray)];

        let item: TestInfo = {
            runId: _runId,
            duration: _duration,
            grafanaUid: _grafanaUid
        };
        return item;
    }

    sendSubmitEvent(formDataPack: FormDataPackage) {
        this.submitSubject.next(formDataPack);
    }

    getSubmitEvent(): Observable<any> {
        return this.submitSubject.asObservable();
    }

    sendStopAllTestsEvent() {
        this.stopAllSubject.next();
    }

    sendResultsDatasourceReadyEvent() {
        this.resultsDataSourceReadySubject.next();
    }

    getStopAllTestsEvent() {
        return this.stopAllSubject.asObservable();
    }

    sendStopSingleEvent(prefix: string) {
        this.stopSingleTestSubject.next(prefix);
    }

    getStopSingleEvent() {
        return this.stopSingleTestSubject.asObservable();
    }

    getResultsDatasourceReadyEvent() {
        return this.resultsDataSourceReadySubject.asObservable();
    }

    public buildTestName(prefix: string, loadType: string): string {
        let name = prefix;
        if (loadType === "Direct") {
            name += " ICAP Live Performance Dashboard"
        } else if (loadType === "Proxy") {
            name += " Proxy Site Live Performance Dashboard"
        }
        return name;
    }

    public buildGrafanaLink(prefix: string, loadType: string, startTime: Date, runTime: number, grafanaUid: string) {
        let start = startTime.getTime(); //gets time in epoch, for use when setting grafana time window
        let end = start + (runTime * 1000);
        let name = prefix;
        if (loadType === "Direct") {
            name += "-icap-live-performance-dashboard"
        } else if (loadType === "Proxy") {
            name += "-proxy-site-live-performance-dashboard"
        }

        let link = this.grafanaUrl + 'd/' + grafanaUid + '/' + name + "?&from=" + start + "&to=" + end;
        return link;
    }
}

// this is the object that will carry data passed from form to other components
export interface FormDataPackage {
    formAsJsonString: string,
    grafanaUrlResponse: string,
    stackName: string
}

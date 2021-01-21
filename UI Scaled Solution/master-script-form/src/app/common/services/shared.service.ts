/*
    This service is responsible for querying the database and storing retrieved data for use in other componenets
*/
import { AppSettings, LoadTypes } from './../app settings/AppSettings';
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
    duration: string;
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
    public grafanaUrl: string = "";

    constructor(private readonly http: HttpClient) {
        this.init();
    }

    init(): void {
        this.getTestsFromDatabase();
        setInterval(() => { this.getTestsFromDatabase(); }, 60000); //used to refresh list and remove expired tests.
    }

    getTestsFromDatabase() {
        this.http.get(AppSettings.serverIp).subscribe(response => this.processRetrievedTestData(response), (err) => { this.onError(err) });
    }

    processRetrievedTestData(response) {
        this.grafanaUrl = response[1];
        this.generateDatabaseArrays(response);
    }

    onError(error) {
        console.log(error);
    }

    buildResultsDataRow(dataRow, columnArray): ResultsRowElement {
        let _testName = this.buildTestName(dataRow[this.getDataItemIndex('Prefix', columnArray)], dataRow[this.getDataItemIndex('LoadType', columnArray)]);
        let _startTime = new Date(dataRow[this.getDataItemIndex('time', columnArray)]);
        let _runId = dataRow[this.getDataItemIndex('RunId', columnArray)];
        let _duration = dataRow[this.getDataItemIndex('Duration', columnArray)];
        let _rampUp = dataRow[this.getDataItemIndex('RampUp', columnArray)];
        let _threads = dataRow[this.getDataItemIndex('Threads', columnArray)];
        let _totalRequests = dataRow[this.getDataItemIndex('TotalRequests', columnArray)];
        let _successfulRequests = dataRow[this.getDataItemIndex('SuccessfulRequests', columnArray)];
        let _failedRequests = dataRow[this.getDataItemIndex('FailedRequests', columnArray)];
        let _averageResponseTime = dataRow[this.getDataItemIndex('AverageResponseTime', columnArray)];
        let _maxConcurrentPods = dataRow[this.getDataItemIndex('TotalUsers', columnArray)];
        let grafanaUid = dataRow[this.getDataItemIndex('GrafanaUid', columnArray)];
        _startTime = new Date(_startTime.getTime() - (parseFloat(_duration) * 1000))
        let _dashboardUrl = this.buildGrafanaLink(dataRow[this.getDataItemIndex('Prefix', columnArray)], dataRow[this.getDataItemIndex('LoadType', columnArray)], _startTime, _duration, grafanaUid);
        let _status = dataRow[this.getDataItemIndex('Status', columnArray)]
        let row: ResultsRowElement = {
            testName: _testName,
            startTime: _startTime,
            runId: _runId,
            duration: _duration,
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

    generateDatabaseArrays(databaseResponse) {
        let resultsFields = [];
        let resultsValues = [];
        if (databaseResponse[0].series[0]) {
            resultsFields = databaseResponse[0].series[0]['columns'];
            resultsValues = databaseResponse[0].series[0]['values'];
        }

        this.resultsDataSource.length = 0;
        for (const arr of resultsValues) {
            this.resultsDataSource.push(this.buildResultsDataRow(arr, resultsFields));
        }

        this.sendResultsDatasourceReadyEvent();
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
        if (loadType === AppSettings.loadTypeNames[LoadTypes.Direct]) {
            name += " " + AppSettings.testNames[LoadTypes.Direct];
        } else if (loadType === AppSettings.loadTypeNames[LoadTypes.ProxyOffline]) {
            name += " " + AppSettings.testNames[LoadTypes.ProxyOffline];
        } else if (loadType === AppSettings.loadTypeNames[LoadTypes.ProxySharePoint]) {
            name += " " + AppSettings.testNames[LoadTypes.ProxySharePoint];
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

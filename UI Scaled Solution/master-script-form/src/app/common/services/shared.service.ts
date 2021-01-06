/*
    This service is responsible for querying the database and storing retrieved data for use in other componenets
*/

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, Subject } from 'rxjs';

export interface testRowElement {
    prefix: string; //prefix stored to target tests when stopping them individually
    stackName: string; //gotten from back end, used to target stacks for deletion
    testName: string; //prefix plus name that depends on type of load
    totalUsers: number;
    duration: number;
    startTime: Date;
    endTime: Date;
    dashboardUrl: string;
}

export interface resultsRowElement {
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
    status: string;
}

@Injectable({
    providedIn: 'root'
})

export class SharedService {
    private submitSubject = new Subject<any>();
    private stopAllSubject = new Subject<any>();
    private stopSingleTestSubject = new Subject<any>();
    private testDataSourceReadySubject = new Subject<any>();
    private resultsDataSourceReadySubject = new Subject<any>();
    public testDataSource: testRowElement[] = [];
    public resultsDataSource: resultsRowElement[] = [];

    constructor(private readonly http: HttpClient) {
        this.init();
    }

    init(): void {
        this.getTestsFromDatabase();
        setInterval(() => { console.log("service running") }, 5000); //used to refresh list and remove expired tests.
    }

    getTestsFromDatabase() {
        this.http.get('http://127.0.0.1:5000/').subscribe(response => this.processRetrievedTestData(response), (err) => { this.onError(err) });
    }

    processRetrievedTestData(response) {
        this.generateDatasourceArrays(response.series[0]['values'], response.series[0]['columns']);
    }

    onError(error) {
        console.log(error);
    }

    buildResultsDataRow(dataRow, columnArray): resultsRowElement {
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
        let _status = dataRow[this.getDataItemIndex('Status', columnArray)]
        let row: resultsRowElement = {
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
            dashboardUrl: _dashboardUrl,
            status: _status
        };
        return row;
    }

    buildTestDataRow(dataRow, columnArray): testRowElement {
        let _prefix = dataRow[this.getDataItemIndex('', columnArray)];
        let _stackName = dataRow[this.getDataItemIndex('', columnArray)];
        let _testName = dataRow[this.getDataItemIndex('', columnArray)];
        let _totalUsers = dataRow[this.getDataItemIndex('', columnArray)];
        let _duration = dataRow[this.getDataItemIndex('', columnArray)];
        let _startTime = dataRow[this.getDataItemIndex('', columnArray)];
        let _endTime = dataRow[this.getDataItemIndex('', columnArray)];
        let _dashboardUrl = dataRow[this.getDataItemIndex('', columnArray)];

        let row: testRowElement = {
            prefix: _prefix,
            stackName: _stackName,
            testName: _testName,
            totalUsers: _totalUsers,
            duration: _duration,
            startTime: _startTime,
            endTime: _endTime,
            dashboardUrl: _dashboardUrl
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

    generateDatasourceArrays(arrayOfValueArrays, columnArray) {
        this.resultsDataSource.length = 0;
        for (const arr of arrayOfValueArrays) {
            // console.log(arr);
            this.resultsDataSource.push(this.buildResultsDataRow(arr, columnArray));
        }

        this.sendResultsDatasourceReadyEvent();

        this.testDataSource.length = 0;
        for (const arr of arrayOfValueArrays) {
            // console.log(arr);
            // this.testDataSource.push(this.buildDataRow(arr, columnArray));
        }

        this.sendTestDatasourceReadyEvent();
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

    sendTestDatasourceReadyEvent() {
        this.testDataSourceReadySubject.next();
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

    getTestDatasourceReadyEvent() {
        return this.testDataSourceReadySubject.asObservable();
    }

    getResultsDatasourceReadyEvent() {
        return this.resultsDataSourceReadySubject.asObservable();
    }
}

// this is the object that will carry data passed from form to other components
export interface FormDataPackage {
    formAsJsonString: string,
    grafanaUrlResponse: string,
    stackName: string
}

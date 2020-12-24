import { FormGroup } from '@angular/forms';
import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';

@Injectable({
    providedIn: 'root'
})

export class SharedService {
    private submitSubject = new Subject<any>();
    private stopAllSubject = new Subject<any>();
    private stopSingleTestSubject = new Subject<any>();

    sendSubmitEvent(formDataPack: FormDataPackage) {
        this.submitSubject.next(formDataPack);
    }

    getSubmitEvent(): Observable<any> {
        return this.submitSubject.asObservable();
    }

    sendStopAllTestsEvent() {
        this.stopAllSubject.next();
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
}

// this is the object that will carry data passed from form to other components
export interface FormDataPackage {
    formAsJsonString: string,
    grafanaUrlResponse: string,
    stackName: string
 }

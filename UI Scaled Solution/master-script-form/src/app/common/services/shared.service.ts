import { FormGroup } from '@angular/forms';
import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';

@Injectable({
    providedIn: 'root'
})

export class SharedService {
    private submitSubject = new Subject<any>();
    private stopSubject = new Subject<any>();

    sendSubmitEvent(formDataPack: FormDataPackage) {
        this.submitSubject.next(formDataPack);
    }

    getSubmitEvent(): Observable<any> {
        return this.submitSubject.asObservable();
    }

    sendStopTestsEvent() {
        this.stopSubject.next();
    }

    getStopTestsEvent() {
        return this.stopSubject.asObservable();
    }
}

// this is the object that will carry data passed from form to other components
export interface FormDataPackage {
    form: FormGroup,
    grafanaUrlResponse: string
 }

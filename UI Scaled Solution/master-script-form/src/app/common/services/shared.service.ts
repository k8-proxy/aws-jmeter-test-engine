import { FormGroup } from '@angular/forms';
import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';

@Injectable({
    providedIn: 'root'
})

export class SharedService {
    private subject = new Subject<any>();

    sendSubmitEvent(formDataPack: FormDataPackage) {
        this.subject.next(formDataPack);
        console.log("Hit0");
    }

    getSubmitEvent(): Observable<any> {
        console.log("Hit1");
        return this.subject.asObservable();
    }
}

export interface FormDataPackage {
    form: FormGroup,
    grafanaUrlResponse: string
 }

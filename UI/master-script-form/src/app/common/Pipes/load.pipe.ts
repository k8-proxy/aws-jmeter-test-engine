/*
This pipe is used to adjust load type names in UI front end while preserving the original naming used in the backend databases.
This is important to keep everything backwards compatible despite changes made to UI element names.
*/
import {Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: "adjustLoadName"
})

export class LoadPipe implements PipeTransform {
    transform(value: string, args?: any) {
        if(value === "Direct") {
            value = "Direct ICAP Server";
        }
        return value;
    }
}

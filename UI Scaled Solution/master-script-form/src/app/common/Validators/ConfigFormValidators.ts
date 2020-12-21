import { AppSettings } from './../app settings/AppSettings';
import { AbstractControl, ValidationErrors } from '@angular/forms';

export class ConfigFormValidators {

    static hasNumberLimit(control: AbstractControl) : ValidationErrors | null {
        if(control.value > 4000) {
            return {exceedsNumberLimit: true};
        }

        return null;
    }

    static cannotContainSpaces(control: AbstractControl) : ValidationErrors | null {
        if(control.value != null && (control.value as string).indexOf(' ') >= 0){
            return {cannotContainSpaces: true}
        }
  
        return null;
    }

    static cannotContainDuplicatePrefix(control: AbstractControl) : ValidationErrors | null {
        if(control.value != null &&  AppSettings.testPrefixSet.has((control.value as string))){
            return {cannotContainDuplicatePrefix: true}
        }
        return null;
    }
    
}
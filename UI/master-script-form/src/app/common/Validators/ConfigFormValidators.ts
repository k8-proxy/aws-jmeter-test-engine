import { AbstractControl, ValidationErrors } from '@angular/forms';

export class ConfigFormValidators {

    static limitedNumber(control: AbstractControl) : ValidationErrors | null {
        if(isNaN(control.value)) {
            return {isNumber: false};
        }  else if(control.value <= 0) {
            return {isMoreThanZero: false};
        }

        return null;
    }

    static cannotContainSpaces(control: AbstractControl) : ValidationErrors | null {
        if(control.value != null && (control.value as string).indexOf(' ') >= 0){
            return {cannotContainSpaces: true}
        }
  
        return null;
    }
}
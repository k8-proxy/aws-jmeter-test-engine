import { AbstractControl, ValidationErrors } from '@angular/forms';

export class ConfigFormValidators {

    static limitedNumber(control: AbstractControl) : ValidationErrors | null {
        if(isNaN(control.value)) {
            console.log("that's NOT a number");
            return {isNumber: false};
        }  else if(control.value <= 0) {
            console.log("that's a number, but it's not the right kind of number");
            return {isMoreThanZero: false};
        } else {
            console.log("that's a correct number");
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
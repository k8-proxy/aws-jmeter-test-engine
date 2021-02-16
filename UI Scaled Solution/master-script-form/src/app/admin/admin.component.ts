import { Component, OnInit } from '@angular/core';
import { AppSettings, ReturnStatus } from '../common/app settings/AppSettings';
import { HttpClient } from '@angular/common/http';
import { animate, state, style, transition, trigger } from '@angular/animations';
import { Title } from '@angular/platform-browser';

@Component({
  selector: 'app-admin',
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.css'],animations: [
    trigger('animationState', [
      state('show', style({ opacity: 1 })),
      state('hide', style({ opacity: 0 })),
      transition('show => hide', animate('150ms ease-out')),
      transition('hide => show', animate('400ms ease-in'))
    ])
  ]
})
export class AdminComponent implements OnInit {

  updateButtonText = "Begin Update"
  public popoverTitle: string = "Please Confirm";
  public popoverMessage: string = "This will begin the update process, please do not run tests during update. Service may be interrupted for a short period.";
  updateInProgress: boolean = false;
  showAlert = false;
  alertClass = "";
  alertText = "";

  constructor(private titleService: Title, private readonly http: HttpClient) { }

  ngOnInit(): void {
    this.titleService.setTitle("Administration");
  }

  get animState() {
    return this.showAlert ? 'show' : 'hide';
  }
  get updating() {
    return this.updateInProgress;
  }

  onUpdateButtonPressed() {
    this.lockUpdateButton();
    this.postUpdateRequest();
  }

  postUpdateRequest() {
    const formData = new FormData();
    formData.append("button", "update");
    this.http.post(AppSettings.serverIp, formData).subscribe(response => this.onSuccessUpdating(response), (err) => { this.onErrorUpdating(err) });
  }

  toggleAlert(status?: ReturnStatus) {

    if (status == ReturnStatus.UpdateSuccess) {
      this.alertClass = "alert-success";
      this.alertText = "Update Successful"
    } else if (status == ReturnStatus.UpdateFailure) {
      this.alertClass = "alert-danger";
      this.alertText = "Error updating application"
    } 
    this.showAlert = !this.showAlert;
    setTimeout(() => (this.showAlert = !this.showAlert), 3000);
  }

  onSuccessUpdating(response) {
    this.unlockUpdateButton();
    this.toggleAlert(ReturnStatus.UpdateSuccess);
  }

  onErrorUpdating(error) {
    console.log(error);
    this.unlockUpdateButton();
    this.toggleAlert(ReturnStatus.UpdateFailure);
  }

  lockUpdateButton() {
    this.updateInProgress = true;
    this.updateButtonText = "Updating...";
  }

  unlockUpdateButton() {
    this.updateInProgress = false;
    this.updateButtonText = "Begin Update";
  }

}

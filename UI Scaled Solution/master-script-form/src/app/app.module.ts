import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { CommonModule } from '@angular/common';
import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms'
import { FormBuilder } from '@angular/forms'
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { ConfigFormComponent } from './config-form/config-form.component';
import { HttpClientModule } from '@angular/common/http';
import { ConfirmationPopoverModule } from 'angular-confirmation-popover';
import { CookieService } from 'ngx-cookie-service';
import { TestsTableComponent } from './tests-table/tests-table.component';
import { MatTableModule } from '@angular/material/table';
import { ResultsTableComponent } from './results-table/results-table.component';
import { SetupFormComponent } from './setup-form/setup-form.component';
import { NavbarComponent } from './navbar/navbar.component';
import { RouterModule } from '@angular/router'
import { LoadPipe } from './common/Pipes/load.pipe';
import { AdminComponent } from './admin/admin.component';

@NgModule({
  declarations: [
    AppComponent,
    ConfigFormComponent,
    TestsTableComponent,
    ResultsTableComponent,
    SetupFormComponent,
    NavbarComponent,
    LoadPipe,
    AdminComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    AppRoutingModule,
    ReactiveFormsModule,
    HttpClientModule,
    CommonModule,
    MatTableModule,
    ConfirmationPopoverModule.forRoot({
      confirmButtonType: 'warning'
    }),
    RouterModule.forRoot([
      { path: '', component: ConfigFormComponent},
      { path: 'setup', component: SetupFormComponent},
      { path: 'admin', component: AdminComponent}
    ], {useHash: true})
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  providers: [FormBuilder, CookieService],
  bootstrap: [AppComponent]
})
export class AppModule { }

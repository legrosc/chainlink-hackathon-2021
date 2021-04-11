import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { HedgeRoutingModule } from './hedge-routing.module';
import { HomeComponent } from './home/home.component';

import { ReactiveFormsModule } from '@angular/forms';
import { MaterialModule } from '../../shared/material/material.module';
import { FlexLayoutModule } from '@angular/flex-layout';
import { OlMapModule } from '../../shared/ol-map/ol-map.module';
import { HeaderComponent } from './header/header.component';
import { RegisterFormComponent } from './register-form/register-form.component';
import { InsuranceCounterComponent } from './insurance-counter/insurance-counter.component';
import { AdminComponent } from './admin/admin.component';

@NgModule({
  declarations: [HomeComponent, HeaderComponent, RegisterFormComponent, InsuranceCounterComponent, AdminComponent],
  imports: [
    CommonModule,
    HedgeRoutingModule,
    MaterialModule,
    ReactiveFormsModule,
    FlexLayoutModule,
    OlMapModule,
  ],
  exports: [HeaderComponent],
})
export class HedgeModule {}

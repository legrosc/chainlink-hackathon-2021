import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { HedgeRoutingModule } from './hedge-routing.module';
import { HomeComponent } from './home/home.component';

import { ReactiveFormsModule } from '@angular/forms';
import { MaterialModule } from '../../shared/material/material.module';
import { FlexLayoutModule } from '@angular/flex-layout';
import { OlMapModule } from '../../shared/ol-map/ol-map.module';

@NgModule({
  declarations: [HomeComponent],
  imports: [
    CommonModule,
    HedgeRoutingModule,
    MaterialModule,
    ReactiveFormsModule,
    FlexLayoutModule,
    OlMapModule,
  ],
})
export class HedgeModule {}

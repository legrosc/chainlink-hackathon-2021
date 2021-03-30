import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OlMapComponent } from './ol-map/ol-map.component';



@NgModule({
  declarations: [OlMapComponent],
  imports: [
    CommonModule
  ],
  exports: [OlMapComponent]
})
export class OlMapModule { }

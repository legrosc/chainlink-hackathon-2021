import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable({
  providedIn: 'root',
})
export class SnackbarService {
  constructor(private readonly snackBar: MatSnackBar) {}

  public showMessage(message: string): void {
    this.snackBar.open(message, '', {
      duration: 2000,
    });
  }

  public showError(message: string): void {
    this.snackBar.open(message, '', {
      duration: 2000,
      panelClass: 'error',
    });
  }
}

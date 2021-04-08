import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { HedgeMeService } from '@services/hedge-me/hedge-me.service';
import { SnackbarService } from '@services/snackbar/snackbar.service';
import { Account } from '@services/web3/models/account';
import { Web3Service } from '@services/web3/web3.service';
import { errorCodes } from 'eth-rpc-errors';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeaderComponent implements OnInit {
  public signerAddress: string = '';
  public signerBalance: string = '';

  public currentAccount$: Observable<Account | null>;
  public hasMetamask$: Observable<boolean>;

  constructor(
    private readonly web3Service: Web3Service,
    private readonly snackbarService: SnackbarService,
    private readonly hedgeMeService: HedgeMeService
  ) {}

  async ngOnInit(): Promise<void> {
    this.currentAccount$ = this.web3Service.currentAccount$;
    this.hasMetamask$ = this.web3Service.hasMetamask$;

    try {
      await this.web3Service.connectToWeb3();
    } catch (error) {
      this.snackbarService.showMessage(
        'Please install Metamask to use this app.'
      );
    }
  }

  public async connectMetamask(): Promise<void> {
    try {
      await this.web3Service.connectMetamask();
      this.snackbarService.showMessage('Connected to Metamask.');
    } catch (error) {
      if (error.code !== errorCodes.provider.userRejectedRequest) {
        this.snackbarService.showError('An error occured while connecting.');
      }
    }
  }

  public async setOracle(): Promise<void> {
    await this.hedgeMeService.setContractOracle();
  }
}

import { Injectable, NgZone } from '@angular/core';
import { ethers, Signer } from 'ethers';
import detectEthereumProvider from '@metamask/detect-provider';
import { BehaviorSubject, Observable } from 'rxjs';
import { ProviderConnectInfo, ProviderRpcError } from 'hardhat/types';
import { Account } from './models/account';
import { errorCodes, getMessageFromCode, serializeError } from 'eth-rpc-errors';
import { SerializedEthereumRpcError } from 'eth-rpc-errors/dist/classes';

@Injectable({
  providedIn: 'root',
})
export class Web3Service {
  private _provider: ethers.providers.Web3Provider;
  private _signer: Signer;

  public get signer(): Signer {
    return this._signer;
  }

  public get provider(): ethers.providers.Web3Provider {
    return this._provider;
  }

  private hasMetamaskSubject$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(
    false
  );
  /**
   * Indicates if Metamask is installed in the browser.
   */
  public hasMetamask$: Observable<boolean> = this.hasMetamaskSubject$.asObservable();

  private currentAccountSubject$: BehaviorSubject<Account | null> = new BehaviorSubject<Account | null>(
    null
  );
  /**
   * The current connected Metamask account. If null, the user is not connected.
   */
  public currentAccount$: Observable<Account | null> = this.currentAccountSubject$.asObservable();

  constructor(private zone: NgZone) {}

  /**
   * Initialize the connection to the blockchain, through Metamask.
   */
  public async connectToWeb3(): Promise<void> {
    const metamaskProvider: any = await detectEthereumProvider({
      mustBeMetaMask: true,
    });
    if (metamaskProvider) {
      this.hasMetamaskSubject$.next(true);
      this._provider = new ethers.providers.Web3Provider(metamaskProvider);

      // Check if the user is already connected
      await this.handleAccountsChanged(await this.provider.listAccounts());

      // Register event listeners
      metamaskProvider.on('connect', (connectInfo: ProviderConnectInfo) =>
        // TODO: handle connection
        console.log('Connected to chain')
      );
      metamaskProvider.on('disconnect', (error: ProviderRpcError) =>
        // TODO: handle disconnection
        console.log('Disconnected from chain')
      );
      metamaskProvider.on('accountsChanged', (accounts: string[]) =>
        this.zone.run(() => this.handleAccountsChanged(accounts))
      );
      metamaskProvider.on('chainChanged', (chainId: string) =>
        this.zone.run(() => this.handleChainChanged(chainId))
      );
    } else {
      throw new Error('Metamask is not installed.');
    }
  }

  private handleChainChanged(chainId: string) {
    window.location.reload();
  }

  private async handleAccountsChanged(accounts: string[]): Promise<void> {
    if (accounts.length === 0) {
      // Reset the account
      this._signer = null;
      this.currentAccountSubject$.next(null);
    } else {
      this._signer = this.provider.getSigner();
      this.currentAccountSubject$.next(
        new Account(
          await this.signer.getAddress(),
          await this.signer.getBalance()
        )
      );
    }
  }

  /**
   * Prompt the user to connect his Metamask account to the app.
   * @returns A promise with the address of the connected account.
   * @throws {SerializedEthereumRpcError}
   */
  public async connectMetamask(): Promise<void> {
    try {
      let accounts: string[] = await this.provider.send(
        'eth_requestAccounts',
        []
      );
      this.handleAccountsChanged(accounts);
    } catch (error) {
      this.handleError(error);
    }
  }

  private handleError(error: ProviderRpcError): SerializedEthereumRpcError {
    // Make sure the error is spec compliant
    const serializedError: SerializedEthereumRpcError = serializeError(error);

    if (serializedError.code !== errorCodes.provider.userRejectedRequest) {
      console.error(getMessageFromCode(serializedError.code));
    }

    throw serializedError;
  }

  /**
   * Request an update of the current account's balance.
   */
  public async updateAccountBalance(): Promise<void> {
    let currentAccount: Account = this.currentAccountSubject$.value;
    currentAccount.balance = await this.signer.getBalance();
    this.currentAccountSubject$.next(currentAccount);
  }
}

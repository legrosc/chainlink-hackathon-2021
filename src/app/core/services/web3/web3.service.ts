import { Injectable, NgZone } from '@angular/core';
import { Contract, ethers, Signer } from 'ethers';
import * as contractArtifact from '@contracts/Greeter.sol/Greeter.json';
import { Greeter } from 'hardhat/typechain/Greeter';
import detectEthereumProvider from '@metamask/detect-provider';
import { BehaviorSubject, Observable } from 'rxjs';
import { ProviderConnectInfo, ProviderRpcError } from 'hardhat/types';
import { Account } from './models/account';
import {
  errorCodes,
  ethErrors,
  getMessageFromCode,
  serializeError,
} from 'eth-rpc-errors';
import { SerializedEthereumRpcError } from 'eth-rpc-errors/dist/classes';

@Injectable({
  providedIn: 'root',
})
export class Web3Service {
  private provider: ethers.providers.Web3Provider;
  private signer: Signer;
  private contract: Greeter;

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
      this.provider = new ethers.providers.Web3Provider(metamaskProvider);

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

      // Create the contract
      this.contract = new Contract(
        '0x5FbDB2315678afecb367f032d93F642f64180aa3',
        contractArtifact.abi,
        this.provider
      ) as Greeter;
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
      this.signer = null;
      this.currentAccountSubject$.next(null);
    } else {
      this.signer = this.provider.getSigner();
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
}

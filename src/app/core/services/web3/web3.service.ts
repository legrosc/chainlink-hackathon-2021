import { Injectable } from '@angular/core';
import { BigNumber, Contract, ethers, Signer } from 'ethers';
import contractArtifact from '@contracts/Greeter.sol/Greeter.json';
import { Greeter } from 'hardhat/typechain/Greeter';

@Injectable({
  providedIn: 'root',
})
export class Web3Service {
  private readonly provider:
    | ethers.providers.JsonRpcProvider
    | ethers.providers.Web3Provider;
  private readonly signer: Signer;
  private readonly contract: Greeter;

  constructor() {
    let allowMetamask: boolean = false;
    if (!!(window as any).ethereum && allowMetamask) {
      // Metamask
      this.provider = new ethers.providers.Web3Provider(
        (window as any).ethereum
      );
    } else {
      // Local ethereum node on default port (8545)
      this.provider = new ethers.providers.JsonRpcProvider();
    }
    this.signer = this.provider.getSigner();
    this.contract = new Greeter(
      '0x5FbDB2315678afecb367f032d93F642f64180aa3',
      contractArtifact.abi,
      this.provider
    );
  }

  public getAccounts(): Promise<string[]> {
    return this.provider.listAccounts();
  }

  public getAccountBalance(account: string): Promise<BigNumber> {
    return this.provider.getBalance(account);
  }

  public send(
    to: string,
    amount: string
  ): Promise<ethers.providers.TransactionResponse> {
    return this.signer.sendTransaction({
      to: to,
      value: ethers.utils.parseEther(amount),
    });
  }

  public getGreeting(): Promise<string> {
    return this.contract.greet();
  }

  public setGreeting(): Promise<ethers.ContractTransaction> {
    const contractWithSigner = this.contract.connect(this.signer);
    return contractWithSigner.setGreeting('Hola');
  }
}

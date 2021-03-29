import { Injectable } from '@angular/core';
import { Web3Service } from '@services/web3/web3.service';
import { BigNumberish, Contract, ethers } from 'ethers';
import { InsurpoolSubscription } from 'hardhat/typechain';
import * as contractArtifact from '@contracts/InsurpoolSubscription.sol/InsurpoolSubscription.json';
import { BehaviorSubject, Observable } from 'rxjs';
import { PolicyHolder } from 'src/app/modules/hedge/models/policy-holder';
import { filter } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class InsurpoolService {
  private readonly contractAddress: string =
    '0x5fbdb2315678afecb367f032d93f642f64180aa3';
  private contract: InsurpoolSubscription;

  private insuranceFundSubject$: BehaviorSubject<string> = new BehaviorSubject<string>(
    '0'
  );
  /**
   * Updates when the insurance fund is updated.
   */
  public insuranceFund$: Observable<string> = this.insuranceFundSubject$.asObservable();

  constructor(private readonly web3service: Web3Service) {
    this.web3service.currentAccount$
      .pipe(filter((c) => c != null))
      .subscribe(() => {
        this.createContract();
        this.updateInsuranceFund();
      });
  }

  private createContract(): void {
    this.contract = new Contract(
      this.contractAddress,
      contractArtifact.abi,
      this.web3service.signer
    ) as InsurpoolSubscription;

    this.contract.on(
      this.contract.filters.InsuranceFundsUpdated(null),
      (newValue: BigNumberish) => {
        console.log('Someone updated the funds');
        this.updateInsuranceFund(newValue);
      }
    );
  }

  private async updateInsuranceFund(newFund: BigNumberish | null = null) {
    if (newFund != null) {
      this.insuranceFundSubject$.next(ethers.utils.formatEther(newFund));
    } else {
      const balance = await this.web3service.provider.getBalance(
        this.contract.address
      );
      this.insuranceFundSubject$.next(ethers.utils.formatEther(balance));
    }
  }

  public async register(policyHolder: PolicyHolder): Promise<void> {
    const signerAddress = await this.web3service.signer.getAddress();
    const estimatedGas = await this.contract.estimateGas.register(
      policyHolder.amount,
      policyHolder,
      {
        from: signerAddress,
        value: policyHolder.amount,
      }
    );
    console.log(
      'from: ',
      signerAddress,
      'to: ',
      this.contract.address,
      'chain id: ',
      this.web3service.provider.network.chainId,
      'estimated gas: ',
      estimatedGas.toNumber()
    );
    await this.contract.register(policyHolder.amount, policyHolder, {
      from: signerAddress,
      value: policyHolder.amount,
    });
  }
}

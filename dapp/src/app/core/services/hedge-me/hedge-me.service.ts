import { Injectable } from '@angular/core';
import { Web3Service } from '@services/web3/web3.service';
import { BigNumberish, Contract, ethers } from 'ethers';
import * as contractArtifact from '@contracts/HedgeMe.sol/HedgeMe.json';
import { BehaviorSubject, Observable } from 'rxjs';
import { PolicyHolder } from 'src/app/modules/hedge/models/policy-holder';
import { filter } from 'rxjs/operators';
import { HedgeMe } from 'hardhat/typechain/HedgeMe';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class HedgeMeService {
  private readonly contractAddress: string = environment.contractAddress;
  private contract: HedgeMe;

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
    ) as HedgeMe;

    this.contract.on(
      this.contract.filters.InsuranceFundsUpdated(null),
      (newValue: BigNumberish) => {
        console.log(
          'Someone updated the funds:',
          ethers.utils.formatEther(newValue)
        );
        this.updateInsuranceFund(newValue);
        this.web3service.updateAccountBalance();
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
      console.log(
        'getting initial contract balance: ',
        ethers.utils.formatEther(balance)
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

import { Injectable } from '@angular/core';
import { Web3Service } from '@services/web3/web3.service';
import { BigNumberish, Contract, ethers } from 'ethers';
import * as contractArtifact from '@contracts/HedgeMe.sol/HedgeMe.json';
import { BehaviorSubject, Observable } from 'rxjs';
import { PolicyHolder } from 'src/app/modules/hedge/models/policy-holder';
import { filter } from 'rxjs/operators';
import { HedgeMe } from 'hardhat/typechain/HedgeMe';
import { environment } from 'src/environments/environment';
import moment from 'moment';
import { SnackbarService } from '@services/snackbar/snackbar.service';

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

  constructor(
    private readonly web3service: Web3Service,
    private readonly snackbarService: SnackbarService
  ) {
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

    this.contract.on(
      this.contract.filters.PaidInsurance(null, null),
      (to: string, value: BigNumberish) => {
        this.snackbarService.showMessage(
          `${ethers.utils.formatEther(value)} eth were paid to ${to}`
        );
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

  public async setContractOracle(): Promise<void> {
    await this.contract.setOracleAddress(
      environment.oracleAddress,
      ethers.utils.toUtf8Bytes(environment.jobId),
      ethers.utils.parseEther(environment.oracleFee)
    );
  }

  public async requestWeather(weatherValues: string): Promise<void> {
    console.log(`Requesting weather (${weatherValues})...`);
    const address = await this.web3service.signer.getAddress();
    await this.contract.requestWeather(
      address,
      ethers.BigNumber.from(weatherValues)
    );
  }

  public async fundWithLink(): Promise<any> {
    const network: string = this.web3service.provider.network.name;
    const LINK_TOKEN_ABI = [
      {
        inputs: [
          { internalType: 'address', name: 'recipient', type: 'address' },
          { internalType: 'uint256', name: 'amount', type: 'uint256' },
        ],
        name: 'transfer',
        outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
        stateMutability: 'nonpayable',
        type: 'function',
      },
    ];

    //set the LINK token contract address according to the environment
    let linkContractAddr: string;
    switch (network) {
      case 'mainnet':
        linkContractAddr = '0x514910771af9ca656af840dff83e8264ecf986ca';
        break;
      case 'kovan':
        linkContractAddr = '0xa36085F69e2889c224210F603D836748e7dC0088';
        break;
      case 'rinkeby':
        linkContractAddr = '0x01BE23585060835E02B77ef475b0Cc51aA1e0709';
        break;
      case 'goerli':
        linkContractAddr = '0x326c977e6efc84e512bb9c30f76e30c160ed06fb';
        break;
      default:
        //default to kovan
        linkContractAddr = '0xa36085F69e2889c224210F603D836748e7dC0088';
    }
    //Fund with 1 LINK token
    const amount = ethers.constants.WeiPerEther;

    //Get signer information
    const signer = this.web3service.provider.getSigner();

    //Create connection to LINK token contract and initiate the transfer
    const linkTokenContract = new ethers.Contract(
      linkContractAddr,
      LINK_TOKEN_ABI,
      signer
    );
    var result = await linkTokenContract
      .transfer(this.contractAddress, amount)
      .then(function (transaction) {
        console.log(
          'Contract funded with 1 LINK. Transaction Hash: ',
          transaction.hash
        );
      });
  }
}

import { BigNumberish } from '@ethersproject/bignumber';
import { ethers } from 'ethers';

export class Account {
  /**
   * The account's ethereum address.
   */
  public address: string;
  /**
   * The account's balance in wei.
   */
  public balance: BigNumberish;

  public constructor(address: string, balance: BigNumberish) {
    this.address = address;
    this.balance = balance;
  }

  /**
   * The account's balance in ether.
   */
  public get balanceInEth(): string {
    return ethers.utils.formatEther(this.balance);
  }
}

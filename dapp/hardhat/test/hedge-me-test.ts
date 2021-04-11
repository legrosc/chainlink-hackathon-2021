import { ethers, waffle } from 'hardhat';
import { expect } from 'chai';
import {
  HedgeMe__factory,
  HedgeMe,
  MockOracle,
  MockOracle__factory,
  MockLink,
  MockLink__factory,
} from '../typechain';
import { BigNumberish } from '@ethersproject/bignumber';
import '@nomiclabs/hardhat-waffle';
import { BigNumber, Wallet } from 'ethers';

async function deployContract(
  minValue: BigNumberish,
  dailyAmount: BigNumberish
): Promise<[HedgeMe, MockOracle]> {
  // Create the mock LINK contract
  const mockLinkFactory = (await ethers.getContractFactory(
    'MockLink'
  )) as MockLink__factory;
  const link: MockLink = await mockLinkFactory.deploy();
  await link.deployed();

  // Create the mock oracle contract
  const mockOracleFactory = (await ethers.getContractFactory(
    'MockOracle'
  )) as MockOracle__factory;
  const mockOracle: MockOracle = await mockOracleFactory.deploy(link.address);
  await mockOracle.deployed();

  // Create the HedgeMe contract
  const factory: HedgeMe__factory = (await ethers.getContractFactory(
    'HedgeMe'
  )) as HedgeMe__factory;
  const hedgeMe: HedgeMe = await factory.deploy(
    minValue,
    dailyAmount,
    link.address
  );
  await hedgeMe.deployed();
  await hedgeMe.setOracleAddress(
    mockOracle.address,
    ethers.utils.toUtf8Bytes('235f8b1eeb364efc83c26d0bef2d0c01'), // random bogus jobId
    ethers.utils.parseEther('0.1')
  );

  // Give 1 LINK to the contract
  await link.transfer(hedgeMe.address, ethers.constants.WeiPerEther);

  return [hedgeMe, mockOracle];
}

describe('HedgeMe', function () {
  const wallets: Wallet[] = waffle.provider.getWallets();
  let contract: HedgeMe;
  let mockOracle: MockOracle;

  const policyHolder = {
    start: 1617973366, // 04/09/2021 3:03PM
    duration: 604800, // 7 days
    amount: ethers.utils.parseEther('1'),
    latitude: ethers.utils.parseUnits('10.25', 2),
    longitude: ethers.utils.parseUnits('-0.54', 2),
    weather: 0, // frost
  };

  beforeEach(async () => {
    [contract, mockOracle] = await deployContract(
      ethers.constants.WeiPerEther,
      ethers.utils.parseEther('0.2')
    );
  });

  it("Should revert if the amounts don't match", async () => {
    await expect(
      contract.register(ethers.utils.parseEther('2'), policyHolder, {
        from: wallets[0].address,
        value: policyHolder.amount,
      })
    ).to.be.reverted;
  });

  it('Should store the payement in the contract', async () => {
    await contract.register(policyHolder.amount, policyHolder, {
      from: wallets[0].address,
      value: policyHolder.amount,
    });
    expect(await ethers.provider.getBalance(contract.address)).to.be.equal(
      policyHolder.amount
    );
  });

  it('Should emit an event when a new policy holder registers', async () => {
    await expect(
      contract.register(policyHolder.amount, policyHolder, {
        from: wallets[0].address,
        value: policyHolder.amount,
      })
    )
      .to.emit(contract, 'InsuranceFundsUpdated')
      .withArgs(ethers.constants.WeiPerEther);
  });

  it('Should revert if the amount is too low', async () => {
    let weiValue: BigNumberish = ethers.utils.parseEther('0.02');
    await expect(
      contract.register(
        weiValue,
        { ...policyHolder, amount: weiValue },
        {
          from: wallets[0].address,
          value: weiValue,
        }
      )
    ).to.be.reverted;
  });

  it("Should parse the oracle's value correctly", async () => {
    const oracleValue = ethers.BigNumber.from('111222333444555666777');
    const result = await contract.parseLastSevenDaysTemperatures(oracleValue);
    const expectedResult = [777, 666, 555, 444, 333, 222, 111];
    expect(result.length).to.equal(7);
    expect(result.map((r) => r.toNumber())).to.eql(expectedResult);
  });

  it('Should pay insurance if the condition is reached', async () => {
    // Register to the insurance
    let beforeBalance = await ethers.provider.getBalance(wallets[0].address);
    await contract.register(policyHolder.amount, policyHolder, {
      from: wallets[0].address,
      value: policyHolder.amount,
    });
    let afterBalance = await ethers.provider.getBalance(wallets[0].address);
    let difference = beforeBalance.sub(afterBalance);
    expect(difference.isNegative()).to.be.false;
    beforeBalance = afterBalance;

    // Make the request to the oracle
    await contract.requestWeather(
      wallets[0].address,
      ethers.BigNumber.from('263273278253271272267')
    );

    let requestId: string = await new Promise<string>((resolve) => {
      mockOracle.on(
        mockOracle.filters.OracleRequest(
          null,
          null,
          null,
          null,
          null,
          null,
          null,
          null,
          null
        ),
        (
          _specId,
          _sender,
          _requestId,
          _payment,
          _callbackAddress,
          _callbackFunctionId,
          _expiration,
          _dataVersion,
          _data
        ) => {
          resolve(_requestId);
        }
      );
    });

    console.log('Oracle request id: ', requestId);

    // Receive the temperature for the policy holder
    // In °C: -10, 0, 5, -20, -2, -1, -6
    const temperatures = ethers.BigNumber.from('263273278253271272267');
    await mockOracle.fulfillOracleRequest(requestId, temperatures);

    // Check that we received the insurance (4 days at a daily amount of 0.2 ethers == 1 ether)
    let transferedAmount: BigNumber = await new Promise<BigNumber>(
      (resolve) => {
        contract.on(
          contract.filters.PaidInsurance(null, null),
          (to, amount) => {
            resolve(amount);
          }
        );
      }
    );

    expect(transferedAmount.toString()).to.equal(
      ethers.utils.parseEther('1').toString()
    );

    afterBalance = await ethers.provider.getBalance(wallets[0].address);
    difference = beforeBalance.sub(afterBalance);
    expect(difference.isNegative()).to.be.true;
  });
});

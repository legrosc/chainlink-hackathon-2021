import { ethers } from 'hardhat';
import { expect } from 'chai';
import { Greeter__factory, Greeter } from '../typechain';

describe('Greeter', function () {
  it("Should return the new greeting once it's changed", async function () {
    const factory: Greeter__factory = (await ethers.getContractFactory(
      'Greeter'
    )) as Greeter__factory;
    const greeter: Greeter = await factory.deploy('Hello, world!');

    await greeter.deployed();
    expect(await greeter.greet()).to.equal('Hello, world!');

    await greeter.setGreeting('Hola, mundo!');
    expect(await greeter.greet()).to.equal('Hola, mundo!');
  });
});

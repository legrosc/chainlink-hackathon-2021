import { task, HardhatUserConfig } from 'hardhat/config';
import '@nomiclabs/hardhat-waffle';
import '@nomiclabs/hardhat-ethers';
import '@nomiclabs/hardhat-web3';
import '@typechain/hardhat';
import dotenv from 'dotenv';
dotenv.config();

// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html
task('accounts', 'Prints the list of accounts', async (args, hre) => {
  const accounts = await hre.ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address);
  }
});

task('fund-link', 'Funds a contract with LINK')
  .addParam('contract', 'The address of the contract that requires LINK')
  .addOptionalParam('linkAddress', 'Set the LINK token address')
  .setAction(async (taskArgs) => {
    console.log(taskArgs.linkAddress);
    const contractAddr = taskArgs.contract;
    const networkId = network.name;
    console.log('Funding contract ', contractAddr, ' on network ', networkId);
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
    let linkContractAddr;
    switch (networkId) {
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
    const amount = web3.utils.toHex(1e18);

    //Get signer information
    const accounts = await hre.ethers.getSigners();
    const signer = accounts[0];

    //Create connection to LINK token contract and initiate the transfer
    const linkTokenContract = new ethers.Contract(
      linkContractAddr,
      LINK_TOKEN_ABI,
      signer
    );
    var result = await linkTokenContract
      .transfer(contractAddr, amount)
      .then(function (transaction) {
        console.log(
          'Contract ',
          contractAddr,
          ' funded with 1 LINK. Transaction Hash: ',
          transaction.hash
        );
      });
  });

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more
const config: HardhatUserConfig = {
  solidity: {
    compilers: [
      {
        version: '0.8.3',
      },
      {
        version: '0.7.0',
        settings: {},
      },
    ],
  },
  networks: {
    hardhat: {
      chainId: 1337,
    },
    kovan: {
      url: `https://eth-kovan.alchemyapi.io/v2/${process.env.ALCHEMY_API_KEY}`,
      accounts: [`0x${process.env.KOVAN_PRIVATE_KEY}`],
    },
  },
};

export default config;

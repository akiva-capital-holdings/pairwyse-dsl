import * as dotenv from 'dotenv';

import { HardhatUserConfig, task } from 'hardhat/config';
import '@nomiclabs/hardhat-etherscan';
import '@nomiclabs/hardhat-waffle';
import '@typechain/hardhat';
import 'hardhat-gas-reporter';
import 'solidity-coverage';
import 'hardhat-contract-sizer';
import * as tdly from '@tenderly/hardhat-tenderly';

tdly.setup();
dotenv.config();

// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html
task('accounts', 'Prints the list of accounts', async (taskArgs, hre) => {
  const accounts = await hre.ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address);
  }
});

const config: HardhatUserConfig = {
  solidity: {
    version: '0.8.11',
    settings: {
      optimizer: {
        enabled: process.env.OPTIMIZER === 'true',
        runs: 100,
      },
    },
  },
  defaultNetwork: 'hardhat',
  networks: {
    hardhat: {
      chainId: 1337,
    },
    localhost: {
      timeout: 1e9,
      url: 'http://127.0.0.1:7545',
    },
    remoteGanache: {
      url: process.env.REMOTE_GANACHE_URL || '',
      timeout: 1e9,
      accounts:
        process.env.REMOTE_GANACHE_PRIVATE_KEYS !== undefined
          ? process.env.REMOTE_GANACHE_PRIVATE_KEYS.split(',')
          : [],
    },
    ropsten: {
      url: process.env.ROPSTEN_URL || '',
      accounts: process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
    },
    tenderly: {
      url: process.env.TENDERLY_FORK_URL || '',
      chainId: 1,
    },
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS === 'true',
    currency: 'USD',
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY,
  },
  mocha: {
    timeout: 1e9,
  },
  contractSizer: {
    runOnCompile: process.env.CONTRACT_SIZER === 'true',
  },
  tenderly: {
    project: 'project',
    username: 'eugenefine',
    forkNetwork: '1',
  },
};

export default config;

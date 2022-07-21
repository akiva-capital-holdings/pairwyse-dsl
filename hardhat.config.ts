import * as dotenv from 'dotenv';

import { HardhatUserConfig, task } from 'hardhat/config';
import '@typechain/hardhat';
import '@nomiclabs/hardhat-ethers';
import '@nomiclabs/hardhat-waffle';
import '@nomiclabs/hardhat-etherscan';
import 'hardhat-gas-reporter';
import 'solidity-coverage';
import 'hardhat-contract-sizer';
import * as tdly from '@tenderly/hardhat-tenderly';

// Enable Tenderly (v. 1.1.4) setup only if needed as it causes tests to fall
if (process.env.DEPLOY_TO_TENDERLY === 'true') {
  tdly.setup();
}
dotenv.config();

const {
  OPTIMIZER,
  REMOTE_GANACHE_URL,
  REMOTE_GANACHE_PRIVATE_KEYS,
  ROPSTEN_URL,
  PRIVATE_KEY,
  TENDERLY_FORK_URL,
  REPORT_GAS,
  ETHERSCAN_API_KEY,
  CONTRACT_SIZER,
  TENDERLY_PROJECT,
  TENDERLY_USERNAME,
  TENDERLY_FORK_ID,
} = process.env;

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
        enabled: OPTIMIZER === 'true',
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
      url: 'http://127.0.0.1:8545',
    },
    remoteGanache: {
      url: REMOTE_GANACHE_URL || '',
      timeout: 1e9,
      accounts:
        REMOTE_GANACHE_PRIVATE_KEYS !== undefined ? REMOTE_GANACHE_PRIVATE_KEYS.split(',') : [],
    },
    ropsten: {
      url: ROPSTEN_URL || '',
      accounts: PRIVATE_KEY !== undefined ? [PRIVATE_KEY] : [],
    },
    tenderly: {
      url: TENDERLY_FORK_URL || '',
      chainId: 1,
    },
  },
  gasReporter: {
    enabled: REPORT_GAS === 'true',
    currency: 'USD',
  },
  etherscan: {
    apiKey: ETHERSCAN_API_KEY,
  },
  mocha: {
    timeout: 1e9,
  },
  contractSizer: {
    runOnCompile: CONTRACT_SIZER === 'true',
  },
  tenderly: {
    project: TENDERLY_PROJECT || '',
    username: TENDERLY_USERNAME || '',
    forkNetwork: TENDERLY_FORK_ID,
  },
};

export default config;

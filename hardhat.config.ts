import * as dotenv from 'dotenv';

import { HardhatUserConfig } from 'hardhat/config';
import './tasks/deploy';
import './tasks/interact';
import './tasks/others';
import '@typechain/hardhat';
import '@nomiclabs/hardhat-ethers';
import '@nomiclabs/hardhat-waffle';
import '@nomiclabs/hardhat-etherscan';
import 'hardhat-gas-reporter';
import 'solidity-coverage';
import 'solidity-docgen';
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
  REMOTE_GANACHE_MNEMONIC,
  ROPSTEN_URL,
  RINKEBY_URL,
  PRIVATE_KEY,
  TENDERLY_FORK_URL,
  REPORT_GAS,
  ETHERSCAN_API_KEY,
  CONTRACT_SIZER,
  TENDERLY_PROJECT,
  TENDERLY_USERNAME,
  TENDERLY_FORK_ID,
} = process.env;

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
  docgen: {
    pages: 'files',
    templates: 'custom',
    // theme: 'page'
  },
  // Note: make `tenderly` to verify contracts on Tenderly during running deployment scripts
  defaultNetwork: 'hardhat',
  networks: {
    hardhat: {
      // chainId: 51337,
      forking: {
        url: 'https://eth-mainnet.alchemyapi.io/v2/TblxLEyAvK38N2-0m0hyUkvqin-slMv2',
        blockNumber: 16381381,
      },
    },
    localhost: {
      timeout: 1e9,
      url: 'http://127.0.0.1:8545',
    },
    remoteGanache: {
      url: REMOTE_GANACHE_URL || '',
      timeout: 1e9,
      chainId: 31337,
      accounts: {
        mnemonic:
          REMOTE_GANACHE_MNEMONIC || 'test test test test test test test test test test test junk',
      },
    },
    ropsten: {
      url: ROPSTEN_URL || '',
      accounts: PRIVATE_KEY !== undefined ? [PRIVATE_KEY] : [],
    },
    rinkeby: {
      url: RINKEBY_URL || '',
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

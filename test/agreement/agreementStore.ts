import * as hre from 'hardhat';
import { expect } from 'chai';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { parseEther } from 'ethers/lib/utils';
import { addSteps, hex4Bytes } from '../utils/utils';
import { deployAgreementStore, deployPreprocessor } from '../../scripts/utils/deploy.utils';
import { AgreementStore } from '../../typechain-types';
import { ONE_MONTH } from '../utils/constants';
import { MultisigMock } from '../../typechain-types/agreement/mocks/MultisigMock';

const { ethers, network } = hre;

describe.only('AgreementStore: Alice, Bob, Carl', () => {
  let agreementStore: AgreementStore;
  let agreementAddr: string;
  let preprocessorAddr: string;
  let multisig: MultisigMock;
  let alice: SignerWithAddress;
  let bob: SignerWithAddress;
  let carl: SignerWithAddress;
  let snapshotId: number;
  let NEXT_MONTH = 0;

  const oneEthBN = parseEther('1');
  const tenTokens = parseEther('10');

  before(async () => {
    multisig = await (await ethers.getContractFactory('MultisigMock')).deploy();
    agreementAddr = await deployAgreementStore(hre, multisig.address);
    preprocessorAddr = await deployPreprocessor(hre);
    agreementStore = await ethers.getContractAt('AgreementStore', agreementAddr);

    [alice, bob, carl] = await ethers.getSigners();

    const LAST_BLOCK_TIMESTAMP = (
      await ethers.provider.getBlock(await ethers.provider.getBlockNumber())
    ).timestamp;
    NEXT_MONTH = LAST_BLOCK_TIMESTAMP + ONE_MONTH;
  });

  beforeEach(async () => {
    snapshotId = await network.provider.send('evm_snapshot');
  });

  afterEach(async () => {
    await network.provider.send('evm_revert', [snapshotId]);
  });

  describe('AgreementStore: check value name', () => {
    it('fails if a non-creator of a variable tries to set the variable', async () => {
      await agreementStore.connect(alice).setStorage(1, 'BALANCE', []);
      const get = await agreementStore.connect(alice).getStorage('BALANCE');
      console.log(await get.wait());
    });
  });
});

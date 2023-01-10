import * as hre from 'hardhat';
import { expect } from 'chai';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { parseEther } from 'ethers/lib/utils';
import { addSteps, hex4Bytes } from '../utils/utils';
import {
  deployAgreement,
  deployOpcodeLibs,
  deployPreprocessor,
} from '../../scripts/utils/deploy.utils';
import {
  aliceAndBobSteps,
  aliceBobAndCarl,
  aliceAndAnybodySteps,
  oneEthToBobSteps,
} from '../../scripts/data/agreement';
import { Agreement } from '../../typechain-types';
import { anyone, ONE_DAY, ONE_MONTH } from '../utils/constants';
import { MultisigMock } from '../../typechain-types/agreement/mocks/MultisigMock';
import { deployBaseMock } from '../../scripts/utils/deploy.utils.mock';

const { ethers } = hre;

/**
 * Multi Tranche Agreement Template contract tests
 */
describe('Multi Tranche', () => {
  let creator: SignerWithAddress;
  let investor1: SignerWithAddress;
  let investor2: SignerWithAddress;
  let investor3: SignerWithAddress;

  before(async () => {
    [creator, investor1, investor2, investor3] = await ethers.getSigners();

    // await deployPreprocessor(hre);
  });

  it('success', async () => {
    // 1. Governance contract is deployed; it will be an owner of Agreement.
    const [
      comparisonOpcodesLibAddr,
      branchingOpcodesLibAddr,
      logicalOpcodesLibAddr,
      otherOpcodesLibAddr,
    ] = await deployOpcodeLibs(hre);
    const [parserAddr, executorLibAddr] = await deployBaseMock(hre);
    const MultiTranche = await hre.ethers.getContractFactory('MultiTranche', {
      libraries: {
        Executor: executorLibAddr,
      },
    });

    const DSLContext = await (
      await ethers.getContractFactory('DSLContextMock')
    ).deploy(
      comparisonOpcodesLibAddr,
      branchingOpcodesLibAddr,
      logicalOpcodesLibAddr,
      otherOpcodesLibAddr
    );
    await DSLContext.deployed();
    const multiTranche = await MultiTranche.deploy(parserAddr, creator.address, DSLContext.address);
    await multiTranche.deployed();
  });
});

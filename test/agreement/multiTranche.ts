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
describe.only('Multi Tranche', () => {
  let creator: SignerWithAddress;
  let investor1: SignerWithAddress;
  let investor2: SignerWithAddress;
  let investor3: SignerWithAddress;
  let agreement: Agreement;
  let agreementAddr: string;
  let tokenAddr: string;
  let NEXT_MONTH: number;

  before(async () => {
    [creator, investor1, investor2, investor3] = await ethers.getSigners();

    const LAST_BLOCK_TIMESTAMP = (
      await ethers.provider.getBlock(await ethers.provider.getBlockNumber())
    ).timestamp;
    NEXT_MONTH = LAST_BLOCK_TIMESTAMP + ONE_MONTH;

    await deployPreprocessor(hre);

    // Deploy Token contract
    const token = await (await ethers.getContractFactory('Token'))
      .connect(creator)
      .deploy(ethers.utils.parseEther('1000'));
    await token.deployed();
    tokenAddr = token.address;
  });

  it('success', async () => {
    // 1. Governance contract is deployed; it will be an owner of Agreement.
    const [
      comparisonOpcodesLibAddr,
      branchingOpcodesLibAddr,
      logicalOpcodesLibAddr,
      otherOpcodesLibAddr,
    ] = await deployOpcodeLibs(hre);
    const [parserAddr, executorLibAddr, preprAddr] = await deployBaseMock(hre);
    const MultiTranche = await hre.ethers.getContractFactory('MultiTranche', {
      libraries: {
        Executor: executorLibAddr,
      },
    });
    const parser = await ethers.getContractAt('ParserMock', parserAddr);

    const DSLContext = await (
      await ethers.getContractFactory('DSLContextMock')
    ).deploy(
      comparisonOpcodesLibAddr,
      branchingOpcodesLibAddr,
      logicalOpcodesLibAddr,
      otherOpcodesLibAddr
    );
    await DSLContext.deployed();
    const multiTranche = await MultiTranche.deploy(
      parserAddr,
      creator.address,
      tokenAddr,
      DSLContext.address,
      NEXT_MONTH
    );
    await multiTranche.deployed();
  });
});

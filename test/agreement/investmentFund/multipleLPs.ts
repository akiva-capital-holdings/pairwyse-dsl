import * as hre from 'hardhat';
import { parseUnits } from 'ethers/lib/utils';
import { Suite } from 'mocha';
import dotenv from 'dotenv';
import { addSteps, businessCaseTest } from '../../utils/utils';
import { businessCaseSteps } from '../../../scripts/data/agreement';
import { deployAgreement, deployPreprocessor } from '../../../scripts/utils/deploy.utils';
import { ONE_MONTH } from '../../utils/constants';
import { DynamicTestData } from '../../types';

const { ethers, network } = hre;
dotenv.config();

const dynamicTestData = {} as DynamicTestData;

const parentSuite = describe('Agreement: Investment Fund. Multiple LPs', () => {
  let snapshotId: number;

  before(async () => {
    // Deploy the contracts
    const multisig = await (await ethers.getContractFactory('MultisigMock')).deploy();
    const agreementAddr = await deployAgreement(hre, multisig.address);
    const preprocessorAddr = await deployPreprocessor(hre);
    dynamicTestData.agreement = await ethers.getContractAt('Agreement', agreementAddr);
    [, , , dynamicTestData.whale, dynamicTestData.GP, ...dynamicTestData.LPs] =
      await ethers.getSigners();

    dynamicTestData.dai = await (await ethers.getContractFactory('Token'))
      .connect(dynamicTestData.whale)
      .deploy(parseUnits('100000000', 18));

    // Add all necessary Records
    // `base = 5` - steps for businessCases with multiple LPs
    await addSteps(
      preprocessorAddr,
      businessCaseSteps(
        dynamicTestData.GP.address,
        [dynamicTestData.LPs[0].address, dynamicTestData.LPs[1].address],
        '5'
      ),
      agreementAddr,
      multisig
    );

    const LAST_BLOCK_TIMESTAMP = (
      await ethers.provider.getBlock(await ethers.provider.getBlockNumber())
    ).timestamp;

    dynamicTestData.PLACEMENT_DATE = LAST_BLOCK_TIMESTAMP + ONE_MONTH; // NEXT_MONTH
    dynamicTestData.CLOSING_DATE = LAST_BLOCK_TIMESTAMP + 2 * ONE_MONTH; // NEXT_TWO_MONTH
  });

  beforeEach(async () => {
    snapshotId = await network.provider.send('evm_snapshot');
  });

  afterEach(async () => {
    await network.provider.send('evm_revert', [snapshotId]);
  });
});

const tests = {
  'Lifecycle Test Multiple LPs': [
    {
      base: '5',
      name: 'Scenario 1: LPs deposit; GP balances; Profit Realized',
      dynamicTestData,
      GP_INITIAL: parseUnits('20', 18),
      LP_INITIAL_ARR: [parseUnits('300', 18), parseUnits('900', 18)],
      INITIAL_FUNDS_TARGET: parseUnits('1000', 18),
      CAPITAL_LOSS: parseUnits('0', 18),
      CAPITAL_GAINS: parseUnits('200', 18),
      DEPOSIT_MIN_PERCENT: 2,
      PURCHASE_PERCENT: 91,
      MANAGEMENT_FEE_PERCENTAGE: 2,
      HURDLE: 9,
      PROFIT_PART: 20,
      GP_FAILS_TO_DO_GAP_DEPOSIT: false,
      get suiteInstance() {
        return Suite.create(parentSuite, this.name);
      },
    },
  ],
};

(Object.keys(tests) as (keyof typeof tests)[]).forEach((testBlockName) => {
  for (const test of tests[testBlockName]) {
    businessCaseTest(test);
  }
});

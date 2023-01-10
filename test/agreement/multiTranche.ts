import * as hre from 'hardhat';
import { expect } from 'chai';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { parseEther } from 'ethers/lib/utils';
import { addSteps, hex4Bytes } from '../utils/utils';
import {
  deployAgreement,
  deployOpcodeLibs,
  deployParser,
  deployPreprocessor,
} from '../../scripts/utils/deploy.utils';
import {
  aliceAndBobSteps,
  aliceBobAndCarl,
  aliceAndAnybodySteps,
  oneEthToBobSteps,
} from '../../scripts/data/agreement';
import { AgreementMock, ERC20Token } from '../../typechain-types';
import { anyone, ONE_DAY, ONE_MONTH } from '../utils/constants';
import { MultisigMock } from '../../typechain-types/agreement/mocks/MultisigMock';
import { deployAgreementMock } from '../../scripts/utils/deploy.utils.mock';
import { setRecord, parse, activateRecord } from '../../scripts/utils/update.record.mock';

const { ethers, network } = hre;

/**
 * Multi Tranche Agreement Template contract tests
 */
describe.only('Multi Tranche', () => {
  let creator: SignerWithAddress;
  let investor1: SignerWithAddress;
  let investor2: SignerWithAddress;
  let investor3: SignerWithAddress;
  let tokenAddr: string;
  let NEXT_MONTH: number;
  let app: AgreementMock;
  let token: ERC20Token;
  let snapshotId: number;

  before(async () => {
    [creator, investor1, investor2, investor3] = await ethers.getSigners();

    const LAST_BLOCK_TIMESTAMP = (
      await ethers.provider.getBlock(await ethers.provider.getBlockNumber())
    ).timestamp;
    NEXT_MONTH = LAST_BLOCK_TIMESTAMP + ONE_MONTH;

    await deployPreprocessor(hre);
    // Deploy Token contract
    token = await (await ethers.getContractFactory('Token'))
      .connect(creator)
      .deploy(ethers.utils.parseEther('1000'));
    await token.deployed();
    tokenAddr = token.address;
  });

  beforeEach(async () => {
    snapshotId = await network.provider.send('evm_snapshot');
  });

  afterEach(async () => {
    // Return to the snapshot
    await network.provider.send('evm_revert', [snapshotId]);
  });

  it('mint token inside multitranch contract', async () => {
    // 1. Governance contract is deployed; it will be an owner of Agreement.
    const [
      comparisonOpcodesLibAddr,
      branchingOpcodesLibAddr,
      logicalOpcodesLibAddr,
      otherOpcodesLibAddr,
    ] = await deployOpcodeLibs(hre);
    const multisig = await (await ethers.getContractFactory('MultisigMock')).deploy();
    const [appAddr, parserAddr, executorLibAddr, preprAddr] = await deployAgreementMock(
      hre,
      multisig.address
    );
    app = await ethers.getContractAt('AgreementMock', appAddr);
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
      NEXT_MONTH,
      app.address,
      investor1.address
    );
    await multiTranche.deployed();
    expect(await token.balanceOf(creator.address)).to.equal('1000000000000000000000');
    await token.connect(creator).approve(app.address, '100');
    const alowance = await token.allowance(creator.address, app.address);
    expect(await token.allowance(creator.address, app.address)).to.equal('100');
    const record = {
      recordId: 1,
      requiredRecords: [],
      signatories: [creator.address],
      transactionStr: 'transferFrom USDC_ADDR MSG_SENDER MULTI_TRANCHE_ADDR 100',
      conditionStrings: ['bool true'],
    };

    console.log('USDC_ADDR', hex4Bytes('USDC_ADDR'));
    console.log('MULTI_TRANCHE_ADDR', hex4Bytes('MULTI_TRANCHE_ADDR'));
    console.log('WUSDC_ADDR', hex4Bytes('WUSDC_ADDR'));
    console.log('ALLOWANCE', hex4Bytes('ALLOWANCE'));

    // await app.setStorageAddress(hex4Bytes('USDC_ADDR'), tokenAddr);
    // await app.setStorageAddress(hex4Bytes('MULTI_TRANCHE_ADDR'), multiTranche.address);
    // await app.setStorageAddress(hex4Bytes('WUSDC_ADDR'), multiTranche.wrappedUSDC1());
    // await app.setStorageUint256(hex4Bytes('ALLOWANCE'), alowance.toNumber());

    // await setRecord(record, app);
    // await activateRecord(app, multisig, 1);
    // await parse(app, preprAddr);
    // await app.connect(creator).execute(1)
    // // await expect(await app.connect(creator).execute(1)).to.changeEtherBalance(
    // //   multiTranche.address,
    // //   ethers.provider.getSigner(app.address),
    // //   10
    // // );
    // expect(await token.balanceOf(creator.address)).to.equal('999999999999999999900');
  });
});

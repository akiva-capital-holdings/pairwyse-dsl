import * as hre from 'hardhat';
import { expect } from 'chai';
import { BaseApplication } from '../../../../typechain-types';
import { hex4Bytes } from '../../../utils/utils';
import { deployBaseMock } from '../../../../scripts/utils/deploy.utils.mock';
import { DSLContextMock, ProgramContextMock } from '../../../../typechain-types/dsl/mocks';
import { deployOpcodeLibs } from '../../../../scripts/utils/deploy.utils';

const { ethers, network } = hre;

describe('DSL: math', () => {
  let ctx: DSLContextMock;
  let ctxProgram: ProgramContextMock;
  let app: BaseApplication;
  let snapshotId: number;

  before(async () => {
    // Deploy libraries
    const [
      comparisonOpcodesLibAddr,
      branchingOpcodesLibAddr,
      logicalOpcodesLibAddr,
      otherOpcodesLibAddr,
      complexOpcodesLibAddr,
    ] = await deployOpcodeLibs(hre);

    const [parserAddr, executorLibAddr, preprAddr] = await deployBaseMock(hre);

    // Deploy Context & setup
    ctx = await (
      await ethers.getContractFactory('DSLContextMock')
    ).deploy(
      comparisonOpcodesLibAddr,
      branchingOpcodesLibAddr,
      logicalOpcodesLibAddr,
      otherOpcodesLibAddr,
      complexOpcodesLibAddr
    );
    ctxProgram = await (await ethers.getContractFactory('ProgramContextMock')).deploy();
    // Deploy BaseApplication
    app = await (
      await ethers.getContractFactory('BaseApplication', {
        libraries: { Executor: executorLibAddr },
      })
    ).deploy(parserAddr, preprAddr, ctx.address, ctxProgram.address);

    await ctxProgram.setAppAddress(app.address);
  });

  beforeEach(async () => {
    snapshotId = await network.provider.send('evm_snapshot');
  });

  afterEach(async () => {
    await network.provider.send('evm_revert', [snapshotId]);
  });

  describe('division case', () => {
    it('division by zero error', async () => {
      await app.parse('5 / 0');
      await expect(app.execute()).to.be.revertedWith('EXC3');
    });

    it('division by zero error with uint256 types', async () => {
      await app.parse('uint256 5 / uint256 0');
      await expect(app.execute()).to.be.revertedWith('EXC3');
    });

    it('division by zero error from variables', async () => {
      await app['setStorageUint256(bytes32,uint256)'](hex4Bytes('NUM1'), 10);
      await app['setStorageUint256(bytes32,uint256)'](hex4Bytes('NUM2'), 0);
      await app.parse('var NUM1 / var NUM2');
      await expect(app.execute()).to.be.revertedWith('EXC3');
    });

    it('division zero by zero error', async () => {
      await app.parse('0 / 0');
      await expect(app.execute()).to.be.revertedWith('EXC3');

      await app.parse('uint256 0 / uint256 0');
      await expect(app.execute()).to.be.revertedWith('EXC3');

      await app['setStorageUint256(bytes32,uint256)'](hex4Bytes('NUM1'), 0);
      await app['setStorageUint256(bytes32,uint256)'](hex4Bytes('NUM2'), 0);
      await app.parse('var NUM1 / var NUM2');
      await expect(app.execute()).to.be.revertedWith('EXC3');
    });

    it('should divide zero by number', async () => {
      await app.parse('0 / 1');
      await app.execute();
    });

    it('should divide zero by number with uint256', async () => {
      await app.parse('uint256 0 / uint256 1');
      await app.execute();
    });

    it('should divide zero by number from variables', async () => {
      await app['setStorageUint256(bytes32,uint256)'](hex4Bytes('NUM1'), 0);
      await app['setStorageUint256(bytes32,uint256)'](hex4Bytes('NUM2'), 1);
      await app.parse('var NUM1 / var NUM2');
      await app.execute();
    });
  });

  describe('underflow case', () => {
    it('negative number error', async () => {
      await app.parse('uint256 5 - uint256 6');
      await expect(app.execute()).to.be.revertedWith('EXC3');

      await app['setStorageUint256(bytes32,uint256)'](hex4Bytes('NUM1'), 10);
      await app['setStorageUint256(bytes32,uint256)'](hex4Bytes('NUM2'), 1000);
      await app.parse('var NUM1 - var NUM2');
      await expect(app.execute()).to.be.revertedWith('EXC3');
    });

    it('returns error if the first number is 0', async () => {
      await app.parse('0 - 1');
      await expect(app.execute()).to.be.revertedWith('EXC3');

      await app.parse('uint256 0 - uint256 1');
      await expect(app.execute()).to.be.revertedWith('EXC3');

      await app['setStorageUint256(bytes32,uint256)'](hex4Bytes('NUM1'), 0);
      await app['setStorageUint256(bytes32,uint256)'](hex4Bytes('NUM2'), 1);
      await app.parse('var NUM1 - var NUM2');
      await expect(app.execute()).to.be.revertedWith('EXC3');
    });

    it('no errors if both numbers are 0', async () => {
      await app.parse('0 - 0');
      await app.execute();

      await app.parse('uint256 0 - uint256 0');
      await app.execute();

      await app['setStorageUint256(bytes32,uint256)'](hex4Bytes('NUM1'), 0);
      await app['setStorageUint256(bytes32,uint256)'](hex4Bytes('NUM2'), 0);
      await app.parse('var NUM1 - var NUM2');
      await app.execute();
    });
  });

  describe('overflow case', () => {
    const MAX_UINT256 = ethers.constants.MaxUint256;
    const PRE_MAX_UINT256 = MAX_UINT256.sub(1);

    it('can not be added a maximum uint256 value to a simple one', async () => {
      await app.parse(`${MAX_UINT256} + 1`);
      await expect(app.execute()).to.be.revertedWith('EXC3');

      await app.parse(`uint256 ${MAX_UINT256} + uint256 1`);
      await expect(app.execute()).to.be.revertedWith('EXC3');
    });

    it('can not to be added a simple uint256 value to a maximum one', async () => {
      await app.parse(`1 + ${MAX_UINT256}`);
      await expect(app.execute()).to.be.revertedWith('EXC3');

      await app.parse(`uint256 1 + uint256 ${MAX_UINT256}`);
      await expect(app.execute()).to.be.revertedWith('EXC3');
    });

    it('can not to be added a maximum uint256 value to the maximum one', async () => {
      await app.parse(`${MAX_UINT256} + ${MAX_UINT256}`);
      await expect(app.execute()).to.be.revertedWith('EXC3');

      await app.parse(`uint256 ${MAX_UINT256} + uint256 ${MAX_UINT256}`);
      await expect(app.execute()).to.be.revertedWith('EXC3');
    });

    it('can be added a pre maximum uint256 value to the simple one', async () => {
      await app.parse(`${PRE_MAX_UINT256} + 1`);
      await app.execute();

      await app.parse(`uint256 ${PRE_MAX_UINT256} + uint256 1`);
      await app.execute();
    });

    it('can be added a simple uint256 value to pre maximum one', async () => {
      await app.parse(`1 + ${PRE_MAX_UINT256}`);
      await app.execute();

      await app.parse(`uint256 1 + uint256 ${PRE_MAX_UINT256}`);
      await app.execute();
    });

    // eslint-disable-next-line no-multi-str
    it('reverts if add a pre maximum uint256 value to the simple one that is bigger then \
  uint256', async () => {
      await app.parse(`${PRE_MAX_UINT256} + 2`);
      await expect(app.execute()).to.be.revertedWith('EXC3');

      await app.parse(`uint256 ${PRE_MAX_UINT256} + uint256 2`);
      await expect(app.execute()).to.be.revertedWith('EXC3');
    });

    it('no errors if both numbers are 0', async () => {
      await app.parse('0 + 0');
      await app.execute();

      await app.parse('uint256 0 + uint256 0');
      await app.execute();

      await app['setStorageUint256(bytes32,uint256)'](hex4Bytes('NUM1'), 0);
      await app['setStorageUint256(bytes32,uint256)'](hex4Bytes('NUM2'), 0);
      await app.parse('var NUM1 + var NUM2');
      await app.execute();
    });
  });
});

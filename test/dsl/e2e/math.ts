import { ethers } from 'hardhat';
import { expect } from 'chai';
import { App, Context, Parser } from '../../../typechain-types';
import { hex4Bytes } from '../../utils/utils';

describe('DSL: math', () => {
  let ctx: Context;
  let app: App;
  let parser: Parser;

  before(async () => {
    // Deploy libraries
    const opcodeHelpersLib = await (await ethers.getContractFactory('OpcodeHelpers')).deploy();
    const comparisonOpcodesLib = await (
      await ethers.getContractFactory('ComparisonOpcodes', {
        libraries: {
          OpcodeHelpers: opcodeHelpersLib.address,
        },
      })
    ).deploy();
    const branchingOpcodesLib = await (
      await ethers.getContractFactory('BranchingOpcodes', {
        libraries: {
          OpcodeHelpers: opcodeHelpersLib.address,
        },
      })
    ).deploy();
    const logicalOpcodesLib = await (
      await ethers.getContractFactory('LogicalOpcodes', {
        libraries: {
          OpcodeHelpers: opcodeHelpersLib.address,
        },
      })
    ).deploy();
    const otherOpcodesLib = await (
      await ethers.getContractFactory('OtherOpcodes', {
        libraries: {
          OpcodeHelpers: opcodeHelpersLib.address,
        },
      })
    ).deploy();
    const stringLib = await (await ethers.getContractFactory('StringUtils')).deploy();
    const byteLib = await (await ethers.getContractFactory('ByteUtils')).deploy();
    const executorLib = await (await ethers.getContractFactory('Executor')).deploy();

    // Deploy Preprocessor
    const preprocessor = await (
      await ethers.getContractFactory('Preprocessor', {
        libraries: { StringUtils: stringLib.address },
      })
    ).deploy();

    // Deploy Parser
    const ParserCont = await ethers.getContractFactory('Parser', {
      libraries: { StringUtils: stringLib.address, ByteUtils: byteLib.address },
    });
    parser = await ParserCont.deploy(preprocessor.address);

    // Deploy Context & setup
    ctx = await (await ethers.getContractFactory('Context')).deploy();
    await ctx.setComparisonOpcodesAddr(comparisonOpcodesLib.address);
    await ctx.setBranchingOpcodesAddr(branchingOpcodesLib.address);
    await ctx.setLogicalOpcodesAddr(logicalOpcodesLib.address);
    await ctx.setOtherOpcodesAddr(otherOpcodesLib.address);

    // Deploy Application
    app = await (
      await ethers.getContractFactory('App', { libraries: { Executor: executorLib.address } })
    ).deploy(parser.address, ctx.address);
  });

  describe('division case', () => {
    it('division by zero error', async () => {
      await app.parse('5 / 0');
      await expect(app.execute()).to.be.revertedWith('EXC3');

      await app.parse('uint256 5 / uint256 0');
      await expect(app.execute()).to.be.revertedWith('EXC3');

      await app.setStorageUint256(hex4Bytes('NUM1'), 10);
      await app.setStorageUint256(hex4Bytes('NUM2'), 0);
      await app.parse('loadLocal uint256 NUM1 / loadLocal uint256 NUM2');
      await expect(app.execute()).to.be.revertedWith('EXC3');
    });

    it('division zero by zero error', async () => {
      await app.parse('0 / 0');
      await expect(app.execute()).to.be.revertedWith('EXC3');

      await app.parse('uint256 0 / uint256 0');
      await expect(app.execute()).to.be.revertedWith('EXC3');

      await app.setStorageUint256(hex4Bytes('NUM1'), 0);
      await app.setStorageUint256(hex4Bytes('NUM2'), 0);
      await app.parse('loadLocal uint256 NUM1 / loadLocal uint256 NUM2');
      await expect(app.execute()).to.be.revertedWith('EXC3');
    });

    it('should divide zero by number', async () => {
      await app.parse('0 / 1');
      await app.execute();

      await app.parse('uint256 0 / uint256 1');
      await app.execute();

      await app.setStorageUint256(hex4Bytes('NUM1'), 0);
      await app.setStorageUint256(hex4Bytes('NUM2'), 1);
      await app.parse('loadLocal uint256 NUM1 / loadLocal uint256 NUM2');
      await app.execute();
    });
  });

  describe('underflow case', () => {
    it('negative number error', async () => {
      await app.parse('uint256 5 - uint256 6');
      await expect(app.execute()).to.be.revertedWith('EXC3');

      await app.setStorageUint256(hex4Bytes('NUM1'), 10);
      await app.setStorageUint256(hex4Bytes('NUM2'), 1000);
      await app.parse('loadLocal uint256 NUM1 - loadLocal uint256 NUM2');
      await expect(app.execute()).to.be.revertedWith('EXC3');
    });

    it('returns error if the first number is 0', async () => {
      await app.parse('0 - 1');
      await expect(app.execute()).to.be.revertedWith('EXC3');

      await app.parse('uint256 0 - uint256 1');
      await expect(app.execute()).to.be.revertedWith('EXC3');

      await app.setStorageUint256(hex4Bytes('NUM1'), 0);
      await app.setStorageUint256(hex4Bytes('NUM2'), 1);
      await app.parse('loadLocal uint256 NUM1 - loadLocal uint256 NUM2');
      await expect(app.execute()).to.be.revertedWith('EXC3');
    });

    it('no errors if both numbers are 0', async () => {
      await app.parse('0 - 0');
      await app.execute();

      await app.parse('uint256 0 - uint256 0');
      await app.execute();

      await app.setStorageUint256(hex4Bytes('NUM1'), 0);
      await app.setStorageUint256(hex4Bytes('NUM2'), 0);
      await app.parse('loadLocal uint256 NUM1 - loadLocal uint256 NUM2');
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

      await app.setStorageUint256(hex4Bytes('NUM1'), 0);
      await app.setStorageUint256(hex4Bytes('NUM2'), 0);
      await app.parse('loadLocal uint256 NUM1 + loadLocal uint256 NUM2');
      await app.execute();
    });
  });
});

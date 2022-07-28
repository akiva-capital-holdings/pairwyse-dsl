import { expect } from 'chai';
import { ethers } from 'hardhat';
/* eslint-disable camelcase */
import {
  Stack__factory,
  StackValue__factory,
  Context,
  Stack,
  OtherOpcodesMock,
  ERC20Mintable,
  Storage,
} from '../../../../typechain-types';
import { checkStack, checkStackTailv2, hex4Bytes, uint256StrToHex } from '../../../utils/utils';

describe('Other opcodes', () => {
  let StackCont: Stack__factory;
  let StackValue: StackValue__factory;
  /* eslint-enable camelcase */
  let app: OtherOpcodesMock;
  let anotherApp: Storage;
  let ctx: Context;
  let ctxAddr: string;
  let stack: Stack;
  let testERC20: ERC20Mintable;

  before(async () => {
    StackCont = (await ethers.getContractFactory('Stack')) as Stack__factory;
    StackValue = (await ethers.getContractFactory('StackValue')) as StackValue__factory;

    ctx = (await (await ethers.getContractFactory('Context')).deploy()) as Context;
    ctxAddr = ctx.address;

    // Deploy libraries
    const opcodeHelpersLib = await (await ethers.getContractFactory('OpcodeHelpers')).deploy();
    const otherOpcodesLib = await (
      await ethers.getContractFactory('OtherOpcodes', {
        libraries: { OpcodeHelpers: opcodeHelpersLib.address },
      })
    ).deploy();

    // Deploy OtherOpcodesMock
    app = (await (
      await ethers.getContractFactory('OtherOpcodesMock', {
        libraries: { OtherOpcodes: otherOpcodesLib.address },
      })
    ).deploy()) as OtherOpcodesMock;

    // Create Stack instance
    const stackAddr = await ctx.stack();
    stack = (await ethers.getContractAt('Stack', stackAddr)) as Stack;

    // Deploy Storage contract to simulate another app (needed for testing loadRemove opcodes)
    anotherApp = (await (await ethers.getContractFactory('Storage')).deploy()) as Storage;

    // Setup
    await ctx.initOpcodes();
    await ctx.setAppAddress(app.address);
    await ctx.setOtherOpcodesAddr(otherOpcodesLib.address);

    // Deploy test ERC20 and mint some to ctx
    testERC20 = (await (
      await ethers.getContractFactory('ERC20Mintable')
    ).deploy('Test', 'TST')) as ERC20Mintable;
  });

  afterEach(async () => {
    await ctx.setPc(0);
    await stack.clear();
  });

  it('opLoadLocalAny', async () => {
    await ctx.setProgram('0x1a');
    await expect(app.opLoadLocalAny(ctxAddr)).to.be.revertedWith(
      'Opcodes: mustCall call not success'
    );
  });

  it('opLoadLocalGet', async () => {
    await ctx.setProgram('0x1a000000');
    await expect(app.opLoadLocalGet(ctxAddr, 'hey()')).to.be.revertedWith(
      'Opcodes: opLoadLocal call not success'
    );
  });

  it('opLoadRemote', async () => {
    const ctxAddrCut = ctxAddr.substring(2);
    await ctx.setProgram(`0x1a000000${ctxAddrCut}`);
    await expect(app.opLoadRemote(ctxAddr, 'hey()')).to.be.revertedWith(
      'Opcodes: opLoadRemote call not success'
    );
  });

  it('opLoadRemoteAny', async () => {});

  describe('block', () => {
    it('blockNumber', async () => {
      const ctxStackAddress = await ctx.stack();
      StackCont.attach(ctxStackAddress);

      // 0x05 is NUMBER
      await ctx.setProgram('0x15');

      const opBlockResult = await app.opBlockNumber(ctxAddr);

      // stack size is 1
      expect(await stack.length()).to.equal(1);

      // get result
      const svResultAddress = await stack.stack(0);
      const svResult = StackValue.attach(svResultAddress);

      expect(await svResult.getUint256()).to.equal(opBlockResult.blockNumber);
    });

    // Block timestamp doesn't work because Hardhat doesn't return timestamp
    it('blockTimestamp', async () => {
      const ctxStackAddress = await ctx.stack();
      StackCont.attach(ctxStackAddress);

      // 0x16 is Timestamp
      await ctx.setProgram('0x16');

      await app.opBlockTimestamp(ctxAddr);

      // stack size is 1
      expect(await stack.length()).to.equal(1);

      // get result
      const svResultAddress = await stack.stack(0);
      const svResult = StackValue.attach(svResultAddress);

      const lastBlockTimestamp = (
        await ethers.provider.getBlock(
          // eslint-disable-next-line no-underscore-dangle
          ethers.provider._lastBlockNumber /* it's -2 but the resulting block number is correct */
        )
      ).timestamp;

      expect((await svResult.getUint256()).toNumber()).to.be.approximately(
        lastBlockTimestamp,
        1000
      );
    });

    // Block TIME doesn't work because Hardhat doesn't return timestamp
    it('TIME', async () => {
      // TIME is an alias for blockTimestamp
      const ctxStackAddress = await ctx.stack();
      StackCont.attach(ctxStackAddress);

      // 0x30 is TIME
      await ctx.setProgram('0x30');

      await app.opBlockTimestamp(ctxAddr);

      // stack size is 1
      expect(await stack.length()).to.equal(1);

      // get result
      const svResultAddress = await stack.stack(0);
      const svResult = StackValue.attach(svResultAddress);

      const lastBlockTimestamp = (
        await ethers.provider.getBlock(
          // eslint-disable-next-line no-underscore-dangle
          ethers.provider._lastBlockNumber /* it's -2 but the resulting block number is correct */
        )
      ).timestamp;

      expect((await svResult.getUint256()).toNumber()).to.be.approximately(
        lastBlockTimestamp,
        1000
      );
    });

    it('blockChainId', async () => {
      const ctxStackAddress = await ctx.stack();
      StackCont.attach(ctxStackAddress);

      // 0x17 is ChainID
      await ctx.setProgram('0x17');

      const opBlockResult = await app.opBlockChainId(ctxAddr);

      // stack size is 1
      expect(await stack.length()).to.equal(1);

      // get result
      const svResultAddress = await stack.stack(0);
      const svResult = StackValue.attach(svResultAddress);

      expect(await svResult.getUint256()).to.equal(opBlockResult.chainId);
    });
  });

  it('opMsgSender', async () => {
    const [first, second] = await ethers.getSigners();

    await app.opMsgSender(ctxAddr);
    await checkStack(StackValue, stack, 1, 0);
    await stack.clear();

    await ctx.setMsgSender(first.address);
    await app.opMsgSender(ctxAddr);
    await checkStack(StackValue, stack, 1, first.address);
    await stack.clear();

    await ctx.setMsgSender(second.address);
    await app.opMsgSender(ctxAddr);
    await checkStack(StackValue, stack, 1, second.address);
  });

  it('opLoadLocalUint256', async () => {
    const testValue = 1;
    const bytes32TestValueName = hex4Bytes('NUMBER');

    await app.setStorageUint256(bytes32TestValueName, testValue);

    const number = bytes32TestValueName.substring(2, 10);
    await ctx.setProgram(`0x${number}`);

    await app.opLoadLocalUint256(ctxAddr);
    await checkStackTailv2(StackValue, stack, [testValue]);
  });

  it('opLoadLocalBytes32', async () => {
    const testValue = hex4Bytes('123456');
    const bytes32TestValueName = hex4Bytes('BYTES');

    await app.setStorageBytes32(bytes32TestValueName, testValue);

    const bytes = bytes32TestValueName.substring(2, 10);
    await ctx.setProgram(`0x${bytes}`);

    await app.opLoadLocalBytes32(ctxAddr);
    await checkStackTailv2(StackValue, stack, [testValue]);
  });

  it('opLoadLocalBool', async () => {
    const testValue = true;
    const bytes32TestValueName = hex4Bytes('BOOL');

    await app.setStorageBool(bytes32TestValueName, testValue);

    const bool = bytes32TestValueName.substring(2, 10);
    await ctx.setProgram(`0x${bool}`);

    await app.opLoadLocalBool(ctxAddr);
    await checkStackTailv2(StackValue, stack, [+testValue]);
  });

  it('opLoadLocalAddress', async () => {
    const [addr] = await ethers.getSigners();
    const testValue = addr.address;
    const bytes32TestValueName = hex4Bytes('ADDRESS');

    await app.setStorageAddress(bytes32TestValueName, testValue);

    const address = bytes32TestValueName.substring(2, 10);
    await ctx.setProgram(`0x${address}`);

    await app.opLoadLocalAddress(ctxAddr);
    await checkStackTailv2(StackValue, stack, [testValue]);
  });

  it('opLoadRemoteUint256', async () => {
    const testValue = 1;
    const bytes32TestValueName = hex4Bytes('NUMBER');

    await anotherApp.setStorageUint256(bytes32TestValueName, testValue);

    const number = bytes32TestValueName.substring(2, 10);

    await ctx.setProgram(`0x${number}${anotherApp.address.substring(2)}`);
    await app.opLoadRemoteUint256(ctxAddr);
    await checkStackTailv2(StackValue, stack, [testValue]);
  });

  it('opLoadRemoteBytes32', async () => {
    const testValue = hex4Bytes('123456');
    const bytes32TestValueName = hex4Bytes('BYTES');

    await anotherApp.setStorageBytes32(bytes32TestValueName, testValue);

    const bytes = bytes32TestValueName.substring(2, 10);
    await ctx.setProgram(`0x${bytes}${anotherApp.address.substring(2)}`);
    await app.opLoadRemoteBytes32(ctxAddr);
    await checkStackTailv2(StackValue, stack, [testValue]);
  });

  it('opLoadRemoteBool', async () => {
    const testValue = true;
    const bytes32TestValueName = hex4Bytes('BOOLEAN');

    await anotherApp.setStorageBool(bytes32TestValueName, testValue);

    const bool = bytes32TestValueName.substring(2, 10);
    await ctx.setProgram(`0x${bool}${anotherApp.address.substring(2)}`);
    await app.opLoadRemoteBool(ctxAddr);
    await checkStackTailv2(StackValue, stack, [+testValue]);
  });

  it('opLoadRemoteAddress', async () => {
    const [addr1] = await ethers.getSigners();
    const testValue = addr1.address;
    const bytes32TestValueName = hex4Bytes('ADDRESS');

    await anotherApp.setStorageAddress(bytes32TestValueName, testValue);

    const addr = bytes32TestValueName.substring(2, 10);
    await ctx.setProgram(`0x${addr}${anotherApp.address.substring(2)}`);
    await app.opLoadRemoteAddress(ctxAddr);
    await checkStackTailv2(StackValue, stack, [testValue]);
  });

  it('opBool', async () => {
    await ctx.setProgram('0x01');
    await app.opBool(ctxAddr);
    await checkStackTailv2(StackValue, stack, ['0x01']);
  });

  it('opUint256', async () => {
    await ctx.setProgram('0x0000000000000000000000000000000000000000000000000000000000000001');
    await app.opUint256(ctxAddr);
    await checkStackTailv2(StackValue, stack, ['1']);
  });

  it('opSendEth', async () => {
    const [receiver] = await ethers.getSigners();

    const fundAmountUint = 1e8;
    const fundAmountHex = uint256StrToHex(fundAmountUint);

    await (
      await receiver.sendTransaction({
        from: receiver.address,
        to: app.address,
        value: `0x${fundAmountHex}`,
      })
    ).wait();

    const testAddress = receiver.address;

    const bytes32TestAddressName = hex4Bytes('ADDRESS');

    await app.setStorageAddress(bytes32TestAddressName, testAddress);

    const address = bytes32TestAddressName.substring(2, 10);
    await ctx.setProgram(`0x${address}${fundAmountHex}`);

    await expect(() => app.opSendEth(ctxAddr)).to.changeEtherBalance(receiver, fundAmountUint);
    await checkStackTailv2(StackValue, stack, ['1']);
  });

  it('opTransfer', async () => {
    const [receiver] = await ethers.getSigners();
    const testAmount = '10000000';

    await testERC20.mint(app.address, testAmount);

    const bytes32TestAddressName1 = hex4Bytes('ADDRESS1');
    const bytes32TestAddressName2 = hex4Bytes('ADDRESS2');

    await app.setStorageAddress(bytes32TestAddressName1, testERC20.address);
    await app.setStorageAddress(bytes32TestAddressName2, receiver.address);

    const address1 = bytes32TestAddressName1.substring(2, 10);
    const address2 = bytes32TestAddressName2.substring(2, 10);
    await ctx.setProgram(`0x${address1}${address2}${uint256StrToHex(testAmount)}`);

    await app.opTransfer(ctxAddr);
    await checkStackTailv2(StackValue, stack, ['1']);

    const balanceOfReceiver = await testERC20.balanceOf(receiver.address);

    expect(balanceOfReceiver).to.be.equal(testAmount);
  });

  it('opTransferFrom', async () => {
    const [sender, receiver] = await ethers.getSigners();
    const testAmount = '1000';

    await testERC20.mint(sender.address, testAmount);
    await testERC20.approve(app.address, testAmount, { from: sender.address });

    const bytes32TestAddressName1 = hex4Bytes('ADDRESS1');
    const bytes32TestAddressName2 = hex4Bytes('ADDRESS2');
    const bytes32TestAddressName3 = hex4Bytes('ADDRESS3');

    await app.setStorageAddress(bytes32TestAddressName1, testERC20.address);
    await app.setStorageAddress(bytes32TestAddressName2, sender.address);
    await app.setStorageAddress(bytes32TestAddressName3, receiver.address);

    const address1 = bytes32TestAddressName1.substring(2, 10);
    const address2 = bytes32TestAddressName2.substring(2, 10);
    const address3 = bytes32TestAddressName3.substring(2, 10);

    await ctx.setProgram(`0x${address1}${address2}${address3}${uint256StrToHex(testAmount)}`);

    await app.opTransferFrom(ctxAddr);
    await checkStackTailv2(StackValue, stack, ['1']);

    const balanceOfReceiver = await testERC20.balanceOf(receiver.address);

    expect(balanceOfReceiver).to.be.equal(testAmount);
  });

  it('opUint256Get', async () => {
    const testAmount = '1000';

    await ctx.setProgram(`0x${uint256StrToHex(testAmount)}`);

    const result = await app.callStatic.opUint256Get(ctxAddr);

    expect(result).to.be.equal(testAmount);
  });

  it('opLoadLocalGet', async () => {
    const testValue = hex4Bytes('TEST_VALUE');
    const bytes32TestValueName = hex4Bytes('BYTES32');
    const testSignature = 'getStorageBytes32(bytes32)';

    await app.setStorageBytes32(bytes32TestValueName, testValue);

    const bytes = bytes32TestValueName.substring(2, 10);
    await ctx.setProgram(`0x${bytes}`);

    const result = await app.callStatic.opLoadLocalGet(ctxAddr, testSignature);

    expect(result).to.be.equal(testValue);
  });

  it('opAddressGet', async () => {
    const [someAccount] = await ethers.getSigners();
    const testAddress = someAccount.address;

    await ctx.setProgram(`0x${testAddress.substring(2)}`);

    const result = await app.callStatic.opAddressGet(ctxAddr);

    expect(result).to.be.equal(testAddress);
  });

  it('opLoadLocal', async () => {
    const testValue = hex4Bytes('TEST_VALUE');
    const bytes32TestValueName = hex4Bytes('BYTES32');
    const testSignature = 'getStorageBytes32(bytes32)';

    const bytes = bytes32TestValueName.substring(2, 10);
    await ctx.setProgram(`0x${bytes}`);

    await app.setStorageBytes32(bytes32TestValueName, testValue);
    await app.opLoadLocal(ctxAddr, testSignature);

    checkStackTailv2(StackValue, stack, [testValue]);
  });

  it('opLoadRemote', async () => {
    const testValue = hex4Bytes('123456');
    const bytes32TestValueName = hex4Bytes('BYTES');
    const testSignature = 'getStorageBytes32(bytes32)';

    await anotherApp.setStorageBytes32(bytes32TestValueName, testValue);

    const bytes = bytes32TestValueName.substring(2, 10);
    await ctx.setProgram(`0x${bytes}${anotherApp.address.substring(2)}`);
    await app.opLoadRemote(ctxAddr, testSignature);
    await checkStackTailv2(StackValue, stack, [testValue]);
  });
});

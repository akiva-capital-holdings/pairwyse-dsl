import { ethers } from 'hardhat';
import { expect } from 'chai';
import { BigNumber } from 'ethers';

/* eslint-disable camelcase */
import {
  Stack__factory,
  Context,
  Stack,
  OtherOpcodesMock,
  ERC20Mintable,
  BaseStorage,
} from '../../../../typechain-types';
import {
  checkStack,
  checkStackTailv2,
  hex4Bytes,
  uint256StrToHex,
  pushToStack,
} from '../../../utils/utils';

describe('Other opcodes', () => {
  let StackCont: Stack__factory;
  /* eslint-enable camelcase */
  let app: OtherOpcodesMock;
  let clientApp: BaseStorage;
  let ctx: Context;
  let ctxAddr: string;
  let stack: Stack;
  let testERC20: ERC20Mintable;
  let uint256type: string;
  let addressType: string;
  const testAmount = '1000';
  const zero32bytes = '0x' + new Array(65).join('0');

  before(async () => {
    StackCont = await ethers.getContractFactory('Stack');

    ctx = await (await ethers.getContractFactory('Context')).deploy();
    ctxAddr = ctx.address;

    // Deploy libraries
    const opcodeHelpersLib = await (await ethers.getContractFactory('OpcodeHelpers')).deploy();
    const otherOpcodesLib = await (
      await ethers.getContractFactory('OtherOpcodes', {
        libraries: { OpcodeHelpers: opcodeHelpersLib.address },
      })
    ).deploy();

    // Deploy OtherOpcodesMock
    app = await (
      await ethers.getContractFactory('OtherOpcodesMock', {
        libraries: { OtherOpcodes: otherOpcodesLib.address },
      })
    ).deploy();

    // Create Stack instance
    const stackAddr = await ctx.stack();
    stack = await ethers.getContractAt('Stack', stackAddr);

    // Deploy Storage contract to simulate another app (needed for testing loadRemote opcodes)
    clientApp = await (await ethers.getContractFactory('BaseStorage')).deploy();

    // Setup
    await ctx.setAppAddress(clientApp.address);
    await ctx.setOtherOpcodesAddr(otherOpcodesLib.address);

    // Deploy test ERC20 and mint some to ctx
    testERC20 = await (await ethers.getContractFactory('ERC20Mintable')).deploy('Test', 'TST');

    uint256type = await ctx.branchCodes('declareArr', 'uint256');
    addressType = await ctx.branchCodes('declareArr', 'address');
  });

  afterEach(async () => {
    await ctx.setPc(0);
    await stack.clear();
  });

  // it('opLoadLocalAny', async () => {
  //   await ctx.setProgram('0x1a');
  //   await expect(app.opLoadLocalAny(ctxAddr)).to.be.revertedWith('OPH1');
  // });

  it('opLoadLocalGet', async () => {
    await ctx.setProgram('0x1a000000');
    await expect(app.opLoadLocalGet(ctxAddr, 'hey()')).to.be.revertedWith('OP5');
  });

  it('opLoadRemote', async () => {
    const ctxAddrCut = ctxAddr.substring(2);
    await ctx.setProgram(`0x1a000000${ctxAddrCut}`);
    await expect(app.opLoadRemote(ctxAddr, 'hey()')).to.be.revertedWith('OP3');
  });

  it('opLoadRemoteAny', async () => {
    await ctx.setProgram('0x1a');
    await expect(app.opLoadRemoteAny(ctxAddr)).to.be.revertedWith('OPH1');
  });

  describe('block', () => {
    it('blockNumber', async () => {
      const ctxStackAddress = await ctx.stack();
      StackCont.attach(ctxStackAddress);

      // 0x05 is NUMBER
      await ctx.setProgram('0x15');

      const opBlockResult = await app.opBlockNumber(ctxAddr);

      // stack size is 1
      expect(await stack.length()).to.equal(1);

      expect(await stack.seeLast()).to.equal(opBlockResult.blockNumber);
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

      const lastBlockTimestamp = (
        await ethers.provider.getBlock(
          // eslint-disable-next-line no-underscore-dangle
          ethers.provider._lastBlockNumber /* it's -2 but the resulting block number is correct */
        )
      ).timestamp;

      expect((await stack.seeLast()).toNumber()).to.be.approximately(lastBlockTimestamp, 1000);
    });

    // Block time doesn't work because Hardhat doesn't return timestamp
    it('time', async () => {
      // time is an alias for blockTimestamp
      const ctxStackAddress = await ctx.stack();
      StackCont.attach(ctxStackAddress);

      // 0x30 is time
      await ctx.setProgram('0x30');

      await app.opBlockTimestamp(ctxAddr);

      // stack size is 1
      expect(await stack.length()).to.equal(1);

      const lastBlockTimestamp = (
        await ethers.provider.getBlock(
          // eslint-disable-next-line no-underscore-dangle
          ethers.provider._lastBlockNumber /* it's -2 but the resulting block number is correct */
        )
      ).timestamp;

      expect((await stack.seeLast()).toNumber()).to.be.approximately(lastBlockTimestamp, 1000);
    });

    it('blockChainId', async () => {
      const ctxStackAddress = await ctx.stack();
      StackCont.attach(ctxStackAddress);

      // 0x17 is ChainID
      await ctx.setProgram('0x17');

      const opBlockResult = await app.opBlockChainId(ctxAddr);

      // stack size is 1
      expect(await stack.length()).to.equal(1);

      expect(await stack.seeLast()).to.equal(opBlockResult.chainId);
    });
  });

  it('opMsgSender', async () => {
    const [first, second] = await ethers.getSigners();

    await app.opMsgSender(ctxAddr);
    await checkStack(stack, 1, 0);
    await stack.clear();

    await ctx.setMsgSender(first.address);
    await app.opMsgSender(ctxAddr);
    await checkStack(stack, 1, first.address);
    await stack.clear();

    await ctx.setMsgSender(second.address);
    await app.opMsgSender(ctxAddr);
    await checkStack(stack, 1, second.address);
  });

  it('opMsgValue', async () => {
    await app.opMsgValue(ctxAddr);
    await checkStack(stack, 1, 0);
    await stack.clear();

    await ctx.setMsgValue(10);
    await app.opMsgValue(ctxAddr);
    await checkStack(stack, 1, 10);
    await stack.clear();

    await ctx.setMsgValue(25);
    await app.opMsgValue(ctxAddr);
    await checkStack(stack, 1, 25);
  });

  describe('opSetLocalBool', async () => {
    const bytes32VarName = hex4Bytes('BOOL_VAR');
    const bytesVarName = bytes32VarName.substring(2, 10);

    afterEach(async () => {
      await ctx.setPc(0);
      await stack.clear();
      await checkStackTailv2(stack, []);
    });

    it('error: opSetLocal call not success', async () => {
      await ctx.setProgram(`0x${bytesVarName}01`);
      const badContract = await (await ethers.getContractFactory('StorageWithRevert')).deploy();
      await ctx.setAppAddress(badContract.address);
      await expect(app.opSetLocalBool(ctxAddr)).to.be.revertedWith('OP1');
      await ctx.setAppAddress(clientApp.address);
    });

    it('success', async () => {
      await ctx.setProgram(`0x${bytesVarName}01`);
      await app.opSetLocalBool(ctxAddr);
      expect(await clientApp.getStorageBool(bytes32VarName)).to.equal(true);

      await ctx.setProgram(`0x${bytesVarName}00`);
      await app.opSetLocalBool(ctxAddr);
      expect(await clientApp.getStorageBool(bytes32VarName)).to.equal(false);
    });
  });

  describe('opSetUint256', async () => {
    const bytes32VarName = hex4Bytes('UINT256_VAR');
    const bytesVarName = bytes32VarName.substring(2, 10);

    afterEach(async () => {
      await ctx.setPc(0);
      await stack.clear();
      await checkStackTailv2(stack, []);
    });

    it('error: opSetLocal call not success', async () => {
      await pushToStack(ctx, StackCont, [15]);
      await ctx.setProgram(`0x${bytesVarName}`);

      const badContract = await (await ethers.getContractFactory('StorageWithRevert')).deploy();
      await ctx.setAppAddress(badContract.address);
      await expect(app.opSetUint256(ctxAddr)).to.be.revertedWith('OP1');
      await ctx.setAppAddress(clientApp.address);
    });

    it('success: regular number', async () => {
      await pushToStack(ctx, StackCont, [15]);
      await ctx.setProgram(`0x${bytesVarName}`);
      await app.opSetUint256(ctxAddr);
      expect(await clientApp.getStorageUint256(bytes32VarName)).to.equal(15);
    });

    it('success: big number', async () => {
      await pushToStack(ctx, StackCont, [ethers.utils.parseEther('100')]);
      await ctx.setProgram(`0x${bytesVarName}`);
      await app.opSetUint256(ctxAddr);
      expect(await clientApp.getStorageUint256(bytes32VarName)).to.equal(
        ethers.utils.parseEther('100')
      );
    });
  });

  it('opLoadLocalUint256', async () => {
    const testValue = 1;
    const bytes32TestValueName = hex4Bytes('NUMBER');

    await clientApp.setStorageUint256(bytes32TestValueName, testValue);

    const number = bytes32TestValueName.substring(2, 10);
    await ctx.setProgram(`0x${number}`);

    await app.opLoadLocalUint256(ctxAddr);
    await checkStackTailv2(stack, [testValue]);
  });

  it('opLoadRemoteUint256', async () => {
    const testValue = 1;
    const bytes32TestValueName = hex4Bytes('NUMBER');

    await clientApp.setStorageUint256(bytes32TestValueName, testValue);

    const number = bytes32TestValueName.substring(2, 10);

    await ctx.setProgram(`0x${number}${clientApp.address.substring(2)}`);
    await app.opLoadRemoteUint256(ctxAddr);
    await checkStackTailv2(stack, [testValue]);
  });

  it('opLoadRemoteBytes32', async () => {
    const testValue = hex4Bytes('123456');
    const bytes32TestValueName = hex4Bytes('BYTES');

    await clientApp.setStorageBytes32(bytes32TestValueName, testValue);

    const bytes = bytes32TestValueName.substring(2, 10);
    await ctx.setProgram(`0x${bytes}${clientApp.address.substring(2)}`);
    await app.opLoadRemoteBytes32(ctxAddr);
    await checkStackTailv2(stack, [testValue]);
  });

  it('opLoadRemoteBool', async () => {
    const testValue = true;
    const bytes32TestValueName = hex4Bytes('BOOLEAN');

    await clientApp.setStorageBool(bytes32TestValueName, testValue);

    const bool = bytes32TestValueName.substring(2, 10);
    await ctx.setProgram(`0x${bool}${clientApp.address.substring(2)}`);
    await app.opLoadRemoteBool(ctxAddr);
    await checkStackTailv2(stack, [+testValue]);
  });

  it('opLoadRemoteAddress', async () => {
    const [addr1] = await ethers.getSigners();
    const testValue = addr1.address;
    const bytes32TestValueName = hex4Bytes('ADDRESS');

    await clientApp.setStorageAddress(bytes32TestValueName, testValue);

    const addr = bytes32TestValueName.substring(2, 10);
    await ctx.setProgram(`0x${addr}${clientApp.address.substring(2)}`);
    await app.opLoadRemoteAddress(ctxAddr);
    await checkStackTailv2(stack, [testValue]);
  });

  it('opBool', async () => {
    await ctx.setProgram('0x01');
    await app.opBool(ctxAddr);
    await checkStackTailv2(stack, ['0x01']);
  });

  it('opUint256', async () => {
    await ctx.setProgram('0x0000000000000000000000000000000000000000000000000000000000000001');
    await app.opUint256(ctxAddr);
    await checkStackTailv2(stack, ['1']);
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

    await clientApp.setStorageAddress(bytes32TestAddressName, testAddress);

    const address = bytes32TestAddressName.substring(2, 10);
    await ctx.setProgram(`0x${address}${fundAmountHex}`);

    await expect(() => app.opSendEth(ctxAddr)).to.changeEtherBalance(receiver, fundAmountUint);
    await checkStackTailv2(stack, ['1']);
  });

  it('opTransfer', async () => {
    const [receiver] = await ethers.getSigners();

    await testERC20.mint(app.address, testAmount);

    const bytes32TokenAddr = hex4Bytes('TOKEN_ADDR');
    const bytes32ReceiverAddr = hex4Bytes('RECEIVER');

    await clientApp.setStorageAddress(bytes32TokenAddr, testERC20.address);
    await clientApp.setStorageAddress(bytes32ReceiverAddr, receiver.address);

    const tokenAddress = bytes32TokenAddr.substring(2, 10);
    const receiverAddress = bytes32ReceiverAddr.substring(2, 10);
    await ctx.setProgram(`0x${tokenAddress}${receiverAddress}${uint256StrToHex(testAmount)}`);

    await app.opTransfer(ctxAddr);
    await checkStackTailv2(stack, ['1']);

    const balanceOfReceiver = await testERC20.balanceOf(receiver.address);

    expect(balanceOfReceiver).to.be.equal(testAmount);
  });

  it('opTransferVar', async () => {
    const [receiver] = await ethers.getSigners();
    await testERC20.burn(receiver.address, testAmount);
    await testERC20.mint(app.address, testAmount);

    const bytes32TokenAddr = hex4Bytes('TOKEN_ADDR');
    const bytes32ReceiverAddr = hex4Bytes('RECEIVER');
    const bytes32TestAmount = hex4Bytes(testAmount);

    await clientApp.setStorageAddress(bytes32TokenAddr, testERC20.address);
    await clientApp.setStorageAddress(bytes32ReceiverAddr, receiver.address);
    await clientApp.setStorageUint256(bytes32TestAmount, 1000);

    const tokenAddress = bytes32TokenAddr.substring(2, 10);
    const receiverAddress = bytes32ReceiverAddr.substring(2, 10);
    const amount = bytes32TestAmount.substring(2, 10);
    await ctx.setProgram(`0x${tokenAddress}${receiverAddress}${amount}`);

    await app.opTransferVar(ctxAddr);
    await checkStackTailv2(stack, ['1']);

    const balanceOfReceiver = await testERC20.balanceOf(receiver.address);
    expect(balanceOfReceiver).to.be.equal(testAmount);
    await testERC20.burn(receiver.address, testAmount);
  });

  it('opTransferFrom', async () => {
    const [sender, receiver] = await ethers.getSigners();

    await testERC20.mint(sender.address, testAmount);
    await testERC20.approve(app.address, testAmount, { from: sender.address });

    const bytes32TokenAddr = hex4Bytes('TOKEN_ADDR');
    const bytes32SenderAddr = hex4Bytes('SENDER');
    const bytes32ReceiverAddr = hex4Bytes('RECEIVER');

    await clientApp.setStorageAddress(bytes32TokenAddr, testERC20.address);
    await clientApp.setStorageAddress(bytes32SenderAddr, sender.address);
    await clientApp.setStorageAddress(bytes32ReceiverAddr, receiver.address);

    const tokenAddress = bytes32TokenAddr.substring(2, 10);
    const senderAddress = bytes32SenderAddr.substring(2, 10);
    const receiverAddress = bytes32ReceiverAddr.substring(2, 10);

    await ctx.setProgram(
      `0x${tokenAddress}${senderAddress}${receiverAddress}${uint256StrToHex(testAmount)}`
    );

    await app.opTransferFrom(ctxAddr);
    await checkStackTailv2(stack, ['1']);

    const balanceOfReceiver = await testERC20.balanceOf(receiver.address);
    expect(balanceOfReceiver).to.be.equal(testAmount);
    await testERC20.burn(receiver.address, testAmount);
  });

  it('opTransferFromVar', async () => {
    const [sender, receiver] = await ethers.getSigners();

    await testERC20.mint(sender.address, testAmount);
    await testERC20.approve(app.address, testAmount, { from: sender.address });

    const bytes32TokenAddr = hex4Bytes('TOKEN_ADDR');
    const bytes32SenderAddr = hex4Bytes('SENDER');
    const bytes32ReceiverAddr = hex4Bytes('RECEIVER');
    const bytes32TestAmount = hex4Bytes(testAmount);

    await clientApp.setStorageAddress(bytes32TokenAddr, testERC20.address);
    await clientApp.setStorageAddress(bytes32SenderAddr, sender.address);
    await clientApp.setStorageAddress(bytes32ReceiverAddr, receiver.address);

    const tokenAddress = bytes32TokenAddr.substring(2, 10);
    const senderAddress = bytes32SenderAddr.substring(2, 10);
    const receiverAddress = bytes32ReceiverAddr.substring(2, 10);
    const amount = bytes32TestAmount.substring(2, 10);

    await ctx.setProgram(`0x${tokenAddress}${senderAddress}${receiverAddress}${amount}`);

    await app.opTransferFromVar(ctxAddr);
    await checkStackTailv2(stack, ['1']);

    const balanceOfReceiver = await testERC20.balanceOf(receiver.address);
    expect(balanceOfReceiver).to.be.equal(testAmount);
    await testERC20.burn(receiver.address, testAmount);
  });

  it('opBalanceOf', async () => {
    const [, receiver] = await ethers.getSigners();

    await testERC20.mint(receiver.address, testAmount);

    const bytes32TokenAddr = hex4Bytes('TOKEN_ADDR');
    const bytes32ReceiverAddr = hex4Bytes('RECEIVER');

    await clientApp.setStorageAddress(bytes32TokenAddr, testERC20.address);
    await clientApp.setStorageAddress(bytes32ReceiverAddr, receiver.address);

    const tokenAddress = bytes32TokenAddr.substring(2, 10);
    const receiverAddress = bytes32ReceiverAddr.substring(2, 10);

    await ctx.setProgram(`0x${tokenAddress}${receiverAddress}`);

    await app.opBalanceOf(ctxAddr);
    await checkStackTailv2(stack, [testAmount]);
    await testERC20.burn(receiver.address, testAmount);
  });

  it('opUint256Get', async () => {
    await ctx.setProgram(`0x${uint256StrToHex(testAmount)}`);

    const result = await app.callStatic.opUint256Get(ctxAddr);

    expect(result).to.be.equal(testAmount);
  });

  it('opLoadLocalGet', async () => {
    const testValue = hex4Bytes('TEST_VALUE');
    const bytes32TestValueName = hex4Bytes('BYTES32');
    const testSignature = 'getStorageBytes32(bytes32)';

    await clientApp.setStorageBytes32(bytes32TestValueName, testValue);

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

    await clientApp.setStorageBytes32(bytes32TestValueName, testValue);
    await app.opLoadLocal(ctxAddr, testSignature);

    checkStackTailv2(stack, [testValue]);
  });

  it('opLoadRemote', async () => {
    const testValue = hex4Bytes('123456');
    const bytes32TestValueName = hex4Bytes('BYTES');
    const testSignature = 'getStorageBytes32(bytes32)';

    await clientApp.setStorageBytes32(bytes32TestValueName, testValue);

    const bytes = bytes32TestValueName.substring(2, 10);
    await ctx.setProgram(`0x${bytes}${clientApp.address.substring(2)}`);
    await app.opLoadRemote(ctxAddr, testSignature);
    await checkStackTailv2(stack, [testValue]);
  });

  it('opStruct', async () => {
    const LAST_PAYMENT = hex4Bytes('BOB.lastPayment');
    const ACCOUNT = hex4Bytes('BOB.account');
    const ADDRESS = '47f8a90ede3d84c7c0166bd84a4635e4675accfc000000000000000000000000';
    const THREE = new Array(64).join('0') + 3;
    const ZERO = new Array(65).join('0');

    await ctx.setProgram(
      '0x' +
        '4a871642' + // BOB.lastPayment
        `${THREE}` + // 3
        '2215b81f' + // BOB.account
        `${ADDRESS}` + // the address for account
        'cb398fe1' // endStruct
    );

    expect(await clientApp.getStorageUint256(LAST_PAYMENT)).equal(0);
    expect(await clientApp.getStorageUint256(ACCOUNT)).equal(BigNumber.from(zero32bytes));
    await app.opStruct(ctxAddr);
    expect(await clientApp.getStorageUint256(LAST_PAYMENT)).equal(3);
    expect(await clientApp.getStorageUint256(ACCOUNT)).equal(BigNumber.from(`0x${ADDRESS}`));
  });

  describe('Arrays', () => {
    const zero62 = new Array(63).join('0');
    const ONE = new Array(64).join('0') + 1;
    const THREE = new Array(64).join('0') + 3;
    const FIVE = new Array(64).join('0') + 5;
    const NUMBERS = hex4Bytes('NUMBERS');
    const PARTNERS = hex4Bytes('PARTNERS');
    const ADDRESS_MARY = 'e7f8a90ede3d84c7c0166bd84a4635e4675accfc000000000000000000000000';
    const ADDRESS_MAX = 'f7f8a90ede3d84c7c0166bd84a4635e4675accfc000000000000000000000000';

    it('opDeclare', async () => {
      await ctx.setProgram(
        '0x' +
          '01' + // uint256
          '1fff709e' // bytecode for NUMBERS
      );
      expect(await clientApp.getType(NUMBERS)).to.be.equal(zero32bytes);
      await app.opDeclare(ctxAddr);
      expect(await clientApp.getType(NUMBERS)).to.be.equal(
        '0x0100000000000000000000000000000000000000000000000000000000000000'
      );
    });

    it('opPush', async () => {
      await clientApp.declare(`${uint256type}${zero62}`, NUMBERS);
      await clientApp.declare(`${addressType}${zero62}`, PARTNERS);

      expect(await clientApp.getLength(NUMBERS)).to.be.equal(0);

      await ctx.setProgram(
        '0x' +
          `${THREE}` + // 3
          '1fff709e' // bytecode for NUMBERS
      );

      await app.opPush(ctxAddr);

      expect(await clientApp.getLength(NUMBERS)).to.be.equal(1);
      expect(await clientApp.getLength(PARTNERS)).to.be.equal(0);
      expect(await clientApp.get(0, NUMBERS)).to.be.equal(`0x${THREE}`);
      expect(await clientApp.get(0, PARTNERS)).to.be.equal(`${zero32bytes}`);

      await ctx.setProgram(
        '0x' +
          `${ADDRESS_MARY}` + // an address
          '3c8423ff' // bytecode for PARTNERS
      );
      await app.opPush(ctxAddr);

      expect(await clientApp.getLength(PARTNERS)).to.be.equal(1);
      expect(await clientApp.getLength(NUMBERS)).to.be.equal(1);
      expect(await clientApp.get(0, PARTNERS)).to.be.equal(`0x${ADDRESS_MARY}`);
      expect(await clientApp.get(0, NUMBERS)).to.be.equal(`0x${THREE}`);
    });

    it('opGet', async () => {
      await clientApp.declare(`${uint256type}${zero62}`, NUMBERS);
      await clientApp.declare(`${addressType}${zero62}`, PARTNERS);

      await clientApp.addItem(`0x${THREE}`, NUMBERS);
      await clientApp.addItem(`0x${ADDRESS_MARY}`, PARTNERS);

      await ctx.setProgram(
        `${zero32bytes}` + // 0x + 0 index
          '1fff709e' // bytecode for NUMBERS
      );

      checkStackTailv2(stack, []);
      await app.opGet(ctxAddr);
      // returned 3 as a value stored in NUMBERS with 0 index
      checkStackTailv2(stack, [3]);

      await ctx.setProgram(
        `${zero32bytes}` + // 0x + 0 index
          '3c8423ff' // bytecode for PARTNERS
      );
      await app.opGet(ctxAddr);

      checkStackTailv2(stack, [
        3, // already stored 3 as a value stored in NUMBERS with 0 index
        BigNumber.from(`0x${ADDRESS_MARY}`), // a number from ADDRESS_MARY address
      ]);
    });

    it('opSumOf', async () => {
      await clientApp.declare(`${uint256type}${zero62}`, NUMBERS);
      await clientApp.addItem(`0x${THREE}`, NUMBERS);
      await clientApp.addItem(`0x${FIVE}`, NUMBERS);

      await ctx.setProgram(
        '0x1fff709e' // bytecode for NUMBERS
      );

      checkStackTailv2(stack, []);
      await app.opSumOf(ctxAddr);
      // returned 8 as a result of sum for two values (3 and 5) that stored in NUMBERS
      checkStackTailv2(stack, [8]);
    });

    it('opLengthOf', async () => {
      await clientApp.declare(`${uint256type}${zero62}`, NUMBERS);
      await clientApp.declare(`${addressType}${zero62}`, PARTNERS);

      await clientApp.addItem(`0x${THREE}`, NUMBERS);
      await clientApp.addItem(`0x${FIVE}`, NUMBERS);
      await clientApp.addItem(`0x${ONE}`, NUMBERS);
      await clientApp.addItem(`0x${ADDRESS_MARY}`, PARTNERS);
      await clientApp.addItem(`0x${ADDRESS_MAX}`, PARTNERS);

      await ctx.setProgram(
        '0x1fff709e' // bytecode for NUMBERS
      );

      checkStackTailv2(stack, []);
      await app.opLengthOf(ctxAddr);
      // returned 3 as a length of items that stored in NUMBERS
      checkStackTailv2(stack, [3]);

      await ctx.setProgram(
        '0x3c8423ff' // bytecode for PARTNERS
      );
      await app.opLengthOf(ctxAddr);

      checkStackTailv2(stack, [
        3, // already stored 3 as a length of items that stored in NUMBERS
        2, // returned 2 as a length of items that stored in PARTNERS
      ]);
    });
  });
});

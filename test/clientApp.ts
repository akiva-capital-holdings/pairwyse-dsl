import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import chai, { expect } from 'chai';
import { parseEther } from 'ethers/lib/utils';
import { ethers } from 'hardhat';
import { solidity } from 'ethereum-waffle';
import { ClientApp } from '../typechain';

chai.use(solidity);

describe('Client Application', () => {
  let app: ClientApp;
  let user1: SignerWithAddress;

  before(async () => {
    [user1] = await ethers.getSigners();
    app = await (await ethers.getContractFactory('ClientApp')).deploy();
  });

  it('Lifecycle', async () => {
    await user1.sendTransaction({ to: app.address, value: parseEther('1') });
    expect(await ethers.provider.getBalance(app.address)).to.equal(parseEther('1'));

    // is_risky == false && block.number > min_block
    // is_risky == false; min_block = block.number + 1000
    expect(
      await app.callStatic.exec([
        'loadLocal',
        'bool',
        'IS_RISKY',
        'bool',
        'false',
        '==',
        'blockNumber',
        'loadLocal',
        'uint256',
        'MIN_BLOCK',
        '>',
        'and',
      ]),
    ).to.equal(false);

    // Set withdrawal condition
    await app.setWithdrawalCond([
      'loadLocal',
      'bool',
      'IS_RISKY',
      'bool',
      'false',
      '==',
      'blockNumber',
      'loadLocal',
      'uint256',
      'MIN_BLOCK',
      '>',
      'and',
    ]);

    // Can't withdraw
    expect(await app.callStatic.withdraw()).to.equal(false);
    await app.withdraw();
    await app.withdraw();
    expect(await ethers.provider.getBalance(app.address)).to.equal(parseEther('1'));

    // Withdraw
    await app.setIsRisky(false);
    await app.setMinBlock(0);
    expect(await app.connect(user1).callStatic.withdraw()).to.equal(true);
    await expect(await app.connect(user1).withdraw()).to.changeEtherBalances(
      [app, user1],
      [parseEther('-1'), parseEther('1')],
    );
  });
});

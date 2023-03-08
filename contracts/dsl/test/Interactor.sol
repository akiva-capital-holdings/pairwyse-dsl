// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import { BaseStorage } from '../test/BaseStorage.sol';
import { IERC20Mintable } from '../interfaces/IERC20Mintable.sol';
import { ERC20Mintable } from '../helpers/ERC20Mintable.sol';

contract Interactor is BaseStorage {
    address public unitroller = 0x3cBe63aAcF6A064D32072a630A3eab7545C54d78;
    // https://goerli.etherscan.io/address/0x3cBe63aAcF6A064D32072a630A3eab7545C54d78#code
    IERC20Mintable public WUSDC; // WUSDC
    mapping(address => address) public compounds; // token => cToken

    constructor() {
        WUSDC = new ERC20Mintable('Wrapped USDC', 'WUSDC', 6);
        _setDefaultVariables();
    }

    function WUSDCAddress() external view returns (address) {
        return (address(WUSDC));
    }

    function _setDefaultVariables() internal {
        // Set DAI variable
        address DAI_ADDR = 0x2899a03ffDab5C90BADc5920b4f53B0884EB13cC;
        setStorageAddress(
            0xa5e92f3e00000000000000000000000000000000000000000000000000000000,
            DAI_ADDR
        );
        // Set WUSDC variable
        setStorageAddress(
            0x1896092e00000000000000000000000000000000000000000000000000000000,
            address(WUSDC)
        );
        // Set USDC variable
        address USDC_ADDR = 0x07865c6E87B9F70255377e024ace6630C1Eaa37F;
        setStorageAddress(
            0xd6aca1be00000000000000000000000000000000000000000000000000000000,
            USDC_ADDR
        );

        // Set cUSDC variable
        address CUSDC_ADDR = 0x73506770799Eb04befb5AaE4734e58C2C624F493;
        setStorageAddress(
            0x48ebcbd300000000000000000000000000000000000000000000000000000000,
            CUSDC_ADDR
        );

        // Set wETH variable
        address WETH_ADDR = 0xcd48a86666D2a79e027D82cA6Adf853357c70d02;
        setStorageAddress(
            0x0f8a193f00000000000000000000000000000000000000000000000000000000,
            WETH_ADDR
        );

        // Set cETH variable
        address CETH_ADDR = 0x64078a6189Bf45f80091c6Ff2fCEe1B15Ac8dbde;
        setStorageAddress(
            0xf75c38ec00000000000000000000000000000000000000000000000000000000,
            CETH_ADDR
        );

        // Set cDAI variable
        address CDAI_ADDR = 0x0545a8eaF7ff6bB6F708CbB544EA55DBc2ad7b2a;
        setStorageAddress(
            0xaafc769300000000000000000000000000000000000000000000000000000000,
            CDAI_ADDR
        );

        compounds[DAI_ADDR] = CDAI_ADDR;
        compounds[USDC_ADDR] = CUSDC_ADDR;
        compounds[WETH_ADDR] = CETH_ADDR;
    }
}

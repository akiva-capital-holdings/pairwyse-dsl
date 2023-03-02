// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import { BaseStorage } from '../test/BaseStorage.sol';
import { IERC20Mintable } from '../interfaces/IERC20Mintable.sol';
import { ERC20Mintable } from '../helpers/ERC20Mintable.sol';

contract TestCompoundMock is BaseStorage {
    // using UnstructuredStorage for bytes32;
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

        compounds[USDC_ADDR] = CUSDC_ADDR;
        compounds[WETH_ADDR] = CETH_ADDR;
    }
}

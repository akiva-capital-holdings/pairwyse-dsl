// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import { BaseStorage } from '../test/BaseStorage.sol';

contract CompoundMock is BaseStorage {
    // using UnstructuredStorage for bytes32;

    mapping(address => address) public compounds; // token => cToken

    constructor() {
        _setDefaultVariables();
    }

    function _setDefaultVariables() internal {
        // Set MULTI_TRANCHE variable
        setStorageAddress(
            0x0a371cf900000000000000000000000000000000000000000000000000000000,
            address(this)
        );
        // Set cUSDC variable
        address CUSDC_ADDR = 0x73506770799Eb04befb5AaE4734e58C2C624F493;
        setStorageAddress(
            0x48ebcbd300000000000000000000000000000000000000000000000000000000,
            CUSDC_ADDR
        );
        // Set USDC variable
        address USDC_ADDR = 0x07865c6E87B9F70255377e024ace6630C1Eaa37F;
        setStorageAddress(
            0xd6aca1be00000000000000000000000000000000000000000000000000000000,
            USDC_ADDR
        );
        compounds[USDC_ADDR] = CUSDC_ADDR;
    }
}

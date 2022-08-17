// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import { Agreement } from '../Agreement.sol';

contract AgreementMock is Agreement {
    constructor(address _parser) Agreement(_parser) {}
}

// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import { Context } from './Context.sol';

contract ContextFactory {
    address[] public deployed;
    event NewContext(address context);

    function deployContext() external returns (address _contextAddr) {
        Context _context = new Context();
        _contextAddr = address(_context);
        deployed.push(_contextAddr);
        emit NewContext(_contextAddr);
    }

    function getDeployedLen() external view returns (uint256) {
        return deployed.length;
    }
}

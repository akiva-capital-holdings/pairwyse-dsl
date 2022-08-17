// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import { Context } from './Context.sol';

contract ContextFactory {
    address[] public deployedContexts;
    event NewContext(address context);

    /**
     * Deploy new Context contract
     * @param _app Address of the end application
     * @return _contextAddr Address of a newly created Context
     */
    function deployContext(address _app) external returns (address _contextAddr) {
        Context _context = new Context();
        _context.setAppAddress(_app);
        _contextAddr = address(_context);
        deployedContexts.push(_contextAddr);
        emit NewContext(_contextAddr);
    }

    function getDeployedContextsLen() external view returns (uint256) {
        return deployedContexts.length;
    }
}

// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import { IParser } from '../interfaces/IParser.sol';
import { IProgramContext } from '../interfaces/IProgramContext.sol';
import { Executor } from '../libs/Executor.sol';
import { StringUtils } from '../libs/StringUtils.sol';
import { BaseStorage } from './BaseStorage.sol';

// import 'hardhat/console.sol';

// TODO: do we need this contract actually? Will it be usable after making Roles?
contract BaseApplication is BaseStorage {
    using StringUtils for string;

    address public parserAddr;
    address public dslContext;
    address public programContext;
    address public preprocessorAddr;

    constructor(
        address _parserAddr,
        address _preprocessorAddr,
        address _dslContext,
        address _programContext
    ) {
        parserAddr = _parserAddr;
        preprocessorAddr = _preprocessorAddr;
        dslContext = _dslContext;
        programContext = _programContext;
        _setupContext();
    }

    // solhint-disable-next-line no-empty-blocks
    receive() external payable {}

    function parse(string memory _program) external {
        IParser(parserAddr).parse(preprocessorAddr, dslContext, programContext, _program);
    }

    function parseCode(string[] memory _code) external {
        IParser(parserAddr).parseCode(dslContext, programContext, _code);
    }

    function execute() external payable {
        IProgramContext(programContext).setMsgValue(msg.value);
        Executor.execute(dslContext, programContext, address(this));
    }

    function _setupContext() internal {
        IProgramContext(programContext).setMsgSender(msg.sender);
    }
}

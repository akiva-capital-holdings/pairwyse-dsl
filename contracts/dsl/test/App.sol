// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import { IParser } from '../interfaces/IParser.sol';
import { IContext } from '../interfaces/IContext.sol';
import { Executor } from '../libs/Executor.sol';
import { StringUtils } from '../libs/StringUtils.sol';
import { LinkedList } from '../helpers/LinkedList.sol';
import { UnstructuredStorageMock } from '../mocks/UnstructuredStorageMock.sol';

// import 'hardhat/console.sol';

// TODO: do we need this contract actually? Will it be usable after making Roles?
contract App is UnstructuredStorageMock, LinkedList {
    using StringUtils for string;

    address public parserAddr;
    address public ctxAddr;
    address public preprocessorAddr;

    // solhint-disable-next-line no-empty-blocks
    receive() external payable {}

    constructor(
        address _parserAddr,
        address _preprocessorAddr,
        address _ctxAddr
    ) {
        parserAddr = _parserAddr;
        preprocessorAddr = _preprocessorAddr;
        ctxAddr = _ctxAddr;
        _setupContext();
    }

    function parse(string memory _program) external {
        IParser(parserAddr).parse(preprocessorAddr, ctxAddr, _program);
    }

    function parseCode(string[] memory _code) external {
        IParser(parserAddr).parseCode(ctxAddr, _code);
    }

    function execute() external payable {
        IContext(ctxAddr).setMsgValue(msg.value);
        Executor.execute(ctxAddr);
    }

    function _setupContext() internal {
        IContext(ctxAddr).setMsgSender(msg.sender);
    }
}

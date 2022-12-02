// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import { Preprocessor } from '../Preprocessor.sol';
import { IProgramContext } from '../interfaces/IProgramContext.sol';
import { IParser } from '../interfaces/IParser.sol';
import { Executor } from '../libs/Executor.sol';
import { LinkedList } from '../helpers/LinkedList.sol';
import { UnstructuredStorageMock } from '../mocks/UnstructuredStorageMock.sol';

// import "hardhat/console.sol";

contract E2EApp is UnstructuredStorageMock, LinkedList {
    address public parserAddr;
    address public preprocessorAddr;
    address public dslContext;
    address public programContext;

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
        setupContext();
    }

    // solhint-disable-next-line no-empty-blocks
    receive() external payable {}

    function parse(string memory _program) external {
        IParser(parserAddr).parse(preprocessorAddr, dslContext, _program);
    }

    function parseCode(string[] memory _code) external {
        IParser(parser).parseCode(dslContext, programContext, _code);
    }

    function execute() external payable {
        IProgramContext(programContext).setMsgValue(msg.value);
        Executor.execute(dslContext, programContext);
    }

    function setupContext() internal {
        IProgramContext(programContext).setMsgSender(msg.sender);
    }
}

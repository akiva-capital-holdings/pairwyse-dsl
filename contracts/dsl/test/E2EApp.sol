// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import { Preprocessor } from '../Preprocessor.sol';
import { ParserMock } from '../mocks/ParserMock.sol';
import { IContext } from '../interfaces/IContext.sol';
import { Executor } from '../libs/Executor.sol';
import { Storage } from '../helpers/Storage.sol';

// import "hardhat/console.sol";

contract E2EApp is Storage {
    address public preprAddr;
    address public parserAddr;
    IContext public ctx;

    // solhint-disable-next-line no-empty-blocks
    receive() external payable {}

    constructor(
        address _preprAddr,
        address _parserAddr,
        IContext _ctx
    ) {
        preprAddr = _preprAddr;
        parserAddr = _parserAddr;
        ctx = _ctx;
        setupContext();
    }

    function parse(string memory _program) external {
        ParserMock(parserAddr).parse(preprAddr, address(ctx), _program);
    }

    function parseCode(string[] memory _code) external {
        // parseCodeExt(address _ctxAddr, string[] memory _code)
        ParserMock(parserAddr).parseCodeExt(address(ctx), _code);
        // ParserMock(parserAddr).parseCodeExt(address(0), _code);
        // ParserMock(parserAddr).labelPos('');
    }

    function execute() external payable {
        ctx.setMsgValue(msg.value);
        Executor.execute(address(ctx));
    }

    function setupContext() internal {
        ctx.initOpcodes();
        ctx.setAppAddress(address(this));
        ctx.setMsgSender(msg.sender);
    }
}

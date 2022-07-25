// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import { IParser } from '../interfaces/IParser.sol';
import { IContext } from '../interfaces/IContext.sol';
import { Executor } from '../libs/Executor.sol';
import { Storage } from '../helpers/Storage.sol';
import { StringUtils } from '../libs/StringUtils.sol';

// import "hardhat/console.sol";

contract App is Storage {
    using StringUtils for string;

    IParser public parser;
    IContext public ctx;

    // solhint-disable-next-line no-empty-blocks
    receive() external payable {}

    constructor(IParser _parser, IContext _ctx) {
        parser = _parser;
        ctx = _ctx;
        _setupContext();
    }

    function parse(string memory _program) external {
        parser.parse(address(ctx), _program);
    }

    function execute() external payable {
        ctx.setMsgValue(msg.value);
        Executor.execute(address(ctx));
    }

    function _setupContext() internal {
        ctx.initOpcodes();
        ctx.setAppAddress(address(this));
        ctx.setMsgSender(msg.sender);
    }
}

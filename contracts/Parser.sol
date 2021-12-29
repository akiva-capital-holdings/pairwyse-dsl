//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "./Context.sol";
import "./Opcodes.sol";
import "./Eval.sol";
import "./helpers/StringUtils.sol";
import "./helpers/Storage.sol";
import "hardhat/console.sol";

contract Parser is StringUtils, Storage {
    Context public ctx;
    Opcodes public opcodes;
    Eval public eval;

    bytes internal program;
    string[] internal cmds;
    uint256 internal cmdIdx;

    event ExecRes(bool result);

    constructor() {
        ctx = new Context();
        opcodes = new Opcodes(ctx);
        eval = new Eval(ctx, opcodes);

        initOpcodes();
    }

    function parseCode(string[] memory code) public virtual {
        delete program;
        cmdIdx = 0;
        cmds = code;
        ctx.stack().clean();

        while(cmdIdx < cmds.length) {
            parseOpcodeWithParams();
        }

        // console.logBytes(program);
        ctx.setProgram(program);
    }

    /**
     * @notice Execute an expression written in our custom DSL
     * @param code string array of commands (expression) in polish notation to be parsed by DSL
     * @return result returns the expression execution result (the last value in stack)
     */
    function exec(string[] memory code) public returns(bool result) {
        parseCode(code);
        eval.evalWithContext(address(this), msg.sender);

        result = ctx.stack().seeLast().getUint256() == 0 ? false : true;
        emit ExecRes(result);
    }

    function asmLoadLocal() public {
        parseBranchOf("loadLocal");
        parseVariable();
    }

    function asmLoadRemote() public {
        parseBranchOf("loadRemote");
        parseVariable();
        parseAddress();
    }

    function asmBool() public {
        bytes1 value = bytes1(strcmp(nextCmd(), "true") ? 0x01 : 0x00);
        program = bytes.concat(program, value);
    }

    function asmUint256() public {
        uint256 value = atoi(nextCmd());
        program = bytes.concat(program, bytes32(value));
    }

    function asmAddress() public {
        parseVariable();
        asmUint256();
        // Note: this function may cost many gas. But the contract that will execute sendEth function will need to have
        // that ETH. So one solution is to transfer ETH to Opcodes contract (that executes sendEth function) or to move
        // all execution (and evaluation logic) of sendEth function to Parser contract (that is less desirable)
        transferAllEth(payable(address(opcodes)));
    }

    function transferAllEth(address payable receiver) internal {
        receiver.transfer(address(this).balance);
    }

    function initOpcodes() internal {
        // Opcodes
        ctx.addOpcode("==", 0x01, opcodes.opEq.selector, 0x0);
        ctx.addOpcode("!", 0x02, opcodes.opNot.selector, 0x0);
        ctx.addOpcode("<", 0x03, opcodes.opLt.selector, 0x0);
        ctx.addOpcode(">", 0x04, opcodes.opGt.selector, 0x0);
        ctx.addOpcode("swap", 0x05, opcodes.opSwap.selector, 0x0);
        ctx.addOpcode("<=", 0x06, opcodes.opLe.selector, 0x0);
        ctx.addOpcode(">=", 0x07, opcodes.opGe.selector, 0x0);
        ctx.addOpcode("xor", 0x11, opcodes.opXor.selector, 0x0);
        ctx.addOpcode("and", 0x12, opcodes.opAnd.selector, 0x0);
        ctx.addOpcode("or", 0x13, opcodes.opOr.selector, 0x0);
        ctx.addOpcode("!=", 0x14, opcodes.opNotEq.selector, 0x0);
        ctx.addOpcode("blockNumber", 0x15, opcodes.opBlockNumber.selector, 0x0);
        ctx.addOpcode("blockTimestamp", 0x16, opcodes.opBlockTimestamp.selector, 0x0);
        ctx.addOpcode("blockChainId", 0x17, opcodes.opBlockChainId.selector, 0x0);
        ctx.addOpcode("bool", 0x18, opcodes.opBool.selector, this.asmBool.selector);
        ctx.addOpcode("uint256", 0x1a, opcodes.opUint256.selector, this.asmUint256.selector);
        ctx.addOpcode("msgSender", 0x1d, opcodes.opMsgSender.selector, 0x0);
        ctx.addOpcode("sendEth", 0x1e, opcodes.opSendEth.selector, this.asmAddress.selector);

        // complex opcodes with sub opcodes (branches)
        string memory name = "loadLocal";
        ctx.addOpcode(name, 0x1b, opcodes.opLoadLocalAny.selector, this.asmLoadLocal.selector);
        ctx.addOpcodeBranch(name, "uint256", 0x01, opcodes.opLoadLocalUint256.selector);
        ctx.addOpcodeBranch(name, "bool", 0x02, opcodes.opLoadLocalBool.selector);
        ctx.addOpcodeBranch(name, "address", 0x03, opcodes.opLoadLocalAddress.selector);
        ctx.addOpcodeBranch(name, "bytes32", 0x04, opcodes.opLoadLocalBytes32.selector);

        name = "loadRemote";
        ctx.addOpcode(name, 0x1c, opcodes.opLoadRemoteAny.selector, this.asmLoadRemote.selector);
        ctx.addOpcodeBranch(name, "uint256", 0x01, opcodes.opLoadRemoteUint256.selector);
        ctx.addOpcodeBranch(name, "bool", 0x02, opcodes.opLoadRemoteBool.selector);
        ctx.addOpcodeBranch(name, "address", 0x03, opcodes.opLoadRemoteAddress.selector);
        ctx.addOpcodeBranch(name, "bytes32", 0x04, opcodes.opLoadRemoteBytes32.selector);
    }

    function nextCmd() internal returns (string storage) {
        return cmds[cmdIdx++];
    }

    function parseVariable() internal {
        program = bytes.concat(program, bytes4(keccak256(abi.encodePacked(nextCmd()))));
    }

    function parseBranchOf(string memory baseOpName) internal {
        program = bytes.concat(program, ctx.branchCodes(baseOpName, nextCmd()));
    }

    function parseAddress() internal {
        program = bytes.concat(program, fromHex(nextCmd()));
    }

    function parseOpcodeWithParams() internal {
        string storage cmd = nextCmd();
        bytes1 opcode = ctx.opCodeByName(cmd);
        require(opcode != 0x0, string(abi.encodePacked("Parser: '", cmd, "' command is unknown")));
        program = bytes.concat(program, opcode);

        bytes4 selector = ctx.asmSelectors(cmd);
        if (selector != 0x0) {
            (bool success, ) = address(this).delegatecall(abi.encodeWithSelector(selector));
            require(success, "Parser: delegatecall to asmSelector failed");
        }
        // if no selector then opcode without params
    }
}

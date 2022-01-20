//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import { Context } from "./Context.sol";
import { Opcodes } from "./Opcodes.sol";
import { ConditionalTx } from "./ConditionalTx.sol";
import { StringUtils } from "./libs/StringUtils.sol";
import { Preprocessor } from "./helpers/Preprocessor.sol";
import { Storage } from "./helpers/Storage.sol";
import { IERC20 } from "./interfaces/IERC20.sol";
import "hardhat/console.sol";

// TODO: make all quotes single
// TODO: use only explicit imports i.e. import { X } from "./X.sol"
// TODO: fix other todos

contract Parser is Storage {
    using StringUtils for string;

    // Context public ctx;
    Opcodes public opcodes;
    // ConditionalTx public eval;
    Preprocessor public preprocessor;

    bytes internal program;
    string[] internal cmds;
    uint256 internal cmdIdx;

    event ExecRes(bool result);
    event NewConditionalTx(address txObj);

    constructor() {
        // ctx = new Context();
        opcodes = new Opcodes();
        // eval = new ConditionalTx(ctx, opcodes);
        preprocessor = new Preprocessor();

        // initOpcodes();
    }

    function parseCode(Context _ctx, string[] memory code) public virtual {
        delete program;
        cmdIdx = 0;
        cmds = code;
        _ctx.stack().clear();

        while (cmdIdx < cmds.length) {
            parseOpcodeWithParams(_ctx);
        }

        // console.logBytes(program);
        _ctx.setProgram(program);
    }

    function parseOpcodeWithParams(Context _ctx) internal {
        string storage cmd = nextCmd();
        bytes1 opcode = _ctx.opCodeByName(cmd);
        require(opcode != 0x0, string(abi.encodePacked("Parser: '", cmd, "' command is unknown")));
        program = bytes.concat(program, opcode);

        bytes4 selector = _ctx.asmSelectors(cmd);
        if (selector != 0x0) {
            (bool success, ) = address(this).delegatecall(abi.encodeWithSelector(selector));
            require(success, "Parser: delegatecall to asmSelector failed");
        }
        // if no selector then opcode without params
    }

    // function execHighLevel(string memory code) public returns (bool result) {
    //     string[] memory postfixCode = preprocessor.transform(code);
    //     return this.exec(postfixCode);
    // }

    function parse(Context _ctx, string memory _codeRaw) public {
        string[] memory _code = preprocessor.transform(_codeRaw);
        parseCode(_ctx, _code);

        _ctx.setAppAddress(address(this));
        _ctx.setMsgSender(msg.sender);
    }

    function spawnHighLevel(
        address _signatory,
        string memory _transactionStr,
        string memory _conditionStr
    ) public returns (ConditionalTx txObj) {
        // string[] memory _transactionStrArr = preprocessor.transform(_transactionStr);
        // string[] memory _conditionStrArr = preprocessor.transform(_conditionStr);
        // txObj = new ConditionalTx(opcodes);
        // Context conditionCtx = txObj.conditionCtx();
        // Context transactionCtx = txObj.transactionCtx();
        // initOpcodes(conditionCtx);
        // initOpcodes(transactionCtx);
        // parseCode(conditionCtx, _conditionStrArr); // TODO: also parse `_transactionStrArr`
        // bytes memory _condition = conditionCtx.program();
        // bytes memory _transaction = ""; // TODO
        // conditionCtx.setAppAddress(address(this));
        // conditionCtx.setMsgSender(msg.sender);
        // txObj.constructorV2(_signatory, _transaction, _condition, _transactionStr, _conditionStr);
    }

    // function spawn(string[] memory code) public returns (ConditionalTx txObj) {
    //     txObj = new ConditionalTx(ctx, opcodes);
    //     parseCode(code);

    //     ctx.setAppAddress(address(this));
    //     ctx.setMsgSender(msg.sender);

    //     emit NewConditionalTx(address(txObj));
    // }

    // /**
    //  * @notice Execute an expression written in our custom DSL
    //  * @param code string array of commands (expression) in polish notation to be parsed by DSL
    //  * @return result returns the expression execution result (the last value in stack)
    //  */
    // function exec(string[] memory code) public returns (bool result) {
    //     ConditionalTx eval = new ConditionalTx(ctx, opcodes);
    //     parseCode(code);

    //     ctx.setAppAddress(address(this));
    //     ctx.setMsgSender(msg.sender);
    //     eval.eval();

    //     result = ctx.stack().seeLast().getUint256() == 0 ? false : true;
    //     emit ExecRes(result);
    // }

    function asmLoadLocal(Context _ctx) public {
        parseBranchOf(_ctx, "loadLocal");
        parseVariable();
    }

    function asmLoadRemote(Context _ctx) public {
        parseBranchOf(_ctx, "loadRemote");
        parseVariable();
        parseAddress();
    }

    function asmBool() public {
        bytes1 value = bytes1(nextCmd().equal("true") ? 0x01 : 0x00);
        program = bytes.concat(program, value);
    }

    function asmUint256() public {
        uint256 value = nextCmd().toUint256();
        program = bytes.concat(program, bytes32(value));
    }

    function asmSend() public {
        parseVariable();
        asmUint256();
        // Note: this function may cost many gas. But the contract that will execute sendEth function will need to have
        // that ETH. So one solution is to transfer ETH to Opcodes contract (that executes sendEth function) or to move
        // all execution (and evaluation logic) of sendEth function to Parser contract (that is less desirable)
        transferAllEth(payable(address(opcodes)));
    }

    function asmTransfer() public {
        address token = getAddress();
        // console.log("token");
        // console.log(token);
        parseAddress();
        parseVariable();
        asmUint256();
        transferAllERC20(token, address(opcodes));
    }

    function asmTransferFrom() public {
        // address token = getAddress();
        // console.log("token");
        // console.log(token);
        // parseAddress();
        parseVariable();
        parseVariable();
        parseVariable();
        asmUint256();
    }

    function transferAllEth(address payable receiver) internal {
        receiver.transfer(address(this).balance);
    }

    function transferAllERC20(address token, address receiver) internal {
        uint256 balanceThis = IERC20(token).balanceOf(address(this));
        // console.log("balanceThis");
        // console.log(balanceThis);
        IERC20(token).transfer(receiver, balanceThis);
    }

    function initOpcodes(Context _ctx) public {
        // Opcodes
        _ctx.addOpcode("==", 0x01, opcodes.opEq.selector, 0x0);
        _ctx.addOpcode("!", 0x02, opcodes.opNot.selector, 0x0);
        _ctx.addOpcode("<", 0x03, opcodes.opLt.selector, 0x0);
        _ctx.addOpcode(">", 0x04, opcodes.opGt.selector, 0x0);
        _ctx.addOpcode("swap", 0x05, opcodes.opSwap.selector, 0x0);
        _ctx.addOpcode("<=", 0x06, opcodes.opLe.selector, 0x0);
        _ctx.addOpcode(">=", 0x07, opcodes.opGe.selector, 0x0);
        _ctx.addOpcode("xor", 0x11, opcodes.opXor.selector, 0x0);
        _ctx.addOpcode("and", 0x12, opcodes.opAnd.selector, 0x0);
        _ctx.addOpcode("or", 0x13, opcodes.opOr.selector, 0x0);
        _ctx.addOpcode("!=", 0x14, opcodes.opNotEq.selector, 0x0);
        _ctx.addOpcode("blockNumber", 0x15, opcodes.opBlockNumber.selector, 0x0);
        _ctx.addOpcode("blockTimestamp", 0x16, opcodes.opBlockTimestamp.selector, 0x0);
        _ctx.addOpcode("blockChainId", 0x17, opcodes.opBlockChainId.selector, 0x0);
        _ctx.addOpcode("bool", 0x18, opcodes.opBool.selector, this.asmBool.selector);
        _ctx.addOpcode("uint256", 0x1a, opcodes.opUint256.selector, this.asmUint256.selector);
        _ctx.addOpcode("msgSender", 0x1d, opcodes.opMsgSender.selector, 0x0);
        _ctx.addOpcode("sendEth", 0x1e, opcodes.opSendEth.selector, this.asmSend.selector);
        _ctx.addOpcode("transfer", 0x1f, opcodes.opTransfer.selector, this.asmTransfer.selector);
        _ctx.addOpcode("transferFrom", 0x20, opcodes.opTransferFrom.selector, this.asmTransferFrom.selector);

        // complex opcodes with sub opcodes (branches)
        string memory name = "loadLocal";
        _ctx.addOpcode(name, 0x1b, opcodes.opLoadLocalAny.selector, this.asmLoadLocal.selector);
        _ctx.addOpcodeBranch(name, "uint256", 0x01, opcodes.opLoadLocalUint256.selector);
        _ctx.addOpcodeBranch(name, "bool", 0x02, opcodes.opLoadLocalBool.selector);
        _ctx.addOpcodeBranch(name, "address", 0x03, opcodes.opLoadLocalAddress.selector);
        _ctx.addOpcodeBranch(name, "bytes32", 0x04, opcodes.opLoadLocalBytes32.selector);

        name = "loadRemote";
        _ctx.addOpcode(name, 0x1c, opcodes.opLoadRemoteAny.selector, this.asmLoadRemote.selector);
        _ctx.addOpcodeBranch(name, "uint256", 0x01, opcodes.opLoadRemoteUint256.selector);
        _ctx.addOpcodeBranch(name, "bool", 0x02, opcodes.opLoadRemoteBool.selector);
        _ctx.addOpcodeBranch(name, "address", 0x03, opcodes.opLoadRemoteAddress.selector);
        _ctx.addOpcodeBranch(name, "bytes32", 0x04, opcodes.opLoadRemoteBytes32.selector);
    }

    function nextCmd() internal returns (string storage) {
        return cmds[cmdIdx++];
    }

    function parseVariable() internal {
        program = bytes.concat(program, bytes4(keccak256(abi.encodePacked(nextCmd()))));
    }

    function parseBranchOf(Context _ctx, string memory baseOpName) internal {
        program = bytes.concat(program, _ctx.branchCodes(baseOpName, nextCmd()));
    }

    function parseAddress() internal {
        program = bytes.concat(program, nextCmd().fromHex());
    }

    function getAddress() internal view returns (address) {
        bytes memory addrBytes = cmds[cmdIdx].fromHex();
        bytes32 addrB32;
        // console.logBytes(addrBytes);

        assembly {
            addrB32 := mload(add(addrBytes, 0x20))
        }
        /**
         * Shift bytes to the left so that
         * 0xe7f1725e7734ce288f8367e1bb143e90bb3f0512000000000000000000000000
         * transforms into
         * 0x000000000000000000000000e7f1725e7734ce288f8367e1bb143e90bb3f0512
         * This is needed to later conversion from bytes32 to address
         */
        addrB32 >>= 96;

        // console.log("addrB32");
        // console.logBytes32(addrB32);

        return address(uint160(uint256(addrB32)));
    }
}

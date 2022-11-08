# Solidity API

## Agreement

Financial Agreement written in DSL between two or more users

Agreement contract that is used to implement any custom logic of a
financial agreement. Ex. lender-borrower agreement

### parser

```solidity
contract IParser parser
```

### context

```solidity
contract IContext context
```

### ownerAddr

```solidity
address ownerAddr
```

### NewRecord

```solidity
event NewRecord(uint256 recordId, uint256[] requiredRecords, address[] signatories, string transaction, string[] conditionStrings)
```

### isReserved

```solidity
modifier isReserved(bytes32 position)
```

### onlyOwner

```solidity
modifier onlyOwner()
```

### Record

```solidity
struct Record {
  address recordContext;
  bool isExecuted;
  bool isArchived;
  bool isActive;
  string transactionString;
}
```

### records

```solidity
mapping(uint256 => struct Agreement.Record) records
```

### conditionContexts

```solidity
mapping(uint256 => address[]) conditionContexts
```

### conditionStrings

```solidity
mapping(uint256 => string[]) conditionStrings
```

### signatories

```solidity
mapping(uint256 => address[]) signatories
```

### requiredRecords

```solidity
mapping(uint256 => uint256[]) requiredRecords
```

### isExecutedBySignatory

```solidity
mapping(uint256 => mapping(address => bool)) isExecutedBySignatory
```

### recordIds

```solidity
uint256[] recordIds
```

### constructor

```solidity
constructor(address _parser, address _ownerAddr) public
```

Sets parser address, creates new Context instance, and setups Context

### getStorageBool

```solidity
function getStorageBool(bytes32 position) external view returns (bool data)
```

### getStorageAddress

```solidity
function getStorageAddress(bytes32 position) external view returns (address data)
```

### getStorageUint256

```solidity
function getStorageUint256(bytes32 position) external view returns (uint256 data)
```

### setStorageBool

```solidity
function setStorageBool(bytes32 position, bool data) external
```

### setStorageAddress

```solidity
function setStorageAddress(bytes32 position, address data) external
```

### setStorageBytes32

```solidity
function setStorageBytes32(bytes32 position, bytes32 data) external
```

### setStorageUint256

```solidity
function setStorageUint256(bytes32 position, uint256 data) external
```

### conditionContextsLen

```solidity
function conditionContextsLen(uint256 _recordId) external view returns (uint256)
```

_Based on Record ID returns the number of condition Context instances_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _recordId | uint256 | Record ID |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | Number of condition Context instances of the Record |

### signatoriesLen

```solidity
function signatoriesLen(uint256 _recordId) external view returns (uint256)
```

_Based on Record ID returns the number of signatures_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _recordId | uint256 | Record ID |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | Number of signatures in records |

### requiredRecordsLen

```solidity
function requiredRecordsLen(uint256 _recordId) external view returns (uint256)
```

_Based on Record ID returns the number of required records_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _recordId | uint256 | Record ID |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | Number of required records |

### conditionStringsLen

```solidity
function conditionStringsLen(uint256 _recordId) external view returns (uint256)
```

_Based on Record ID returns the number of condition strings_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _recordId | uint256 | Record ID |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | Number of Condition strings of the Record |

### getActiveRecords

```solidity
function getActiveRecords() external view returns (uint256[])
```

_Sorted all records and return array of active records in Agreement_

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256[] | activeRecords array of active records in Agreement |

### getRecord

```solidity
function getRecord(uint256 _recordId) external view returns (uint256[] _requiredRecords, address[] _signatories, string[] _conditions, string _transaction, bool _isActive)
```

_return valuses for preview record before execution_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _recordId | uint256 | Record ID |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| _requiredRecords | uint256[] | array of required records in the record |
| _signatories | address[] | array of signatories in the record |
| _conditions | string[] | array of conditions in the record |
| _transaction | string | string of transaction |
| _isActive | bool | true if the record is active |

### archiveRecord

```solidity
function archiveRecord(uint256 _recordId) external
```

_archived any of the existing records by recordId._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _recordId | uint256 | Record ID |

### unarchiveRecord

```solidity
function unarchiveRecord(uint256 _recordId) external
```

_unarchive any of the existing records by recordId_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _recordId | uint256 | Record ID |

### activateRecord

```solidity
function activateRecord(uint256 _recordId) external
```

_activates the existing records by recordId, only awailable for ownerAddr_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _recordId | uint256 | Record ID |

### deactivateRecord

```solidity
function deactivateRecord(uint256 _recordId) external
```

_deactivates the existing records by recordId, only awailable for ownerAddr_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _recordId | uint256 | Record ID |

### parse

```solidity
function parse(string _code, address _context, address _preProc) external
```

_Parse DSL code from the user and set the program bytecode in Context contract_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _code | string | DSL code input from the user |
| _context | address | Context address |
| _preProc | address | Preprocessor address |

### update

```solidity
function update(uint256 _recordId, uint256[] _requiredRecords, address[] _signatories, string _transactionString, string[] _conditionStrings, address _recordContext, address[] _conditionContexts) external
```

### execute

```solidity
function execute(uint256 _recordId) external payable
```

### receive

```solidity
receive() external payable
```

### _checkSignatories

```solidity
function _checkSignatories(address[] _signatories) internal view
```

_Checks input _signatures that only one  'anyone' address exists in the
list or that 'anyone' address does not exist in signatures at all_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _signatories | address[] | the list of addresses |

### _verify

```solidity
function _verify(uint256 _recordId) internal view returns (bool)
```

Verify that the user who wants to execute the record is amoung the signatories for this Record

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _recordId | uint256 | ID of the record |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | bool | true if the user is allowed to execute the record, false - otherwise |

### _validateRequiredRecords

```solidity
function _validateRequiredRecords(uint256 _recordId) internal view returns (bool)
```

Check that all records required by this records were executed

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _recordId | uint256 | ID of the record |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | bool | true all the required records were executed, false - otherwise |

### _addRecordBlueprint

```solidity
function _addRecordBlueprint(uint256 _recordId, uint256[] _requiredRecords, address[] _signatories) internal
```

_Define some basic values for a new record_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _recordId | uint256 | is the ID of a transaction |
| _requiredRecords | uint256[] | transactions ids that have to be executed |
| _signatories | address[] | addresses that can execute the chosen transaction |

### _addRecordCondition

```solidity
function _addRecordCondition(uint256 _recordId, string _conditionStr, address _conditionCtx) internal
```

_Conditional Transaction: Append a condition to already existing conditions
inside Record_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _recordId | uint256 | Record ID |
| _conditionStr | string | DSL code for condition |
| _conditionCtx | address | Context contract address for block of DSL code for `_conditionStr` |

### _addRecordTransaction

```solidity
function _addRecordTransaction(uint256 _recordId, string _transactionString, address _recordContext) internal
```

_Adds a transaction that should be executed if all
conditions inside Record are met_

### _validateConditions

```solidity
function _validateConditions(uint256 _recordId, uint256 _msgValue) internal returns (bool)
```

### _fulfill

```solidity
function _fulfill(uint256 _recordId, uint256 _msgValue, address _signatory) internal returns (bool)
```

_Fulfill Record_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _recordId | uint256 | Record ID to execute |
| _msgValue | uint256 | Value that were sent along with function execution // TODO: possibly remove this argument |
| _signatory | address | The user that is executing the Record |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | bool | Boolean whether the record was successfully executed or not |

### _activeRecordsLen

```solidity
function _activeRecordsLen() internal view returns (uint256)
```

_return length of active records for getActiveRecords_

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | count length of active records array |

## AgreementMock

### constructor

```solidity
constructor(address _parser, address _ownerAddr) public
```

### verify

```solidity
function verify(uint256 _recordId) public view returns (bool)
```

### validateRequiredRecords

```solidity
function validateRequiredRecords(uint256 _recordId) public view returns (bool)
```

### validateConditions

```solidity
function validateConditions(uint256 _recordId, uint256 _msgValue) public returns (bool)
```

### addRecordBlueprint

```solidity
function addRecordBlueprint(uint256 _recordId, uint256[] _requiredRecords, address[] _signatories) external
```

### addRecordCondition

```solidity
function addRecordCondition(uint256 _recordId, string _conditionStr, address _conditionCtx) public
```

### addRecordTransaction

```solidity
function addRecordTransaction(uint256 _recordId, string _transactionString, address _recordContext) public
```

### fulfill

```solidity
function fulfill(uint256 _recordId, uint256 _msgValue, address _signatory) external returns (bool)
```

### setRecordContext

```solidity
function setRecordContext(uint256 _recordId, address _context) external
```

## MultisigMock

This is the contract that simulates Multisig. The contract just executes any transaction given to it without
any checks

### executeTransaction

```solidity
function executeTransaction(address _targetContract, bytes _payload, uint256 _value) external
```

Execute any transaction to any contract

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _targetContract | address | Contract which function should be called |
| _payload | bytes | Raw unsigned contract function call data with parameters |
| _value | uint256 | Optional value to send via the delegate call |

## Context

_Context of DSL code

One of the core contracts of the project. It contains opcodes and aliases for commands.
It provides additional information about program state and point counter (pc).
During creating Context contract executes the `initOpcodes` function that provides
basic working opcodes_

### anyone

```solidity
address anyone
```

### stack

```solidity
contract Stack stack
```

### program

```solidity
bytes program
```

### pc

```solidity
uint256 pc
```

### nextpc

```solidity
uint256 nextpc
```

### appAddr

```solidity
address appAddr
```

### msgSender

```solidity
address msgSender
```

### comparisonOpcodes

```solidity
address comparisonOpcodes
```

### branchingOpcodes

```solidity
address branchingOpcodes
```

### logicalOpcodes

```solidity
address logicalOpcodes
```

### otherOpcodes

```solidity
address otherOpcodes
```

### msgValue

```solidity
uint256 msgValue
```

### opCodeByName

```solidity
mapping(string => bytes1) opCodeByName
```

### selectorByOpcode

```solidity
mapping(bytes1 => bytes4) selectorByOpcode
```

### opcodeLibNameByOpcode

```solidity
mapping(bytes1 => enum IContext.OpcodeLibNames) opcodeLibNameByOpcode
```

### asmSelectors

```solidity
mapping(string => bytes4) asmSelectors
```

### opsPriors

```solidity
mapping(string => uint256) opsPriors
```

### operators

```solidity
string[] operators
```

### branchSelectors

```solidity
mapping(string => mapping(bytes1 => bytes4)) branchSelectors
```

### branchCodes

```solidity
mapping(string => mapping(string => bytes1)) branchCodes
```

### aliases

```solidity
mapping(string => string) aliases
```

### isStructVar

```solidity
mapping(string => bool) isStructVar
```

### structParams

```solidity
mapping(bytes4 => mapping(bytes4 => bytes4)) structParams
```

### forLoopIterationsRemaining

```solidity
uint256 forLoopIterationsRemaining
```

### nonZeroAddress

```solidity
modifier nonZeroAddress(address _addr)
```

### constructor

```solidity
constructor() public
```

### initOpcodes

```solidity
function initOpcodes() internal
```

_Creates a list of opcodes and its aliases with information about each of them:
- name
- selectors of opcode functions,
- used library for each of opcode for Executor contract
- asm selector of function that uses in Parser contract
Function contains simple opcodes as arithmetic, comparison and bitwise. In additional to that
it contains complex opcodes that can load data (variables with different types) from memory
and helpers like transfer tokens or native coins to the address or opcodes branching and internal
DSL functions._

### operatorsLen

```solidity
function operatorsLen() external view returns (uint256)
```

_Returns the amount of stored operators_

### setComparisonOpcodesAddr

```solidity
function setComparisonOpcodesAddr(address _comparisonOpcodes) public
```

_Sets the new address of the ComparisonOpcodes library_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _comparisonOpcodes | address | is the new address of the library |

### setBranchingOpcodesAddr

```solidity
function setBranchingOpcodesAddr(address _branchingOpcodes) public
```

_Sets the new address of the BranchingOpcodes library_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _branchingOpcodes | address | is the new address of the library |

### setLogicalOpcodesAddr

```solidity
function setLogicalOpcodesAddr(address _logicalOpcodes) public
```

_Sets the new address of the LogicalOpcodes library_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _logicalOpcodes | address | is the new address of the library |

### setOtherOpcodesAddr

```solidity
function setOtherOpcodesAddr(address _otherOpcodes) public
```

_Sets the new address of the OtherOpcodes library_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _otherOpcodes | address | is the new address of the library |

### addOpcode

```solidity
function addOpcode(string _name, bytes1 _opcode, bytes4 _opSelector, bytes4 _asmSelector, enum IContext.OpcodeLibNames _libName) public
```

_Adds the opcode for the DSL command_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _name | string | is the name of the command |
| _opcode | bytes1 | is the opcode of the command |
| _opSelector | bytes4 | is the selector of the function for this opcode        from onle of library in `contracts/libs/opcodes/*` |
| _asmSelector | bytes4 | is the selector of the function from the Parser for that opcode |
| _libName | enum IContext.OpcodeLibNames | is the name of library that is used fot the opcode |

### setProgram

```solidity
function setProgram(bytes _data) public
```

_ATTENTION! Works only during development! Will be removed.
Sets the final version of the program._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _data | bytes | is the bytecode of the full program |

### programAt

```solidity
function programAt(uint256 _index, uint256 _step) public view returns (bytes)
```

_Returns the slice of the current program using the index and the step values_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _index | uint256 | is a last byte of the slice |
| _step | uint256 | is the step of the slice |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | bytes | the slice of stored bytecode in the `program` variable |

### programSlice

```solidity
function programSlice(bytes _payload, uint256 _index, uint256 _step) public pure returns (bytes)
```

_Returns the slice of the program using a step value_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _payload | bytes | is bytecode of program that will be sliced |
| _index | uint256 | is a last byte of the slice |
| _step | uint256 | is the step of the slice |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | bytes | the slice of provided _payload bytecode |

### setPc

```solidity
function setPc(uint256 _pc) public
```

_Sets the current point counter for the program_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _pc | uint256 | is the new value of the pc |

### setNextPc

```solidity
function setNextPc(uint256 _nextpc) public
```

_Sets the next point counter for the program_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _nextpc | uint256 | is the new value of the nextpc |

### incPc

```solidity
function incPc(uint256 _val) public
```

_Increases the current point counter with the provided value and saves the sum_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _val | uint256 | is the new value that is used for summing it and the current pc value |

### setAppAddress

```solidity
function setAppAddress(address _appAddr) external
```

_Sets/Updates application Address by the provided value_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _appAddr | address | is the new application Address, can not be a zero address |

### setMsgSender

```solidity
function setMsgSender(address _msgSender) public
```

_Sets/Updates msgSender by the provided value_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _msgSender | address | is the new msgSender |

### setMsgValue

```solidity
function setMsgValue(uint256 _msgValue) public
```

_Sets/Updates msgValue by the provided value_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _msgValue | uint256 | is the new msgValue |

### setStructVars

```solidity
function setStructVars(string _structName, string _varName, string _fullName) public
```

_Sets the full name depends on structure variables_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _structName | string | is the name of the structure |
| _varName | string | is the name of the structure variable |
| _fullName | string | is the full string of the name of the structure and its variables |

### setForLoopIterationsRemaining

```solidity
function setForLoopIterationsRemaining(uint256 _forLoopIterationsRemaining) external
```

_Sets the number of iterations for the for-loop that is being executed_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _forLoopIterationsRemaining | uint256 | The number of iterations of the loop |

### _addOpcodeForOperator

```solidity
function _addOpcodeForOperator(string _name, bytes1 _opcode, bytes4 _opSelector, bytes4 _asmSelector, enum IContext.OpcodeLibNames _libName, uint256 _priority) internal
```

_Adds the opcode for the operator_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _name | string | is the name of the operator |
| _opcode | bytes1 | is the opcode of the operator |
| _opSelector | bytes4 | is the selector of the function for this operator        from onle of library in `contracts/libs/opcodes/*` |
| _asmSelector | bytes4 | is the selector of the function from the Parser for this operator |
| _libName | enum IContext.OpcodeLibNames | is the name of library that is used fot the operator |
| _priority | uint256 | is the priority for the opcode |

### _addOpcodeBranch

```solidity
function _addOpcodeBranch(string _baseOpName, string _branchName, bytes1 _branchCode, bytes4 _selector) internal
```

_As branched (complex) DSL commands have their own name, types and values the
_addOpcodeBranch provides adding opcodes using additional internal branch opcodes._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _baseOpName | string | is the name of the command |
| _branchName | string | is the type for the value |
| _branchCode | bytes1 | is the code for the certain name and its type |
| _selector | bytes4 | is the selector of the function from the Parser for this command |

### _addOperator

```solidity
function _addOperator(string _op, uint256 _priority) internal
```

_Adds the operator by its priority
Note: bigger number => bigger priority_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _op | string | is the name of the operator |
| _priority | uint256 | is the priority of the operator |

### _addAlias

```solidity
function _addAlias(string _baseCmd, string _alias) internal
```

_Adds an alias to the already existing DSL command_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _baseCmd | string | is the name of the command |
| _alias | string | is the alias command name for the base command |

## ContextFactory

### deployedContexts

```solidity
address[] deployedContexts
```

### NewContext

```solidity
event NewContext(address context)
```

### deployContext

```solidity
function deployContext(address _app) external returns (address _contextAddr)
```

Deploy new Context contract

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _app | address | Address of the end application |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| _contextAddr | address | Address of a newly created Context |

### getDeployedContextsLen

```solidity
function getDeployedContextsLen() external view returns (uint256)
```

## Parser

_Parser of DSL code
This contract is a singleton and should not be deployed more than once

One of the core contracts of the project. It parses DSL expression
that comes from user. After parsing code in Parser
a bytecode of the DSL program is generated as stored in Context

DSL code in postfix notation as string -> Parser -> raw bytecode_

### program

```solidity
bytes program
```

### cmds

```solidity
string[] cmds
```

### cmdIdx

```solidity
uint256 cmdIdx
```

### labelPos

```solidity
mapping(string => uint256) labelPos
```

### parse

```solidity
function parse(address _preprAddr, address _ctxAddr, string _codeRaw) external
```

_Transform DSL code from array in infix notation to raw bytecode_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _preprAddr | address |  |
| _ctxAddr | address | Context contract interface address |
| _codeRaw | string | Input code as a string in infix notation |

### asmSetLocalBool

```solidity
function asmSetLocalBool() public
```

_Updates the program with the bool value

Example of a command:
```
bool true
```_

### asmSetUint256

```solidity
function asmSetUint256() public
```

_Updates the program with the local variable value

Example of a command:
```
(uint256 5 + uint256 7) setUint256 VARNAME
```_

### asmDeclare

```solidity
function asmDeclare(address _ctxAddr) public
```

_Updates the program with the name(its position) of the array

Example of a command:
```
declare ARR_NAME
```_

### asmGet

```solidity
function asmGet() public
```

_Updates the program with the element by index from the provived array's name

Example of a command:
```
get 3 USERS
```_

### asmPush

```solidity
function asmPush() public
```

_Updates the program with the new item for the array, can be `uint256`,
`address` and `struct name` types.

Example of a command:
```
push ITEM ARR_NAME
```_

### asmVar

```solidity
function asmVar() public
```

_Updates the program with the loadLocal variable

Example of command:
```
var NUMBER
```_

### asmLoadRemote

```solidity
function asmLoadRemote(address _ctxAddr) public
```

_Updates the program with the loadRemote variable

Example of a command:
```
loadRemote bool MARY_ADDRESS 9A676e781A523b5d0C0e43731313A708CB607508
```_

### asmBool

```solidity
function asmBool() public
```

_Concatenates and updates previous `program` with the `0x01`
bytecode of `true` value otherwise `0x00` for `false`_

### asmUint256

```solidity
function asmUint256() public
```

_Concatenates and updates previous `program` with the
bytecode of uint256 value_

### asmSend

```solidity
function asmSend() public
```

_Updates previous `program` with the amount that will be send (in wei)

Example of a command:
```
sendEth RECEIVER 1234
```_

### asmTransfer

```solidity
function asmTransfer() public
```

_Updates previous `program` with the amount of tokens
that will be transfer to reciever(in wei). The `TOKEN` and `RECEIVER`
parameters should be stored in smart contract

Example of a command:
```
transfer TOKEN RECEIVER 1234
```_

### asmTransferVar

```solidity
function asmTransferVar() public
```

_Updates previous `program` with the amount of tokens
that will be transfer to reciever(in wei). The `TOKEN`, `RECEIVER`, `AMOUNT`
parameters should be stored in smart contract

Example of a command:
```
transferVar TOKEN RECEIVER AMOUNT
```_

### asmTransferFrom

```solidity
function asmTransferFrom() public
```

_Updates previous `program` with the amount of tokens
that will be transfer from the certain address to reciever(in wei).
The `TOKEN`, `FROM`, `TO` address parameters should be stored in smart contract

Example of a command:
```
transferFrom TOKEN FROM TO 1234
```_

### asmTransferFromVar

```solidity
function asmTransferFromVar() public
```

_Updates previous `program` with the amount of tokens
that will be transfer from the certain address to reciever(in wei).
The `TOKEN`, `FROM`, `TO`, `AMOUNT` parameters should be stored in smart contract

Example of a command:
```
transferFromVar TOKEN FROM TO AMOUNT
```_

### asmBalanceOf

```solidity
function asmBalanceOf() public
```

_Updates previous `program` with getting the amount of tokens
The `TOKEN`, `USER` address parameters should be stored in smart contract

Example of a command:
```
balanceOf TOKEN USER
```_

### asmLengthOf

```solidity
function asmLengthOf() public
```

_Updates previous `program` with getting the length of the dsl array by its name
The command return non zero value only if the array name was declared and have at least one value.
Check: `declareArr` and `push` commands for DSL arrays

Example of a command:
```
lengthOf ARR_NAME
```_

### asmSumOf

```solidity
function asmSumOf() public
```

_Updates previous `program` with the name of the dsl array that will
be used to sum uint256 variables

Example of a command:
```
sumOf ARR_NAME
```_

### asmSumThroughStructs

```solidity
function asmSumThroughStructs() public
```

_Updates previous `program` with the name of the dsl array and
name of variable in the DSL structure that will
be used to sum uint256 variables

Example of a command:
```
struct BOB {
  lastPayment: 3
}

struct ALISA {
  lastPayment: 300
}

sumOf USERS.lastPayment
```_

### asmIfelse

```solidity
function asmIfelse() public
```

_Updates previous `program` for positive and negative branch position

Example of a command:
```
6 > 5 // condition is here must return true or false
ifelse AA BB
end

branch AA {
  // code for `positive` branch
}

branch BB {
  // code for `negative` branch
}
```_

### asmIf

```solidity
function asmIf() public
```

_Updates previous `program` for positive branch position

Example of a command:
```
6 > 5 // condition is here must return true or false
if POSITIVE_ACTION
end

POSITIVE_ACTION {
  // code for `positive` branch
}
```_

### asmFunc

```solidity
function asmFunc() public
```

_Updates previous `program` for function code

Example of a command:
```
func NAME_OF_FUNCTION

NAME_OF_FUNCTION {
  // code for the body of function
}
```_

### asmStruct

```solidity
function asmStruct(address _ctxAddr) public
```

_Updates previous `program` for DSL struct.
This function rebuilds variable parameters using a name of the structure, dot symbol
and the name of each parameter in the structure

Example of DSL command:
```
struct BOB {
  account: 0x47f8a90ede3d84c7c0166bd84a4635e4675accfc,
  lastPayment: 3
}
```

Example of commands that uses for this functions:
`cmds = ['struct', 'BOB', 'lastPayment', '3', 'account', '0x47f..', 'endStruct']`

`endStruct` word is used as an indicator for the ending loop for the structs parameters_

### asmForLoop

```solidity
function asmForLoop() public
```

_Parses variable names in for-loop & skip the unnecessary `in` parameter
Ex. ['for', 'LP_INITIAL', 'in', 'LPS_INITIAL']_

### asmEnableRecord

```solidity
function asmEnableRecord() public
```

_Parses the `record id` and the `agreement address` parameters
Ex. ['enable', '56', 'for', '9A676e781A523b5d0C0e43731313A708CB607508']_

### _isLabel

```solidity
function _isLabel(string _name) internal view returns (bool)
```

_returns `true` if the name of `if/ifelse branch` or `function` exists in the labelPos list
otherwise returns `false`_

### _parseCode

```solidity
function _parseCode(address _ctxAddr, string[] code) internal
```

_Сonverts a list of commands to bytecode_

### _parseOpcodeWithParams

```solidity
function _parseOpcodeWithParams(address _ctxAddr) internal
```

_Updates the bytecode `program` in dependence on
commands that were provided in `cmds` list_

### _nextCmd

```solidity
function _nextCmd() internal returns (string)
```

_Returns next commad from the cmds list, increases the
command index `cmdIdx` by 1_

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | string | nextCmd string |

### _parseVariable

```solidity
function _parseVariable() internal
```

_Updates previous `program` with the next provided command_

### _parseBranchOf

```solidity
function _parseBranchOf(address _ctxAddr, string baseOpName) internal
```

_Updates previous `program` with the branch name, like `loadLocal` or `loadRemote`
of command and its additional used type_

### _parseAddress

```solidity
function _parseAddress() internal
```

_Updates previous `program` with the address command that is a value_

## Preprocessor

_Preprocessor of DSL code
This contract is a singleton and should not be deployed more than once

TODO: add description about Preprocessor as a single contract of the project
It can remove comments that were created by user in the DSL code string. It
transforms the users DSL code string to the list of commands that can be used
in a Parser contract.

DSL code in postfix notation as
user's string code -> Preprocessor -> each command is separated in the commands list_

### parameters

```solidity
mapping(uint256 => struct IPreprocessor.FuncParameter) parameters
```

### result

```solidity
string[] result
```

### strStack

```solidity
contract StringStack strStack
```

### DOT_SYMBOL

```solidity
bytes1 DOT_SYMBOL
```

### constructor

```solidity
constructor() public
```

### transform

```solidity
function transform(address _ctxAddr, string _program) external returns (string[])
```

_The main function that transforms the user's DSL code string to the list of commands.

Example:
The user's DSL code string is
```
uint256 6 setUint256 A
```
The end result after executing a `transform()` function is
```
['uint256', '6', 'setUint256', 'A']
```_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _ctxAddr | address | is a context contract address |
| _program | string | is a user's DSL code string |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | string[] | the list of commands that storing `result` |

### cleanString

```solidity
function cleanString(string _program) public pure returns (string _cleanedProgram)
```

_Searches the comments in the program and removes comment lines
Example:
The user's DSL code string is
```
 bool true
 // uint256 2 * uint256 5
```
The end result after executing a `cleanString()` function is
```
bool true
```_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _program | string | is a current program string |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| _cleanedProgram | string | new string program that contains only clean code without comments |

### split

```solidity
function split(string _program) public returns (string[])
```

_Splits the user's DSL code string to the list of commands
avoiding several symbols:
- removes additional and useless symbols as ' ', `\\n`
- defines and adding help 'end' symbol for the ifelse condition
- defines and cleans the code from `{` and `}` symbols

Example:
The user's DSL code string is
```
(var TIMESTAMP > var INIT)
```
The end result after executing a `split()` function is
```
['var', 'TIMESTAMP', '>', 'var', 'INIT']
```_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _program | string | is a user's DSL code string |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | string[] | the list of commands that storing in `result` |

### infixToPostfix

```solidity
function infixToPostfix(address _ctxAddr, string[] _code, contract StringStack _stack) public returns (string[])
```

_Rebuild and transforms the user's DSL commands (can be prepared by
the `split()` function) to the list of commands.

Example:
The user's DSL command contains
```
['1', '+', '2']
```
The result after executing a `infixToPostfix()` function is
```
['uint256', '1', 'uint256', '2', '+']
```_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _ctxAddr | address | is a context contract address |
| _code | string[] | is a DSL command list |
| _stack | contract StringStack |  |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | string[] | _stack uses for getting and storing temporary string data rebuild the list of commands |

### _getMultiplier

```solidity
function _getMultiplier(string _chunk) internal pure returns (uint256)
```

_checks the value, and returns the corresponding multiplier.
If it is Ether, then it returns 1000000000000000000,
If it is GWEI, then it returns 1000000000_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _chunk | string | is a command from DSL command list |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | returns the corresponding multiplier. |

### _getNames

```solidity
function _getNames(string _chunk) internal view returns (bool success, string arrName, string structVar)
```

_Searching for a `.` (dot) symbol  and returns names status for complex string name.
Ex. `USERS.balance`:
Where `success` = true`,
`arrName` = `USERS`,
`structVar` = `balance`; otherwise it returns `success` = false` with empty string results_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _chunk | string | is a command from DSL command list |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| success | bool | if user provides complex name,  result is true |
| arrName | string | if user provided complex name, result is the name of structure |
| structVar | string | if user provided complex name, result is the name of structure variable |

### _parseChunk

```solidity
function _parseChunk(string _chunk, uint256 _currencyMultiplier) internal pure returns (string)
```

_returned parsed chunk, values can be address with 0x parameter or be uint256 type_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _chunk | string | provided string |
| _currencyMultiplier | uint256 | provided number of the multiplier |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | string | updated _chunk value in dependence on its type |

### _parseNumber

```solidity
function _parseNumber(string _chunk, uint256 _currencyMultiplier) internal pure returns (string updatedChunk)
```

_As the string of values can be simple and complex for DSL this function returns a number in
Wei regardless of what type of number parameter was provided by the user.
For example:
`uint256 1000000` - simple
`uint256 1e6 - complex`_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _chunk | string | provided number |
| _currencyMultiplier | uint256 | provided number of the multiplier |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| updatedChunk | string | amount in Wei of provided _chunk value |

### _isCurrencySymbol

```solidity
function _isCurrencySymbol(string _chunk) internal pure returns (bool)
```

_Check is chunk is a currency symbol_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _chunk | string | is a current chunk from the DSL string code |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | bool | true or false based on whether chunk is a currency symbol or not |

### _updateUINT256param

```solidity
function _updateUINT256param() internal
```

_Pushes additional 'uint256' string to results in case, if there are no
types provided for uint256 values or
loadRemote command, is not in the processing or
the last chunk that was added to results is not 'uint256'_

### _parseFuncParams

```solidity
function _parseFuncParams(string _chunk, string _currentName, bool _isFunc) internal returns (bool)
```

_Checks parameters and updates DSL code depending on what
kind of function was provided.
This internal function expects 'func' that can be with and without parameters._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _chunk | string | is a current chunk from the DSL string code |
| _currentName | string | is a current name of function |
| _isFunc | bool | describes if the func opcode was occured |

### _parseFuncMainData

```solidity
function _parseFuncMainData(string _chunk, string _currentName, bool _isFunc, bool _isName) internal pure returns (bool, bool, string)
```

_Returns updated parameters for the `func` opcode processing
Pushes the command that saves parameter in the smart contract instead
of the parameters that were provided for parsing.
The function will store the command like `uint256 7 setUint256 NUMBER_VAR` and
remove the parameter like `uint256 7`.
The DSL command will be stored before the function body.
For the moment it works only with uint256 type._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _chunk | string | is a current chunk from the DSL string code |
| _currentName | string | is a current name of function |
| _isFunc | bool | describes if the func opcode was occured |
| _isName | bool | describes if the name for the function was already set |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | bool | isFunc the new state of _isFunc for function processing |
| [1] | bool | isName the new state of _isName for function processing |
| [2] | string | name the new name of the function |

### _rebuildParameters

```solidity
function _rebuildParameters(uint256 _paramsCount, string _nameOfFunc) internal
```

_Rebuilds parameters to DSL commands in result's list.
Pushes the command that saves parameter in the smart contract instead
of the parameters that were provided for parsing.
The function will store the command like `uint256 7 setUint256 NUMBER_VAR` and
remove the parameter like `uint256 7`.
The DSL command will be stored before the function body.
For the moment it works only with uint256 type._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _paramsCount | uint256 | is an amount of parameters that provided after the name of function |
| _nameOfFunc | string | is a name of function that is used to generate the name of variables |

### _pushParameters

```solidity
function _pushParameters(uint256 _count) internal
```

_Pushes parameters to result's list depend on their type for each value_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _count | uint256 | is an amount of parameters provided next to the name of func |

### _saveParameter

```solidity
function _saveParameter(uint256 _index, string _type, string _value, string _nameOfFunc) internal
```

_Saves parameters in mapping checking/using valid type for each value_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _index | uint256 | is a current chunk index from temporary chunks |
| _type | string | is a type of the parameter |
| _value | string | is a value of the parameter |
| _nameOfFunc | string | is a name of function that is used to generate the name of the current variable |

### _cleanCode

```solidity
function _cleanCode(uint256 _count) internal
```

_Clears useless variables from the DSL code string as
all needed parameters are already stored in chunks list_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _count | uint256 | is an amount of parameters provided next to the name of func. As parameters are stored with their types, the _count variable was already multiplied to 2 |

### _rebuildParameter

```solidity
function _rebuildParameter(string _type, string _value, string _variableName) internal
```

_Preparing and pushes the DSL command to results.
The comand will save this parameter and its name in the smart contract.
For example: `uint256 7 setUint256 NUMBER_VAR`
For the moment it works only with uint256 types._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _type | string | is a type of the parameter |
| _value | string | is a value of the parameter |
| _variableName | string | is a name of variable that was generated before |

### _pushFuncName

```solidity
function _pushFuncName(string _name) internal
```

_Pushes the func opcode and the name of the function_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _name | string | is a current name of the function |

### _isOperator

```solidity
function _isOperator(address _ctxAddr, string op) internal view returns (bool)
```

### _isAlias

```solidity
function _isAlias(address _ctxAddr, string _cmd) internal view returns (bool)
```

_Checks if a string is an alias to a command from DSL_

### _getCommentSymbol

```solidity
function _getCommentSymbol(uint256 _index, string _program, string char) internal pure returns (uint256, uint256, bool)
```

_Checks if a symbol is a comment, then increases _index to the next
no-comment symbol avoiding an additional iteration_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _index | uint256 | is a current index of a char that might be changed |
| _program | string | is a current program string |
| char | string |  |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | new index |
| [1] | uint256 | searchedSymbolLen |
| [2] | bool | isCommeted |

### _getEndCommentSymbol

```solidity
function _getEndCommentSymbol(uint256 _ssl, uint256 _i, string _p, string char) internal pure returns (uint256, bool)
```

_Checks if a symbol is an end symbol of a comment, then increases _index to the next
no-comment symbol avoiding an additional iteration_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _ssl | uint256 | is a searched symbol len that might be 0, 1, 2 |
| _i | uint256 | is a current index of a char that might be changed |
| _p | string | is a current program string |
| char | string |  |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | index is a new index of a char |
| [1] | bool | isCommeted |

### _canGetSymbol

```solidity
function _canGetSymbol(uint256 _index, string _program) internal pure returns (bool)
```

_Checks if it is possible to get next char from a _program_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _index | uint256 | is a current index of a char |
| _program | string | is a current program string |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | bool | true if program has the next symbol, otherwise is false |

### _isDirectUseUint256

```solidity
function _isDirectUseUint256(bool _directUseUint256, bool _isStruct, string _chunk) internal pure returns (bool _isDirect)
```

_This function is used to check if 'transferFrom',
'sendEth' and 'transfer' functions(opcodes) won't use 'uint256' opcode during code
execution directly. So it needs to be sure that executed code won't mess up
parameters for the simple number and a number that be used for these functions._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _directUseUint256 | bool | set by default from the outer function. Allows to keep current state of a contract |
| _isStruct | bool |  |
| _chunk | string | is a current chunk from the outer function |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| _isDirect | bool | is true if a chunk is matched one from the opcode list, otherwise is false |

### _updateRemoteParams

```solidity
function _updateRemoteParams(bool _loadRemoteFlag, uint256 _loadRemoteVarCount, string _chunk) internal pure returns (bool _flag, uint256 _count)
```

_As a 'loadRemote' opcode has 4 parameters in total and two of them are
numbers, so it is important to be sure that executed code under 'loadRemote'
won't mess parameters with the simple uint256 numbers._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _loadRemoteFlag | bool | is used to check if it was started the set of parameters for 'loadRemote' opcode |
| _loadRemoteVarCount | uint256 | is used to check if it was finished the set of parameters for 'loadRemote' opcode |
| _chunk | string | is a current chunk from the outer function |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| _flag | bool | is an updated or current value of _loadRemoteFlag |
| _count | uint256 | is an updated or current value of _loadRemoteVarCount |

## LinkedList

### EMPTY

```solidity
bytes32 EMPTY
```

### heads

```solidity
mapping(bytes32 => bytes32) heads
```

### types

```solidity
mapping(bytes32 => bytes1) types
```

### lengths

```solidity
mapping(bytes32 => uint256) lengths
```

### getType

```solidity
function getType(bytes32 _arrName) external view returns (bytes1)
```

_Returns length of the array_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _arrName | bytes32 | is a bytecode of the array name |

### getLength

```solidity
function getLength(bytes32 _arrName) external view returns (uint256)
```

_Returns length of the array_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _arrName | bytes32 | is a bytecode of the array name |

### get

```solidity
function get(uint256 _index, bytes32 _arrName) public view returns (bytes32 data)
```

_Returns the item data from the array by its index_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _index | uint256 | is an index of the item in the array that starts from 0 |
| _arrName | bytes32 | is a bytecode of the array name |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| data | bytes32 | is a bytecode of the item from the array or empty bytes if no item exists by this index |

### declare

```solidity
function declare(bytes1 _type, bytes32 _arrName) external
```

_Declares the new array in dependence of its type_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _type | bytes1 | is a bytecode type of the array. Bytecode of each type can be find in Context contract |
| _arrName | bytes32 | is a bytecode of the array name |

### addItem

```solidity
function addItem(bytes32 _item, bytes32 _arrName) external
```

_Pushed item to the end of the array. Increases the length of the array_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _item | bytes32 | is a bytecode type of the array. Bytecode of each type can be find in Context contract |
| _arrName | bytes32 | is a bytecode of the array name |

### getHead

```solidity
function getHead(bytes32 _arrName) public view returns (bytes32)
```

_Returns the head position of the array:
- `bytes32(0x0)` value if array has not declared yet,
- `bytes32(type(uint256).max` if array was just declared but it is empty
- `other bytecode` with a position of the first element of the array_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _arrName | bytes32 | is a bytecode of the array name |

### _insertItem

```solidity
function _insertItem(bytes32 _position, bytes32 _item) internal
```

_Insert item in the array by provided position. Updates new storage pointer
for the future inserting_

### _updateLinkToNextItem

```solidity
function _updateLinkToNextItem(bytes32 _position, bytes32 _nextPosition) internal
```

_Updates the next position for the provided(current) position_

### _getEmptyMemoryPosition

```solidity
function _getEmptyMemoryPosition() internal view returns (bytes32 position)
```

_Uses 0x40 position as free storage pointer that returns value of current free position.
In this contract it 0x40 position value updates by _insertItem function anfter
adding new item in the array. See: mload - free memory pointer in the doc_

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| position | bytes32 | is a value that stores in the 0x40 position in the storage |

### _getData

```solidity
function _getData(bytes32 _position) internal view returns (bytes32 data, bytes32 nextPosition)
```

_Returns the value of current position and the position(nextPosition)
to the next object in array_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _position | bytes32 | is a current item position in the array |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| data | bytes32 | is a current data stored in the _position |
| nextPosition | bytes32 | is a next position to the next item in the array |

## Stack

### stack

```solidity
uint256[] stack
```

### length

```solidity
function length() external view returns (uint256)
```

### seeLast

```solidity
function seeLast() external view returns (uint256)
```

### push

```solidity
function push(uint256 data) external
```

### pop

```solidity
function pop() external returns (uint256)
```

### clear

```solidity
function clear() external
```

### _length

```solidity
function _length() internal view returns (uint256)
```

### _seeLast

```solidity
function _seeLast() internal view returns (uint256)
```

## StringStack

### stack

```solidity
string[] stack
```

### length

```solidity
function length() external view returns (uint256)
```

### seeLast

```solidity
function seeLast() external view returns (string)
```

### push

```solidity
function push(string data) external
```

### pop

```solidity
function pop() external returns (string)
```

### clear

```solidity
function clear() external
```

### _length

```solidity
function _length() internal view returns (uint256)
```

### _seeLast

```solidity
function _seeLast() internal view returns (string)
```

## IContext

### OpcodeLibNames

```solidity
enum OpcodeLibNames {
  ComparisonOpcodes,
  BranchingOpcodes,
  LogicalOpcodes,
  OtherOpcodes
}
```

### anyone

```solidity
function anyone() external view returns (address)
```

### stack

```solidity
function stack() external view returns (contract Stack)
```

### program

```solidity
function program() external view returns (bytes)
```

### pc

```solidity
function pc() external view returns (uint256)
```

### nextpc

```solidity
function nextpc() external view returns (uint256)
```

### appAddr

```solidity
function appAddr() external view returns (address)
```

### msgSender

```solidity
function msgSender() external view returns (address)
```

### comparisonOpcodes

```solidity
function comparisonOpcodes() external view returns (address)
```

### branchingOpcodes

```solidity
function branchingOpcodes() external view returns (address)
```

### logicalOpcodes

```solidity
function logicalOpcodes() external view returns (address)
```

### otherOpcodes

```solidity
function otherOpcodes() external view returns (address)
```

### msgValue

```solidity
function msgValue() external view returns (uint256)
```

### opCodeByName

```solidity
function opCodeByName(string _name) external view returns (bytes1 _opcode)
```

### selectorByOpcode

```solidity
function selectorByOpcode(bytes1 _opcode) external view returns (bytes4 _selecotor)
```

### opcodeLibNameByOpcode

```solidity
function opcodeLibNameByOpcode(bytes1 _opcode) external view returns (enum IContext.OpcodeLibNames _name)
```

### asmSelectors

```solidity
function asmSelectors(string _name) external view returns (bytes4 _selecotor)
```

### opsPriors

```solidity
function opsPriors(string _name) external view returns (uint256 _priority)
```

### operators

```solidity
function operators(uint256 _index) external view returns (string _operator)
```

### branchSelectors

```solidity
function branchSelectors(string _baseOpName, bytes1 _branchCode) external view returns (bytes4 _selector)
```

### branchCodes

```solidity
function branchCodes(string _baseOpName, string _branchName) external view returns (bytes1 _branchCode)
```

### aliases

```solidity
function aliases(string _alias) external view returns (string _baseCmd)
```

### isStructVar

```solidity
function isStructVar(string _varName) external view returns (bool)
```

### forLoopIterationsRemaining

```solidity
function forLoopIterationsRemaining() external view returns (uint256)
```

### operatorsLen

```solidity
function operatorsLen() external view returns (uint256)
```

### setComparisonOpcodesAddr

```solidity
function setComparisonOpcodesAddr(address _opcodes) external
```

### setBranchingOpcodesAddr

```solidity
function setBranchingOpcodesAddr(address _opcodes) external
```

### setLogicalOpcodesAddr

```solidity
function setLogicalOpcodesAddr(address _opcodes) external
```

### setOtherOpcodesAddr

```solidity
function setOtherOpcodesAddr(address _opcodes) external
```

### setProgram

```solidity
function setProgram(bytes _data) external
```

### programAt

```solidity
function programAt(uint256 _index, uint256 _step) external view returns (bytes)
```

### programSlice

```solidity
function programSlice(bytes _payload, uint256 _index, uint256 _step) external view returns (bytes)
```

### setPc

```solidity
function setPc(uint256 _pc) external
```

### setNextPc

```solidity
function setNextPc(uint256 _nextpc) external
```

### incPc

```solidity
function incPc(uint256 _val) external
```

### setAppAddress

```solidity
function setAppAddress(address _addr) external
```

### setMsgSender

```solidity
function setMsgSender(address _msgSender) external
```

### setMsgValue

```solidity
function setMsgValue(uint256 _msgValue) external
```

### setStructVars

```solidity
function setStructVars(string _structName, string _varName, string _fullName) external
```

### structParams

```solidity
function structParams(bytes4 _structName, bytes4 _varName) external view returns (bytes4 _fullName)
```

### setForLoopIterationsRemaining

```solidity
function setForLoopIterationsRemaining(uint256 _forLoopIterationsRemaining) external
```

## IERC20

_Interface of the ERC20 standard as defined in the EIP._

### totalSupply

```solidity
function totalSupply() external view returns (uint256)
```

_Returns the amount of tokens in existence._

### balanceOf

```solidity
function balanceOf(address account) external view returns (uint256)
```

_Returns the amount of tokens owned by `account`._

### transfer

```solidity
function transfer(address recipient, uint256 amount) external returns (bool)
```

_Moves `amount` tokens from the caller's account to `recipient`.

Returns a boolean value indicating whether the operation succeeded.

Emits a {Transfer} event._

### allowance

```solidity
function allowance(address owner, address spender) external view returns (uint256)
```

_Returns the remaining number of tokens that `spender` will be
allowed to spend on behalf of `owner` through {transferFrom}. This is
zero by default.

This value changes when {approve} or {transferFrom} are called._

### approve

```solidity
function approve(address spender, uint256 amount) external returns (bool)
```

_Sets `amount` as the allowance of `spender` over the caller's tokens.

Returns a boolean value indicating whether the operation succeeded.

IMPORTANT: Beware that changing an allowance with this method brings the risk
that someone may use both the old and the new allowance by unfortunate
transaction ordering. One possible solution to mitigate this race
condition is to first reduce the spender's allowance to 0 and set the
desired value afterwards:
https://github.com/ethereum/EIPs/issues/20#issuecomment-263524729

Emits an {Approval} event._

### transferFrom

```solidity
function transferFrom(address sender, address recipient, uint256 amount) external returns (bool)
```

_Moves `amount` tokens from `sender` to `recipient` using the
allowance mechanism. `amount` is then deducted from the caller's
allowance.

Returns a boolean value indicating whether the operation succeeded.

Emits a {Transfer} event._

### Transfer

```solidity
event Transfer(address from, address to, uint256 value)
```

_Emitted when `value` tokens are moved from one account (`from`) to
another (`to`).

Note that `value` may be zero._

### Approval

```solidity
event Approval(address owner, address spender, uint256 value)
```

_Emitted when the allowance of a `spender` for an `owner` is set by
a call to {approve}. `value` is the new allowance._

## ILinkedList

### getType

```solidity
function getType(bytes32 _arrName) external view returns (bytes1)
```

### getLength

```solidity
function getLength(bytes32 _arrName) external view returns (uint256)
```

### get

```solidity
function get(uint256 _index, bytes32 _arrName) external view returns (bytes32 data)
```

## IParser

### ExecRes

```solidity
event ExecRes(bool result)
```

### NewConditionalTx

```solidity
event NewConditionalTx(address txObj)
```

### parse

```solidity
function parse(address _preprAddr, address _ctxAddr, string _codeRaw) external
```

### asmSetLocalBool

```solidity
function asmSetLocalBool() external
```

### asmSetUint256

```solidity
function asmSetUint256() external
```

### asmVar

```solidity
function asmVar() external
```

### asmLoadRemote

```solidity
function asmLoadRemote(address _ctxAddr) external
```

### asmDeclare

```solidity
function asmDeclare(address _ctxAddr) external
```

### asmBool

```solidity
function asmBool() external
```

### asmUint256

```solidity
function asmUint256() external
```

### asmSend

```solidity
function asmSend() external
```

### asmTransfer

```solidity
function asmTransfer() external
```

### asmTransferVar

```solidity
function asmTransferVar() external
```

### asmTransferFrom

```solidity
function asmTransferFrom() external
```

### asmBalanceOf

```solidity
function asmBalanceOf() external
```

### asmLengthOf

```solidity
function asmLengthOf() external
```

### asmSumOf

```solidity
function asmSumOf() external
```

### asmSumThroughStructs

```solidity
function asmSumThroughStructs() external
```

### asmTransferFromVar

```solidity
function asmTransferFromVar() external
```

### asmIfelse

```solidity
function asmIfelse() external
```

### asmIf

```solidity
function asmIf() external
```

### asmFunc

```solidity
function asmFunc() external
```

### asmGet

```solidity
function asmGet() external
```

### asmPush

```solidity
function asmPush() external
```

### asmStruct

```solidity
function asmStruct(address _ctxAddr) external
```

### asmForLoop

```solidity
function asmForLoop() external
```

### asmEnableRecord

```solidity
function asmEnableRecord() external
```

## IPreprocessor

_Preprocessor of DSL code

One of the core contracts of the project. It can remove comments that were
created by user in the DSL code string. It transforms the users DSL code string
to the list of commands that can be used in a Parser contract.

DSL code in postfix notation as
user's string code -> Preprocessor -> each command is separated in the commands list_

### FuncParameter

```solidity
struct FuncParameter {
  string _type;
  string nameOfVariable;
  string value;
}
```

### PreprocessorInfo

```solidity
struct PreprocessorInfo {
  bool isFunc;
  bool isName;
  bool loadRemoteFlag;
  bool directUseUint256;
  bool isArrayStart;
  bool isStructStart;
  bool isLoopStart;
  uint256 loadRemoteVarCount;
  uint256 currencyMultiplier;
  uint256 insertStep;
  string name;
}
```

### transform

```solidity
function transform(address _ctxAddr, string _program) external returns (string[])
```

### cleanString

```solidity
function cleanString(string _program) external pure returns (string _cleanedProgram)
```

### split

```solidity
function split(string _program) external returns (string[])
```

### infixToPostfix

```solidity
function infixToPostfix(address _ctxAddr, string[] _code, contract StringStack _stack) external returns (string[])
```

## IStack

### stack

```solidity
function stack(uint256) external returns (uint256)
```

### length

```solidity
function length() external view returns (uint256)
```

### push

```solidity
function push(uint256 data) external
```

### pop

```solidity
function pop() external returns (uint256)
```

## IStorage

### getStorageBool

```solidity
function getStorageBool(bytes32 position) external view returns (bool data)
```

### getStorageAddress

```solidity
function getStorageAddress(bytes32 position) external view returns (address data)
```

### getStorageBytes32

```solidity
function getStorageBytes32(bytes32 position) external view returns (bytes32 data)
```

### getStorageUint256

```solidity
function getStorageUint256(bytes32 position) external view returns (uint256 data)
```

### setStorageBool

```solidity
function setStorageBool(bytes32 position, bool data) external
```

### setStorageAddress

```solidity
function setStorageAddress(bytes32 position, address data) external
```

### setStorageBytes32

```solidity
function setStorageBytes32(bytes32 position, bytes32 data) external
```

### setStorageUint256

```solidity
function setStorageUint256(bytes32 position, uint256 data) external
```

## IStorageUniversal

### setStorageBool

```solidity
function setStorageBool(bytes32 position, bytes32 data) external
```

### setStorageAddress

```solidity
function setStorageAddress(bytes32 position, bytes32 data) external
```

### setStorageUint256

```solidity
function setStorageUint256(bytes32 position, bytes32 data) external
```

## ByteUtils

### slice

```solidity
function slice(bytes _data, uint256 _start, uint256 _end) public pure returns (bytes)
```

## ErrorsAgreement

### AGR1

```solidity
string AGR1
```

### AGR2

```solidity
string AGR2
```

### AGR3

```solidity
string AGR3
```

### AGR4

```solidity
string AGR4
```

### AGR5

```solidity
string AGR5
```

### AGR6

```solidity
string AGR6
```

### AGR7

```solidity
string AGR7
```

### AGR8

```solidity
string AGR8
```

### AGR9

```solidity
string AGR9
```

### AGR10

```solidity
string AGR10
```

### AGR11

```solidity
string AGR11
```

### AGR12

```solidity
string AGR12
```

### AGR13

```solidity
string AGR13
```

### AGR14

```solidity
string AGR14
```

### AGR15

```solidity
string AGR15
```

## ErrorsContext

### CTX1

```solidity
string CTX1
```

### CTX2

```solidity
string CTX2
```

### CTX3

```solidity
string CTX3
```

### CTX4

```solidity
string CTX4
```

### CTX5

```solidity
string CTX5
```

## ErrorsStack

### STK1

```solidity
string STK1
```

### STK2

```solidity
string STK2
```

### STK3

```solidity
string STK3
```

### STK4

```solidity
string STK4
```

## ErrorsGeneralOpcodes

### OP1

```solidity
string OP1
```

### OP2

```solidity
string OP2
```

### OP3

```solidity
string OP3
```

### OP4

```solidity
string OP4
```

### OP5

```solidity
string OP5
```

### OP6

```solidity
string OP6
```

### OP8

```solidity
string OP8
```

## ErrorsBranchingOpcodes

### BR1

```solidity
string BR1
```

### BR2

```solidity
string BR2
```

### BR3

```solidity
string BR3
```

## ErrorsParser

### PRS1

```solidity
string PRS1
```

### PRS2

```solidity
string PRS2
```

## ErrorsPreprocessor

### PRP1

```solidity
string PRP1
```

### PRP2

```solidity
string PRP2
```

## ErrorsOpcodeHelpers

### OPH1

```solidity
string OPH1
```

## ErrorsByteUtils

### BUT1

```solidity
string BUT1
```

### BUT2

```solidity
string BUT2
```

## ErrorsExecutor

### EXC1

```solidity
string EXC1
```

### EXC2

```solidity
string EXC2
```

### EXC3

```solidity
string EXC3
```

## ErrorsStringUtils

### SUT1

```solidity
string SUT1
```

### SUT2

```solidity
string SUT2
```

### SUT3

```solidity
string SUT3
```

### SUT4

```solidity
string SUT4
```

### SUT5

```solidity
string SUT5
```

### SUT6

```solidity
string SUT6
```

### SUT7

```solidity
string SUT7
```

### SUT8

```solidity
string SUT8
```

### SUT9

```solidity
string SUT9
```

## Executor

### execute

```solidity
function execute(address _ctx) public
```

## StringUtils

### char

```solidity
function char(string s, uint256 index) public pure returns (string)
```

### equal

```solidity
function equal(string s1, string s2) internal pure returns (bool)
```

### length

```solidity
function length(string s) internal pure returns (uint256)
```

### concat

```solidity
function concat(string s1, string s2) internal pure returns (string)
```

### fromHex

```solidity
function fromHex(string s) public pure returns (bytes)
```

### fromHexBytes

```solidity
function fromHexBytes(bytes ss) public pure returns (bytes)
```

### toString

```solidity
function toString(uint256 value) internal pure returns (string)
```

_Converts a `uint256` to its ASCII `string` decimal representation._

### toUint256

```solidity
function toUint256(string s) public pure returns (uint256 value)
```

### getWei

```solidity
function getWei(string _s) public pure returns (string result)
```

### mayBeNumber

```solidity
function mayBeNumber(string _string) public pure returns (bool)
```

_If the string starts with a number, so we assume that it's a number._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _string | string | is a current string for checking |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | bool | isNumber that is true if the string starts with a number, otherwise is false |

### mayBeAddress

```solidity
function mayBeAddress(string _string) public pure returns (bool)
```

_If the string starts with `0x` symbols, so we assume that it's an address._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _string | string | is a current string for checking |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | bool | isAddress that is true if the string starts with `0x` symbols, otherwise is false |

### fromHexChar

```solidity
function fromHexChar(bytes1 c) public pure returns (uint8)
```

### isValidVarName

```solidity
function isValidVarName(string _s) public pure returns (bool)
```

_Checks is string is a valid DSL variable name (matches regexp /^([A-Z_$][A-Z\d_$]*)$/g)_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _s | string | is a current string to check |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | bool | isCapital whether the string is a valid DSL variable name or not |

## UnstructuredStorage

### getStorageBool

```solidity
function getStorageBool(bytes32 position) internal view returns (bool data)
```

### getStorageAddress

```solidity
function getStorageAddress(bytes32 position) internal view returns (address data)
```

### getStorageBytes32

```solidity
function getStorageBytes32(bytes32 position) internal view returns (bytes32 data)
```

### getStorageUint256

```solidity
function getStorageUint256(bytes32 position) internal view returns (uint256 data)
```

### setStorageBool

```solidity
function setStorageBool(bytes32 position, bytes32 data) internal
```

### setStorageBool

```solidity
function setStorageBool(bytes32 position, bool data) internal
```

### setStorageAddress

```solidity
function setStorageAddress(bytes32 position, bytes32 data) internal
```

### setStorageAddress

```solidity
function setStorageAddress(bytes32 position, address data) internal
```

### setStorageBytes32

```solidity
function setStorageBytes32(bytes32 position, bytes32 data) internal
```

### setStorageUint256

```solidity
function setStorageUint256(bytes32 position, bytes32 data) internal
```

### setStorageUint256

```solidity
function setStorageUint256(bytes32 position, uint256 data) internal
```

## BranchingOpcodes

Opcodes for logical operators such as if/esle, switch/case

### opIfelse

```solidity
function opIfelse(address _ctx) public
```

### opIf

```solidity
function opIf(address _ctx) public
```

### opFunc

```solidity
function opFunc(address _ctx) public
```

### opForLoop

```solidity
function opForLoop(address _ctx) external
```

_For loop setup. Responsible for checking iterating array existence, set the number of iterations_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _ctx | address | Context contract address |

### opStartLoop

```solidity
function opStartLoop(address _ctx) public
```

_Does the real iterating process over the body of the for-loop_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _ctx | address | Context contract address |

### opEndLoop

```solidity
function opEndLoop(address _ctx) public
```

_This function is responsible for getting of the body of the for-loop_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _ctx | address | Context contract address |

### opEnd

```solidity
function opEnd(address _ctx) public
```

### getUint16

```solidity
function getUint16(address _ctx) public returns (uint16)
```

## ComparisonOpcodes

Opcodes for comparator operators such as >, <, =, !, etc.

### opEq

```solidity
function opEq(address _ctx) public
```

_Compares two values in the stack. Put 1 to the stack if they are equal._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _ctx | address | Context contract address |

### opNotEq

```solidity
function opNotEq(address _ctx) public
```

_Compares two values in the stack. Put 1 to the stack if they are not equal._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _ctx | address | Context contract address |

### opLt

```solidity
function opLt(address _ctx) public
```

_Compares two values in the stack. Put 1 to the stack if value1 < value2_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _ctx | address | Context contract address |

### opGt

```solidity
function opGt(address _ctx) public
```

_Compares two values in the stack. Put 1 to the stack if value1 > value2_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _ctx | address | Context contract address |

### opLe

```solidity
function opLe(address _ctx) public
```

_Compares two values in the stack. Put 1 to the stack if value1 <= value2_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _ctx | address | Context contract address |

### opGe

```solidity
function opGe(address _ctx) public
```

_Compares two values in the stack. Put 1 to the stack if value1 >= value2_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _ctx | address | Context contract address |

### opNot

```solidity
function opNot(address _ctx) public
```

_Revert last value in the stack_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _ctx | address | Context contract address |

### opSwap

```solidity
function opSwap(address _ctx) public
```

_Swaps two last element in the stack_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _ctx | address | Context contract address |

## LogicalOpcodes

Opcodes for set operators such as AND, OR, XOR

### opAnd

```solidity
function opAnd(address _ctx) public
```

_Compares two values in the stack. Put 1 if both of them are 1, put
     0 otherwise_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _ctx | address | Context contract address |

### opOr

```solidity
function opOr(address _ctx) public
```

_Compares two values in the stack. Put 1 if either one of them is 1,
     put 0 otherwise_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _ctx | address | Context contract address |

### opXor

```solidity
function opXor(address _ctx) public
```

_Compares two values in the stack. Put 1 if the values ​
​are different and 0 if they are the same_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _ctx | address | Context contract address |

### opAdd

```solidity
function opAdd(address _ctx) public
```

_Add two values and put result in the stack._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _ctx | address | Context contract address |

### opSub

```solidity
function opSub(address _ctx) public
```

_Subtracts one value from enother and put result in the stack._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _ctx | address | Context contract address |

### opMul

```solidity
function opMul(address _ctx) public
```

_Multiplies values and put result in the stack._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _ctx | address | Context contract address |

### opDiv

```solidity
function opDiv(address _ctx) public
```

Divide two numbers from the top of the stack

_This is an integer division. Example: 5 / 2 = 2_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _ctx | address | Context address |

## OpcodeHelpers

Opcode helper functions that are used in other opcode libraries

_Opcode libraries are: ComparisonOpcodes, BranchingOpcodes, LogicalOpcodes, and OtherOpcodes_

### putToStack

```solidity
function putToStack(address _ctx, uint256 _value) public
```

### nextBytes

```solidity
function nextBytes(address _ctx, uint256 size) public returns (bytes out)
```

### nextBytes1

```solidity
function nextBytes1(address _ctx) public returns (bytes1)
```

### readBytesSlice

```solidity
function readBytesSlice(address _ctx, uint256 _start, uint256 _end) public view returns (bytes32 res)
```

_Reads the slice of bytes from the raw program
Warning! The maximum slice size can only be 32 bytes!_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _ctx | address | Context contract address |
| _start | uint256 | Start position to read |
| _end | uint256 | End position to read |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| res | bytes32 | Bytes32 slice of the raw program |

### nextBranchSelector

```solidity
function nextBranchSelector(address _ctx, string baseOpName) public returns (bytes4)
```

### mustCall

```solidity
function mustCall(address addr, bytes data) public
```

### getNextBytes

```solidity
function getNextBytes(address _ctx, uint256 _bytesNum) public returns (bytes32 varNameB32)
```

## OtherOpcodes

### opLoadRemoteAny

```solidity
function opLoadRemoteAny(address _ctx) public
```

### opBlockNumber

```solidity
function opBlockNumber(address _ctx) public
```

### opBlockTimestamp

```solidity
function opBlockTimestamp(address _ctx) public
```

### opBlockChainId

```solidity
function opBlockChainId(address _ctx) public
```

### opMsgSender

```solidity
function opMsgSender(address _ctx) public
```

### opMsgValue

```solidity
function opMsgValue(address _ctx) public
```

### opSetLocalBool

```solidity
function opSetLocalBool(address _ctx) public
```

_Sets boolean variable in the application contract.
The value of bool variable is taken from DSL code itself_

### opSetUint256

```solidity
function opSetUint256(address _ctx) public
```

_Sets uint256 variable in the application contract. The value of the variable is taken from stack_

### opGet

```solidity
function opGet(address _ctx) public
```

_Gets an element by its index in the array_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _ctx | address | Context contract instance address |

### opSumOf

```solidity
function opSumOf(address _ctx) public
```

_Sums uin256 elements from the array (array name should be provided)_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _ctx | address | Context contract instance address |

### opSumThroughStructs

```solidity
function opSumThroughStructs(address _ctx) public
```

_Sums struct variables values from the `struct type` array_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _ctx | address | Context contract instance address |

### opStruct

```solidity
function opStruct(address _ctx) public
```

_Inserts items to DSL structures using mixed variable name (ex. `BOB.account`).
Struct variable names already contain a name of a DSL structure, `.` dot symbol, the name of
variable. `endStruct` word (0xcb398fe1) is used as an indicator for the ending loop for
the structs parameters_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _ctx | address | Context contract instance address |

### opPush

```solidity
function opPush(address _ctx) public
```

_Inserts an item to array_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _ctx | address | Context contract instance address |

### opDeclare

```solidity
function opDeclare(address _ctx) public
```

_Declares an empty array_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _ctx | address | Context contract instance address |

### opLoadLocalUint256

```solidity
function opLoadLocalUint256(address _ctx) public
```

### opLoadLocalAddress

```solidity
function opLoadLocalAddress(address _ctx) public
```

### opLoadRemoteUint256

```solidity
function opLoadRemoteUint256(address _ctx) public
```

### opLoadRemoteBytes32

```solidity
function opLoadRemoteBytes32(address _ctx) public
```

### opLoadRemoteBool

```solidity
function opLoadRemoteBool(address _ctx) public
```

### opLoadRemoteAddress

```solidity
function opLoadRemoteAddress(address _ctx) public
```

### opBool

```solidity
function opBool(address _ctx) public
```

### opUint256

```solidity
function opUint256(address _ctx) public
```

### opSendEth

```solidity
function opSendEth(address _ctx) public
```

### opTransfer

```solidity
function opTransfer(address _ctx) public
```

### opTransferVar

```solidity
function opTransferVar(address _ctx) public
```

### opTransferFrom

```solidity
function opTransferFrom(address _ctx) public
```

### opBalanceOf

```solidity
function opBalanceOf(address _ctx) public
```

### opLengthOf

```solidity
function opLengthOf(address _ctx) public
```

### opTransferFromVar

```solidity
function opTransferFromVar(address _ctx) public
```

### opUint256Get

```solidity
function opUint256Get(address _ctx) public returns (uint256)
```

### opLoadLocalGet

```solidity
function opLoadLocalGet(address _ctx, string funcSignature) public returns (bytes32 result)
```

### opAddressGet

```solidity
function opAddressGet(address _ctx) public returns (address)
```

### opLoadLocal

```solidity
function opLoadLocal(address _ctx, string funcSignature) public
```

### opLoadRemote

```solidity
function opLoadRemote(address _ctx, string funcSignature) public
```

### opEnableRecord

```solidity
function opEnableRecord(address _ctx) public
```

### _sumOfStructVars

```solidity
function _sumOfStructVars(address _ctx, bytes32 _arrNameB32, bytes4 _varName, bytes32 _length) internal returns (uint256 total)
```

_Sums struct variables values from the `struct type` array_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _ctx | address | Context contract instance address |
| _arrNameB32 | bytes32 | Array's name in bytecode |
| _varName | bytes4 | Struct's name in bytecode |
| _length | bytes32 | Array's length in bytecode |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| total | uint256 | Total sum of each element in the `struct` type of array |

### _getItem

```solidity
function _getItem(address _ctx, uint256 _index, bytes32 _arrNameB32) internal returns (bytes)
```

_Returns the element from the array_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _ctx | address | Context contract instance address |
| _index | uint256 | Array's index |
| _arrNameB32 | bytes32 | Array's name in bytecode |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | bytes | item Item from the array by its index |

### _sumOfVars

```solidity
function _sumOfVars(address _ctx, bytes32 _arrNameB32, bytes32 _length) internal returns (uint256 total)
```

_Sums uin256 elements from the array (array name should be provided)_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _ctx | address | Context contract instance address |
| _arrNameB32 | bytes32 | Array's name in bytecode |
| _length | bytes32 | Array's length in bytecode |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| total | uint256 | Total sum of each element in the `uint256` type of array |

### _checkArrType

```solidity
function _checkArrType(address _ctx, bytes32 _arrNameB32, string _typeName) internal
```

_Checks the type for array_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _ctx | address | Context contract instance address |
| _arrNameB32 | bytes32 | Array's name in bytecode |
| _typeName | string | Type of the array, ex. `uint256`, `address`, `struct` |

### _getArrLength

```solidity
function _getArrLength(address _ctx, bytes32 _arrNameB32) internal returns (bytes32)
```

_Returns array's length_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _ctx | address | Context contract instance address |
| _arrNameB32 | bytes32 | Array's name in bytecode |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | bytes32 | Array's length in bytecode |

## ByteUtilsMock

### slice

```solidity
function slice(bytes _data, uint256 _start, uint256 _end) public pure returns (bytes)
```

## ContextMock

### addOpcodeBranchExt

```solidity
function addOpcodeBranchExt(string _baseOpName, string _branchName, bytes1 _branchCode, bytes4 _selector) external
```

### addOperatorExt

```solidity
function addOperatorExt(string _op, uint256 _priority) external
```

### addOpcodeForOperatorExt

```solidity
function addOpcodeForOperatorExt(string _name, bytes1 _opcode, bytes4 _opSelector, bytes4 _asmSelector, enum IContext.OpcodeLibNames _libName, uint256 _priority) external
```

## ExecutorMock

### execute

```solidity
function execute(address _ctxAddr) public
```

## ParserMock

### constructor

```solidity
constructor() public
```

### parseCodeExt

```solidity
function parseCodeExt(address _ctxAddr, string[] _code) external
```

### asmLoadRemoteExt

```solidity
function asmLoadRemoteExt(address _ctxAddr) external
```

## StringUtilsMock

### char

```solidity
function char(string _s, uint256 _index) public pure returns (string)
```

### equal

```solidity
function equal(string _s1, string _s2) public pure returns (bool)
```

### length

```solidity
function length(string _s) public pure returns (uint256)
```

### concat

```solidity
function concat(string _s1, string _s2) public pure returns (string)
```

### fromHex

```solidity
function fromHex(string _s) public pure returns (bytes)
```

### toUint256

```solidity
function toUint256(string _s) public pure returns (uint256)
```

### fromUint256toString

```solidity
function fromUint256toString(uint256 _s) public pure returns (string)
```

### fromHexChar

```solidity
function fromHexChar(bytes1 _c) public pure returns (uint8)
```

### getWei

```solidity
function getWei(string _s) public pure returns (string)
```

### mayBeNumber

```solidity
function mayBeNumber(string _s) public pure returns (bool isNumber)
```

## UnstructuredStorageMock

### getStorageBool

```solidity
function getStorageBool(bytes32 position) public view returns (bool data)
```

### getStorageAddress

```solidity
function getStorageAddress(bytes32 position) public view returns (address data)
```

### getStorageBytes32

```solidity
function getStorageBytes32(bytes32 position) public view returns (bytes32 data)
```

### getStorageUint256

```solidity
function getStorageUint256(bytes32 position) public view returns (uint256 data)
```

### setStorageBool

```solidity
function setStorageBool(bytes32 position, bool data) public
```

### setStorageBool

```solidity
function setStorageBool(bytes32 position, bytes32 data) public
```

### setStorageAddress

```solidity
function setStorageAddress(bytes32 position, address data) public
```

### setStorageAddress

```solidity
function setStorageAddress(bytes32 position, bytes32 data) public
```

### setStorageBytes32

```solidity
function setStorageBytes32(bytes32 position, bytes32 data) public
```

### setStorageUint256

```solidity
function setStorageUint256(bytes32 position, uint256 data) public
```

### setStorageUint256

```solidity
function setStorageUint256(bytes32 position, bytes32 data) public
```

## BranchingOpcodesMock

### opIfelse

```solidity
function opIfelse(address _ctx) public
```

### opIf

```solidity
function opIf(address _ctx) public
```

### opEnd

```solidity
function opEnd(address _ctx) public
```

### getUint16

```solidity
function getUint16(address _ctx) public returns (uint16)
```

### opFunc

```solidity
function opFunc(address _ctx) public
```

## ComparisonOpcodesMock

### opEq

```solidity
function opEq(address _ctx) public
```

_Compares two values in the stack. Put 1 to the stack if they are equal._

### opNotEq

```solidity
function opNotEq(address _ctx) public
```

_Compares two values in the stack. Put 1 to the stack if they are not equal._

### opLt

```solidity
function opLt(address _ctx) public
```

_Compares two values in the stack. Put 1 to the stack if value1 < value2_

### opGt

```solidity
function opGt(address _ctx) public
```

_Compares two values in the stack. Put 1 to the stack if value1 > value2_

### opLe

```solidity
function opLe(address _ctx) public
```

_Compares two values in the stack. Put 1 to the stack if value1 <= value2_

### opGe

```solidity
function opGe(address _ctx) public
```

_Compares two values in the stack. Put 1 to the stack if value1 >= value2_

### opSwap

```solidity
function opSwap(address _ctx) public
```

_Swaps two last element in the stack_

### opNot

```solidity
function opNot(address _ctx) public
```

_Revert last value in the stack_

## LogicalOpcodesMock

### opAnd

```solidity
function opAnd(address _ctx) public
```

_Compares two values in the stack. Put 1 if both of them are 1, put
     0 otherwise_

### opOr

```solidity
function opOr(address _ctx) public
```

_Compares two values in the stack. Put 1 if either one of them is 1,
     put 0 otherwise_

### opXor

```solidity
function opXor(address _ctx) public
```

### opAdd

```solidity
function opAdd(address _ctx) public
```

### opSub

```solidity
function opSub(address _ctx) public
```

### opMul

```solidity
function opMul(address _ctx) public
```

### opDiv

```solidity
function opDiv(address _ctx) public
```

## OpcodeHelpersMock

### putToStack

```solidity
function putToStack(address _ctx, uint256 _value) public
```

### nextBytes

```solidity
function nextBytes(address _ctx, uint256 _size) public returns (bytes)
```

### nextBytes1

```solidity
function nextBytes1(address _ctx) public returns (bytes1)
```

### nextBranchSelector

```solidity
function nextBranchSelector(address _ctx, string _baseOpName) public returns (bytes4)
```

### mustCall

```solidity
function mustCall(address _addr, bytes _data) public
```

### getNextBytes

```solidity
function getNextBytes(address _ctx, uint256 _bytesNum) public returns (bytes32)
```

## OtherOpcodesMock

### receive

```solidity
receive() external payable
```

### opLoadRemoteAny

```solidity
function opLoadRemoteAny(address _ctx) public
```

### opBlockNumber

```solidity
function opBlockNumber(address _ctx) public
```

### opBlockTimestamp

```solidity
function opBlockTimestamp(address _ctx) public
```

### opBlockChainId

```solidity
function opBlockChainId(address _ctx) public
```

### opMsgSender

```solidity
function opMsgSender(address _ctx) public
```

### opMsgValue

```solidity
function opMsgValue(address _ctx) public
```

### opSetLocalBool

```solidity
function opSetLocalBool(address _ctx) public
```

### opSetUint256

```solidity
function opSetUint256(address _ctx) public
```

### opTransferVar

```solidity
function opTransferVar(address _ctx) public
```

### opBalanceOf

```solidity
function opBalanceOf(address _ctx) public
```

### opTransferFromVar

```solidity
function opTransferFromVar(address _ctx) public
```

### opLoadLocalUint256

```solidity
function opLoadLocalUint256(address _ctx) public
```

### opLoadRemoteUint256

```solidity
function opLoadRemoteUint256(address _ctx) public
```

### opLoadRemoteBytes32

```solidity
function opLoadRemoteBytes32(address _ctx) public
```

### opLoadRemoteBool

```solidity
function opLoadRemoteBool(address _ctx) public
```

### opLoadRemoteAddress

```solidity
function opLoadRemoteAddress(address _ctx) public
```

### opBool

```solidity
function opBool(address _ctx) public
```

### opUint256

```solidity
function opUint256(address _ctx) public
```

### opSendEth

```solidity
function opSendEth(address _ctx) public
```

### opTransfer

```solidity
function opTransfer(address _ctx) public
```

### opTransferFrom

```solidity
function opTransferFrom(address _ctx) public
```

### opUint256Get

```solidity
function opUint256Get(address _ctx) public returns (uint256)
```

### opLoadLocalGet

```solidity
function opLoadLocalGet(address _ctx, string funcSignature) public returns (bytes32 result)
```

### opAddressGet

```solidity
function opAddressGet(address _ctx) public returns (address)
```

### opLoadLocal

```solidity
function opLoadLocal(address _ctx, string funcSignature) public
```

### opLoadRemote

```solidity
function opLoadRemote(address _ctx, string funcSignature) public
```

### opDeclare

```solidity
function opDeclare(address _ctx) public
```

### opPush

```solidity
function opPush(address _ctx) public
```

### opGet

```solidity
function opGet(address _ctx) public
```

### opSumOf

```solidity
function opSumOf(address _ctx) public
```

### opSumThroughStructs

```solidity
function opSumThroughStructs(address _ctx) public
```

### opStruct

```solidity
function opStruct(address _ctx) public
```

### opLengthOf

```solidity
function opLengthOf(address _ctx) public
```

### opEnableRecord

```solidity
function opEnableRecord(address _ctx) public
```

## App

### parser

```solidity
address parser
```

### ctx

```solidity
address ctx
```

### preprocessor

```solidity
address preprocessor
```

### receive

```solidity
receive() external payable
```

### constructor

```solidity
constructor(address _parser, address _preprocessor, address _ctx) public
```

### parse

```solidity
function parse(string _program) external
```

### execute

```solidity
function execute() external payable
```

### _setupContext

```solidity
function _setupContext() internal
```

## BaseStorage

## E2EApp

### preprocessor

```solidity
address preprocessor
```

### parser

```solidity
address parser
```

### context

```solidity
address context
```

### receive

```solidity
receive() external payable
```

### constructor

```solidity
constructor(address _parserAddr, address _preprAddr, address _ctx) public
```

### parse

```solidity
function parse(string _program) external
```

### parseCode

```solidity
function parseCode(string[] _code) external
```

### execute

```solidity
function execute() external payable
```

### setupContext

```solidity
function setupContext() internal
```

## ERC20

_Implementation of the {IERC20} interface.

This implementation is agnostic to the way tokens are created. This means
that a supply mechanism has to be added in a derived contract using {_mint}.
For a generic mechanism see {ERC20PresetMinterPauser}.

TIP: For a detailed writeup see our guide
https://forum.zeppelin.solutions/t/how-to-implement-erc20-supply-mechanisms/226[How
to implement supply mechanisms].

We have followed general OpenZeppelin guidelines: functions revert instead
of returning `false` on failure. This behavior is nonetheless conventional
and does not conflict with the expectations of ERC20 applications.

Additionally, an {Approval} event is emitted on calls to {transferFrom}.
This allows applications to reconstruct the allowance for all accounts just
by listening to said events. Other implementations of the EIP may not emit
these events, as it isn't required by the specification.

Finally, the non-standard {decreaseAllowance} and {increaseAllowance}
functions have been added to mitigate the well-known issues around setting
allowances. See {IERC20-approve}._

### _balances

```solidity
mapping(address => uint256) _balances
```

### _allowances

```solidity
mapping(address => mapping(address => uint256)) _allowances
```

### _totalSupply

```solidity
uint256 _totalSupply
```

### _name

```solidity
string _name
```

### _symbol

```solidity
string _symbol
```

### constructor

```solidity
constructor(string name_, string symbol_) public
```

_Sets the values for {name} and {symbol}.

The defaut value of {decimals} is 18. To select a different value for
{decimals} you should overload it.

All three of these values are immutable: they can only be set once during
construction._

### name

```solidity
function name() public view virtual returns (string)
```

_Returns the name of the token._

### symbol

```solidity
function symbol() public view virtual returns (string)
```

_Returns the symbol of the token, usually a shorter version of the
name._

### decimals

```solidity
function decimals() public view virtual returns (uint8)
```

_Returns the number of decimals used to get its user representation.
For example, if `decimals` equals `2`, a balance of `505` tokens should
be displayed to a user as `5,05` (`505 / 10 ** 2`).

Tokens usually opt for a value of 18, imitating the relationship between
Ether and Wei. This is the value {ERC20} uses, unless this function is
overloaded;

NOTE: This information is only used for _display_ purposes: it in
no way affects any of the arithmetic of the contract, including
{IERC20-balanceOf} and {IERC20-transfer}._

### totalSupply

```solidity
function totalSupply() public view virtual returns (uint256)
```

_See {IERC20-totalSupply}._

### balanceOf

```solidity
function balanceOf(address account) public view virtual returns (uint256)
```

_See {IERC20-balanceOf}._

### transfer

```solidity
function transfer(address recipient, uint256 amount) public virtual returns (bool)
```

_See {IERC20-transfer}.

Requirements:

- `recipient` cannot be the zero address.
- the caller must have a balance of at least `amount`._

### allowance

```solidity
function allowance(address owner, address spender) public view virtual returns (uint256)
```

_See {IERC20-allowance}._

### approve

```solidity
function approve(address spender, uint256 amount) public virtual returns (bool)
```

_See {IERC20-approve}.

Requirements:

- `spender` cannot be the zero address._

### transferFrom

```solidity
function transferFrom(address sender, address recipient, uint256 amount) public virtual returns (bool)
```

_See {IERC20-transferFrom}.

Emits an {Approval} event indicating the updated allowance. This is not
required by the EIP. See the note at the beginning of {ERC20}.

Requirements:

- `sender` and `recipient` cannot be the zero address.
- `sender` must have a balance of at least `amount`.
- the caller must have allowance for ``sender``'s tokens of at least
`amount`._

### increaseAllowance

```solidity
function increaseAllowance(address spender, uint256 addedValue) public virtual returns (bool)
```

_Atomically increases the allowance granted to `spender` by the caller.

This is an alternative to {approve} that can be used as a mitigation for
problems described in {IERC20-approve}.

Emits an {Approval} event indicating the updated allowance.

Requirements:

- `spender` cannot be the zero address._

### decreaseAllowance

```solidity
function decreaseAllowance(address spender, uint256 subtractedValue) public virtual returns (bool)
```

_Atomically decreases the allowance granted to `spender` by the caller.

This is an alternative to {approve} that can be used as a mitigation for
problems described in {IERC20-approve}.

Emits an {Approval} event indicating the updated allowance.

Requirements:

- `spender` cannot be the zero address.
- `spender` must have allowance for the caller of at least
`subtractedValue`._

### _transfer

```solidity
function _transfer(address sender, address recipient, uint256 amount) internal virtual
```

_Moves tokens `amount` from `sender` to `recipient`.

This is internal function is equivalent to {transfer}, and can be used to
e.g. implement automatic token fees, slashing mechanisms, etc.

Emits a {Transfer} event.

Requirements:

- `sender` cannot be the zero address.
- `recipient` cannot be the zero address.
- `sender` must have a balance of at least `amount`._

### _mint

```solidity
function _mint(address account, uint256 amount) internal virtual
```

_Creates `amount` tokens and assigns them to `account`, increasing
the total supply.

Emits a {Transfer} event with `from` set to the zero address.

Requirements:

- `to` cannot be the zero address._

### _burn

```solidity
function _burn(address account, uint256 amount) internal virtual
```

_Destroys `amount` tokens from `account`, reducing the
total supply.

Emits a {Transfer} event with `to` set to the zero address.

Requirements:

- `account` cannot be the zero address.
- `account` must have at least `amount` tokens._

### _approve

```solidity
function _approve(address owner, address spender, uint256 amount) internal virtual
```

_Sets `amount` as the allowance of `spender` over the `owner` s tokens.

This internal function is equivalent to `approve`, and can be used to
e.g. set automatic allowances for certain subsystems, etc.

Emits an {Approval} event.

Requirements:

- `owner` cannot be the zero address.
- `spender` cannot be the zero address._

### _beforeTokenTransfer

```solidity
function _beforeTokenTransfer(address from, address to, uint256 amount) internal virtual
```

_Hook that is called before any transfer of tokens. This includes
minting and burning.

Calling conditions:

- when `from` and `to` are both non-zero, `amount` of ``from``'s tokens
will be to transferred to `to`.
- when `from` is zero, `amount` tokens will be minted for `to`.
- when `to` is zero, `amount` of ``from``'s tokens will be burned.
- `from` and `to` are never both zero.

To learn more about hooks, head to xref:ROOT:extending-contracts.adoc#using-hooks[Using Hooks]._

## ERC20

### Transfer

```solidity
event Transfer(address from, address to, uint256 value)
```

_Emitted when `value` tokens are moved from one account (`from`) to
another (`to`).

Note that `value` may be zero._

### Approval

```solidity
event Approval(address owner, address spender, uint256 value)
```

_Emitted when the allowance of a `spender` for an `owner` is set by
a call to {approve}. `value` is the new allowance._

### _balances

```solidity
mapping(address => uint256) _balances
```

### _allowances

```solidity
mapping(address => mapping(address => uint256)) _allowances
```

### _totalSupply

```solidity
uint256 _totalSupply
```

### _name

```solidity
string _name
```

### _symbol

```solidity
string _symbol
```

### constructor

```solidity
constructor(string name_, string symbol_) public
```

_Sets the values for {name} and {symbol}.

The default value of {decimals} is 18. To select a different value for
{decimals} you should overload it.

All two of these values are immutable: they can only be set once during
construction._

### name

```solidity
function name() public view virtual returns (string)
```

_Returns the name of the token._

### symbol

```solidity
function symbol() public view virtual returns (string)
```

_Returns the symbol of the token, usually a shorter version of the
name._

### decimals

```solidity
function decimals() public view virtual returns (uint8)
```

_Returns the number of decimals used to get its user representation.
For example, if `decimals` equals `2`, a balance of `505` tokens should
be displayed to a user as `5.05` (`505 / 10 ** 2`).

Tokens usually opt for a value of 18, imitating the relationship between
Ether and Wei. This is the value {ERC20} uses, unless this function is
overridden;

NOTE: This information is only used for _display_ purposes: it in
no way affects any of the arithmetic of the contract, including
{IERC20-balanceOf} and {IERC20-transfer}._

### totalSupply

```solidity
function totalSupply() public view virtual returns (uint256)
```

_See {IERC20-totalSupply}._

### balanceOf

```solidity
function balanceOf(address account) public view virtual returns (uint256)
```

_See {IERC20-balanceOf}._

### transfer

```solidity
function transfer(address to, uint256 amount) public virtual returns (bool)
```

_See {IERC20-transfer}.

Requirements:

- `to` cannot be the zero address.
- the caller must have a balance of at least `amount`._

### allowance

```solidity
function allowance(address owner, address spender) public view virtual returns (uint256)
```

_See {IERC20-allowance}._

### approve

```solidity
function approve(address spender, uint256 amount) public virtual returns (bool)
```

_See {IERC20-approve}.

NOTE: If `amount` is the maximum `uint256`, the allowance is not updated on
`transferFrom`. This is semantically equivalent to an infinite approval.

Requirements:

- `spender` cannot be the zero address._

### transferFrom

```solidity
function transferFrom(address from, address to, uint256 amount) public virtual returns (bool)
```

_See {IERC20-transferFrom}.

Emits an {Approval} event indicating the updated allowance. This is not
required by the EIP. See the note at the beginning of {ERC20}.

NOTE: Does not update the allowance if the current allowance
is the maximum `uint256`.

Requirements:

- `from` and `to` cannot be the zero address.
- `from` must have a balance of at least `amount`.
- the caller must have allowance for ``from``'s tokens of at least
`amount`._

### increaseAllowance

```solidity
function increaseAllowance(address spender, uint256 addedValue) public virtual returns (bool)
```

_Atomically increases the allowance granted to `spender` by the caller.

This is an alternative to {approve} that can be used as a mitigation for
problems described in {IERC20-approve}.

Emits an {Approval} event indicating the updated allowance.

Requirements:

- `spender` cannot be the zero address._

### decreaseAllowance

```solidity
function decreaseAllowance(address spender, uint256 subtractedValue) public virtual returns (bool)
```

_Atomically decreases the allowance granted to `spender` by the caller.

This is an alternative to {approve} that can be used as a mitigation for
problems described in {IERC20-approve}.

Emits an {Approval} event indicating the updated allowance.

Requirements:

- `spender` cannot be the zero address.
- `spender` must have allowance for the caller of at least
`subtractedValue`._

### _transfer

```solidity
function _transfer(address from, address to, uint256 amount) internal virtual
```

_Moves `amount` of tokens from `sender` to `recipient`.

This internal function is equivalent to {transfer}, and can be used to
e.g. implement automatic token fees, slashing mechanisms, etc.

Emits a {Transfer} event.

Requirements:

- `from` cannot be the zero address.
- `to` cannot be the zero address.
- `from` must have a balance of at least `amount`._

### _mint

```solidity
function _mint(address account, uint256 amount) internal virtual
```

_Creates `amount` tokens and assigns them to `account`, increasing
the total supply.

Emits a {Transfer} event with `from` set to the zero address.

Requirements:

- `account` cannot be the zero address._

### _burn

```solidity
function _burn(address account, uint256 amount) internal virtual
```

_Destroys `amount` tokens from `account`, reducing the
total supply.

Emits a {Transfer} event with `to` set to the zero address.

Requirements:

- `account` cannot be the zero address.
- `account` must have at least `amount` tokens._

### _approve

```solidity
function _approve(address owner, address spender, uint256 amount) internal virtual
```

_Sets `amount` as the allowance of `spender` over the `owner` s tokens.

This internal function is equivalent to `approve`, and can be used to
e.g. set automatic allowances for certain subsystems, etc.

Emits an {Approval} event.

Requirements:

- `owner` cannot be the zero address.
- `spender` cannot be the zero address._

### _spendAllowance

```solidity
function _spendAllowance(address owner, address spender, uint256 amount) internal virtual
```

_Spend `amount` form the allowance of `owner` toward `spender`.

Does not update the allowance amount in case of infinite allowance.
Revert if not enough allowance is available.

Might emit an {Approval} event._

### _beforeTokenTransfer

```solidity
function _beforeTokenTransfer(address from, address to, uint256 amount) internal virtual
```

_Hook that is called before any transfer of tokens. This includes
minting and burning.

Calling conditions:

- when `from` and `to` are both non-zero, `amount` of ``from``'s tokens
will be transferred to `to`.
- when `from` is zero, `amount` tokens will be minted for `to`.
- when `to` is zero, `amount` of ``from``'s tokens will be burned.
- `from` and `to` are never both zero.

To learn more about hooks, head to xref:ROOT:extending-contracts.adoc#using-hooks[Using Hooks]._

### _afterTokenTransfer

```solidity
function _afterTokenTransfer(address from, address to, uint256 amount) internal virtual
```

_Hook that is called after any transfer of tokens. This includes
minting and burning.

Calling conditions:

- when `from` and `to` are both non-zero, `amount` of ``from``'s tokens
has been transferred to `to`.
- when `from` is zero, `amount` tokens have been minted for `to`.
- when `to` is zero, `amount` of ``from``'s tokens have been burned.
- `from` and `to` are never both zero.

To learn more about hooks, head to xref:ROOT:extending-contracts.adoc#using-hooks[Using Hooks]._

## ERC20Mintable

### constructor

```solidity
constructor(string _name, string _symbol) public
```

### mint

```solidity
function mint(address _to, uint256 _amount) external
```

### burn

```solidity
function burn(address _to, uint256 _amount) external
```

## StorageWithRevert

### setStorageBool

```solidity
function setStorageBool(bytes32, uint256) public pure
```

### setStorageUint256

```solidity
function setStorageUint256(bytes32, uint256) public pure
```

## Token

### constructor

```solidity
constructor(uint256 totalSupply) public
```

## Governance

Financial Agreement written in DSL between two or more users

Agreement contract that is used to implement any custom logic of a
financial agreement. Ex. lender-borrower agreement

### parser

```solidity
contract IParser parser
```

### context

```solidity
contract IContext context
```

### conditionContext

```solidity
contract IContext conditionContext
```

### deadline

```solidity
uint256 deadline
```

### ownerAddr

```solidity
address ownerAddr
```

### NewRecord

```solidity
event NewRecord(uint256 recordId, uint256[] requiredRecords, address[] signatories, string transaction, string[] conditionStrings)
```

### isReserved

```solidity
modifier isReserved(bytes32 position)
```

### onlyOwner

```solidity
modifier onlyOwner()
```

### isUpgradableRecord

```solidity
modifier isUpgradableRecord(uint256 _recordId)
```

### Record

```solidity
struct Record {
  address recordContext;
  bool isExecuted;
  bool isArchived;
  bool isActive;
  string transactionString;
}
```

### records

```solidity
mapping(uint256 => struct Governance.Record) records
```

### baseRecord

```solidity
mapping(uint256 => bool) baseRecord
```

### conditionContexts

```solidity
mapping(uint256 => address[]) conditionContexts
```

### conditionStrings

```solidity
mapping(uint256 => string[]) conditionStrings
```

### signatories

```solidity
mapping(uint256 => address[]) signatories
```

### requiredRecords

```solidity
mapping(uint256 => uint256[]) requiredRecords
```

### isExecutedBySignatory

```solidity
mapping(uint256 => mapping(address => bool)) isExecutedBySignatory
```

### recordIds

```solidity
uint256[] recordIds
```

### constructor

```solidity
constructor(address _parser, address _ownerAddr, address _token, uint256 _deadline) public
```

Sets parser address, creates new Context instance, and setups Context

### getStorageBool

```solidity
function getStorageBool(bytes32 position) external view returns (bool data)
```

### getStorageAddress

```solidity
function getStorageAddress(bytes32 position) external view returns (address data)
```

### getStorageUint256

```solidity
function getStorageUint256(bytes32 position) external view returns (uint256 data)
```

### setStorageBool

```solidity
function setStorageBool(bytes32 position, bool data) external
```

### setStorageAddress

```solidity
function setStorageAddress(bytes32 position, address data) external
```

### setStorageBytes32

```solidity
function setStorageBytes32(bytes32 position, bytes32 data) external
```

### setStorageUint256

```solidity
function setStorageUint256(bytes32 position, uint256 data) external
```

### conditionContextsLen

```solidity
function conditionContextsLen(uint256 _recordId) external view returns (uint256)
```

_Based on Record ID returns the number of condition Context instances_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _recordId | uint256 | Record ID |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | Number of condition Context instances of the Record |

### signatoriesLen

```solidity
function signatoriesLen(uint256 _recordId) external view returns (uint256)
```

_Based on Record ID returns the number of signatures_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _recordId | uint256 | Record ID |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | Number of signatures in records |

### requiredRecordsLen

```solidity
function requiredRecordsLen(uint256 _recordId) external view returns (uint256)
```

_Based on Record ID returns the number of required records_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _recordId | uint256 | Record ID |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | Number of required records |

### conditionStringsLen

```solidity
function conditionStringsLen(uint256 _recordId) external view returns (uint256)
```

_Based on Record ID returns the number of condition strings_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _recordId | uint256 | Record ID |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | Number of Condition strings of the Record |

### getActiveRecords

```solidity
function getActiveRecords() external view returns (uint256[])
```

_Sorted all records and return array of active records in Agreement_

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256[] | activeRecords array of active records in Agreement |

### getRecord

```solidity
function getRecord(uint256 _recordId) external view returns (uint256[] _requiredRecords, address[] _signatories, string[] _conditions, string _transaction, bool _isActive)
```

_return valuses for preview record before execution_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _recordId | uint256 | Record ID |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| _requiredRecords | uint256[] | array of required records in the record |
| _signatories | address[] | array of signatories in the record |
| _conditions | string[] | array of conditions in the record |
| _transaction | string | string of transaction |
| _isActive | bool | true if the record is active |

### archiveRecord

```solidity
function archiveRecord(uint256 _recordId) external
```

_archived any of the existing records by recordId._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _recordId | uint256 | Record ID |

### unarchiveRecord

```solidity
function unarchiveRecord(uint256 _recordId) external
```

_unarchive any of the existing records by recordId_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _recordId | uint256 | Record ID |

### activateRecord

```solidity
function activateRecord(uint256 _recordId) external
```

_activates the existing records by recordId, only awailable for ownerAddr_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _recordId | uint256 | Record ID |

### deactivateRecord

```solidity
function deactivateRecord(uint256 _recordId) external
```

_deactivates the existing records by recordId, only awailable for ownerAddr_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _recordId | uint256 | Record ID |

### parse

```solidity
function parse(string _code, address _context, address _preProc) external
```

_Parse DSL code from the user and set the program bytecode in Context contract_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _code | string | DSL code input from the user |
| _context | address | Context address |
| _preProc | address | Preprocessor address |

### update

```solidity
function update(uint256 _recordId, uint256[] _requiredRecords, address[] _signatories, string _transactionString, string[] _conditionStrings, address _recordContext, address[] _conditionContexts) public
```

### execute

```solidity
function execute(uint256 _recordId) external payable
```

### receive

```solidity
receive() external payable
```

### _checkSignatories

```solidity
function _checkSignatories(address[] _signatories) internal view
```

_Checks input _signatures that only one  'anyone' address exists in the
list or that 'anyone' address does not exist in signatures at all_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _signatories | address[] | the list of addresses |

### _verify

```solidity
function _verify(uint256 _recordId) internal view returns (bool)
```

Verify that the user who wants to execute the record is amoung the signatories for this Record

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _recordId | uint256 | ID of the record |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | bool | true if the user is allowed to execute the record, false - otherwise |

### _validateRequiredRecords

```solidity
function _validateRequiredRecords(uint256 _recordId) internal view returns (bool)
```

Check that all records required by this records were executed

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _recordId | uint256 | ID of the record |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | bool | true all the required records were executed, false - otherwise |

### _addRecordBlueprint

```solidity
function _addRecordBlueprint(uint256 _recordId, uint256[] _requiredRecords, address[] _signatories) internal
```

_Define some basic values for a new record_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _recordId | uint256 | is the ID of a transaction |
| _requiredRecords | uint256[] | transactions ids that have to be executed |
| _signatories | address[] | addresses that can execute the chosen transaction |

### _addRecordCondition

```solidity
function _addRecordCondition(uint256 _recordId, string _conditionStr, address _conditionCtx) internal
```

_Conditional Transaction: Append a condition to already existing conditions
inside Record_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _recordId | uint256 | Record ID |
| _conditionStr | string | DSL code for condition |
| _conditionCtx | address | Context contract address for block of DSL code for `_conditionStr` |

### _addRecordTransaction

```solidity
function _addRecordTransaction(uint256 _recordId, string _transactionString, address _recordContext) internal
```

_Adds a transaction that should be executed if all
conditions inside Record are met_

### _validateConditions

```solidity
function _validateConditions(uint256 _recordId, uint256 _msgValue) internal returns (bool)
```

### _fulfill

```solidity
function _fulfill(uint256 _recordId, uint256 _msgValue, address _signatory) internal returns (bool)
```

_Fulfill Record_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _recordId | uint256 | Record ID to execute |
| _msgValue | uint256 | Value that were sent along with function execution // TODO: possibly remove this argument |
| _signatory | address | The user that is executing the Record |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | bool | Boolean whether the record was successfully executed or not |

### getActiveRecordsLen

```solidity
function getActiveRecordsLen() public view returns (uint256)
```

_return length of active records for getActiveRecords_

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | count length of active records array |

### _updateRecord

```solidity
function _updateRecord(uint256 _recordId, string _record) internal
```

_Uploads pre-defined records to Governance contract directly.
Uses a simple condition string `bool true`.
Records that are uploaded using `_updateRecord` still have to be
parsed using a preprocessor before execution. Such record becomes
non-upgradable. Check `isUpgradableRecord` modifier_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _recordId | uint256 | Record ID |
| _record | string | the DSL code string of the record |

### _setBaseRecords

```solidity
function _setBaseRecords() internal
```

_Sets 4 pre-defined records for Governance contract_

## GovernanceMock

### constructor

```solidity
constructor(address _parser, address _onlyOwner, address _token, uint256 _deadline) public
```


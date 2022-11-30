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


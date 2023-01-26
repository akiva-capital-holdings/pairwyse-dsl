## DSLContext

_Context of DSL code

One of the core contracts of the project. It contains opcodes and aliases for commands.
During creating Context contract executes the `initOpcodes` function that provides
basic working opcodes_

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

### opCodeByName

```solidity
mapping(string => bytes1) opCodeByName
```

### selectorByOpcode

```solidity
mapping(bytes1 => bytes4) selectorByOpcode
```

### numOfArgsByOpcode

```solidity
mapping(string => uint8) numOfArgsByOpcode
```

### isCommand

```solidity
mapping(string => bool) isCommand
```

### opcodeLibNameByOpcode

```solidity
mapping(bytes1 => enum IDSLContext.OpcodeLibNames) opcodeLibNameByOpcode
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

### nonZeroAddress

```solidity
modifier nonZeroAddress(address _addr)
```

### constructor

```solidity
constructor(address _comparisonOpcodes, address _branchingOpcodes, address _logicalOpcodes, address _otherOpcodes) public
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

### _addOpcode

```solidity
function _addOpcode(string _name, bytes1 _opcode, bytes4 _opSelector, bytes4 _asmSelector, enum IDSLContext.OpcodeLibNames _libName, uint8 _numOfArgs, bool _isCommand) internal
```

_Adds the opcode for the DSL command_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _name | string | is the name of the command |
| _opcode | bytes1 | is the opcode of the command |
| _opSelector | bytes4 | is the selector of the function for this opcode        from onle of library in `contracts/libs/opcodes/*` |
| _asmSelector | bytes4 | is the selector of the function from the Parser for that opcode |
| _libName | enum IDSLContext.OpcodeLibNames | is the name of library that is used fot the opcode |
| _numOfArgs | uint8 | The number of arguments for this opcode |
| _isCommand | bool |  |

### _addOpcodeForOperator

```solidity
function _addOpcodeForOperator(string _name, bytes1 _opcode, bytes4 _opSelector, bytes4 _asmSelector, enum IDSLContext.OpcodeLibNames _libName, uint256 _priority) internal
```

_Adds the opcode for the operator_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _name | string | is the name of the operator |
| _opcode | bytes1 | is the opcode of the operator |
| _opSelector | bytes4 | is the selector of the function for this operator        from onle of library in `contracts/libs/opcodes/*` |
| _asmSelector | bytes4 | is the selector of the function from the Parser for this operator |
| _libName | enum IDSLContext.OpcodeLibNames | is the name of library that is used fot the operator |
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



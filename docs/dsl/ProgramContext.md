## ProgramContext

_Context of DSL code

One of the core contracts of the project. It provides additional information about
program state and point counter (pc)._

### ANYONE

```solidity
address ANYONE
```

### appAddr

```solidity
address appAddr
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

### msgSender

```solidity
address msgSender
```

### msgValue

```solidity
uint256 msgValue
```

### isStructVar

```solidity
mapping(string => bool) isStructVar
```

### structParams

```solidity
mapping(bytes4 => mapping(bytes4 => bytes4)) structParams
```

### labelPos

```solidity
mapping(string => uint256) labelPos
```

### forLoopIterationsRemaining

```solidity
uint256 forLoopIterationsRemaining
```

### nonZeroAddress

```solidity
modifier nonZeroAddress(address _addr)
```

### onlyApp

```solidity
modifier onlyApp()
```

### constructor

```solidity
constructor() public
```

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

### programAt

```solidity
function programAt(uint256 _start, uint256 _size) external view returns (bytes)
```

### currentProgram

```solidity
function currentProgram() public view returns (bytes)
```

_Returns the slice of the current program using the index and the step values_

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | bytes | the slice of stored bytecode in the `program` variable |

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

### setLabelPos

```solidity
function setLabelPos(string _name, uint256 _value) external
```


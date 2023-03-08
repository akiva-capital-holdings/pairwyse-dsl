## BranchingOpcodes

Opcodes for logical operators such as if/esle, switch/case

### opIfelse

```solidity
function opIfelse(address _ctxProgram, address) public
```

### opIf

```solidity
function opIf(address _ctxProgram, address) public
```

### opFunc

```solidity
function opFunc(address _ctxProgram, address) public
```

### opForLoop

```solidity
function opForLoop(address _ctxProgram, address) external
```

_For loop setup. Responsible for checking iterating array existence, set the number of iterations_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _ctxProgram | address | Context contract address |
|  | address |  |

### opStartLoop

```solidity
function opStartLoop(address _ctxProgram, address _ctxDSL) public
```

_Does the real iterating process over the body of the for-loop_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _ctxProgram | address | ProgramContext contract address |
| _ctxDSL | address | DSL Context contract address |

### opEndLoop

```solidity
function opEndLoop(address _ctxProgram, address) public
```

_This function is responsible for getting of the body of the for-loop_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _ctxProgram | address | Context contract address |
|  | address |  |

### opEnd

```solidity
function opEnd(address _ctxProgram, address) public
```

### getUint16

```solidity
function getUint16(address _ctxProgram) public returns (uint16)
```


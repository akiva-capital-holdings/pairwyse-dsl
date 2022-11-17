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


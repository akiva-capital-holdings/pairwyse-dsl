## ComparisonOpcodes

Opcodes for comparator operators such as >, <, =, !, etc.

### opEq

```solidity
function opEq(address _ctxProgram, address) public
```

_Compares two values in the stack. Put 1 to the stack if they are equal._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _ctxProgram | address | Context contract address |
|  | address |  |

### opNotEq

```solidity
function opNotEq(address _ctxProgram, address) public
```

_Compares two values in the stack. Put 1 to the stack if they are not equal._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _ctxProgram | address | Context contract address |
|  | address |  |

### opLt

```solidity
function opLt(address _ctxProgram, address) public
```

_Compares two values in the stack. Put 1 to the stack if value1 < value2_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _ctxProgram | address | Context contract address |
|  | address |  |

### opGt

```solidity
function opGt(address _ctxProgram, address) public
```

_Compares two values in the stack. Put 1 to the stack if value1 > value2_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _ctxProgram | address | Context contract address |
|  | address |  |

### opLe

```solidity
function opLe(address _ctxProgram, address) public
```

_Compares two values in the stack. Put 1 to the stack if value1 <= value2_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _ctxProgram | address | Context contract address |
|  | address |  |

### opGe

```solidity
function opGe(address _ctxProgram, address) public
```

_Compares two values in the stack. Put 1 to the stack if value1 >= value2_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _ctxProgram | address | Context contract address |
|  | address |  |

### opNot

```solidity
function opNot(address _ctxProgram, address) public
```

_Revert last value in the stack_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _ctxProgram | address | Context contract address |
|  | address |  |

### opSwap

```solidity
function opSwap(address _ctxProgram, address) public
```

_Swaps two last element in the stack_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _ctxProgram | address | Context contract address |
|  | address |  |



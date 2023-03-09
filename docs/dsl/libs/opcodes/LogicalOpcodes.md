## LogicalOpcodes

Opcodes for set operators such as AND, OR, XOR

### opAnd

```solidity
function opAnd(address _ctxProgram, address) public
```

_Compares two values in the stack. Put 1 if both of them are 1, put
     0 otherwise_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _ctxProgram | address | Context contract address |
|  | address |  |

### opOr

```solidity
function opOr(address _ctxProgram, address) public
```

_Compares two values in the stack. Put 1 if either one of them is 1,
     put 0 otherwise_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _ctxProgram | address | Context contract address |
|  | address |  |

### opXor

```solidity
function opXor(address _ctxProgram, address) public
```

_Compares two values in the stack. Put 1 if the values ​
​are different and 0 if they are the same_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _ctxProgram | address | Context contract address |
|  | address |  |

### opAdd

```solidity
function opAdd(address _ctxProgram, address) public
```

_Add two values and put result in the stack._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _ctxProgram | address | Context contract address |
|  | address |  |

### opSub

```solidity
function opSub(address _ctxProgram, address) public
```

_Subtracts one value from enother and put result in the stack._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _ctxProgram | address | Context contract address |
|  | address |  |

### opMul

```solidity
function opMul(address _ctxProgram, address) public
```

_Multiplies values and put result in the stack._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _ctxProgram | address | Context contract address |
|  | address |  |

### opDiv

```solidity
function opDiv(address _ctxProgram, address) public
```

Divide two numbers from the top of the stack

_This is an integer division. Example: 5 / 2 = 2_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _ctxProgram | address | Context address |
|  | address |  |


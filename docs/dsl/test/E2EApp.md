## E2EApp

### parserAddr

```solidity
address parserAddr
```

### preprocessorAddr

```solidity
address preprocessorAddr
```

### parser

```solidity
address parser
```

### dslContext

```solidity
address dslContext
```

### programContext

```solidity
address programContext
```

### constructor

```solidity
constructor(address _parserAddr, address _preprocessorAddr, address _dslContext, address _programContext) public
```

### receive

```solidity
receive() external payable
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


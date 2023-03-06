## BaseApplication

### parserAddr

```solidity
address parserAddr
```

### dslContext

```solidity
address dslContext
```

### programContext

```solidity
address programContext
```

### preprocessorAddr

```solidity
address preprocessorAddr
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

### _setupContext

```solidity
function _setupContext() internal
```


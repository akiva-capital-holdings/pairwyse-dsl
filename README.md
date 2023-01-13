# Solidity DSL

### Deployments to Goerli

For commit with ID 95709a7f291ce61541bc78189e906ae73c2ffe53

StringStack https://goerli.etherscan.io/address/0x2cD6BeBf36BC7eCf3B5303B033FCd0cce28653C9#code
StringUtils https://goerli.etherscan.io/address/0xD816C20e28Cc704028c475108f4DC535e237EbD9#code
Preprocessor address [0x43cF86ea1eC36C023d5d0E801dD8C459AC456947](https://goerli.etherscan.io/address/0x43cF86ea1eC36C023d5d0E801dD8C459AC456947#code)

OpcodeHelpers 0x088890626B062e1E7De8f13d49c72bDCB93066b0
ComparisonOpcodes 0x62Ab7De53EF4bFfAB0133dea58EF3C1d202D894e
BranchingOpcodes 0xC0e037AC5F7181b3f28B939301860e74AFd4A265
LogicalOpcodes 0xcd6037cDC0166E7735d6AB1819688050F186692c
OtherOpcodes 0xDC246FA53Bc64B05ed639Cf90cD5640876F80D3A
DSLContext 0x20FE732B7A4BCA0f637d459ee53f4B2Cf46583fF

ByteUtils 0x1C407CDD4975532Bb5f3f614FB3b48478f597f49
Parser 0x4827b97709B2E8cf1F53Da11f7Fb069CD18F739d
Executor 0x69D4725cc55980416bA5AEd6EC565547D281c8F9

### Install Dependencies

Execute: `yarn install`

### Compile contracts

Execute: `yarn hardhat compile`

### Localnodes

Run: `yarn hardhat node --network hardhat` to start a local node (in the separate terminal). Or use `yarn hardhat node --hostname 127.0.0.1 --port 7545` directly.

### Deploy the contracts on remote node

1. Open or create the .env file
2. Make sure the value is filled `REMOTE_GANACHE_URL= http://192.168.221.1:8545`
3. Open Pritunl and run VPN
4. Run: `yarn hardhat run --network remoteGanache scripts/deploy.preprocessor.ts` to run a script

### Deploy the contracts

Run: `yarn hardhat run scripts/deploy.agreement.ts --network localhost` to run a script

### Deploy the contracts and verify on tenderly

Use `--network tenderly` flag
Ex.: `yarn hardhat run scripts/deploy.<contract_name>.ts --network tenderly`

### Update AGREEMENT_ADDR in the .env file

`AGREEMENT_ADDR` variable is needed to test agreement smart contract in the local node.
In tests might be some issues if the address was provided incorectly or if this variable will be empty.

1. Open or create the .env file
2. Update the `AGREEMENT_ADDR` variable by the address that was provided after deployment script execution
   Ex. `AGREEMENT_ADDR=0x8C08821f5f94b519c853486eB131667AA528A460`

### Before pushing to repository

All tests marked as agreement (example: `test/agreement/agreement<*>.ts`) must be skipped. Example: `describe.only('Agreement: business case'...`

### Run tests

Use `yarn test` if it needs to run tests that not include agreement contract testing. All tests marked as agreement must be skipped.
Use `yarn test --network localhost` if it needs to run tests that include agreement contract testing. Be sure that the local node is ran on the separate terminal window. All tests marked as agreement must not be skipped. Example: `describe('Agreement: business case'...`

### Tests coverage

Use `yarn coverage` if it needs to check tests coverage that not include agreement contract testing.
Check the `coverage/` directory to see detailed HTML reports that were covered by tests.

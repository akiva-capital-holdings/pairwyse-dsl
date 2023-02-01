# Nivaura Demo

## General User Stories

1. As a client I want to enter the Pairwyse website and be able to create an Agreement Tranches smart contract (AT) that would allow user to deposit USDC tokens into Compound V2.
2. As a client I want to specify Deposits Deadline and Lock Time variables for AT contract.
3. As a user I want to enter the deployed AT contract by providing USDC to it.
4. As an anyone I want to trigged depositing my USDC to Compound V2 from AT contract after the Deposits Deadline has passed.
5. As a user I want to withdraw my funds (body; without the interest) from AT contract after the Deposits Deadline + Lock Time has passed.

## Deployments to Goerli

For commit with ID 95709a7f291ce61541bc78189e906ae73c2ffe53

- StringStack [0x2cD6BeBf36BC7eCf3B5303B033FCd0cce28653C9](https://goerli.etherscan.io/address/0x2cD6BeBf36BC7eCf3B5303B033FCd0cce28653C9#code)
- StringUtils [0xD816C20e28Cc704028c475108f4DC535e237EbD9](https://goerli.etherscan.io/address/0xD816C20e28Cc704028c475108f4DC535e237EbD9#code)
- Preprocessor address [0x43cF86ea1eC36C023d5d0E801dD8C459AC456947](https://goerli.etherscan.io/address/0x43cF86ea1eC36C023d5d0E801dD8C459AC456947#code)
- OpcodeHelpers [0x088890626B062e1E7De8f13d49c72bDCB93066b0](https://goerli.etherscan.io/address/0x088890626B062e1E7De8f13d49c72bDCB93066b0#code)
- ComparisonOpcodes [0x62Ab7De53EF4bFfAB0133dea58EF3C1d202D894e](https://goerli.etherscan.io/address/0x62Ab7De53EF4bFfAB0133dea58EF3C1d202D894e#code)
- BranchingOpcodes [0xC0e037AC5F7181b3f28B939301860e74AFd4A265](https://goerli.etherscan.io/address/0xC0e037AC5F7181b3f28B939301860e74AFd4A265#code)
- LogicalOpcodes [0xcd6037cDC0166E7735d6AB1819688050F186692c](https://goerli.etherscan.io/address/0xcd6037cDC0166E7735d6AB1819688050F186692c#code)
- OtherOpcodes [0xDC246FA53Bc64B05ed639Cf90cD5640876F80D3A](https://goerli.etherscan.io/address/0xDC246FA53Bc64B05ed639Cf90cD5640876F80D3A#code)
- DSLContext [0x20FE732B7A4BCA0f637d459ee53f4B2Cf46583fF](https://goerli.etherscan.io/address/0x20FE732B7A4BCA0f637d459ee53f4B2Cf46583fF#code)
- ByteUtils [0x1C407CDD4975532Bb5f3f614FB3b48478f597f49](https://goerli.etherscan.io/address/0x1C407CDD4975532Bb5f3f614FB3b48478f597f49#code)
- Parser [0x4827b97709B2E8cf1F53Da11f7Fb069CD18F739d](https://goerli.etherscan.io/address/0x4827b97709B2E8cf1F53Da11f7Fb069CD18F739d#code)
- Executor [0x69D4725cc55980416bA5AEd6EC565547D281c8F9](https://goerli.etherscan.io/address/0x69D4725cc55980416bA5AEd6EC565547D281c8F9#code)

## Prerequisites #1

To setup MultiTranche Demo use the same steps as in [Front End Demo V2](https://github.com/akiva-capital-holdings/solidity-dsl/blob/master/demo/v2/FE-demo-v2.md). Specifically read the following sections:

- Setup Solidity SC
- Setup FE
- Setup Metamask
- Reset MetaMask nonce (needed for localhost)

However, please use the following commit IDs (insted of those, provided in Front End Demo V2):

- Pairwyse DSL: [ef968481133b7a73c09af28c4c29a76082164d5a](https://github.com/akiva-capital-holdings/solidity-dsl/commit/ef968481133b7a73c09af28c4c29a76082164d5a)
- Front End: [2a6bd5a68c7fa797907621a2054dc7369fd52543](https://github.com/akiva-capital-holdings/dsl-fe/commit/2a6bd5a68c7fa797907621a2054dc7369fd52543)

<hr>
`Note: you'll also need an account with enough GETH (Goerli Ethereum). Enough is about 1 GETH on your balance.`
<hr>

## Prerequisites #2

1. **Front End.** Run Front End with `yarn start:stage`
2. Open your browser with MetaMask and navigate to http://localhost:3000
3. Authorize on the website with MetaMask address (creator) that has enough GETH and make sure MetaMask is connected to Goerli network.
4. Prepare another MetaMask address (investor) with some GETH (about 0.2 GETH) and 100 Goerli USDC (or more)

<hr>
`Note: to receive GETH you may use one of the awailable GETH Faucets like https://goerlifaucet.com/`
<hr>
<hr>
`Note: to receive Goerli USDC you may use one of the awailable GETH Faucets like https://goerlifaucet.com/`
<hr>

## Front End interactions

### Create and Setup MultiTranche Agreement

1. Click on "Agreement Interaction", you'll be redirected on Agreement creation tab.
2. On this tab from the dropdown menu select "MultiTranche" option and hit "Create Agreement" button. After this you'll have many MetaMask prompts to send transactions (about 7-10 transaction). Make sure you'll confirm all of the transactions.
3. After the MultiTranche contract is deployed (you'll see a MultiTranche address in the notification on the rigth of the screen) navigate to the "Definition" tab.
4. Define a variable `DEPOSITS_DEADLINE` of type "number" with a timestamp in seconds of any time in the future. This variable controls the deadline to control <hr>
   `Note: for the demo, the best option would be about 3 minutes. You may use https://www.unixtimestamp.com/ website to find the timestamp of any given time.`
   <hr>
5. (optional) Define a `LOCK_TIME` variable. This variable controls how long the user cannot withdraw his/her USDC. Set this variable to any positive number (in seconds) to lock the withdrawal.

### Interact with MultiTranche Contract

1. Connect to the website with

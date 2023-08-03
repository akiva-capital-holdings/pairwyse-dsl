# Pairwyse Workshops

## 1.  Contract-to-Contract bylaw governance workshop

### Prelim 1 - Deploy Pairwyse development sandbox

[Follow instructions for smart contract and web3 test IDE setup](https://github.com/akiva-capital-holdings/pairwyse-dsl/blob/workshops/demo/v2/FE-demo-v2.md)

### Prelim 2 - Deploy mock currency token for the demo

![Create Token](https://s3.ap-southeast-1.amazonaws.com/pairwyse.io/Workshop+-+Token+Deployment+-+Annotated.png)

### Prelim 3 - Wallet addresses for ALICE, BOB, CHARLES, DIANA, ELAINE and FARUK

`Account #0 = ALICE`
`Account #1 = BOB`
`Account #2 = CHARLES`
`Account #3 = DIANA`
`Account #4 = ELAINE`
`Account #5 = FARUK`

```
% yarn hardhat node
yarn run v1.22.5
$ pairwyse-dsl/node_modules/.bin/hardhat node
Started HTTP and WebSocket JSON-RPC server at http://127.0.0.1:8545/

Accounts
========

WARNING: These accounts, and their private keys, are publicly known.
Any funds sent to them on Mainnet or any other live network WILL BE LOST.

Account #0: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 (10000 ETH)
Private Key: 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80

Account #1: 0x70997970C51812dc3A010C7d01b50e0d17dc79C8 (10000 ETH)
Private Key: 0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d

Account #2: 0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC (10000 ETH)
Private Key: 0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a

Account #3: 0x90F79bf6EB2c4f870365E785982E1f101E93b906 (10000 ETH)
Private Key: 0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6

Account #4: 0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65 (10000 ETH)
Private Key: 0x47e179ec197488593b187f80a00eb0da91f1b9d0b13f8733639f19c30a34926a

Account #5: 0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc (10000 ETH)
Private Key: 0x8b3a350cf5c34c9194ca85829a2df0ec3153be0318b5e2d3348e872092edffba
```


### Demo - DAO token-to-treasury-to-governance agreement interfacing


	[Step 1] - ALICE Deploys GOV token with 200000e18 supply


	[Step 2] - BOB Deploys FOUNDRY token with 5e1 supply


	[Step 3] - CHARLES Deploys TREASURY agreement with the following logic and state

		Definitions:

		`USDC` token address (mock currency)
		`GOV` token address
		`FOUNDRY` token address
		`TREASURY` agreement address

		Update:

		record id:    `1`
		signatory:    `0xFFfFfFffFFfffFFfFFfFFFFFffFFFffffFfFFFfF`
		condition:    `(balanceOf FOUNDRY MSG_SENDER) > 0`
		transaction:  `(transferFrom USDC MSG_SENDER TREASURY 1e18) and (transfer GOV MSG_SENDER 1e18)`


	[Step 4] - DIANA deploys GOVERNANCE agreement with the following state

		Definitions:

		`TREASURY` as address (agreement)
		`GOV` as address (token)


	[Step 5] - CHARLES transfers ownership of TREASURY agreement to the GOVERNANCE agreement

		```
		agreement = await ethers.getContractAt('Agreement', '<enter treasury agreement address here>');
		await agreement.transferOwnership('<enter governance agreement address here>')
		await agreement.ownerAddr() // confirm new owner
		```

	[Step 6] - ELAINE makes an on-chain bylaw proposal for the TREASURY agreement

		Definitions:

		`SPECIAL_EXPIRY` as number (first deadline as UTC seconds)
		`FUNDING_EXPIRY` as number (second deadline as UTC seconds)

		Bylaw Update Proposal:

		record id:    `2`
		signatory:    `0xFFfFfFffFFfffFFfFFfFFFFFffFFFffffFfFFFfF`
		condition:    `(((balanceOf GOV MSG_SENDER) > 0) and (time < SPECIAL_EXPIRY)) or (((balanceOf USDC) > 100000e18) and (time > SPECIAL_EXPIRY) and (time < FUNDING_EXPIRY))`
		transaction:  `((allowance USDC MSG_SENDER TREASURY) setUint256 ALLOWANCE) and (transferFromVar USDC MSG_SENDER TREASURY ALLOWANCE) and (transferVar GOV MSG_SENDER ALLOWANCE)`


	[Step 7] - DIANA creates the governance vote for ELAINE's treasury bylaw proposal

		Definitions:

		`DEADLINE` as number (UTC in seconds)
		`1` as number with value 1 (certain bylaw transactions require explicit definitions)

		Governance bylaw update:

		record id:    `1`
		signatory:    `0xFFfFfFffFFfffFFfFFfFFFFFffFFFffffFfFFFfF`
		condition:    `((balanceOf GOV MSG_SENDER) > 0) and (time < DEADLINE)`
		transaction:  `declareArr address YES declareArr address NO`
		
		record id:    `2`
		signatory:    `0xFFfFfFffFFfffFFfFFfFFFFFffFFFffffFfFFFfF`
		condition:    `((balanceOf GOV MSG_SENDER) > 0) and (time < DEADLINE)`
		transaction:  `insert MSG_SENDER into YES`
		
		record id:    `3`
		signatory:    `0xFFfFfFffFFfffFFfFFfFFFFFffFFFffffFfFFFfF`
		condition:    `((balanceOf GOV MSG_SENDER) > 0) and (time < DEADLINE)`
		transaction:  `insert MSG_SENDER into NO`
		
		record id:    `4`
		signatory:    `0xFFfFfFffFFfffFFfFFfFFFFFffFFFffffFfFFFfF`
		condition:    `((votersBalance GOV YES) > (votersBalance GOV NO)) and (time > DEADLINE)`
		transaction:  `enableRecords 2 at TREASURY`


	[Step 8] - BOB sends 1e1 FOUNDRY tokens each to ALICE, CHARLES, DIANA, ELAINE

	* This enables the peers to receive early purchase rights once the DAO is fully activated


	[Step 9] - ALICE sends 200000e18 to ASTRO_PROTOCOL

	* The mock DAO is not officially activated until ALICE sends all GOV tokens to the treasury contract


	[Step 10] - ALICE, BOB, CHARLES, DIANA, ELAINE claim their early bird status

	* Each peer executes bylaw 1 on the TREASURY agreement making them the first ceremonial DAO members
	* One peer executes bylaw 1 on the GOVERNANCE agreement to activate the vote
	* Each peer votes to approve or reject the activation of record 2 on the TREASURY agreement
	* If the vote is affirmative, a general GOV token sale will be activate with the peers receiving earlybird purchase rights


	[Step 11] - Assuming an affirmative vote, the founding peers make one-time token purchases is various amounts. After passage of the special expiry, FARUK purchases the remaining tokens to become the new DAO's sixth member

```
```

## 2.  Technical Workshop - DAO constitutional charter instrumentation

Pairwyse smart contracts maintain a dual layer architecture, a fixed solidity charter atop which turing computable bylaw programs (turing bylaws in the form of DSL-mediated on-chain contract upgrades)

![Pairwyse Anatomy](https://s3.ap-southeast-1.amazonaws.com/pairwyse.io/Fig.5.png)

The goal of this workshop is crafting a governance contract with a solidity charter with heightened security features (e.g. ownerless governance contract) and constitutionally-enforced governance votes on upgrade proposals to smart contracts owned by the governance contract

```
contract DAO is Agreement {

    uint256 vote_number;
    address governance_token;
    string governance_token_symbol;

    address ANYONE = 0xFFfFfFffFFfffFFfFFfFFFFFffFFFffffFfFFFfF;

    constructor(
        address _parser,
        address _dslContext,
        address _goverance_token
    ) {
        _checkZeroAddress(_parser);
        _checkZeroAddress(_dslContext);
	_checkZeroAddress(_ownerAddr);

        contextDSL = _dslContext;
	parser = _parser;  /* optional:  governance language model customisations */
        ownerAddr = address(this);

        governance_token = _goverance_token;		
        string governance_token_symbol = IERC20(governance_token).symbol();

        UnstructuredStorage.setStorageAddress(
            bytes4(keccak256(abi.encodePacked(governance_token_symbol))),
            governance_token
        );

        vote_number = 0;
    }

    function initiateVote(
        uint256 _record_id,
        address _target_agreement,
        uint256 _deadline,
    ) public {

        /* option:  enforcement of deadline requirements */

        uint256 memory vote_bylaw_id_1 = (vote_number * 4) + 1;
        uint256 memory vote_bylaw_id_2 = vote_bylaw_id_1 + 1;
        uint256 memory vote_bylaw_id_3 = vote_bylaw_id_2 + 1;
        uint256 memory vote_bylaw_id_4 = vote_bylaw_id_3 + 1;

        vote_number = vote_number + 1;

        string memory vote_number_suffix = _uintToString(vote_number);
        string memory _record_id_string = _uintToString(_record_id);
        string memory _target_agreement_string = _addressToString(_target_agreement);
        string memory _deadline_vote = string(abi.encodePacked("DEADLINE", "_", vote_number_suffix);

        UnstructuredStorage.setStorageUint256(
            bytes4(keccak256(abi.encodePacked(_deadline_vote))), // optional:  date-time converters
            _deadline
        );

        UnstructuredStorage.setStorageUint256(
            bytes4(keccak256(abi.encodePacked(_record_id_string))), // optional:  record id alias  
            _record_id
        );

        UnstructuredStorage.setStorageAddress(
            bytes4(keccak256(abi.encodePacked( _target_agreement_string ))),  // optional:  contract alias
            _target_agreement
        );

        string memory _voting_conditon = string(abi.encodePacked(
            "((balanceOf ", governance_token_symbol, " MSG_SENDER) > 0) and (time < ", _deadline_vote, ")"
        ));

        string memory _affirmative_vote_condition = string(abi.encodePacked(
            "((votersBalance ", governance_token_symbol, " YES_", vote_number_suffix,") > (votersBalance ", governance_token_symbol, " NO_", vote_number_suffix, ")) and (time > ", _deadline_vote,")"
        ));	

        string memory _bylaw_activation_transaction = string(abi.encodePacked(
            "enableRecords ", _record_id_string," at ", _target_agreement_string
        ));
	
        /* Constitution:  An existing token holder must second the vote in order for voting to be activated before the deadline */
        _setVoteParameters(
            vote_bylaw_id_1, // RECORD ID
            _voting_conditon // CONDITIONS
            string(abi.encodePacked(
                "declareArr address YES_", vote_number_suffix, " declareArr address NO_", vote_number_suffix // TRANSACTION	
            )); 
        );
 
        /* Constitution:  A record of affirmative votes will be registered before the deadline */
        _setVoteParameters(
            vote_bylaw_id_2, // RECORD ID
            _voting_conditon // CONDITIONS
            string(abi.encodePacked(
                "insert MSG_SENDER into YES_", vote_number_suffix // TRANSACTION
            )) 
        );

        /* Constitution:  A record of negative votes will be registered before the deadline */
        _setVoteParameters(
            vote_bylaw_id_3, // RECORD ID
            _voting_conditon, // CONDITIONS
            string(abi.encodePacked(
                "insert MSG_SENDER into NO_", vote_number_suffix // TRANSACTION
            )) 
        );

        // Constitution:  If the aggregate token balance for YES votes is greater than that of NO votes, the bylaw record at the target agreement will be officially enacted
        _setVoteParameters(
            vote_bylaw_id_4, // RECORD ID
            _affirmative_vote_condition, // CONDITIONS
            _bylaw_activation_transaction, // TRANSACTION
        );

        /* emit DAOVoteInitiated(...) // optional:  public on-chain notices of vote initiation */
    }

    function _uintToString(uint256 number) internal pure returns (string) { /* method or library of choice */ }

    function _addressToString(uint256 number) internal pure returns (string) { /* method or library of choice */ }

    function _setVoteParameters(
        uint256 _recordId,
        string memory _record,
        string memory _condition,
        uint256 _requiredRecordsLength
    ) internal {	
        /* can follow constitutional pattern of _setParameters in Governance.sol */
        /* optional:  rights protection and scope enforcement implementations */
        /* optional:  invoke consent votes for other user classes (e.g. users, depositors, creditors, etc)
    }
    /* optional:  governance contract ownership transfer protocol * /
    /* optional:  definition restrictions * /
    /* optional:  language restrictions * /
    
}
```

![on-chain charter governance](https://s3.ap-southeast-1.amazonaws.com/pairwyse.io/Fig.6-1.png) 

```
```

## 3.  Business Workshop - DAO Capital Instrument Basics

![Simple Capital Instruments](https://s3.ap-southeast-1.amazonaws.com/pairwyse.io/Instrument+Primatives.png)

The first part of the workshop will cover basics of implementing terms and conditions for primative capital instruments (e.g. RSUs, Warrants, Convertible notes, etc). ([See workshop notes](https://s3.ap-southeast-1.amazonaws.com/pairwyse.io/Pairwyse+Workshop+-+Simple+Capital+Stack+demo.pdf))

The second part of the workshop will cover the multi-tranching of pairwyse smart contracts along with composition with external DeFi protocols ([See testnet demo](https://github.com/akiva-capital-holdings/pairwyse-dsl/blob/master/demo/nivaura/NIVAURA_DEMO.md))

The third part of the workshop will cover a simple example of translating GP/LP terms and conditions on paper into an executable smart contract agreement

[![Traditional Contract](https://s3.ap-southeast-1.amazonaws.com/pairwyse.io/Traditional_Contract_img.png)](https://drive.google.com/file/d/1-_Bu9pnrFF60Vfx7jlcQfipnBZQ12b48/view) 

[![Pairwyse Contract](https://s3.ap-southeast-1.amazonaws.com/pairwyse.io/GP_LP_video_img.png)](https://drive.google.com/file/d/16VvjKBT1PxSnSDXyQfdQ7FYuYkKN2G-f/view) 

The fourth part of the workshop will cover on-chain DAO-to-DAO executable agreements under on-chain P2P negotiation and governance.

![D2D Agreements](https://s3.ap-southeast-1.amazonaws.com/pairwyse.io/Fig.8.png)

```
```

## 4.  Risk Workshop - Scope Enforcement Basics

This workshop covers more advanced Pairwyse features around on-chain recourse and scope enforcement of contracts.  This template can be expanded to escalation pathways for on-chain incremental recourse, mediation, arbitration and adjudication facilities.

```
Term:          ECONOMIC_RECOURSE
Signature:     ANYONE  
Condition:     (var CONTRACT_VALUE < sumOf TERM_DEPOSITS) and ((balanceOf CLAIM_USDC_TERM) > 0) 
Transaction:   ((sumOf DEPOSITS) - (var CONTRACT_VALUE)) setUint256 LOST_VALUE
               ((var LOST_VALUE) / (var GOVERNANCE_TOKEN_PRICE)) setUint256 RECOURSE_AMOUNT
               mint GOVERNANCE_TOKEN ESCROW_CONTRACT RECOURSE_AMOUNT 
```

```
Term:          OPERATIONAL_RECOURSE
Signature:     ANYONE  
Condition:     (var CONTRACT_VALUE < sumOf TERM_DEPOSITS) and ((balanceOf CLAIM_USDC_TERM) > 0) 
Transaction:   (disable upgrade burn GOVERNANCE_TOKEN) and               
               (disable upgrade transfer GOVERNANCE_TOKEN) and
               (disable upgrade transferVar GOVERNANCE_TOKEN) 
```

```
// https://github.com/Vectorized/solady/blob/2c7fa305e443b0e69abff24810dc814a9202f966/src/utils/LibString.sol

import { Agreement } from "../agreement/Agreement.sol"
import { LibString } from "../dsl/libs/LibString.sol"

contract ScopeEnforcedAgreement is Agreement {

    string[] public restrictedScope;
    
    function setScopeRestriction(string memory _restrictedScope) onlyOwner {
        restrictedScope.push(_restrictedScope);
    }
    
    function removeScopeRestriction(string memory _enabledScope) onlyOwner {
        string[] memory updatedScope;
        for (uint i=0; i<restrictedScope.length; i++) {
            if (restrictedScope[i] != _enabledScope) {
                updatedScope.push(restrictedScope[i]);
            }
	}
        restrictedScope = updatedScope;
    }
    
    function scopeValidation(string memory _instructionString) public returns (bool success) {
        for (uint i=0; i<restrictedScope.length; i++) {
            uint256 search_result = LibString.indexOf(_instructionString, restrictedScope[i]);
            if (search_result != type(uint256).max) {
                return false;
            }
        }
        return true;
    }

    function update(
        uint256 _recordId,
        uint256[] memory _requiredRecords,
        address[] memory _signatories,
        string memory _recordString,
        string[] memory _conditionStrings
    ) public {
        _addRecordBlueprint(_recordId, _requiredRecords, _signatories);
        for (uint256 i = 0; i < _conditionStrings.length; i++) {
            _addRecordCondition(_recordId, _conditionStrings[i]);
        }
        require( _scopeValidation(_recordString), "Update blocked, check scope restrictions" );
        _addRecordTransaction(_recordId, _recordString);
        if (msg.sender == ownerAddr) {
            records[_recordId].isActive = true;
        }

        emit NewRecord(_recordId, _requiredRecords, _signatories, _recordString, _conditionStrings);
    }
}
```
```
```

## 5.  BFT DAO genesis Workshop

![BFT on-chain DAO Genesis](https://s3.ap-southeast-1.amazonaws.com/pairwyse.io/Fig.9.png)



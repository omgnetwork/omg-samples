# Making ETH transfer on the OMG Network

_By the end of this tutorial you should know how to make ETH transfer on the OMG network._

## Intro

The example uses `createTransaction` function provided by the `Childchain` module of the `omg-js` library.

## Prerequisites

- Any amount of ETH in Alice's OMG Network wallet. If you're using pre-defined `.env` configurations for Alice and Bob, the wallet should contain test ETH. Otherwise, top it up with [Ropsten faucet](https://faucet.metamask.io/) (for testnet) or actual ETH (for mainnet).

## Steps

1. App setup
2. Logging child chain ETH balances for Alice and Bob
3. Creating a payment transaction
4. Signing, building and submitting a transaction
5. Recording transaction by the Watcher

### 1. App setup

You can find the full Javascript segment of this tutorial in [transaction-eth.js](./transaction-eth.js). The first lines define dependent libraries, set up configs for child chain and root chain, define wallet's data to be used during the sample.

```
import BigNumber from "bn.js";
import Web3 from "web3";
import { ChildChain, OmgUtil } from "@omisego/omg-js";
import wait from "../helpers/wait.js";
import config from "../../config.js";

const web3 = new Web3(new Web3.providers.HttpProvider(config.eth_node), null, {
  transactionConfirmationBlocks: 1,
});
const childChain = new ChildChain({
  watcherUrl: config.watcher_url,
  watcherProxyUrl: config.watcher_proxy_url,
  plasmaContractAddress: config.plasmaframework_contract_address,
});

const rootChainPlasmaContractAddress = config.plasmaframework_contract_address;
const aliceAddress = config.alice_eth_address;
const alicePrivateKey = config.alice_eth_address_private_key;
const bobAddress = config.bob_eth_address;
```

### 2. Logging child chain ETH balances for Alice and Bob

Logging balances helps to see the changes in the wallets before and after making any transaction. For more detailed example, please refer to [Retrieve Balances](../01-balances/README.md).

```
async function logBalances() {
  const alicesBalanceArray = await childChain.getBalance(aliceAddress);
  const alicesEthObject = alicesBalanceArray.find(
    (i) => i.currency === OmgUtil.transaction.ETH_CURRENCY
  );
  const alicesChildchainETHBalance = alicesEthObject
    ? `${web3.utils.fromWei(String(alicesEthObject.amount))} ETH`
    : "0 ETH";

  const bobsBalanceArray = await childChain.getBalance(bobAddress);
  const bobsEthObject = bobsBalanceArray.find(
    (i) => i.currency === OmgUtil.transaction.ETH_CURRENCY
  );
  const bobsChildchainETHBalance = bobsEthObject
    ? `${web3.utils.fromWei(String(bobsEthObject.amount))} ETH`
    : "0 ETH";

  console.log(`Alice's childchain ETH balance: ${alicesChildchainETHBalance}`);
  console.log(`Bob's childchain ETH balance: ${bobsChildchainETHBalance}`);
  return { bobETHBalance: bobsEthObject ? bobsEthObject.amount : 0 };
}
```

Example output:

```
Alice's child chain ETH balance: 0.686843 ETH

Bob's child chain ETH balance: 0.03319 ETH

```

### 3. Creating a payment transaction

- Transactions are composed of inputs and outputs. An input is simply a pointer to the output of another transaction. An output is a transaction that hasn't been spent yet (also known as UTXO).
- The creation of a transaction starts with `createTransaction` function provided by the `Childchain` module of the `omg-js` library.
- Each transaction contains details of the sender and receiver in the `owner` property for a respective object in the form of a public key.
- The amount is defined in [RLP encoded](https://github.com/ethereum/wiki/wiki/RLP) format, as for any type of transaction on the network.
- Currency contains `0x0000000000000000000000000000000000000000` value for ETH operations, and the respective smart contract address for ERC20 tokens.
- The child chain server collects fees for sending a transaction. The fee can be paid in a variety of supported tokens by the network. To get more details on how the fees are defined, please refer to [Fees Documentation](https://docs.omg.network/fees). If you want to know the list of supported tokens to pay fees, you can use the `getFees` function of the `Childchain` module provided by the `omg-js` library.

```
const transferAmount = new BigNumber(
  web3.utils.toWei(config.alice_eth_transfer_amount, "ether")
);

const payments = [
  {
    owner: bobAddress,
    currency: OmgUtil.transaction.ETH_CURRENCY,
    amount: Number(transferAmount),
  },
];
console.log(payments);

const fee = {
  currency: OmgUtil.transaction.ETH_CURRENCY,
};

const createdTxn = await childChain.createTransaction({
  owner: aliceAddress,
  payments,
  fee,
  metadata: "hello",
});

console.log(
  `Created a childchain transaction of ${web3.utils.fromWei(
    payments[0].amount.toString(),
    "ether"
  )} ETH from Alice to Bob.`
);
```

Example output:

```
Created a child chain transaction of 0.005 ETH from Alice to Bob.
```

### 4. Signing, building and submitting a transaction

- Each transaction should be signed by the owner of funds (UTXOs).
- The payment transaction should have a specific format and encoded with [RLP encoding](https://github.com/ethereum/wiki/wiki/RLP) according to the following rules:

```
[txType, inputs, outputs, txData, metaData]

txType ::= uint256
inputs ::= [input]
input ::= bytes32
outputs ::= [output]
output ::= [outputType, outputData]
outputType ::= uint256
outputData ::= [outputGuard, token, amount]
outputGuard ::= bytes20
token ::= bytes20
amount ::= uint256
txData ::= uint256 (must be 0)
metadata ::= bytes32
```

- Transactions are signed using the [EIP-712](https://github.com/ethereum/EIPs/blob/master/EIPS/eip-712.md) method. The EIP-712 typed data structure is defined as follows:

```
{
  types: {
    EIP712Domain: [
        { name: 'name', type: 'string' },
        { name: 'version', type: 'string' },
        { name: 'verifyingContract', type: 'address' },
        { name: 'salt', type: 'bytes32' }
    ],
    Transaction: [
        { name: 'txType', type: 'uint256' },
        { name: 'input0', type: 'Input' },
        { name: 'input1', type: 'Input' },
        { name: 'input2', type: 'Input' },
        { name: 'input3', type: 'Input' },
        { name: 'output0', type: 'Output' },
        { name: 'output1', type: 'Output' },
        { name: 'output2', type: 'Output' },
        { name: 'output3', type: 'Output' },
        { name: 'txData', type: 'uint256' },
        { name: 'metadata', type: 'bytes32' }
    ],
    Input: [
        { name: 'blknum', type: 'uint256' },
        { name: 'txindex', type: 'uint256' },
        { name: 'oindex', type: 'uint256' }
    ],
    Output: [
        { name: 'outputType', type: 'uint256' },
        { name: 'outputGuard', type: 'bytes20' },
        { name: 'currency', type: 'address' },
        { name: 'amount', type: 'uint256' }
    ]
  },
  domain: {
        name: 'OMG Network',
        version: '1',
        verifyingContract: '',
        salt: '0xfad5c7f626d80f9256ef01929f3beb96e058b8b4b0e3fe52d84f054c0e2a7a83'
    },
  primaryType: 'Transaction'
}
```

- The private key used to sign a transaction shouldn't be exposed to anyone under no circumstances. You should treat it more seriously than your bank account password.

```
// sign/build/submit
const typedData = OmgUtil.transaction.getTypedData(
  createdTxn.transactions[0],
  rootChainPlasmaContractAddress
);
const privateKeys = new Array(createdTxn.transactions[0].inputs.length).fill(
  alicePrivateKey
);
const signatures = childChain.signTransaction(typedData, privateKeys);
const signedTxn = childChain.buildSignedTransaction(typedData, signatures);
const receipt = await childChain.submitTransaction(signedTxn);
console.log("Transaction submitted: " + receipt.txhash);
```

Example output:

```
Signing transaction...

Building transaction...

Submitting transaction...

Transaction submitted: 0x97107fdb1a4c9201411bc56bde8e83500d2a76f1ad99f9e7d6207e56872b9c6a
```

### 5. Recording transaction by the Watcher

```
// wait for transaction to be recorded by the watcher
console.log("Waiting for transaction to be recorded by the Watcher...");
const expectedAmount = Number(transferAmount) + Number(bobETHBalance);

await wait.waitForBalance(
  childChain,
  bobAddress,
  expectedAmount,
  OmgUtil.transaction.ETH_CURRENCY
);

console.log("-----");
await logBalances();
```

Example output:

```
Waiting for a transaction to be recorded by the watcher...

Waiting for balance: 1

Waiting for balance: 2

Waiting for balance: 3

...

Waiting for balance: 12
-----

Alice's child chain ETH balance: 0.681813 ETH

Bob's child chain ETH balance: 0.03819 ETH
```

## Running the sample

1. Enter the `omg-js` folder if you're in the root `omg-samples` repository:

```
cd omg-js
```

2. Install dependencies:

```
npm install
```

3. Create `.env` file, modify configurations with required values (look at [.env.example](../../.env.example) or [README](../../README.md) of the `omg-js` repo for details).

4. Run the app:

```
npm run start
```

5. Open your browser at [http://localhost:3000](http://localhost:3000).

6. Select `Make an ETH Transaction` sample on the left side, observe the logs on the right:

![img](../assets/images/04.png)
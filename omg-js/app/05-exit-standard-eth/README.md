# Start a Standard ETH Exit to the root chain

_By the end of this tutorial you should know how to start a standard Ethereum exit to the root chain._

## Intro

The example uses the `startStandardExit`, `getStandardExitId` functions provided by the `Rootchain` module of the `omg-js` library to start a standard ETH exit from the child chain back to the root chain. In plain terms Exit is a process of withdrawing the funds from the OMG Network. Such terminology follows the original [Plasma concept](https://docs.ethhub.io/ethereum-roadmap/layer-2-scaling/plasma).

## Prerequisites

- At least 1 ETH UTXO in Bob’s wallet. For creating a new UTXO, you can make a Deposit or receive a transaction from another address.

## Steps

1. App setup
2. Logging root chain and child chain balances for Bob
3. Logging ETH UTXOs for Bob
4. Checking the exit queue
5. Starting a standard exit

### 1. App setup

You can find the full Javascript segment of this tutorial in [exit-standard-eth.js](./exit-standard-eth.js). The first lines define dependent libraries, set up configs for child chain and root chain, define wallet's data for Bob.

```
import Web3 from "web3";
import { ChildChain, RootChain, OmgUtil } from "@omisego/omg-js";
import wait from "../helpers/wait.js";
import config from "../../config.js";

const web3 = new Web3(new Web3.providers.HttpProvider(config.eth_node), null, {
  transactionConfirmationBlocks: 1,
});
const rootChain = new RootChain({
  web3,
  plasmaContractAddress: config.plasmaframework_contract_address,
});

const childChain = new ChildChain({
  watcherUrl: config.watcher_url,
  watcherProxyUrl: config.watcher_proxy_url,
  plasmaContractAddress: config.plasmaframework_contract_address,
});

const bobAddress = config.bob_eth_address;
const bobPrivateKey = config.bob_eth_address_private_key;

```

### 2. Logging root chain and child chain balances for Bob

Logging balances helps to understand the amount of funds available for submitting a standard exit. For performing this operation, use `getBalance` function provided by [web3.js](https://github.com/ethereum/web3.js) to retrieve the balance from the root chain (Ethereum Network), and `getBalance` function provided by [omg-js](https://github.com/omisego/omg-js) to retrieve balance from the child chain (OMG Network). For a more detailed example, please refer to [Retrieve Balances](../01-balances/README.md) sample.

```
async function logBalances() {
  const bobRootchainBalance = await web3.eth.getBalance(bobAddress);
  const bobChildchainBalanceArray = await childChain.getBalance(bobAddress);
  const bobsEthObject = bobChildchainBalanceArray.find(
    (i) => i.currency === OmgUtil.transaction.ETH_CURRENCY
  );
  const bobChildchainETHBalance = bobsEthObject
    ? `${web3.utils.fromWei(String(bobsEthObject.amount))} ETH`
    : "0 ETH";

  console.log(
    `Bob's rootchain balance: ${web3.utils.fromWei(
      String(bobRootchainBalance),
      "ether"
    )} ETH`
  );
  console.log(`Bob's childchain balance: ${bobChildchainETHBalance}`);
}
```

Example output:

```
Bob's root chain balance: 3.283270598998171475 ETH

Bob's child chain balance: 0.04719 ETH
```

### 3. Logging ETH UTXOs for Bob

- Logging UTXOs helps to understand how many UTXOs you have to submit an exit. For a more detailed example, please refer to [Show UTXOs](../04-utxo-show/README.md) sample.
- You can exit only 1 UTXO at a time. Consider [merging multiple UTXOs](../04-utxo-merge/README.md) into 1 UTXO or [splitting UTXO](../04-utxo-split/README.md) if you don't want to exit all of your funds at once with a single UTXO.
- By default, the UTXO to exit is the youngest one that was created.
- Every exit requires an extra fee called an [exit bond](https://docs.omg.network/exitbonds) as an incentive mechanism for users of the OMG Network to exit honestly and challenge dishonest exits. The bond is currently fixed at an amount estimated to cover the gas cost of submitting a challenge. You can check the current gas cost at [Gastracker](https://etherscan.io/gastracker) provided by the Etherscan.

```
const bobUtxos = await childChain.getUtxos(bobAddress);
const bobUtxoToExit = bobUtxos.find(
  (i) => i.currency === OmgUtil.transaction.ETH_CURRENCY
);
if (!bobUtxoToExit) {
  console.log("Bob doesn't have any ETH UTXOs to exit");
  return;
}

console.log(
  `Bob's wants to exit ${web3.utils.fromWei(
    String(bobUtxoToExit.amount),
    "ether"
  )} ETH with this UTXO:\n${JSON.stringify(bobUtxoToExit, undefined, 2)}`
);

```

Example output:

```
Bob's wants to exit 0.007 ETH with this UTXO:
{
  "amount": "18de76816d8000",
  "blknum": 124000,
  "creating_txhash": "0x810dc27fe8b79127246775ddc1a323327034ad07640e48aba69f070dd96e613b",
  "currency": "0x0000000000000000000000000000000000000000",
  "inserted_at": "2020-04-17T14:05:13Z",
  "oindex": 0,
  "otype": 1,
  "owner": "0x8b63bb2b829813ece5c2f378d47b2862be271c6c",
  "spending_txhash": null,
  "txindex": 0,
  "updated_at": "2020-04-17T14:05:13Z",
  "utxo_pos": 124000000000000
}
```

### 4. Checking the exit queue

- Exits are processed in queues that contain tokens you can use to start an exit. Before you start an exit, the network has to verify that the exit queue for the token used in the UTXO exists. You can check that information with the `hasToken` function provided by the `Rootchain` module of the `omg-js` library.
- If the exit queue doesn't have this token, you can add it with `addToken` function provided by the `Rootchain` module of the `omg-js` library.

```
const hasToken = await rootChain.hasToken(OmgUtil.transaction.ETH_CURRENCY);
if (!hasToken) {
  console.log(`Adding a ${OmgUtil.transaction.ETH_CURRENCY} exit queue`);
  await rootChain.addToken({
    token: OmgUtil.transaction.ETH_CURRENCY,
    txOptions: { from: bobAddress, privateKey: bobPrivateKey },
  });
}
```

### 5. Starting a standard exit

- For starting a standard exit, use `startStandardExit` function provided by the `Rootchain` module of the `omg-js` library.
- A standard exit creates an exit receipt. The receipt has the following structure:

```
{
  "blockHash": "0x11ba9b64986b6a7d5763735d445f77e3b854d41e7041b3c2943e1f9f39c114e4",
  "blockNumber": 7804882,
  "contractAddress": null,
  "cumulativeGasUsed": 1613315,
  "from": "0x8b63bb2b829813ece5c2f378d47b2862be271c6c",
  "gasUsed": 365705,
  "logs": [
    {
      "address": "0x96d5D8bc539694e5fa1ec0dAb0e6327CA9E680F9",
      "topics": [
        "0xe15a4f223f922b625f5fdd941101a23fa0c097e522233d47a7cbea2167e92701",
        "0x00000000000000000000000000617d9cf823fa147946c05adad21e6e417b29e5"
      ],
      "data": "0x0017aa6a1d400002dd231b0000617d9cf823fa147946c05adad21e6e417b29e5",
      "blockNumber": 7804882,
      "transactionHash": "0x63025e84861677312a04e601477916bf948053ce7ca0ed25be41aae4b57aab68",
      "transactionIndex": 11,
      "blockHash": "0x11ba9b64986b6a7d5763735d445f77e3b854d41e7041b3c2943e1f9f39c114e4",
      "logIndex": 2,
      "removed": false,
      "id": "log_e2805243"
    },
    {
      "address": "0x08C569c5774110EB84A80B292e6d6f039E18915A",
      "topics": [
        "0xdd6f755cba05d0a420007aef6afc05e4889ab424505e2e440ecd1c434ba7082e",
        "0x0000000000000000000000008b63bb2b829813ece5c2f378d47b2862be271c6c"
      ],
      "data": "0x00000000000000000000000000617d9cf823fa147946c05adad21e6e417b29e5",
      "blockNumber": 7804882,
      "transactionHash": "0x63025e84861677312a04e601477916bf948053ce7ca0ed25be41aae4b57aab68",
      "transactionIndex": 11,
      "blockHash": "0x11ba9b64986b6a7d5763735d445f77e3b854d41e7041b3c2943e1f9f39c114e4",
      "logIndex": 3,
      "removed": false,
      "id": "log_38e077a9"
    }
  ],
  "logsBloom": "0x00000000000000000000020000000000000000080000000000000400000400800000200100100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000800040000000000000000000000000000000000000000000000008000000000000000000800000000400000000000000000000000000000000008000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000400000000000000000000000000000000000000000000000000000000000000000000100000000000000080",
  "status": true,
  "to": "0x08c569c5774110eb84a80b292e6d6f039e18915a",
  "transactionHash": "0x63025e84861677312a04e601477916bf948053ce7ca0ed25be41aae4b57aab68",
  "transactionIndex": 11
}
```

- Each exit has an Id that identifies it. You can retrive the id using `getStandardExitId` function provided by the `Rootchain` module of the `omg-js` library.
- After a standard exit has started, you'll have to wait a certain amount of time before you can process that exit and receive your funds back on Ethereum Network. This time is called a challenge period and equals to two `minExitPeriod` (2 weeks) on the mainnet and 1 day on the Ropsten testnet. The amount of time needed on the testnet can be altered in the future based on clients' requests. Therefore, a challenge period is an incentivized security measure that allows other users to challenge anybody's exits for validity and honesty. You can learn more about challenging exits in [the OMG Developer Portal](https://docs.omg.network/challenging-exits).
- For checking the amount of time your exit will available for processing, use `getExitTime` provided by the `Rootchain` module of the `omg-js` library. The time is returned in milliseconds. Feel free to convert it to a move convenient way.

```
const exitData = await childChain.getExitData(bobUtxoToExit);

const standardExitReceipt = await rootChain.startStandardExit({
  utxoPos: exitData.utxo_pos,
  outputTx: exitData.txbytes,
  inclusionProof: exitData.proof,
  txOptions: {
    privateKey: bobPrivateKey,
    from: bobAddress,
    gas: 6000000,
  },
});
console.log(
  "Bob started a standard exit: ",
  standardExitReceipt.transactionHash
);

const exitId = await rootChain.getStandardExitId({
  txBytes: exitData.txbytes,
  utxoPos: exitData.utxo_pos,
  isDeposit: bobUtxoToExit.blknum % 1000 !== 0,
});
console.log("Exit id: " + exitId);

const { msUntilFinalization } = await rootChain.getExitTime({
  exitRequestBlockNumber: standardExitReceipt.blockNumber,
  submissionBlockNumber: bobUtxoToExit.blknum,
});

console.log("Exit time: " + msUntilFinalization);
```

Example output:

```
Bob started a standard exit: 0x29643e26a947f5efd78eb0854151f9942c81acc689fb75b7b4453957f9e2f590

Exit id: 1438997387563518723772889822846363694618122838

Exit time: 86400000 ms
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

6. Select `09 - Start a Standard ETH Exit` sample on the left side, observe the logs on the right.

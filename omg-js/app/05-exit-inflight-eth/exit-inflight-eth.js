/*
  Copyright 2020 OmiseGO Pte Ltd
  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at
  http://www.apache.org/licenses/LICENSE-2.0
  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.
*/

import BigNumber from "bn.js";
import Web3 from "web3";
import { ChildChain, RootChain, OmgUtil } from "@omisego/omg-js";
import config from "../../config.js";

const web3 = new Web3(new Web3.providers.HttpProvider(config.eth_node), null, {
  transactionConfirmationBlocks: 1,
});
const rootChain = new RootChain({
  web3,
  plasmaContractAddress: config.plasmaframework_contract_address,
});
const rootChainPlasmaContractAddress = config.plasmaframework_contract_address;
const childChain = new ChildChain({
  watcherUrl: config.watcher_url,
  watcherProxyUrl: config.watcher_proxy_url,
  plasmaContractAddress: config.plasmaframework_contract_address,
});

const aliceAddress = config.alice_eth_address;
const alicePrivateKey = config.alice_eth_address_private_key;
const bobAddress = config.bob_eth_address;
const bobPrivateKey = config.bob_eth_address_private_key;
const ETH_CURRENCY = OmgUtil.transaction.ETH_CURRENCY;

async function logBalances() {
  const aliceRootchainBalance = await web3.eth.getBalance(aliceAddress);
  const bobRootchainBalance = await web3.eth.getBalance(bobAddress);

  const alicesBalanceArray = await childChain.getBalance(aliceAddress);
  const alicesEthObject = alicesBalanceArray.find(
    (i) => i.currency === ETH_CURRENCY
  );
  const alicesChildchainETHBalance = alicesEthObject
    ? `${web3.utils.fromWei(String(alicesEthObject.amount))} ETH`
    : "0 ETH";

  const bobsBalanceArray = await childChain.getBalance(bobAddress);
  const bobsEthObject = bobsBalanceArray.find(
    (i) => i.currency === ETH_CURRENCY
  );
  const bobsChildchainETHBalance = bobsEthObject
    ? `${web3.utils.fromWei(String(bobsEthObject.amount))} ETH`
    : "0 ETH";

  console.log(
    `Alice's root chain ETH balance: ${web3.utils.fromWei(
      String(aliceRootchainBalance),
      "ether"
    )} ETH`
  );
  console.log(
    `Bob's root chain ETH balance: ${web3.utils.fromWei(
      String(bobRootchainBalance),
      "ether"
    )} ETH`
  );
  console.log(`Alice's child chain ETH balance: ${alicesChildchainETHBalance}`);
  console.log(`Bob's child chain ETH balance: ${bobsChildchainETHBalance}`);
}

async function exitQueue() {
  const ethQueue = await rootChain.getExitQueue();
  const ethQueueHuman = ethQueue.map((e) => {
    const container = {};
    container.priority = e.priority;
    container.exitableAt = new Date(
      parseInt(e.exitableAt * 1000)
    ).toLocaleString();
    container.exitId = e.exitId;
    return container;
  });

  console.log(
    "Current ETH exit queue: " + JSON.stringify(ethQueueHuman, null, 2)
  );
}

async function exitInflightEth() {
  const bobRootchainBalance = await web3.eth.getBalance(bobAddress);
  const bobsEtherBalance = web3.utils.fromWei(
    String(bobRootchainBalance),
    "ether"
  );
  if (bobsEtherBalance < 0.001) {
    console.log(
      "Bob doesn't have enough ETH on the root chain to start an exit"
    );
    return;
  }
  await logBalances();
  console.log("-----");
  const transferAmount = new BigNumber(
    web3.utils.toWei(config.alice_eth_transfer_amount, "ether")
  );
  const payments = [
    {
      owner: bobAddress,
      currency: ETH_CURRENCY,
      amount: Number(transferAmount),
    },
  ];
  const fee = {
    currency: ETH_CURRENCY,
  };
  const createdTxn = await childChain.createTransaction({
    owner: aliceAddress,
    payments,
    fee,
  });
  console.log(
    `Created a child chain transaction of ${web3.utils.fromWei(
      payments[0].amount.toString(),
      "ether"
    )} ETH from Alice to Bob`
  );
  // type/sign/build/submit
  const typedData = OmgUtil.transaction.getTypedData(
    createdTxn.transactions[0],
    rootChainPlasmaContractAddress
  );

  console.log("Signing transaction...");
  const signatures = childChain.signTransaction(typedData, [alicePrivateKey]);
  
  console.log("Building transaction...");
  const signedTxn = childChain.buildSignedTransaction(typedData, signatures);
  console.log("The transaction has been created but wasn't submitted");

  // Bob hasn't seen the transaction gets put into a block and he wants to exit his output.
  // check if queue exists for this token
  const hasToken = await rootChain.hasToken(ETH_CURRENCY);
  if (!hasToken) {
    console.log(`Adding ${ETH_CURRENCY} exit queue...`);
    await rootChain.addToken({
      token: ETH_CURRENCY,
      txOptions: { from: bobAddress, privateKey: bobPrivateKey },
    });
  }

  // start an in-flight exit
  console.log("Starting an in-flight exit...");
  const exitData = await childChain.inFlightExitGetData(
    OmgUtil.hexPrefix(signedTxn)
  );
  const exitReceipt = await rootChain.startInFlightExit({
    inFlightTx: exitData.in_flight_tx,
    inputTxs: exitData.input_txs,
    inputUtxosPos: exitData.input_utxos_pos,
    inputTxsInclusionProofs: exitData.input_txs_inclusion_proofs,
    inFlightTxSigs: exitData.in_flight_tx_sigs,
    txOptions: {
      privateKey: bobPrivateKey,
      from: bobAddress,
      gas: 6000000,
    },
  });
  console.log("Bob starts an inflight exit: " + exitReceipt.transactionHash);
  const exitId = await rootChain.getInFlightExitId({
    txBytes: exitData.in_flight_tx,
  });
  console.log("Exit id: " + exitId);
  // Decode the transaction to get the index of Bob's output
  const outputIndex = createdTxn.transactions[0].outputs.findIndex(
    (e) => e.owner.toLowerCase() === bobAddress.toLowerCase()
  );

  // Bob needs to piggyback his output on the in-flight exit
  console.log("Bob piggybacks his output...");
  await rootChain.piggybackInFlightExitOnOutput({
    inFlightTx: exitData.in_flight_tx,
    outputIndex: outputIndex,
    txOptions: {
      privateKey: bobPrivateKey,
      from: bobAddress,
    },
  });
  console.log("Bob has piggybacked his output...");
  exitQueue();
}

export { exitInflightEth };

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

  console.log(`Alice's child chain ETH balance: ${alicesChildchainETHBalance}`);
  console.log(`Bob's child chain ETH balance: ${bobsChildchainETHBalance}`);
  return { bobETHBalance: bobsEthObject ? bobsEthObject.amount : 0 };
}

async function transactionEth() {
  const { bobETHBalance } = await logBalances();
  console.log("-----");

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

  const fee = {
    currency: OmgUtil.transaction.ETH_CURRENCY,
  };

  const createdTxn = await childChain.createTransaction({
    owner: aliceAddress,
    payments,
    fee,
    metadata: "data",
  });

  console.log(
    `Created a child chain transaction of ${web3.utils.fromWei(
      payments[0].amount.toString(),
      "ether"
    )} ETH from Alice to Bob.`
  );

  // sign/build/submit
  const typedData = OmgUtil.transaction.getTypedData(
    createdTxn.transactions[0],
    rootChainPlasmaContractAddress
  );
  const privateKeys = new Array(createdTxn.transactions[0].inputs.length).fill(
    alicePrivateKey
  );

  console.log("Signing transaction...");
  const signatures = childChain.signTransaction(typedData, privateKeys);
  
  console.log("Building transaction...");
  const signedTxn = childChain.buildSignedTransaction(typedData, signatures);
  
  console.log("Submitting transaction...");
  const receipt = await childChain.submitTransaction(signedTxn);
  console.log("Transaction submitted: " + receipt.txhash);

  // wait for transaction to be recorded by the watcher
  console.log("Waiting for a transaction to be recorded by the watcher...");
  const expectedAmount = Number(transferAmount) + Number(bobETHBalance);
  
  await wait.waitForBalance(
    childChain,
    bobAddress,
    expectedAmount,
    OmgUtil.transaction.ETH_CURRENCY
  );

  console.log("-----");
  await logBalances();
}

export { transactionEth };

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

async function exitEth() {
  const bobRootchainBalance = await web3.eth.getBalance(bobAddress);
  const bobsEtherBalance = web3.utils.fromWei(
    String(bobRootchainBalance),
    "ether"
  );
  if (bobsEtherBalance < 0.001) {
    console.log("Bob doesnt have enough ETH on the root chain to start an exit");
    return;
  }
  await logBalances();
  console.log("-----");

  // get ETH UTXO and exit data
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

  // check if queue exists for this token
  const hasToken = await rootChain.hasToken(OmgUtil.transaction.ETH_CURRENCY);
  if (!hasToken) {
    console.log(`Adding a ${OmgUtil.transaction.ETH_CURRENCY} exit queue`);
    await rootChain.addToken({
      token: OmgUtil.transaction.ETH_CURRENCY,
      txOptions: { from: bobAddress, privateKey: bobPrivateKey },
    });
  }

  // start a standard exit
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
    "Bob started a standard exit: " + standardExitReceipt.transactionHash
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

  console.log("Exit time: " + msUntilFinalization + " ms");
}

export { exitEth };

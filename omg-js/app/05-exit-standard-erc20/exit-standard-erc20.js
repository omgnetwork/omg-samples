import Web3 from "web3";
import { ChildChain, RootChain, OmgUtil } from "@omisego/omg-js";
import config from "../../config.js";

// setup for only 1 transaction confirmation block for fast confirmations
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
  const bobRootchainBalance = await OmgUtil.getErc20Balance({
    web3,
    address: bobAddress,
    erc20Address: config.erc20_contract_address,
  });
  const bobChildchainBalanceArray = await childChain.getBalance(bobAddress);
  const bobErc20Object = bobChildchainBalanceArray.find(
    (i) =>
      i.currency.toLowerCase() === config.erc20_contract_address.toLowerCase()
  );
  const bobChildchainBalance = bobErc20Object ? bobErc20Object.amount : 0;

  console.log(
    `Bob's root chain ERC20 balance: ${web3.utils.fromWei(
      String(bobRootchainBalance),
      "ether"
    )}`
  );
  console.log(
    `Bob's child chain ERC20 balance: ${web3.utils.fromWei(
      String(bobChildchainBalance),
      "ether"
    )}`
  );
}

async function exitErc20() {
  if (!config.erc20_contract_address) {
    console.log("Please define an ERC20 contract in your .env");
    return;
  }
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

  // get a ERC20 UTXO and exit data
  const bobUtxos = await childChain.getUtxos(bobAddress);
  const bobUtxoToExit = bobUtxos.find(
    (i) =>
      i.currency.toLowerCase() === config.erc20_contract_address.toLowerCase()
  );
  if (!bobUtxoToExit) {
    console.log("Bob doesn't have any ERC20 UTXOs to exit");
    return;
  }

  console.log(
    `Bob wants to exit ${web3.utils.fromWei(
      String(bobUtxoToExit.amount),
      "ether"
    )} ERC20 with this UTXO:\n${JSON.stringify(bobUtxoToExit, undefined, 2)}`
  );

  // check if queue exists for this token
  const hasToken = await rootChain.hasToken(config.erc20_contract_address);
  if (!hasToken) {
    console.log(`Adding a ${config.erc20_contract_address} exit queue`);
    await rootChain.addToken({
      token: config.erc20_contract_address,
      txOptions: { from: bobAddress, privateKey: bobPrivateKey },
    });
  }

  // start a standard exit
  console.log("Starting an ERC20 exit...");
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

export { exitErc20 };
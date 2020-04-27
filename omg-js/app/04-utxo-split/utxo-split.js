import BigNumber from "bn.js";
import JSONBigNumber from "omg-json-bigint";
import Web3 from "web3";
import { ChildChain, OmgUtil } from "@omisego/omg-js";
import config from "../../config.js";

const rootChainPlasmaContractAddress = config.plasmaframework_contract_address;
const web3 = new Web3(new Web3.providers.HttpProvider(config.eth_node), null, {
  transactionConfirmationBlocks: 1,
});
const childChain = new ChildChain({
  watcherUrl: config.watcher_url,
  watcherProxyUrl: config.watcher_proxy_url,
  plasmaContractAddress: config.plasmaframework_contract_address,
});

const aliceAddress = config.alice_eth_address;
const alicePrivateKey = config.alice_eth_address_private_key;

async function showUtxo() {
  const aliceUtxosAll = await childChain.getUtxos(aliceAddress);
  const aliceEthUtxos = aliceUtxosAll.filter(
    (u) => u.currency === OmgUtil.transaction.ETH_CURRENCY
  );
  const aliceErc20Utxos = aliceUtxosAll.filter(
    (u) =>
      u.currency.toLowerCase() === config.erc20_contract_address.toLowerCase()
  );

  console.log(
    `Alice has ${aliceEthUtxos.length} ETH UTXOs and ${aliceErc20Utxos.length} ERC20 UTXOs`
  );

  console.log(
    `Alice ETH UTXOs: ${JSONBigNumber.stringify(aliceEthUtxos, undefined, 2)}`
  );
  console.log(
    `Alice ERC20 UTXOs: ${JSONBigNumber.stringify(
      aliceErc20Utxos,
      undefined,
      2
    )}`
  );
}

async function logBalances() {
  const aliceBalanceArray = await childChain.getBalance(aliceAddress);
  const aliceEthObject = aliceBalanceArray.find(
    (i) => i.currency === OmgUtil.transaction.ETH_CURRENCY
  );
  return { aliceEthBalance: aliceEthObject ? aliceEthObject.amount : 0 };
}

async function splitUtxo() {
  showUtxo();
  const { aliceEthBalance } = await logBalances();

  const aliceSplitAmount = new BigNumber(
    web3.utils.toWei(config.alice_eth_transfer_amount, "ether")
  );

  const payments = [
    {
      owner: aliceAddress,
      currency: OmgUtil.transaction.ETH_CURRENCY,
      amount: Number(aliceSplitAmount),
    },
    {
      owner: aliceAddress,
      currency: OmgUtil.transaction.ETH_CURRENCY,
      amount: Number(aliceSplitAmount),
    },
  ];

  const fee = {
    currency: OmgUtil.transaction.ETH_CURRENCY,
  };

  const createdTxn = await childChain.createTransaction({
    owner: aliceAddress,
    payments,
    fee,
  });

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

  // wait for transaction to be recorded by the watcher
  console.log("Waiting for a transaction to be recorded by the watcher...");
  const expectedAmount = aliceSplitAmount.add(new BigNumber(aliceEthBalance));

  await OmgUtil.waitForChildchainBalance({
    childChain,
    address: aliceAddress,
    expectedAmount,
    currency: OmgUtil.transaction.ETH_CURRENCY,
  });

  console.log("-----");
  showUtxo();
}

export { splitUtxo };


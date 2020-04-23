import Web3 from "web3";
import { ChildChain, OmgUtil } from "@omisego/omg-js";
import config from "../../config";

const web3 = new Web3(new Web3.providers.HttpProvider(config.eth_node), null, {
  transactionConfirmationBlocks: 1,
});
const childChain = new ChildChain({
  watcherUrl: config.watcher_url,
  watcherProxyUrl: config.watcher_proxy_url,
  plasmaContractAddress: config.plasmaframework_contract_address,
});
const aliceAddress = config.alice_eth_address;
const bobAddress = config.bob_eth_address;
const erc20ContractAddress = config.erc20_contract_address;

async function logBalances() {
  // childchain balances for Alice
  const alicesBalanceArray = await childChain.getBalance(aliceAddress);
  const aliceChildchainBalance = alicesBalanceArray.map((i) => {
    return {
      currency:
        i.currency === OmgUtil.transaction.ETH_CURRENCY ? "ETH" : i.currency,
      amount:
        i.currency === OmgUtil.transaction.ETH_CURRENCY
          ? `${web3.utils.fromWei(String(i.amount))} ETH`
          : i.amount,
    };
  });
  console.log(
    `Alice's childchain balance: ${JSON.stringify(
      aliceChildchainBalance,
      null,
      2
    )}`
  );

  // ETH rootchain balance for Alice
  const aliceRootchainBalance = await web3.eth.getBalance(aliceAddress);
  const aliceRootchainBalances = [
    {
      currency: "ETH",
      amount: `${web3.utils.fromWei(
        String(aliceRootchainBalance),
        "ether"
      )} ETH`,
    },
  ];

  // ERC20 rootchain balance for Alice
  if (erc20ContractAddress) {
    const aliceRootchainERC20Balance = await OmgUtil.getErc20Balance({
      web3,
      address: aliceAddress,
      erc20Address: erc20ContractAddress,
    });
    aliceRootchainBalances.push({
      currency: erc20ContractAddress,
      amount: aliceRootchainERC20Balance,
    });
  }

  console.log(
    `Alice's rootchain balance: ${JSON.stringify(
      aliceRootchainBalances,
      null,
      2
    )}`
  );

  // childchain balances for Bob
  const bobsBalanceArray = await childChain.getBalance(bobAddress);
  const bobChildchainBalance = bobsBalanceArray.map((i) => {
    return {
      currency:
        i.currency === OmgUtil.transaction.ETH_CURRENCY ? "ETH" : i.currency,
      amount:
        i.currency === OmgUtil.transaction.ETH_CURRENCY
          ? `${web3.utils.fromWei(String(i.amount))} ETH`
          : i.amount,
    };
  });
  console.log(
    `Bob's childchain balance: ${JSON.stringify(bobChildchainBalance, null, 2)}`
  );

  // ETH rootchain balance for Bob
  const bobRootchainBalance = await web3.eth.getBalance(bobAddress);
  const bobRootchainBalances = [
    {
      currency: "ETH",
      amount: `${web3.utils.fromWei(String(bobRootchainBalance), "ether")} ETH`,
    },
  ];

  // ERC20 rootchain balance for Bob
  if (erc20ContractAddress) {
    const bobRootchainERC20Balance = await OmgUtil.getErc20Balance({
      web3,
      address: bobAddress,
      erc20Address: erc20ContractAddress,
    });
    bobRootchainBalances.push({
      currency: erc20ContractAddress,
      amount: bobRootchainERC20Balance,
    });
  }
  console.log(
    `Bob's rootchain balance: ${JSON.stringify(bobRootchainBalances, null, 2)}`
  );
}

export { logBalances };
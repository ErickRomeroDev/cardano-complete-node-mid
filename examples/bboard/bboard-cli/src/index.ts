import { createInterface, type Interface } from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import { WebSocket } from 'ws';
import { webcrypto } from 'crypto';
import {
  type BBoardProviders,
  type PrivateStates,
  BBoardAPI,
  utils,
  type BBoardDerivedState,
  type DeployedBBoardContract,
} from '@midnight-ntwrk/bboard-api';
import { ledger, pureCircuits, type Ledger } from '@midnight-ntwrk/bboard-contract';
import {
  type BalancedTransaction,
  createBalancedTx,
  type MidnightProvider,
  type UnbalancedTransaction,
  type WalletProvider,
} from '@midnight-ntwrk/midnight-js-types';
import { type Wallet } from '@midnight-ntwrk/wallet-api';
import * as Rx from 'rxjs';
import { type CoinInfo, nativeToken, Transaction, type TransactionId } from '@midnight-ntwrk/ledger';
import { Transaction as ZswapTransaction } from '@midnight-ntwrk/zswap';
import { NodeZkConfigProvider } from '@midnight-ntwrk/midnight-js-node-zk-config-provider';
import { type Resource, WalletBuilder } from '@midnight-ntwrk/wallet';
import { indexerPublicDataProvider } from '@midnight-ntwrk/midnight-js-indexer-public-data-provider';
import { httpClientProofProvider } from '@midnight-ntwrk/midnight-js-http-client-proof-provider';
import { type Logger } from 'pino';
import { type Config, StandaloneConfig } from './config.js';
import type { StartedDockerComposeEnvironment, DockerComposeEnvironment } from 'testcontainers';
import { levelPrivateStateProvider } from '@midnight-ntwrk/midnight-js-level-private-state-provider';
import { type ContractAddress } from '@midnight-ntwrk/compact-runtime';
import { toHex } from '@midnight-ntwrk/midnight-js-utils';
import { getLedgerNetworkId, getZswapNetworkId } from '@midnight-ntwrk/midnight-js-network-id';

// @ts-expect-error: It's needed to make Scala.js and WASM code able to use cryptography
globalThis.crypto = webcrypto;

// @ts-expect-error: It's needed to enable WebSocket usage through apollo
globalThis.WebSocket = WebSocket;

export const getBBoardLedgerState = (
  providers: BBoardProviders,
  contractAddress: ContractAddress,
): Promise<Ledger | null> =>
  providers.publicDataProvider
    .queryContractState(contractAddress)
    .then((contractState) => (contractState != null ? ledger(contractState.data) : null));

const DEPLOY_OR_JOIN_QUESTION = `
You can do one of the following:
  1. Deploy a new voting contract
  2. Join an existing voting contract
  3. Exit
Which would you like to do? `;

const deployOrJoin = async (providers: BBoardProviders, rli: Interface, logger: Logger): Promise<BBoardAPI | null> => {
  let api: BBoardAPI | null = null;

  while (true) {
    const choice = await rli.question(DEPLOY_OR_JOIN_QUESTION);
    switch (choice) {
      case '1':
        api = await BBoardAPI.deploy(providers, logger);
        logger.info(`Deployed contract at address: ${api.deployedContractAddress}`);
        return api;
      case '2':
        api = await BBoardAPI.join(providers, await rli.question('What is the contract address (in hex)? '), logger);
        logger.info(`Joined contract at address: ${api.deployedContractAddress}`);
        return api;
      case '3':
        logger.info('Exiting...');
        return null;
      default:
        logger.error(`Invalid choice: ${choice}`);
    }
  }
};

const displayLedgerState = async (
  providers: BBoardProviders,
  deployedBBoardContract: DeployedBBoardContract,
  logger: Logger,
): Promise<void> => {
  const contractAddress = deployedBBoardContract.deployTxData.public.contractAddress;
  const ledgerState = await getBBoardLedgerState(providers, contractAddress);
  if (ledgerState === null) {
    logger.info(`There is no voting board contract deployed at ${contractAddress}`);
  } else {
    const authorizedCommitments = ledgerState.authorizedCommitments;
    const authorizedNullifiers = ledgerState.authorizedNullifiers;
    const restrictedCounter1 = ledgerState.restrictedCounter1;
    const restrictedCounter2 = ledgerState.restrictedCounter2;
    const restrictedCounter3 = ledgerState.restrictedCounter3;

    logger.info(`Current authorizedCommitments is: '${authorizedCommitments}'`);
    logger.info(`Current authorizedNullifiers is: '${authorizedNullifiers}'`);
    logger.info(`Current restrictedCounter1 is: ${restrictedCounter1}`);
    logger.info(`Current restrictedCounter2 is: ${restrictedCounter2}`);
    logger.info(`Current restrictedCounter3 is: ${restrictedCounter3}`);
  }
};

const displayPrivateState = async (providers: BBoardProviders, logger: Logger): Promise<void> => {
  const privateState = await providers.privateStateProvider.get('bboardPrivateState');
  if (privateState === null) {
    logger.info(`There is no existing voting board private state`);
  } else {
    logger.info(`Current secret key is: ${toHex(privateState.secretKey)}`);
  }
};

const MAIN_LOOP_QUESTION = `
You can do one of the following:
  1. Add an authority
  2. Vote for option 1
  3. Vote for option 2
  4. Vote for option 3
  5. Display the current ledger state (known by everyone)
  6. Display the current private state (known only to this DApp instance)  
  8. Exit
Which would you like to do? `;

const mainLoop = async (providers: BBoardProviders, rli: Interface, logger: Logger): Promise<void> => {
  const bboardApi = await deployOrJoin(providers, rli, logger);
  if (bboardApi === null) {
    return;
  }
  let currentState: BBoardDerivedState | undefined;
  const stateObserver = {
    next: (state: BBoardDerivedState) => (currentState = state),
  };
  const subscription = bboardApi.state$.subscribe(stateObserver);
  try {
    while (true) {
      const choice = await rli.question(MAIN_LOOP_QUESTION);
      switch (choice) {
        case '1': {
          const sk = await providers.privateStateProvider.get('bboardPrivateState');
          const pk = pureCircuits.public_key(sk!.secretKey);
          console.log({ sk, pk });
          await bboardApi.add_authority(pk);
          break;
        }
        case '2':
          await bboardApi.increment1();
          break;
        case '3':
          await bboardApi.increment2();
          break;
        case '4':
          await bboardApi.increment3();
          break;
        case '5':
          await displayLedgerState(providers, bboardApi.deployedContract, logger);
          break;
        case '6':
          await displayPrivateState(providers, logger);
          break;             
        default:
          logger.error(`Invalid choice: ${choice}`);
      }
    }
  } finally {
    subscription.unsubscribe();
  }
};

const createWalletAndMidnightProvider = async (wallet: Wallet): Promise<WalletProvider & MidnightProvider> => {
  const state = await Rx.firstValueFrom(wallet.state());
  return {
    coinPublicKey: state.coinPublicKey,
    balanceTx(tx: UnbalancedTransaction, newCoins: CoinInfo[]): Promise<BalancedTransaction> {
      return wallet
        .balanceTransaction(
          ZswapTransaction.deserialize(tx.serialize(getLedgerNetworkId()), getZswapNetworkId()),
          newCoins,
        )
        .then((tx) => wallet.proveTransaction(tx))
        .then((zswapTx) => Transaction.deserialize(zswapTx.serialize(getZswapNetworkId()), getLedgerNetworkId()))
        .then(createBalancedTx);
    },
    submitTx(tx: BalancedTransaction): Promise<TransactionId> {
      return wallet.submitTransaction(tx);
    },
  };
};

const waitForFunds = (wallet: Wallet, logger: Logger) =>
  Rx.firstValueFrom(
    wallet.state().pipe(
      Rx.throttleTime(10_000),
      Rx.tap((state) => {
        const scanned = state.syncProgress?.synced ?? 0n;
        const total = state.syncProgress?.total.toString() ?? 'unknown number';
        logger.info(`Wallet scanned ${scanned} blocks out of ${total}`);
      }),
      Rx.filter((state) => {
        // Let's allow progress only if wallet is close enough
        const synced = state.syncProgress?.synced ?? 0n;
        const total = state.syncProgress?.total ?? 1_000n;
        return total - synced < 100n;
      }),
      Rx.map((s) => s.balances[nativeToken()] ?? 0n),
      Rx.filter((balance) => balance > 0n),
    ),
  );

const buildWalletAndWaitForFunds = async (
  { indexer, indexerWS, node, proofServer }: Config,
  logger: Logger,
  seed: string,
): Promise<Wallet & Resource> => {
  const wallet = await WalletBuilder.buildFromSeed(
    indexer,
    indexerWS,
    proofServer,
    node,
    seed,
    getZswapNetworkId(),
    'warn',
  );
  wallet.start();
  const state = await Rx.firstValueFrom(wallet.state());
  logger.info(`Your wallet seed is: ${seed}`);
  logger.info(`Your wallet address is: ${state.address}`);
  let balance = state.balances[nativeToken()];
  if (balance === undefined || balance === 0n) {
    logger.info(`Your wallet balance is: 0`);
    logger.info(`Waiting to receive tokens...`);
    balance = await waitForFunds(wallet, logger);
  }
  logger.info(`Your wallet balance is: ${balance}`);
  return wallet;
};

const buildFreshWallet = async (config: Config, logger: Logger): Promise<Wallet & Resource> =>
  await buildWalletAndWaitForFunds(config, logger, toHex(utils.randomBytes(32)));

const buildWalletFromSeed = async (config: Config, rli: Interface, logger: Logger): Promise<Wallet & Resource> => {
  const seed = await rli.question('Enter your wallet seed: ');
  return await buildWalletAndWaitForFunds(config, logger, seed);
};

const GENESIS_MINT_WALLET_SEED = '0000000000000000000000000000000000000000000000000000000000000042';

const WALLET_LOOP_QUESTION = `
You can do one of the following:
  1. Build a fresh wallet
  2. Build wallet from a seed
  3. Exit
Which would you like to do? `;

const buildWallet = async (config: Config, rli: Interface, logger: Logger): Promise<(Wallet & Resource) | null> => {
  if (config instanceof StandaloneConfig) {
    return await buildWalletAndWaitForFunds(config, logger, GENESIS_MINT_WALLET_SEED);
  }
  while (true) {
    const choice = await rli.question(WALLET_LOOP_QUESTION);
    switch (choice) {
      case '1':
        return await buildFreshWallet(config, logger);
      case '2':
        return await buildWalletFromSeed(config, rli, logger);
      case '3':
        logger.info('Exiting...');
        return null;
      default:
        logger.error(`Invalid choice: ${choice}`);
    }
  }
};

const mapContainerPort = (env: StartedDockerComposeEnvironment, url: string, containerName: string) => {
  const mappedUrl = new URL(url);
  const container = env.getContainer(containerName);

  mappedUrl.port = String(container.getFirstMappedPort());

  return mappedUrl.toString().replace(/\/+$/, '');
};

export const run = async (config: Config, logger: Logger, dockerEnv?: DockerComposeEnvironment): Promise<void> => {
  const rli = createInterface({ input, output, terminal: true });
  let env;
  if (dockerEnv !== undefined) {
    env = await dockerEnv.up();

    if (config instanceof StandaloneConfig) {
      config.indexer = mapContainerPort(env, config.indexer, 'bboard-indexer');
      config.indexerWS = mapContainerPort(env, config.indexerWS, 'bboard-indexer');
      config.node = mapContainerPort(env, config.node, 'bboard-node');
      config.proofServer = mapContainerPort(env, config.proofServer, 'bboard-proof-server');
    }
  }
  const wallet = await buildWallet(config, rli, logger);
  try {
    if (wallet !== null) {
      const walletAndMidnightProvider = await createWalletAndMidnightProvider(wallet);
      const providers = {
        privateStateProvider: levelPrivateStateProvider<PrivateStates>({
          privateStateStoreName: config.privateStateStoreName,
        }),
        publicDataProvider: indexerPublicDataProvider(config.indexer, config.indexerWS),
        zkConfigProvider: new NodeZkConfigProvider<'add_authority' | 'increment1' | 'increment2' | 'increment3'>(
          config.zkConfigPath,
        ),
        proofProvider: httpClientProofProvider(config.proofServer),
        walletProvider: walletAndMidnightProvider,
        midnightProvider: walletAndMidnightProvider,
      };
      await mainLoop(providers, rli, logger);
    }
  } catch (e) {
    if (e instanceof Error) {
      logger.error(`Found error '${e.message}'`);
      logger.info('Exiting...');
      logger.debug(`${e.stack}`);
    } else {
      throw e;
    }
  } finally {
    try {
      rli.close();
      rli.removeAllListeners();
    } catch (e) {
    } finally {
      try {
        if (wallet !== null) {
          await wallet.close();
        }
      } catch (e) {
      } finally {
        try {
          if (env !== undefined) {
            await env.down();
            logger.info('Goodbye');
            process.exit(0);
          }
        } catch (e) {}
      }
    }
  }
};

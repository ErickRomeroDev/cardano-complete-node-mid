import { type ContractAddress, convert_bigint_to_Uint8Array } from '@midnight-ntwrk/compact-runtime';
import { type Logger } from 'pino';
// import type { BBoardDerivedState, BBoardContract, BBoardProviders, DeployedBBoardContract } from './common-types.js';
// import {
//   type BBoardPrivateState,
//   Contract,
//   createBBoardPrivateState,
//   ledger,
//   pureCircuits,  
//   witnesses,
// } from '@midnight-ntwrk/voting-contract';
import * as utils from './utils/index.js';
import {  deployContract, findDeployedContract } from '@midnight-ntwrk/midnight-js-contracts';
import { combineLatest, map, tap, from, type Observable } from 'rxjs';
import { toHex } from '@midnight-ntwrk/midnight-js-utils';

// const bboardContractInstance: BBoardContract = new Contract(witnesses);

// export interface DeployedBBoardAPI {
//   readonly deployedContractAddress: ContractAddress;
//   readonly state$: Observable<BBoardDerivedState>;

//   post: (message: string) => Promise<void>;
//   takeDown: () => Promise<void>;
// }

// export class BBoardAPI implements DeployedBBoardAPI {
//   /** @internal */
//   private constructor(
//     public readonly deployedContract: DeployedBBoardContract,
//     providers: BBoardProviders,
//     private readonly logger?: Logger,
//   ) {
//     this.deployedContractAddress = deployedContract.deployTxData.public.contractAddress;
//     this.state$ = combineLatest(
//       [
//         // Combine public (ledger) state with...
//         providers.publicDataProvider.contractStateObservable(this.deployedContractAddress, { type: 'latest' }).pipe(
//           map((contractState) => ledger(contractState.data)),         
//         ),       
//         from(providers.privateStateProvider.get('bboardPrivateState') as Promise<BBoardPrivateState>),
//       ],     
//       (ledgerState, privateState) => {
//         const hashedSecretKey = pureCircuits.(
//           privateState.secretKey,
//           convert_bigint_to_Uint8Array(32, ledgerState.restrictedCounter1),
//         );

//         return {
//           restrictedCounter1: ledgerState.restrictedCounter1,
//           restrictedCounter2: ledgerState.restrictedCounter2,
//           restrictedCounter3: ledgerState.restrictedCounter3,

//           hasVoted: true,
//           hasSubscribed: true,
          
//           isOwner: toHex(ledgerState.poster) === toHex(hashedSecretKey),
//         };
//       },
//     );
//   }

//   readonly deployedContractAddress: ContractAddress;
//   readonly state$: Observable<BBoardDerivedState>;

//   async post(message: string): Promise<void> {
//     this.logger?.info(`postingMessage: ${message}`);

//     const txData =    
//     await this.deployedContract.callTx 
//       .post(message); 

//     this.logger?.trace({
//       transactionAdded: {
//         circuit: 'post',
//         txHash: txData.public.txHash,
//         blockHeight: txData.public.blockHeight,
//       },
//     });
//   }

//   async takeDown(): Promise<void> {
//     this.logger?.info('takingDownMessage');

//     const txData =
      
//       await this.deployedContract.callTx 
//         .take_down(); 

//     this.logger?.trace({
//       transactionAdded: {
//         circuit: 'take_down',
//         txHash: txData.public.txHash,
//         blockHeight: txData.public.blockHeight,
//       },
//     });
//   }

//   static async deploy(providers: BBoardProviders, logger?: Logger): Promise<BBoardAPI> {
//     logger?.info('deployContract');
    
//     const deployedBBoardContract = await deployContract(providers, {
//       privateStateKey: 'bboardPrivateState',
//       contract: bboardContractInstance,
//       initialPrivateState: await BBoardAPI.getPrivateState(providers), 
//       args: ['']
//     });

//     logger?.trace({
//       contractDeployed: {
//         finalizedDeployTxData: deployedBBoardContract.deployTxData.public,
//       },
//     });

//     return new BBoardAPI(deployedBBoardContract, providers, logger);
//   }
 
//   static async join(providers: BBoardProviders, contractAddress: ContractAddress, logger?: Logger): Promise<BBoardAPI> {
//     logger?.info({
//       joinContract: {
//         contractAddress,
//       },
//     });

//     const deployedBBoardContract = await findDeployedContract(
//       providers,
//       {
//         contractAddress,
//         contract: bboardContractInstance,
//         privateStateKey: 'bboardPrivateState',
//         initialPrivateState: await BBoardAPI.getPrivateState(providers),
//       }
//     );

//     logger?.trace({
//       contractJoined: {
//         finalizedDeployTxData: deployedBBoardContract.deployTxData.public,
//       },
//     });

//     return new BBoardAPI(deployedBBoardContract, providers, logger);
//   }

//   private static async getPrivateState(providers: BBoardProviders): Promise<BBoardPrivateState> {
//     const existingPrivateState = await providers.privateStateProvider.get('bboardPrivateState');

//     return existingPrivateState ?? createBBoardPrivateState(utils.randomBytes(32));
//   }
// }

// export * as utils from './utils/index.js';

// export * from './common-types.js';

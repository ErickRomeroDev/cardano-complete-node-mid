/**
 * Bulletin board common types and abstractions.
 *
 * @module
 */

import { type MidnightProviders } from '@midnight-ntwrk/midnight-js-types';
import { type FoundContract } from '@midnight-ntwrk/midnight-js-contracts';
import type { BBoardPrivateState, Contract, Witnesses } from '@midnight-ntwrk/bboard-contract';


export type PrivateStates = {  
  readonly bboardPrivateState: BBoardPrivateState;
};

export type BBoardContract = Contract<BBoardPrivateState, Witnesses<BBoardPrivateState>>;

export type BBoardCircuitKeys = Exclude<keyof BBoardContract['impureCircuits'], number | symbol>;

export type BBoardProviders = MidnightProviders<BBoardCircuitKeys, PrivateStates>;

export type DeployedBBoardContract = FoundContract<BBoardPrivateState, BBoardContract>;

export type BBoardDerivedState = {  
  readonly restrictedCounter1: bigint; 
  readonly restrictedCounter2: bigint; 
  readonly restrictedCounter3: bigint;   
};

import { Ledger } from './managed/bboard/contract/index.cjs';
import { MerkleTreePath, WitnessContext } from '@midnight-ntwrk/compact-runtime';

export type BBoardPrivateState = {  
  readonly secretKey: Uint8Array; 
};

export const createBBoardPrivateState = (secretKey: Uint8Array) => ({  
  secretKey, 
});

export const witnesses = {
  secret_key: ({ privateState }: WitnessContext<Ledger, BBoardPrivateState>): [BBoardPrivateState, Uint8Array] => [    
    privateState, 
    privateState.secretKey, 
  ],
  find_auth_path: ({ledger}: WitnessContext<Ledger, BBoardPrivateState>, pk: Uint8Array): MerkleTreePath<Uint8Array> => 
    ledger.authorizedCommitments.findPathForLeaf(pk)!
  
};

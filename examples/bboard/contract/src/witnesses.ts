import { Ledger } from './managed/bboard/contract/index.cjs';
import { WitnessContext } from '@midnight-ntwrk/compact-runtime';

type MerkleTreePath = { leaf: Uint8Array; path: { sibling: { field: bigint }; goes_left: boolean }[] };

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
  find_auth_path: (
    { privateState, ledger }: WitnessContext<Ledger, BBoardPrivateState>,
    pk: Uint8Array,
  ): [BBoardPrivateState, MerkleTreePath] => [privateState, ledger.authorizedCommitments.findPathForLeaf(pk)!],
};

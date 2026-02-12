import { Aegis } from '@midnight-ntwrk/aegis-contract';
import type { MidnightProviders } from '@midnight-ntwrk/midnight-js-types';
import type { DeployedContract, FoundContract } from '@midnight-ntwrk/midnight-js-contracts';
import type { ImpureCircuitId } from '@midnight-ntwrk/compact-js';

export type AegisPrivateState = any;

export type AegisCircuits = ImpureCircuitId<Aegis.Contract<AegisPrivateState>>;

export const AegisPrivateStateId = 'aegisPrivateState';

export type AegisProviders = MidnightProviders<AegisCircuits, typeof AegisPrivateStateId, AegisPrivateState>;

export type AegisContract = Aegis.Contract<AegisPrivateState>;

export type DeployedAegisContract = DeployedContract<AegisContract> | FoundContract<AegisContract>;

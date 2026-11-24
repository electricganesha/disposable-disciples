import type { EnvironmentDefinition } from "./types";
import { eldritchEnv } from "./eldritch";
import { voidEnv } from "./void";
import { boneEnv } from "./bone";
import { lavaEnv } from "./lava";

const environments: EnvironmentDefinition[] = [
  eldritchEnv,
  voidEnv,
  boneEnv,
  lavaEnv
];

export const ENVIRONMENT_REGISTRY = new Map<string, EnvironmentDefinition>(
  environments.map(e => [e.id, e])
);

export const getEnvironment = (id: string): EnvironmentDefinition => {
  return ENVIRONMENT_REGISTRY.get(id) || eldritchEnv;
};

export type { EnvironmentDefinition } from "./types";

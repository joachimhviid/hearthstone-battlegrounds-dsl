import type { ValidationAcceptor, ValidationChecks } from "langium";
import type {
  HearthstoneBattlegroundsDslAstType,
  Minion,
  Tribe,
  TribePlural,
} from "./generated/ast.js";
import type { HearthstoneBattlegroundsDslServices } from "./hearthstone-battlegrounds-dsl-module.js";

/**
 * Register custom validation checks.
 */
export function registerValidationChecks(
  services: HearthstoneBattlegroundsDslServices,
) {
  const registry = services.validation.ValidationRegistry;
  const validator = services.validation.HearthstoneBattlegroundsDslValidator;
  const checks: ValidationChecks<HearthstoneBattlegroundsDslAstType> = {
    Minion: [validator.checkMinionTierRange, validator.checkTribe],
  };
  registry.register(checks, validator);
}

/**
 * Implementation of custom validations.
 */
export class HearthstoneBattlegroundsDslValidator {
  checkMinionTierRange(minion: Minion, accept: ValidationAcceptor): void {
    if (minion.tier < 1 || minion.tier > 6) {
      accept("error", "Tier must be between 1 and 6.", {
        node: minion,
        property: "tier",
      });
    }
  }

  checkTribe(minion: Minion, accept: ValidationAcceptor): void {
    if (minion.tribes.length !== 0 && !minion.tribes.every(isNormalizedTribe)) {
      accept("error", "Minion tribes must use the singular form of tribes.", {
        node: minion,
        property: "tribes",
      });
    }
    if (minion.tribes.length > 2) {
        accept("error", "Minions can have a maximum of 2 tribes", {
        node: minion,
        property: "tribes",
      });
    }
    if (minion.tribes.includes("All") && minion.tribes.length > 1) {
        accept("error", `"All" cannot be combined with other tribes.`, {
        node: minion,
        property: "tribes",
      });
    }
  }
}

type NormalizedTribe = Exclude<Tribe, TribePlural>;

function isNormalizedTribe(tribe: string): tribe is NormalizedTribe {
  const normalizedTribes = [
    "All",
    "Beast",
    "Demon",
    "Dragon",
    "Elemental",
    "Mech",
    "Murloc",
    "Naga",
    "Pirate",
    "Quilboar",
    "Undead",
  ];

  return normalizedTribes.includes(tribe);
}

/**
 * Normalize tribe names from plural to singular form.
 */
export function normalizeTribe(tribe: Tribe | TribePlural): NormalizedTribe {
  const singularMap: Record<string, NormalizedTribe> = {
    Beasts: "Beast",
    Demons: "Demon",
    Dragons: "Dragon",
    Elementals: "Elemental",
    Mechs: "Mech",
    Murlocs: "Murloc",
    Nagas: "Naga",
    Pirates: "Pirate",
    Quilboars: "Quilboar",
    Undeads: "Undead",
  };
  return singularMap[tribe] || tribe;
}

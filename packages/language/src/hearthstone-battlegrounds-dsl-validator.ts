import type { ValidationAcceptor, ValidationChecks } from 'langium'
import type { HearthstoneBattlegroundsDslAstType, Minion, Tribe, TribePlural, Trigger } from './generated/ast.js'
import { isPlayerActionCondition } from './generated/ast.js'
import type { HearthstoneBattlegroundsDslServices } from './hearthstone-battlegrounds-dsl-module.js'

/**
 * Register custom validation checks.
 */
export function registerValidationChecks(services: HearthstoneBattlegroundsDslServices) {
  const registry = services.validation.ValidationRegistry
  const validator = services.validation.HearthstoneBattlegroundsDslValidator
  const checks: ValidationChecks<HearthstoneBattlegroundsDslAstType> = {
    Minion: [validator.checkMinionTierRange, validator.checkStats, validator.checkTribe, validator.checkAction],
  }
  registry.register(checks, validator)
}

/**
 * Implementation of custom validations.
 */
export class HearthstoneBattlegroundsDslValidator {
  checkMinionTierRange(minion: Minion, accept: ValidationAcceptor): void {
    if (minion.tier < 1 || minion.tier > 6) {
      accept('error', 'Tier must be between 1 and 6.', {
        node: minion,
        property: 'tier',
      })
    }
  }

  checkTribe(minion: Minion, accept: ValidationAcceptor): void {
    if (minion.tribes.length !== 0 && !minion.tribes.every(isNormalizedTribe)) {
      accept('error', 'Minion tribes must use the singular form of tribes.', {
        node: minion,
        property: 'tribes',
      })
    }
    if (minion.tribes.length > 2) {
      accept('error', 'Minions can have a maximum of 2 tribes', {
        node: minion,
        property: 'tribes',
      })
    }
    if (minion.tribes.includes('All') && minion.tribes.length > 1) {
      accept('error', `"All" cannot be combined with other tribes.`, {
        node: minion,
        property: 'tribes',
      })
    }
  }

  checkAction(minion: Minion, accept: ValidationAcceptor): void {
    if (minion.effects.length !== 0) {
      minion.effects.map((effect) => {
        effect.actions.map((action) => {
          if (action.$type === 'GainGoldAction') {
            if (
              effect.trigger.$type === 'SimpleTrigger' &&
              !['Start of Turn', 'Battlecry'].includes(effect.trigger.type)
            ) {
              accept('warning', `Useless gain gold action. Gold is never usable by player.`, {
                node: minion,
                property: 'effects',
              })
            }
          }
          if (action.$type === 'SummonAction') {
            if (action.amount && action.amount < 0) {
              accept('error', `Cannot summon a negative amount.`, {
                node: minion,
                property: 'effects',
              })
            }
            if (action.minion.ref) {
              if (!action.minion.ref.token && isTavernOnlyTrigger(effect.trigger)) {
                accept('warning', `Summon is not a token. Is this intentional?`, {
                  node: minion,
                  property: 'effects',
                })
              }
              if (
                effect.trigger.$type === 'SimpleTrigger' &&
                effect.trigger.type === 'Deathrattle' &&
                action.minion.ref.name === minion.name
              ) {
                accept(
                  'error',
                  `Infinite loop detected, minion summons itself on death. Try using the Reborn keyword.`,
                  {
                    node: minion,
                    property: 'effects',
                  },
                )
              }
            }
          }
        })
      })
    }
  }

  checkStats(minion: Minion, accept: ValidationAcceptor): void {
    if (minion.attack < 0) {
      accept('error', `Minion cannot have negative attack.`, {
        node: minion,
        property: 'attack',
      })
    }
    if (minion.health <= 0) {
      accept('error', `Minion must have more than 0 health.`, {
        node: minion,
        property: 'health',
      })
    }
  }
}

type NormalizedTribe = Exclude<Tribe, TribePlural>

function isNormalizedTribe(tribe: string): tribe is NormalizedTribe {
  const normalizedTribes = [
    'All',
    'Beast',
    'Demon',
    'Dragon',
    'Elemental',
    'Mech',
    'Murloc',
    'Naga',
    'Pirate',
    'Quilboar',
    'Undead',
  ]

  return normalizedTribes.includes(tribe)
}

/**
 * Normalize tribe names from plural to singular form.
 */
export function normalizeTribe(tribe: Tribe | TribePlural): NormalizedTribe {
  const singularMap: Record<string, NormalizedTribe> = {
    Beasts: 'Beast',
    Demons: 'Demon',
    Dragons: 'Dragon',
    Elementals: 'Elemental',
    Mechs: 'Mech',
    Murlocs: 'Murloc',
    Nagas: 'Naga',
    Pirates: 'Pirate',
    Quilboars: 'Quilboar',
    Undeads: 'Undead',
  }
  return singularMap[tribe] || tribe
}

function isTavernOnlyTrigger(trigger: Trigger): boolean {
  if (trigger.$type === 'SimpleTrigger') {
    if (['Start of Combat', 'Rally'].includes(trigger.type)) {
      return false
    }
  } else {
    if (!isPlayerActionCondition(trigger)) {
      return false
    }
  }
  return true
}

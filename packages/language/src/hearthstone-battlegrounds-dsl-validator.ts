import type { ValidationAcceptor, ValidationChecks } from 'langium';
import type { HearthstoneBattlegroundsDslAstType, Minion } from './generated/ast.js';
import type { HearthstoneBattlegroundsDslServices } from './hearthstone-battlegrounds-dsl-module.js';

/**
 * Register custom validation checks.
 */
export function registerValidationChecks(services: HearthstoneBattlegroundsDslServices) {
    const registry = services.validation.ValidationRegistry;
    const validator = services.validation.HearthstoneBattlegroundsDslValidator;
    const checks: ValidationChecks<HearthstoneBattlegroundsDslAstType> = {
        Minion: validator.checkMinionTierRange
    };
    registry.register(checks, validator);
}

/**
 * Implementation of custom validations.
 */
export class HearthstoneBattlegroundsDslValidator {

    checkMinionTierRange(minion: Minion, accept: ValidationAcceptor): void {
        if (minion.tier < 1 || minion.tier > 6) {
            accept('error', 'Tier must be between 1 and 6.', { node: minion, property: 'tier' });
        }
    }

}

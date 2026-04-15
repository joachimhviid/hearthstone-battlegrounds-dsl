import type { ValidationAcceptor, ValidationChecks } from 'langium';
import type { HearthstoneBattlegroundsDslAstType, Person } from './generated/ast.js';
import type { HearthstoneBattlegroundsDslServices } from './hearthstone-battlegrounds-dsl-module.js';

/**
 * Register custom validation checks.
 */
export function registerValidationChecks(services: HearthstoneBattlegroundsDslServices) {
    const registry = services.validation.ValidationRegistry;
    const validator = services.validation.HearthstoneBattlegroundsDslValidator;
    const checks: ValidationChecks<HearthstoneBattlegroundsDslAstType> = {
        Person: validator.checkPersonStartsWithCapital
    };
    registry.register(checks, validator);
}

/**
 * Implementation of custom validations.
 */
export class HearthstoneBattlegroundsDslValidator {

    checkPersonStartsWithCapital(person: Person, accept: ValidationAcceptor): void {
        if (person.name) {
            const firstChar = person.name.substring(0, 1);
            if (firstChar.toUpperCase() !== firstChar) {
                accept('warning', 'Person name should start with a capital.', { node: person, property: 'name' });
            }
        }
    }

}

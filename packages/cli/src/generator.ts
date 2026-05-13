import type { Model, Minion } from 'hearthstone-battlegrounds-dsl-language';
import { expandToNode, /*joinToNode,*/ toString } from 'langium/generate';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { extractDestinationAndName } from './util.js';

export function generateJavaScript(model: Model, filePath: string, destination: string | undefined): string {
    const data = extractDestinationAndName(filePath, destination);
    const generatedFilePath = `${path.join(data.destination, data.name)}.js`;

    const fileNode = expandToNode`
        "use strict";

    `.appendNewLineIfNotEmpty();
    // ${joinToNode(model.greetings, greeting => `console.log('Hello, ${greeting.person.ref?.name}!');`, { appendNewLineIfNotEmpty: true })}

    if (!fs.existsSync(data.destination)) {
        fs.mkdirSync(data.destination, { recursive: true });
    }
    fs.writeFileSync(generatedFilePath, toString(fileNode));
    return generatedFilePath;
}

export function generateGdScript(model: Model, filePath: string, destination: string | undefined): string {
    const data = extractDestinationAndName(filePath, destination);
    
    const generatedFilePaths = model.minions.map((minion) => {
        const generatedFilePath = `${path.join(data.destination, minion.name)}.gd`
        const fileNode = expandToNode`
            class_name ${minion.name}
            extends MinionData


            func _init():
                name = "${minion.minionName}"
                tier = ${minion.tier}
                attack = ${minion.attack}
                health = ${minion.health}
                tribes = [${minion.tribes.map((t) => `Tribe.${t.toUpperCase()}`).join(', ')}]
                keywords = [${minion.keywords.map((kw) => `Keyword.${kw.toUpperCase()}`).join(', ')}]
                token = ${minion.token}
                description = "${generateCardDescription(minion)}"
        `.appendNewLineIfNotEmpty()

        if (!fs.existsSync(data.destination)) {
            fs.mkdirSync(data.destination, { recursive: true });
        }
        fs.writeFileSync(generatedFilePath, toString(fileNode));

        return generatedFilePath
    })


    return generatedFilePaths.join()
}

function generateCardDescription(minion: Minion): string {
    const cardAttributes: string[] = []

    minion.effects.map((effect) => {
        if (effect.trigger.$type === 'SimpleTrigger') {
            switch (effect.trigger.type) {
                case 'Battlecry':
                case 'Deathrattle':
                case 'Rally':
                    cardAttributes.push(`${effect.trigger.type}:`)
                    break;
                case 'Start of Combat':
                    cardAttributes.push('Start of Combat:')
                    break
                case 'End of Turn':
                    cardAttributes.push('At the end of your turn,')
                    break
                case 'Start of Turn':
                    cardAttributes.push('At the start of your turn,')
                    break
                default:
                    break;
            }
        } else {
            cardAttributes.push(effect.trigger.time)
            // TODO: flesh this out
            // cardAttributes.push(effect.trigger.condition.description)
        }
        effect.actions.map((action) => {
            switch (action.$type) {
                case 'SummonAction':
                    const quantifier = action.amount ? String(action.amount) : 'a'
                    if (!action.minion.ref) {
                        throw new Error('Minion reference not found for SummonAction')
                    }
                    cardAttributes.push(`Summon ${quantifier} ${action.minion.ref.attack}/${action.minion.ref.health} ${action.minion.ref.minionName}`)
                    break;
                case 'DamageAction':
                case 'StatModification':
                default:
                    break;
            }
        })
    })
    return cardAttributes.join(' ')
}

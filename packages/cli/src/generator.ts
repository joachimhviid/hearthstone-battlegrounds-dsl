import type { Model, Minion, Target, Effect } from 'hearthstone-battlegrounds-dsl-language'
import { expandToNode, /*joinToNode,*/ toString } from 'langium/generate'
import * as fs from 'node:fs'
import * as path from 'node:path'
import { extractDestinationAndName } from './util.js'

export function generateJavaScript(model: Model, filePath: string, destination: string | undefined): string {
  const data = extractDestinationAndName(filePath, destination)
  const generatedFilePath = `${path.join(data.destination, data.name)}.js`

  const fileNode = expandToNode`
        "use strict";

    `.appendNewLineIfNotEmpty()
  // ${joinToNode(model.greetings, greeting => `console.log('Hello, ${greeting.person.ref?.name}!');`, { appendNewLineIfNotEmpty: true })}

  if (!fs.existsSync(data.destination)) {
    fs.mkdirSync(data.destination, { recursive: true })
  }
  fs.writeFileSync(generatedFilePath, toString(fileNode))
  return generatedFilePath
}

export function generateGdScript(model: Model, filePath: string, destination: string | undefined): string {
  const data = extractDestinationAndName(filePath, destination)

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
    minion.effects.map((effect) => {

      // fileNode.appendTemplateIf(effect.trigger.$type === 'SimpleTrigger')`

      // `
    })

    if (!fs.existsSync(data.destination)) {
      fs.mkdirSync(data.destination, { recursive: true })
    }
    fs.writeFileSync(generatedFilePath, toString(fileNode))

    return generatedFilePath
  })

  return generatedFilePaths.join()
}

function generateEffect(effect: Effect) {
  if (effect.trigger.$type === 'SimpleTrigger') {
      switch (effect.trigger.type) {
        case 'Battlecry':
        case 'Deathrattle':
        case 'Rally':
          // cardAttributes.push(`${effect.trigger.type}:`)
          break
        case 'Start of Combat':
          // cardAttributes.push('Start of Combat:')
          break
        case 'End of Turn':
          // cardAttributes.push('At the end of your turn,')
          break
        case 'Start of Turn':
          // cardAttributes.push('At the start of your turn,')
          break
        default:
          break
      }
    }
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
          break
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
          break
      }
    } else {
      // EventTrigger: build a readable phrase from time + condition
      const evt = effect.trigger
      const time = evt.time
      const cond = evt.condition
      let condText = ''
      switch (cond.$type) {
        case 'PlayerPlayCondition':
          condText = `you ${cond.action} ${targetToString(cond.target)}`
          break
        case 'PlayerSellCondition':
          condText = `you sell ${targetToString(cond.target)}`
          break
        case 'PlayerTriggerKeywordCondition':
          condText = `you trigger a ${cond.keyword}`
          break
        case 'MinionDamageCondition':
          condText = `${targetToString(cond.target)} takes damage`
          break
        case 'MinionStatGainCondition':
          condText = `${targetToString(cond.target)} gains ${cond.stat}`
          break
        default:
          condText = ''
      }
      if (condText) cardAttributes.push(`${time} ${condText}`)
      else cardAttributes.push(time)
    }
    effect.actions.map((action) => {
      switch (action.$type) {
        case 'SummonAction':
          const quantifier = action.amount ? String(action.amount) : 'a'
          if (!action.minion.ref) {
            throw new Error('Minion reference not found for SummonAction')
          }
          cardAttributes.push(
            `summon ${quantifier} ${action.minion.ref.attack}/${action.minion.ref.health} ${action.minion.ref.minionName}`,
          )
          break
        case 'DamageAction':
          cardAttributes.push(`deal ${action.amount} damage to ${targetToString(action.target)}`)
          break
        case 'GainGoldAction':
          cardAttributes.push(`gain ${action.amount} gold`)
          break
        case 'GainAttributeAction':
          action.modifications.map((mod) => {
            switch (mod.$type) {
              case 'KeywordModification':
                cardAttributes.push(`this gains ${mod.keyword}`)
                break
              case 'StatModification':
                const atk = mod.attack ?? 0
                const hp = mod.health ?? 0
                cardAttributes.push(`this gains +${atk}/+${hp}`)
                break
              default:
                break
            }
          })
          break
        case 'GetGenericMinion':
          cardAttributes.push(
            `get ${action.amount} ${action.random ? 'random ' : ''} ${targetToString(action.subject)}`,
          )
          break
        case 'GetSpecificMinion':
          if (!action.minion.ref) throw new Error('Minion reference not found for GetSpecificMinion')
          cardAttributes.push(`get ${action.amount} ${action.minion.ref.minionName}`)
          break
        case 'GrantAttributeAction':
          const targetStr = targetToString(action.target)
          action.modifications.map((mod) => {
            switch (mod.$type) {
              case 'KeywordModification':
                cardAttributes.push(`give ${targetStr} ${mod.keyword}`)
                break
              case 'StatModification':
                cardAttributes.push(`give ${targetStr} +${mod.attack}/+${mod.health}`)
                break
              default:
                break
            }
          })
          break
        default:
          break
      }
    })
  })
  return cardAttributes.join(' ')
}

function targetToString(target: Target): string {
  const parts: string[] = []

  // quantifier
  if (target.quantifier) {
    if (target.quantifier.all) {
      parts.push('all')
      if (target.quantifier.excludeSelf) {
        parts.push('other')
      }
    } else if (target.quantifier.another) {
      parts.push('another')
    } else if (target.quantifier.one) {
      parts.push('a')
    }
  }

  // affiliation
  if (target.affiliation) {
    if (target.affiliation !== 'tavern') parts.push(target.affiliation)
  }

  // tier filter
  if (target.tierFilter) {
    parts.push(`tier ${target.tierFilter.tier}`)
  }

  parts.push(target.type)

  if (target.affiliation && target.affiliation === 'tavern') {
    parts.push('in the tavern')
  }

  // keyword filter
  if (target.keywordFilter) {
    parts.push(`with ${target.keywordFilter.keyword}`)
  }

  return parts.join(' ')
}

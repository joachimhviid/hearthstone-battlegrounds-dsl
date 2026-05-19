import type { Model, Minion, Target } from 'hearthstone-battlegrounds-dsl-language'
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

    if (!fs.existsSync(data.destination)) {
      fs.mkdirSync(data.destination, { recursive: true })
    }
    fs.writeFileSync(generatedFilePath, toString(fileNode))

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
          cardAttributes.push(
            `Summon ${quantifier} ${action.minion.ref.attack}/${action.minion.ref.health} ${action.minion.ref.minionName}`,
          )
          break
        case 'DamageAction':
          cardAttributes.push(`Deal ${action.amount} damage to ${targetToString(action.target)}`)
          break
        case 'GainGoldAction':
          cardAttributes.push(`Gain ${action.amount} gold`)
          break
        case 'GainAttributeAction':
          action.modifications.map((mod) => {
            switch (mod.$type) {
              case 'KeywordModification':
                cardAttributes.push(`Gains ${mod.keyword}`)
                break
              case 'StatModification':
                const atk = mod.attack ?? 0
                const hp = mod.health ?? 0
                cardAttributes.push(`Gains ${atk}/${hp}`)
                break
              default:
                break
            }
          })
          break
        case 'GetGenericMinion':
          cardAttributes.push(
            `Get ${action.amount} ${action.random ? 'random ' : ''}minion(s) ${targetToString(action.subject)}`,
          )
          break
        case 'GetSpecificMinion':
          if (!action.minion.ref) throw new Error('Minion reference not found for GetSpecificMinion')
          cardAttributes.push(`Get ${action.amount} ${action.minion.ref.minionName}`)
          break
        case 'GrantAttributeAction':
          const targetStr = targetToString(action.target)
          action.modifications.map((mod) => {
            switch (mod.$type) {
              case 'KeywordModification':
                cardAttributes.push(`Give ${targetStr} ${mod.keyword}`)
                break
              case 'StatModification':
                cardAttributes.push(`Give ${targetStr} ${mod.attack}/${mod.health}`)
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
    if (target.quantifier.all) parts.push('all')
    else if (target.quantifier.another) parts.push('another')
    else if (target.quantifier.one) parts.push('one')
  }

  // affiliation
  if (target.affiliation) {
    if (target.affiliation === 'tavern') parts.push('from the tavern')
    else parts.push(target.affiliation)
  }

  // type (it, this, minion(s), or tribe)
  let typeStr = ''
  if (target.type === 'it' || target.type === 'this') {
    typeStr = target.type
  } else if (target.type === 'minion' || target.type === 'minions') {
    typeStr = target.type
  } else {
    // tribe (could be singular or plural)
    typeStr = `${String(target.type).toLowerCase()}`
    // make readable
    if (!typeStr.endsWith('s')) typeStr = `${typeStr} minion`
  }

  if (typeStr) parts.push(typeStr)

  // keyword filter
  if (target.keywordFilter) {
    parts.push(`with ${target.keywordFilter.keyword}`)
  }

  // tier filter
  if (target.tierFilter) {
    parts.push(`(tier ${target.tierFilter.tier})`)
  }

  // assemble
  // If we used a tavern affiliation we already added 'from the tavern' which reads better at end —
  // try to produce a compact phrase
  return parts.join(' ').replace(/\s+from the tavern/, ' from the tavern')
}

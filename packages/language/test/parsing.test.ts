import { beforeAll, describe, expect, test } from 'vitest'
import { EmptyFileSystem, type LangiumDocument } from 'langium'
import { parseHelper } from 'langium/test'
import type { Action, Model, SummonAction } from 'hearthstone-battlegrounds-dsl-language'
import { createHearthstoneBattlegroundsDslServices, isModel } from 'hearthstone-battlegrounds-dsl-language'

let services: ReturnType<typeof createHearthstoneBattlegroundsDslServices>
let parse: ReturnType<typeof parseHelper<Model>>
let document: LangiumDocument<Model> | undefined

beforeAll(async () => {
  services = createHearthstoneBattlegroundsDslServices(EmptyFileSystem)
  parse = parseHelper<Model>(services.HearthstoneBattlegroundsDsl)

  // activate the following if your linking test requires elements from a built-in library, for example
  // await services.shared.workspace.WorkspaceManager.initializeWorkspace([]);
})

describe('Parsing tests', () => {
  test('parse minion with numeric tier', async () => {
    document = await parse(`
            Minion AlleyCat {
                name "Alley Cat"
                tier 1
                attack 1
                health 1
                tribes Beast
            }
        `)

    expect(checkDocumentValid(document)).toBeUndefined()
    expect(document.parseResult.value?.minions[0]).toMatchObject({
      name: 'AlleyCat',
      minionName: 'Alley Cat',
      tier: 1,
      attack: 1,
      health: 1,
      tribes: ['Beast'],
    })
  })

  test('parse summon is valid token', async () => {
    document = await parse(`
            Minion AlleyCat {
                name "Alley Cat"
                tier 1
                attack 1
                health 1
                tribes Beast
                Battlecry summon TabbyCat
            }

            Minion token TabbyCat {
                name "Tabby Cat"
                tier 1
                attack 1
                health 1
                tribes Beast
            }
        `)

    expect(checkDocumentValid(document)).toBeUndefined()
    expect(document.parseResult.value.minions[1]).toMatchObject({
      name: 'TabbyCat',
      minionName: 'Tabby Cat',
      token: true,
    })
    document.parseResult.value.minions[0].effects.map((effect) => {
      effect.actions.map((action) => {
        expect(action.$type).toBe('SummonAction')
        if (actionIsSummonAction(action)) {
          expect(action.minion.error).toBeUndefined()
          expect(action.minion.ref?.name).toBe('TabbyCat')
          expect(action.minion.ref?.token).toBe(true)
        }
      })
    })
  })

  test('parse GrantAttributeAction with stat and keyword modifications', async () => {
    document = await parse(`
            Minion AlleyCat {
                name "Alley Cat"
                tier 1
                attack 1
                health 1
                tribes Beast
                Battlecry give a friendly Beast (+1/+1, Reborn)
            }
        `)

    expect(checkDocumentValid(document)).toBeUndefined()
    const effect = document.parseResult.value?.minions[0].effects[0]
    expect(effect).toBeDefined()
    expect(effect?.actions.length).toBe(1)
    const action = effect?.actions[0]
    expect(action?.$type).toBe('GrantAttributeAction')
    if (action?.$type === 'GrantAttributeAction') {
      expect(action.modifications.length).toBe(2)
      expect(action.modifications[0].$type).toBe('StatModification')
      expect(action.modifications[1].$type).toBe('KeywordModification')
    }
  })

  test('parse SprightlyScarab with formatted code', async () => {
    document = await parse(`
            Minion SprightlyScarab {
                name "Sprightly Scarab"
                tier 3
                attack 3
                health 1
                tribes Beast
                Battlecry give a friendly Beast (+1/+1, Reborn)
            }
        `)

    const errors = checkDocumentValid(document)
    if (errors) {
      console.log('Parse errors:', errors)
    }
    expect(errors).toBeUndefined()
  })

  test('parse Tad', async () => {
    document = await parse(`
            Minion Tad {
                name "Tad"
                tier 2
                attack 2
                health 2
                tribes Murloc
                Whenever you sell this get 1 random Murloc
            }
        `)

    const errors = checkDocumentValid(document)
    // console.log(document.parseResult.value.minions[0].effects[0].trigger.condition)
    if (errors) {
      console.log('Parse errors:', errors)
    }
    expect(errors).toBeUndefined()
  })
})

function checkDocumentValid(document: LangiumDocument): string | undefined {
  return (
    (document.parseResult.parserErrors.length &&
      `Parser errors:\n  ${document.parseResult.parserErrors.map((e) => e.message).join('\n  ')}`) ||
    (document.parseResult.value === undefined && `ParseResult is 'undefined'.`) ||
    (!isModel(document.parseResult.value) &&
      `Root AST object is a ${document.parseResult.value.$type}, expected a 'Model'.`) ||
    undefined
  )
}

function actionIsSummonAction(action: Action): action is SummonAction {
  return action.$type === 'SummonAction'
}

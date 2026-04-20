import { beforeAll, describe, expect, test } from "vitest";
import { EmptyFileSystem, type LangiumDocument } from "langium";
import { expandToString as s } from "langium/generate";
import { parseHelper } from "langium/test";
import type { Diagnostic } from "vscode-languageserver-types";
import type { Model } from "hearthstone-battlegrounds-dsl-language";
import { createHearthstoneBattlegroundsDslServices, isModel } from "hearthstone-battlegrounds-dsl-language";

let services: ReturnType<typeof createHearthstoneBattlegroundsDslServices>;
let parse:    ReturnType<typeof parseHelper<Model>>;
let document: LangiumDocument<Model> | undefined;

beforeAll(async () => {
    services = createHearthstoneBattlegroundsDslServices(EmptyFileSystem);
    const doParse = parseHelper<Model>(services.HearthstoneBattlegroundsDsl);
    parse = (input: string) => doParse(input, { validation: true });

    // activate the following if your linking test requires elements from a built-in library, for example
    // await services.shared.workspace.WorkspaceManager.initializeWorkspace([]);
});

describe('Validating', () => {

    test('accepts a valid tier range', async () => {
        document = await parse(`
            Minion AlleyCat {
              name "Alley Cat"
              tier 1
              attack 1
              health 1
            }
        `);

        expect(
            checkDocumentValid(document) || document?.diagnostics?.map(diagnosticToString)?.join('\n')
        ).toHaveLength(0);
    });

    test('rejects tiers outside 1 to 6', async () => {
        document = await parse(`
            Minion AlleyCat {
              name "Alley Cat"
              tier 7
              attack 1
              health 1
            }
        `);

        expect(
            checkDocumentValid(document) || document?.diagnostics?.map(diagnosticToString)?.join('\n')
        ).toEqual(
            expect.stringContaining(s`
                [3:19..3:20]: Tier must be between 1 and 6.
            `)
        );
    });
});

function checkDocumentValid(document: LangiumDocument): string | undefined {
    return document.parseResult.parserErrors.length && s`
        Parser errors:
          ${document.parseResult.parserErrors.map(e => e.message).join('\n  ')}
    `
        || document.parseResult.value === undefined && `ParseResult is 'undefined'.`
        || !isModel(document.parseResult.value) && `Root AST object is a ${document.parseResult.value.$type}, expected a 'Model'.`
        || undefined;
}

function diagnosticToString(d: Diagnostic) {
    return `[${d.range.start.line}:${d.range.start.character}..${d.range.end.line}:${d.range.end.character}]: ${d.message}`;
}

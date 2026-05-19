import type { Model } from 'hearthstone-battlegrounds-dsl-language'
import {
  createHearthstoneBattlegroundsDslServices,
  HearthstoneBattlegroundsDslLanguageMetaData,
} from 'hearthstone-battlegrounds-dsl-language'
import chalk from 'chalk'
import { Command } from 'commander'
import { extractAstNode } from './util.js'
import { generateGdScript } from './generator.js'
import { NodeFileSystem } from 'langium/node'
import * as url from 'node:url'
import * as fs from 'node:fs/promises'
import * as path from 'node:path'
const __dirname = url.fileURLToPath(new URL('.', import.meta.url))

const packagePath = path.resolve(__dirname, '..', 'package.json')
const packageContent = await fs.readFile(packagePath, 'utf-8')

export const generateAction = async (fileName: string, opts: GenerateOptions): Promise<void> => {
  const services = createHearthstoneBattlegroundsDslServices(NodeFileSystem).HearthstoneBattlegroundsDsl
  const model = await extractAstNode<Model>(fileName, services)
  const generatedFilePath = generateGdScript(model, fileName, opts.destination)
  console.log(chalk.green(`Code generated successfully: ${generatedFilePath}`))
}

export type GenerateOptions = {
  destination?: string
}

export default function (): void {
  const program = new Command()

  program.version(JSON.parse(packageContent).version)

  const fileExtensions = HearthstoneBattlegroundsDslLanguageMetaData.fileExtensions.join(', ')
  program
    .command('generate')
    .argument('<file>', `source file (possible file extensions: ${fileExtensions})`)
    .option('-d, --destination <dir>', 'destination directory of generating')
    .description('generates gdscript code that can be used in a Hearthstone Battlegrounds clone')
    .action(generateAction)

  program.parse(process.argv)
}

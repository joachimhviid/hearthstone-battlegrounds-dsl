import type { AstNode, LangiumCoreServices, LangiumDocument } from 'langium'
import chalk from 'chalk'
import * as path from 'node:path'
import * as fs from 'node:fs'
import { URI } from 'langium'

export async function extractDocument(fileName: string, services: LangiumCoreServices): Promise<LangiumDocument> {
  const extensions = services.LanguageMetaData.fileExtensions
  if (!extensions.includes(path.extname(fileName))) {
    console.error(chalk.yellow(`Please choose a file with one of these extensions: ${extensions}.`))
    process.exit(1)
  }

  if (!fs.existsSync(fileName)) {
    console.error(chalk.red(`File ${fileName} does not exist.`))
    process.exit(1)
  }

  // Load and build all language documents in the same folder (recursively)
  const folder = path.dirname(path.resolve(fileName))
  const filePaths: string[] = []

  function collectFiles(dirPath: string) {
    for (const entry of fs.readdirSync(dirPath, { withFileTypes: true })) {
      const entryPath = path.join(dirPath, entry.name)
      if (entry.isDirectory()) {
        collectFiles(entryPath)
      } else if (extensions.includes(path.extname(entry.name))) {
        filePaths.push(entryPath)
      }
    }
  }

  collectFiles(folder)

  const documents: LangiumDocument[] = []
  for (const f of filePaths) {
    documents.push(await services.shared.workspace.LangiumDocuments.getOrCreateDocument(URI.file(path.resolve(f))))
  }

  const targetUri = URI.file(path.resolve(fileName))
  let targetDocument = documents.find((d) => d.uri.toString() === targetUri.toString())
  if (!targetDocument) {
    targetDocument = await services.shared.workspace.LangiumDocuments.getOrCreateDocument(targetUri)
    documents.push(targetDocument)
  }

  await services.shared.workspace.DocumentBuilder.build(documents, {
    validation: true,
  })

  const validationErrors = (targetDocument.diagnostics ?? []).filter((e) => e.severity === 1)
  if (validationErrors.length > 0) {
    console.error(chalk.red('There are validation errors:'))
    for (const validationError of validationErrors) {
      console.error(
        chalk.red(
          `line ${validationError.range.start.line + 1}: ${validationError.message} [${targetDocument.textDocument.getText(validationError.range)}]`,
        ),
      )
    }
    process.exit(1)
  }

  return targetDocument
}

export async function extractAstNode<T extends AstNode>(fileName: string, services: LangiumCoreServices): Promise<T> {
  return (await extractDocument(fileName, services)).parseResult?.value as T
}

interface FilePathData {
  destination: string
  name: string
}

export function extractDestinationAndName(filePath: string, destination: string | undefined): FilePathData {
  const fileName = path.basename(filePath, path.extname(filePath)).replace(/[.-]/g, '')
  return {
    destination: destination ?? path.join(path.dirname(filePath), 'generated'),
    name: fileName,
  }
}

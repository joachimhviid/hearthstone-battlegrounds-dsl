#!/usr/bin/env node

import { readdir } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import { spawnSync } from 'node:child_process'

const playgroundDir = path.resolve('playground')
const destinationDir = path.join(playgroundDir, 'generated')

const entries = await readdir(playgroundDir, { withFileTypes: true })
const sourceFiles = entries
    .filter((entry) => entry.isFile() && entry.name.endsWith('.hsbg'))
    .map((entry) => path.join(playgroundDir, entry.name))
    .sort()

if (sourceFiles.length === 0) {
    console.error(`No .hsbg files found in ${playgroundDir}`)
    process.exit(1)
}

for (const sourceFile of sourceFiles) {
    const result = spawnSync('hsbg-cli', ['generate', sourceFile, '--destination', destinationDir], {
        stdio: 'inherit'
    })

    if (result.status !== 0) {
        process.exit(result.status ?? 1)
    }
}

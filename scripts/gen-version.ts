import { writeFileSync } from 'node:fs'
import { resolve } from 'path'
import { fileURLToPath } from 'url'
import packageJson from '../package.json'
const versions = packageJson?.['packages-version']
const _filename = fileURLToPath(import.meta.url)

for (const p in versions) {
  const version = versions[p]
  const jsonPath = resolve(_filename, '..', `../packages/${p}`, 'package.json')
  let json = await import(`//${jsonPath}`)
  if (json)
    json = json.default

  writeFileSync(jsonPath, JSON.stringify({ ...json, version }, null, 2))
  // console.log('json', p, version, jsonPath, json)
}

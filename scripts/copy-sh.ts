import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import makeEmptyDir from 'make-empty-dir'

const __dirname = fileURLToPath(import.meta.url)
const repoRoot = path.join(__dirname, '../..')
const dest = path.join(repoRoot, 'dist')
const exeDir = path.join(repoRoot, 'packages/cli/bin')

;(async () => {
  if (!fs.existsSync(dest))
    await makeEmptyDir(dest, { recursive: true })
  copyShell('install.ps1')
  copyShell('install.sh')
})()

function copyShell(srcName: string) {
  fs.copyFileSync(path.join(exeDir, srcName), path.join(dest, srcName))
}

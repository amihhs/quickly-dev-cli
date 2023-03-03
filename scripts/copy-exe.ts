import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import * as execa from 'execa'
import makeEmptyDir from 'make-empty-dir'

const __dirname = fileURLToPath(import.meta.url)
const repoRoot = path.join(__dirname, '../..')
const dest = path.join(repoRoot, 'dist')
const exeDir = path.join(repoRoot, 'packages/exe/dist')

;(async () => {
  await makeEmptyDir(dest)
  if (!fs.existsSync(path.join(exeDir, 'linux-x64/pnpm'))) {
    execa.sync('pnpm', ['--filter=@amihhs/quickly-dev-exe', 'run', 'prepublishOnly'], {
      cwd: repoRoot,
      stdio: 'inherit',
    })
  }
  copyArtifact('linux-x64/quickly-dev-cli', 'quickly-dev-cli-linux-x64')
  copyArtifact('linuxstatic-x64/quickly-dev-cli', 'quickly-dev-cli-linuxstatic-x64')
  copyArtifact('macos-x64/quickly-dev-cli', 'quickly-dev-cli-macos-x64')
  copyArtifact('win-x64/quickly-dev-cli.exe', 'quickly-dev-cli-win-x64.exe')

  const isM1Mac = process.platform === 'darwin' && process.arch === 'arm64'
  if (process.platform === 'linux' || isM1Mac) {
    copyArtifact('linuxstatic-arm64/quickly-dev-cli', 'quickly-dev-cli-linuxstatic-arm64')
    copyArtifact('linux-arm64/quickly-dev-cli', 'quickly-dev-cli-linux-arm64')
    copyArtifact('macos-arm64/quickly-dev-cli', 'quickly-dev-cli-macos-arm64')
  }
})()

function copyArtifact(srcName: string, destName: string) {
  fs.copyFileSync(path.join(exeDir, srcName), path.join(dest, destName))
}

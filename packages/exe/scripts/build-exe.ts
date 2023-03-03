import fs from 'fs'
import path, { resolve } from 'path'
import { fileURLToPath } from 'url'
import { execaSync } from 'execa'

const __dirname = fileURLToPath(import.meta.url)
const exeDir = path.join(__dirname, '../..')
const cliPath = resolve(__dirname, '../../../cli/bin/quickly-dev-cli.cjs')

function build(target: string) {
  let exeFile = path.join(exeDir, `dist/${target}`, 'quickly-dev-cli')
  if (target.startsWith('win-'))
    exeFile += '.exe'
  try {
    fs.unlinkSync(exeFile)
  }
  catch (err) {}
  // console.log('exeFile', exeFile)

  execaSync('pkg', [cliPath, `--config=${resolve(exeDir, 'platform', `${target}.json`)}`], {
    cwd: exeDir,
    stdio: 'inherit',
  })
  // Verifying that the artifact was created.
  fs.statSync(exeFile)
}

build('win-x64')
build('linux-x64')
build('linuxstatic-x64')
build('macos-x64')

// https://github.com/vercel/pkg/issues/1663
const isM1Mac = process.platform === 'darwin' && process.arch === 'arm64'
if (process.platform === 'linux' || isM1Mac) {
  build('macos-arm64')
  build('linux-arm64')
  build('linuxstatic-arm64')
}

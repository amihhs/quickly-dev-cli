import path from 'path'
import { cac } from 'cac'
import { green } from 'colorette'
import consola from 'consola'
import { version } from '../package.json'
import { CLI_NAME, SIMPLE_NAME } from './const'
import type { CliOptions } from './types'
import { handler as setupHandler } from './command/setup'
import { handler as startHandler } from './command/start'
import { clearAbortController } from './utils/fetch'

export async function startCli(cwd = process.cwd(), argv = process.argv, _options: CliOptions = {}): Promise<void> {
  process.on('exit', (code) => {
    consola.error(`About to exit with code: ${code} \r\n`)
    // stop all fetch & clear all abort controller
    clearAbortController()
  })
  process.once('SIGINT', (code) => {
    console.error(`SIGINT: ${code} \r\n`)
    // stop all fetch & clear all abort controller
    clearAbortController()
  })

  const cli = cac(SIMPLE_NAME)
  cli
    .command('setup', 'setup quickly-dev-cli to your system')
    .action(async (_dir, _options) => {
      const USER_HOME = process.env.HOME || process.env.USERPROFILE
      // consola.info('<<setup>>', `homeDir: ${cwd}`, _dir)
      const output = await setupHandler({
        homeDir: path.join(USER_HOME || cwd, CLI_NAME),
        force: true,
      })

      consola.info(green(`<<setup complete>> \n ${output}`))
    })

  cli
    .command('start', 'Start build a local development environment')
    .action(async (_dir, _options) => {
      await startHandler()
    })

  cli.help()
  cli.version(version)
  // Parse CLI args without running the command to
  // handle command errors globally
  cli.parse(argv, { run: false })

  await cli.runMatchedCommand()
}

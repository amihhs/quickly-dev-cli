import { cac } from 'cac'
import { version } from '../package.json'
import type { CliOptions } from './types'
export const NAME = 'qdev'
export async function startCli(cwd = process.cwd(), argv = process.argv, options: CliOptions = {}): Promise<void> {
  const cli = cac(NAME)
  cli
    .command('start', 'Start build a local development environment')
    .action(async (dir, options) => {
      // console.log('<<start command>>', dir, options, cwd, argv, options)
      console.log('<<start command>>', 'Welcome use quickly-dev-cli, but now it han\'t any function, please wait for the next version.')
    })

  cli.help()
  cli.version(version)
  // Parse CLI args without running the command to
  // handle command errors globally
  cli.parse(argv, { run: false })
  await cli.runMatchedCommand()
}

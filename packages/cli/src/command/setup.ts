/* eslint-disable @typescript-eslint/ban-ts-comment */
import path from 'path'
import fs from 'node:fs'
import consola from 'consola'
import { red } from 'colorette'
import type { ConfigReport, PathExtenderReport } from '@pnpm/os.env.path-extender'
import { addDirToEnvPath } from '@pnpm/os.env.path-extender'
import { CLI_NAME, SIMPLE_NAME } from '../const'

export function copyCli(currentLocation: string, targetDir: string) {
  const execName = path.basename(currentLocation).replace(CLI_NAME, SIMPLE_NAME).replace(/(-|win|linux|macos|linuxstatic|x64|x86|arm64)/g, '')
  const newExecPath = path.join(targetDir, execName)
  // consola.log(blue(`<<setup copyCli>>: newExecPath ${newExecPath} `))
  if (path.relative(newExecPath, currentLocation) === '')
    return

  // consola.log(blue(`<<setup copyCli>>: Copying ${CLI_NAME} CLI from ${currentLocation} to ${newExecPath}`))

  fs.mkdirSync(targetDir, { recursive: true })
  fs.copyFileSync(currentLocation, newExecPath)
}

export async function handler(
  opts: {
    force?: boolean
    homeDir: string
  },
) {
  const execPath = getExecPath()
  // consola.log(green(`execPath: ${execPath}`))
  // consola.log(green(`execPath.match(/\.[cm]?js$/): ${execPath.match(/\.[cm]?js$/) == null}`))

  if (execPath.match(/\.[cm]?js$/) == null)
    copyCli(execPath, opts.homeDir)

  try {
    const report = await addDirToEnvPath(opts.homeDir, {
      configSectionName: SIMPLE_NAME,
      proxyVarName: 'QDEV_HOME',
      overwrite: opts.force,
      position: 'start',
    })
    return renderSetupOutput(report)
  }
  catch (err: any) {
    consola.error(red(err))
    throw err
  }
}

function renderSetupOutput(report: PathExtenderReport) {
  if (report.oldSettings === report.newSettings)
    return 'No changes to the environment were made. Everything is already up to date.'

  const output = []
  if (report.configFile)
    output.push(reportConfigChange(report.configFile))

  output.push(`Next configuration changes were made: \n${report.newSettings}`)
  if (report.configFile == null)
    output.push(`Setup complete. Open a new terminal to start using ${CLI_NAME}.`)
  else if (report.configFile.changeType !== 'skipped')
    output.push(`To start using ${SIMPLE_NAME}, run:\n source ${report.configFile.path}`)
  return output.join('\n\n')
}

function reportConfigChange(configReport: ConfigReport): string {
  switch (configReport.changeType) {
    case 'created': return `Created ${configReport.path}`
    case 'appended': return `Appended new lines to ${configReport.path}`
    case 'modified': return `Replaced configuration in ${configReport.path}`
    case 'skipped': return `Configuration already up to date in ${configReport.path}`
  }
}

function getExecPath() {
  // @ts-expect-error
  if (process.pkg != null) {
    // If the CLI was bundled by vercel/pkg then we cannot use the js path for npm_execpath
    // because in that case the js is in a virtual filesystem inside the executor.
    // Instead, we use the path to the exe file.
    return process.execPath
  }
  return process.cwd()
}

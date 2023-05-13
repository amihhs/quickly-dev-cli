/* eslint-disable @typescript-eslint/ban-ts-comment */
// https://doget-api.oopscloud.xyz/api/download?token=eyJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJodHRwczovL2dpdGh1Yi5jb20vcG5wbS9wbnBtL3JlbGVhc2VzL2Rvd25sb2FkL3Y3LjI5LjEvcG5wbS13aW4teDY0LmV4ZSJ9.Nd9gXUggW4JHWuu3dvdnQ1oYEIiYYFRrFfQ3HWOtPio
// https://www.npmjs.com/package/inquirer
import fs from 'node:fs'
import inquirer from 'inquirer'
import consola from 'consola'
import { exec } from '../utils/exec'
import { fetchFile } from '../utils/fetch'

export interface PresetPrompt {
  name: string
  description: string
  downloadUrl: string
  version: string
  targe?: string
  run?: any[]
}
/**
 * DownloadTask
 */
export interface DownloadTask {
  name: string // install package name
  url: string // download url
  version: string // install package version
  targeFile: string // download file save path
  run?: any[] // run command
}

/**
 * Start to build a local development environment
 * 1. Select applications or features that need to be installed
 */
export async function handler() {
  const presetPackage = await presetPrompt()
  const answer = await inquirer.prompt<{ preset: PresetPrompt[] }>([
    presetPackage,
  ])

  const { preset } = answer
  // TODO select preset package version
  const DEFAULT_PATH = process.env.HOME || process.env.USERPROFILE
  // install preset
  // waiting download stack
  const downloadStack: DownloadTask[] = []

  for (const item of preset) {
    downloadStack.push({
      name: item.name,
      url: item.downloadUrl,
      version: item.version,
      targeFile: `${item.targe || DEFAULT_PATH}`,
      run: item.run,
    })
  }

  await run(downloadStack)
}

/**
 * preset prompt
 */
async function presetPrompt() {
  const choices = []
  const json = (await import ('../config/preset.json')).default
  for (const key in json) {
    // @ts-expect-error
    const item = json[key]
    choices.push({
      name: item.description,
      value: item,
    })
  }
  return {
    name: 'preset',
    type: 'checkbox',
    message: 'Please select the items to be installed:',
    choices,
  }
}

/**
 * run download task
 */
async function run(tasks: DownloadTask[]) {
  for (const task of tasks) {
    const { filePath } = await fetchFile(task)
    runCommands(filePath, task)
  }
}

async function runCommands(filePath: string, task: DownloadTask) {
  if (!task || !task.run || task.run.length === 0)
    return

  if (!fs.existsSync(task.targeFile))
    return

  // run command
  for (const command of task.run) {
    const app = command[0] === '__SELF__' ? filePath : command[0]
    const args = command.slice(1)
    const c = `${app} ${args.join(' ')}`
    const res = await exec(c)
    const [error, stdout] = res
    if (error)
      consola.error(`run command<${c}> error: ${error.code}`)
    consola.log(`${stdout}`)
  }
}

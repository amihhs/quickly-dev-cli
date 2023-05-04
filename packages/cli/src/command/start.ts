/* eslint-disable @typescript-eslint/ban-ts-comment */
// https://www.npmjs.com/package/inquirer
import consola from 'consola'
import inquirer from 'inquirer'

/**
 * preset prompt
 * include: pnpm, git, vscode
 */
export type PresetPrompt = '__PNPM__' | '__GIT__' | '__VSCODE__'
/**
 * start prompt
 */
export interface StartPrompt {
  preset: PresetPrompt[]
}

/**
 * DownloadTask
 */
export interface DownloadTask {
  name: string // install package name
  url: string // download url
  version: string // install package version
  targeFile: string // download file save path
}

/**
 * Start to build a local development environment
 * 1. Select applications or features that need to be installed
 */
export async function handler() {
  const presetPackage = await presetPrompt()
  const answer = await inquirer.prompt<StartPrompt>([
    presetPackage,
  ])

  const { preset } = answer
  // TODO select preset package version

  // install preset
  // waiting download stack
  const downloadStack: DownloadTask[] = []

  consola.log(preset)

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
  consola.log(choices)
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
  // for (const task of tasks)
  //   fetchFile(task)
}

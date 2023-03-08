// https://www.npmjs.com/package/inquirer
import consola from 'consola'
import inquirer from 'inquirer'
import { fetchFile } from '../utils/fetch'

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
  const answer = await inquirer.prompt<StartPrompt>([
    presetPrompt(),
  ])

  const { preset } = answer
  // TODO select preset package version

  // install preset
  // waiting download stack
  const downloadStack: DownloadTask[] = []

  if (preset.includes('__PNPM__')) {
    const { downloadTask } = installPnpm()
    downloadStack.push(downloadTask)
  }
  if (preset.includes('__GIT__')) {
    const { downloadTask } = installGit()
    downloadStack.push(downloadTask)
  }
  if (preset.includes('__VSCODE__')) {
    const { downloadTask } = installVsCode()
    downloadStack.push(downloadTask)
  }

  consola.log(answer)

  await run(downloadStack)
}

/**
 * preset prompt
 */
function presetPrompt() {
  return {
    name: 'preset',
    type: 'checkbox',
    message: 'Please select the items to be installed:',
    choices: [
      {
        name: 'PNPM: Install pnpm as your package manager',
        value: '__PNPM__',
      },
      {
        name: 'GIT: Install git as your version control tool',
        value: '__GIT__',
      },
      {
        name: 'VS Code: Install VS Code as your code editor',
        value: '__VSCODE__',
      },
    ],
  }
}

/**
 * install pnpm
 */
function installPnpm() {
  const pnpmInstallFile = {
    name: 'pnpm',
    url: '',
    version: 'laster',
    targeFile: 'D:\\test', // __TEMP__ create a temp dir
  }
  // download pnpm

  // install pnpm

  // set env

  return { downloadTask: pnpmInstallFile }
}

/**
 * install pnpm
 */
function installGit() {
  // TODO
  const installFile = {
    name: 'git',
    url: '',
    version: 'laster',
    targeFile: 'D:\\test', // __TEMP__ create a temp dir
  }
  return { downloadTask: installFile }
}

/**
 * install pnpm
 */
function installVsCode() {
  // TODO
  const installFile = {
    name: 'vscode',
    url: '',
    version: 'laster',
    targeFile: 'D:\\test', // __TEMP__ create a temp dir
  }
  return { downloadTask: installFile }
}

/**
 * run download task
 */
async function run(tasks: DownloadTask[]) {
  const taskGenerator = (async function* (tasks: DownloadTask[]) {
    for (const task of tasks) {
      try {
        yield fetchFile(task)
      }
      catch (err) {
        consola.error(err)
      }
    }
  })(tasks)

  for await (const task of taskGenerator)
    consola.log(task)
}

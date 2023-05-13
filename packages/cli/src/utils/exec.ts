import type { ExecException } from 'node:child_process'
import { exec as exe } from 'node:child_process'
export function exec(command: string): Promise<[ExecException | null, string, string]> {
  return new Promise((resolve) => {
    exe(command, (error, stdout, stderr) => {
      resolve([error, stdout, stderr])
    })
  })
}

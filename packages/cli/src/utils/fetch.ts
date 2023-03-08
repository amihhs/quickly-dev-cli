import consola from 'consola'
import type { DownloadTask } from '../command/start'

// 如何node中使用fetch下载文件,同时展示下载进度

/**
 * fetch download file
 * 1. Check whether the remote file exists
 * 2. Save the download file to the specified directory, and show download progress
 * 3. Return the file path & some file information
 */
export async function fetchFile(task: DownloadTask, options: RequestInit = {}): Promise<any> {
  // TODO
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      consola.log('<<fetchFile>>', task, options)
      if (task.name === 'pnpm')
        reject(new Error('<<fetchFile>>: download error'))
      resolve(1)
    }, 3000)
  })
}

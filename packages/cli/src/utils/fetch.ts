import fs from 'node:fs'
import { pipeline } from 'node:stream'
import { promisify } from 'node:util'
import consola from 'consola'
import { $fetch } from 'ofetch'
import ProgressBar from 'progress'
import type { DownloadTask } from '../command/start'
// 如何node中使用fetch下载文件,同时展示下载进度

const CURRENT_FETCH = new Map<string, AbortController>()
/**
 * fetch download file
 * 1. Check whether the remote file exists
 * 2. Save the download file to the specified directory, and show download progress
 * 3. Return the file path & some file information
 */
export function fetchFile(task: DownloadTask, _options: RequestInit = {}): Promise<any> {
  return new Promise((resolve, reject) => {
    const { url, name, targeFile } = task
    if (!url)
      reject(new Error('url is required'))

    consola.start('begin download...')
    consola.info(url)

    let filename = name
    const filePath = `${targeFile}\\${filename}`
    // 判断文件是否存在
    const isExist = fs.existsSync(filePath)
    if (!isExist)
      fs.writeFileSync(filePath, '')

    const writer = fs.createWriteStream(filePath, { autoClose: false })
    const control = new AbortController()
    CURRENT_FETCH.set(url, control)

    let totalSize = 0
    $fetch(url, {
      responseType: 'stream',
      signal: control.signal,
      onResponse: (res) => {
        filename = res.response.headers.get('content-disposition')?.split('filename=')[1] || ''
        consola.log(`filename: ${filename}`)
        totalSize = parseInt(res.response.headers.get('content-length') || '0', 10)
      },
    }).then((res) => {
      const bar = new ProgressBar(`${name} downloading  ${(totalSize / (1024 * 1024)).toFixed(2)}Mb [:bar] :rate :percent :etas`, {
        curr: 0,
        complete: '=',
        incomplete: ' ',
        width: 30,
        total: totalSize,
      })
      let preSize = 0
      writer.on('drain', () => {
        const size = writer.bytesWritten - preSize
        preSize = writer.bytesWritten
        bar.tick(size)
      })
      writer.on('finish', () => {
        consola.success('download success')
        writer.close()
        fs.renameSync(filePath, `${targeFile}\\${filename}`)
        resolve({ task, filePath })
      })
      writer.on('error', (err) => {
        writer.close()
        control.abort()
        reject(err)
      })
      const streamPipeline = promisify(pipeline)
      streamPipeline(res as any, writer, { signal: control.signal }).catch(reject)
    })
  })
}

export function clearAbortController(url?: string, isFinish = false) {
  if (url) {
    const controller = CURRENT_FETCH.get(url)
    if (controller && !isFinish)
      controller.abort?.()
    CURRENT_FETCH.delete(url)
    return
  }

  // clear all
  for (const [key, controller] of CURRENT_FETCH) {
    controller.abort?.()
    CURRENT_FETCH.delete(key)
  }
}

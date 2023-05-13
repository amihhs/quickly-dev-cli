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

    if (!fs.existsSync(targeFile))
      fs.mkdirSync(targeFile)

    let filename = name
    const filePath = () => `${targeFile}\\${filename}`

    let totalSize = 0
    let isEnd = false
    const control = new AbortController()
    CURRENT_FETCH.set(url, control)
    const returnHandler = () => resolve({ task, filePath: filePath() })
    function onResponse(res: any) {
      filename = res.response.headers.get('content-disposition')?.split('filename=')[1] || ''

      totalSize = parseInt(res.response.headers.get('content-length') || '0', 10)
      // 判断文件是否存在
      const isExist = fs.existsSync(filePath())
      if (!isExist)
        fs.writeFileSync(filePath(), '')

      const fileStat = fs.statSync(filePath())
      if (fileStat.size === totalSize) {
        consola.success('file already exists')
        isEnd = true
      }
      consola.log(`filename: ${filename} | size: ${totalSize} | fileStat.size: ${fileStat.size}`)
    }

    function handler(data: ReadableStream<Uint8Array>) {
      if (isEnd)
        return returnHandler()
      const bar = new ProgressBar(`${name} downloading  ${(totalSize / (1024 * 1024)).toFixed(2)}Mb [:bar] :rate :percent :etas`, {
        curr: 0,
        complete: '=',
        incomplete: ' ',
        width: 30,
        total: totalSize,
      })
      const writer = fs.createWriteStream(filePath(), { autoClose: false })
      let preSize = 0
      writer.on('drain', () => {
        const size = writer.bytesWritten - preSize
        preSize = writer.bytesWritten
        bar.tick(size)
      })
      writer.on('finish', () => {
        consola.success('download success')
        writer.close()
        returnHandler()
      })
      writer.on('error', (err) => {
        writer.close()
        control.abort()
        reject(err)
      })
      const streamPipeline = promisify(pipeline)
      streamPipeline(data as any, writer, { signal: control.signal }).catch(reject)
    }

    $fetch(url, {
      responseType: 'stream',
      signal: control.signal,
      onResponse,
    }).then(handler)
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

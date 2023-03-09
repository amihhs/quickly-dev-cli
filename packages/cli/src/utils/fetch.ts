/* eslint-disable no-console */
import fs from 'node:fs'
import { pipeline } from 'node:stream'
import { promisify } from 'node:util'
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
export async function fetchFile(task: DownloadTask, _options: RequestInit = {}): Promise<any> {
  // TODO

  const { url, name, targeFile } = task
  if (!url)
    return
  console.log('begin download...', url)
  const writer = fs.createWriteStream(`${targeFile}/${name}.exe`, { autoClose: true })
  const control = new AbortController()
  CURRENT_FETCH.set(url, control)

  let totalSize = 0
  const res = await $fetch(url, {
    responseType: 'stream',
    signal: control.signal,
    onResponse: (res) => {
      totalSize = parseInt(res.response.headers.get('content-length') || '0', 10)
    },
  })
  const bar = new ProgressBar('downloading [:bar] :rate/bps :percent :etas', {
    curr: 0,
    complete: '=',
    incomplete: ' ',
    width: 40,
    total: totalSize,
  })

  writer.on('drain', () => {
    // console.log('drain', writer.writableHighWaterMark)
    bar.tick(writer.writableHighWaterMark)
  })
  writer.on('close', () => {
    clearAbortController(url)
    console.log('download close')
  })
  writer.on('error', () => {
    // stop download
    control.abort()
    console.log('download error')
  })

  const streamPipeline = promisify(pipeline)
  await streamPipeline(res as any, writer, { signal: control.signal })
}

export function clearAbortController(url?: string) {
  if (url) {
    const controller = CURRENT_FETCH.get(url)
    if (controller)
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

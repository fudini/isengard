/// <reference types="node" />
declare module 'node-watch' {

  import { FSWatcher } from 'fs'

  interface WatchOptions {
    persistent?: boolean
    encoding?: string
    recursive?: boolean
    filter?: RegExp | Function
    delay?: number
  }

  type WatchCallback = (eventName: string, name: string) => void

 	function watch(
    path: string,
    options: WatchOptions,
    callback: WatchCallback
  ): any // fs.FSWatch

  export = watch
}

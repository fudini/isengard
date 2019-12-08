import fs from 'fs'
import path from 'path'
import { Tail } from 'tail'

async function whenFileExists(fileName: string): Promise<void> {

  return new Promise(resolve => {

    function check() {
      if (fs.existsSync(fileName)) {
        resolve()
        return
      }

      setTimeout(check, 100)
    }

    check()
  })
}

interface Open {
  path: string
  flags: string[]
}

let getUnparsed = (open: string): [string, string] | null => {

  let match = open.match(/open\((.*?)\)/)

  if (match !== null) {

    const [quotedPath, flagsString] = match[1].split(', ')
    return [quotedPath, flagsString]
  }

  const match2 = open.match(/openat\((.*?)\)/)

  if (match2 === null) {
    return null
  }

  const [, quotedPath, flagsString] = match2[1].split(', ')
  return [quotedPath, flagsString]
}

/**
 * Parse the strace open("") logs
 * There is this project to parse strace to json:
 * https://github.com/dannykopping/b3
 */
let parseOpen = (open: string): Open | null => {

  let unparsed = getUnparsed(open)

  if (unparsed === null) {
    return null
  }

  const [quotedPath, flagsString] = unparsed

  const unquotedPath = quotedPath.replace(/"/g, '')
  // paths can be relative
  const resolvedPath = path.resolve(unquotedPath)

  const flags = flagsString.split('|')

  return {
    path: resolvedPath,
    flags
  }
}

async function readStrace(fileName: string, handler: (line: string) => void) {

  await whenFileExists(fileName)

  const input = new Tail(fileName, { fromBeginning: true })

  input.on('line', handler)

  return {
    close() { input.unwatch() }
  }
}

type Config = {
  include: string[]
  exclude: string[]
  trace: boolean // show strace output in stdout
  exitCodes: number[] // exit isengard watcher if watched program exists with any of these codes
}

const loadConfig = (log: (msg: string) => void) => {

  let defaultConfig: Config = {
    include: [],
    exclude: [],
    trace: false,
    exitCodes: [],
  }

  try {
    let userConfig = JSON.parse(fs.readFileSync('.isengard', 'utf8'))
    let config: Config = { ...defaultConfig, ...userConfig }
    return config
  } catch(e) {
    log('error parsing .isengard config file')
    log(e)
    return defaultConfig
  }
}

const random = () => {
  return Math.random().toString(0xf).substr(2)
}

export { readStrace, parseOpen, random, loadConfig }

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

/**
 * Parse the strace open("") logs
 * There is this project to parse strace to json:
 * https://github.com/dannykopping/b3
 */
let parseOpen = (open: string): Open | null => {

  const match = open.match(/open\((.*?)\)/)

  if (match === null) {
    return null
  }

  const [quotedPath, flagsString] = match[1].split(', ')
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
}

const loadConfig = () => {

  let defaultConfig: Config = {
    include: [],
    exclude: [],
    trace: true
  }

  try {
    let userConfig = JSON.parse(fs.readFileSync('.isengard', 'utf8'))
    let config: Config = { ...defaultConfig, ...userConfig }
    return config
  } catch {
    return defaultConfig
  }
}

const random = () => {
  return Math.random().toString(0xf).substr(2)
}

export { readStrace, parseOpen, random, loadConfig }

import fs from 'fs'
import path from 'path'
import { spawn, exec } from 'child_process'
import { Observable } from 'rx-lite'
import watch from 'node-watch'
import kill from 'tree-kill'
import { readStrace, parseOpen, random, loadConfig } from './utils'
import { Isengard } from './Isengard'

const log = (msg: string) => {
  console.log('ISENGARD: ' + msg)
}

let config = loadConfig()
log('isengard started with config:')
log(JSON.stringify(config))

const tmpRootPath = '/tmp'

const tmpFileName = `${random()}.strace`
const tmpFullPath = path.resolve(tmpRootPath, tmpFileName)

log('tmp file: ' + tmpFullPath)

const [,, ...a] = process.argv
const command = a.join(' ')

const straceCmd = `strace -e trace=open -o ${tmpFullPath} ${command}`
const [program, ...args] = straceCmd.split(' ')
const cwd = process.cwd()

app()

async function app() {

  let killed = false

  const strace = spawn(program, args, {
    stdio: 'inherit',
    detached: false
  })

  // in case if watched process exited
  strace.on('close', (code: any) => {
    if (!killed) {
      kill(strace.pid)
      //fs.unlinkSync(tmpFullPath)
      killed = true
    }
    log(`child process exited with code ${code}`)
  })

  const files = await readStrace(tmpFullPath, line => {

    const parsed = parseOpen(line)

    if (parsed === null) {
      return
    }

    const { path, flags } = parsed 

    // we don't want the files that process writes to be on the list
    if (!flags.includes('O_RDONLY')) {
      return 
    }

    // default only from the same path
    // the rest of configuration comes from:
    // .isengard
    if (!path.startsWith(cwd)) {
      return
    }

    if (config.trace) {
      console.log('FILE: ', path)
    }

    // add to the watchlist
    isengard.addFile(path)
  })


  const isengard = Isengard(cwd)

  const isengardSub = isengard.$.subscribe(() => {
    log('-------------------RESTART----------------')
    files.close()
    fs.unlinkSync(tmpFullPath)
    isengardSub.dispose()

    if (!killed) {
      log('killing process')
      kill(strace.pid, () => {
        log('process killed')
        app()
      })
      killed = true
    } else {
      app()
    }
  })

}


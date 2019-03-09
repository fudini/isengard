import fs from 'fs'
import path from 'path'
import { spawn, exec } from 'child_process'
import watch from 'node-watch'
import kill from 'tree-kill'
import { readStrace, parseOpen, random, loadConfig } from './utils'
import { Isengard } from './Isengard'

let config = loadConfig()
console.log(config)

const tmpRootPath = '/tmp'

const tmpFileName = `${random()}.strace`
const tmpFullPath = path.resolve(tmpRootPath, tmpFileName)

console.log('tmp file: ', tmpFullPath)

const [,, ...a] = process.argv
const command = a.join(' ')

const straceCmd = `strace -e trace=open -o ${tmpFullPath} ${command}`
const [program, ...args] = straceCmd.split(' ')
const cwd = process.cwd()

app()

async function app() {

  let killed = false

  const strace = spawn(program, args, {
    //stdio: 'inherit',
    stdio: 'pipe',
    detached: false
  })

  if (strace.stdout !== null && strace.stderr !== null) {
    strace.stdout.on('data', data => {
      process.stdout.write(data)
    })

    strace.stderr.on('data', (data) => {
      process.stderr.write(data)
    })
  }


  const files = await readStrace(tmpFullPath, line => {

    const parsed = parseOpen(line)

    if (parsed === null) {
      return
    }

    const { path, flags } = parsed 

    // we don't want the files that process writes to to be on the list
    if (!flags.includes('O_RDONLY')) {
      return 
    }

    // default only from the same path
    // the rest of configuration comes from:
    // .isengardrc
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
    console.log('-------------------RESTART----------------')
    if (!killed) {
      files.close()
      kill(strace.pid)
      fs.unlinkSync(tmpFullPath)
      killed = true
    }
    isengardSub.unsubscribe()
    app()
  })

  // in case if watched process exited
  strace.on('close', (code: any) => {
    if (!killed) {
      files.close()
      kill(strace.pid)
      fs.unlinkSync(tmpFullPath)
      killed = true
    }
    console.log(`child process exited with code ${code}`)
  })
}


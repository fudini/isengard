import fs from 'fs'
import foo from './foo'
import bar from './bar'

console.log('monitored process output!')
console.log(foo, bar)

setTimeout(() => {

  fs.readFileSync('./dist/tests/foobar.js')

}, 2000)

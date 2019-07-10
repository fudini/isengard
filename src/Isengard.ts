import { Observable, Observer } from 'rx-lite'

import watch from 'node-watch'

type WatchItem = [string, string]

let watchObservable = (
  rootPath: string,
  options: any,
): Observable<WatchItem> => {

  return Observable.create((observer: Observer<WatchItem>) => {

    let watcher = watch(rootPath, options, (type: string, name: string) => {
      observer.onNext([type, name])
    })

    return () => {
      watcher.close()
    }
  })
}

const Isengard = (rootPath: string, exclude: string[]) => {

  let files: string[] = []

  let options = {
    recursive: true,
    encoding: 'utf8',
  }

  let changedFiles$ = watchObservable(rootPath, options)

  let $ = changedFiles$
    // super slow
    // needs some trees if there are a lot of files
    .filter(([_, file]) => {
      return exclude.reduce((matches, regex) => {
        return matches || RegExp(regex).test(file)
      }, false)
    })
    .filter(([_, file]) => {
      return files.includes(file)
    })
    .take(1) // we only need this to happen once

  let addFile = (name: string) => {
    files.push(name)
  }

  return {
    addFile,
    $
  }
}

export { Isengard }


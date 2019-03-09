import { Observable, Observer } from 'rxjs'
import { take, share, filter, throttleTime } from 'rxjs/operators'
import watch from 'node-watch'

type WatchItem = [string, string]

let watchObservable = (
  rootPath: string,
  options: any,
): Observable<WatchItem> => {

  return Observable.create((observer: Observer<WatchItem>) => {

    let watcher = watch(rootPath, options, (type: string, name: string) => {
      observer.next([type, name])
    })

    return () => {
      watcher.close()
    }
  })
}

const Isengard = (rootPath: string) => {

  let files: string[] = []

  let options = {
    recursive: true,
    encoding: 'utf8',
  }

  let changedFiles$ = watchObservable(rootPath, options)

  let $ = changedFiles$.pipe(
    throttleTime(100),
    // super slow
    // needs some trees if there are a lot of files
    // TODO: add glob matching
    filter(([action, file]) => {
      return files.includes(file)
    }),
    take(1) // we only need this to happen once
  )

  let addFile = (name: string) => {
    files.push(name)
  }

  return {
    addFile,
    $
  }
}

export { Isengard }


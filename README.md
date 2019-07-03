## Isengard file watching + stats

Requires `strace`

### Usage:

```bash
isengard yourprogram
```

### Configuration

You can configure it with `.isengard` file

```bash
{
  "include": [],
  "exclude": [],
  "trace": true
}
```

### Todo:

* attach strace to the process
* separate app and index.js
* errors if you try to watch dodgy file
* glob matching
* exclude, include lists
* use trees for caching files
* use md5sum to check for really changed files

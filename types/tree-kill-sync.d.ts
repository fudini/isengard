/// <reference types="node" />
declare module 'tree-kill-sync' {

 	function kill(
    pid: number,
    signal?: number,
  ): void // fs.FSWatch

  export = kill
}


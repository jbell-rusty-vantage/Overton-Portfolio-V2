import { mkdir, readFile, writeFile, rename, rm, rmdir, stat } from "node:fs/promises";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import type { AtomicStore, LedgerState } from "./ledger";
const initial=():LedgerState=>({version:1,killed:false,turns:[]});
export type SqlConnection = { query(sql:string,args?:unknown[]):Promise<{rows:Record<string,unknown>[]}> };
export type Transaction = <T>(fn:(db:SqlConnection)=>Promise<T>)=>Promise<T>;
/** PostgreSQL row lock serializes reservations and settlements across instances. */
export class PostgresStore implements AtomicStore {
  constructor(private transaction:Transaction){}
  update<T>(fn:(state:LedgerState)=>T):Promise<T>{return this.transaction(async db=>{
    const result=await db.query("SELECT state FROM portrait_ledger WHERE id = 1 FOR UPDATE");
    if(result.rows.length!==1) throw Error("Portrait ledger unavailable");
    const state=result.rows[0].state as LedgerState;
    if(state.version!==1 || !Array.isArray(state.turns)) throw Error("Portrait ledger version unavailable");
    const value=fn(state);
    await db.query("UPDATE portrait_ledger SET state = $1::jsonb, updated_at = CURRENT_TIMESTAMP WHERE id = 1",[JSON.stringify(state)]);
    return value;
  });}
}
/** Only for the loopback deterministic mock, never paid calls. mkdir is an OS-wide
 * lock; rename commits atomically. A stale lock fails closed, never steals a lock. */
export class LocalMockStore implements AtomicStore {
  constructor(private directory:string){}
  async update<T>(fn:(state:LedgerState)=>T):Promise<T>{
    await mkdir(this.directory,{recursive:true});
    const lock=join(this.directory,"lock");
    const started=Date.now();
    for(;;){try{await mkdir(lock);break;}catch(e){if((e as NodeJS.ErrnoException).code!=="EEXIST" || Date.now()-started>1500)throw Error("Local mock ledger busy");await new Promise(r=>setTimeout(r,15));}}
    const file=join(this.directory,"ledger.json"),temp=join(this.directory,`ledger-${randomUUID()}.tmp`);
    try{
      let state:LedgerState;
      try{if((await stat(file)).size>8_000_000)throw Error("Ledger full");state=JSON.parse(await readFile(file,"utf8"));}catch(e){if((e as NodeJS.ErrnoException).code!=="ENOENT")throw e;state=initial();}
      const value=fn(state);await writeFile(temp,JSON.stringify(state),{encoding:"utf8",mode:0o600});await rename(temp,file);return value;
    }finally{await rm(temp,{force:true});await rmdir(lock);}
  }
}

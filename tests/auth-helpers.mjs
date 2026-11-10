import worker,{AuthStore,digest} from '../server/worker.mjs';
class Storage{
 async transaction(fn){const before=structuredClone(this.map);try{return await fn(this)}catch(e){this.map=before;throw e}}
 constructor(){this.map=new Map();this.alarm=null}
 async get(k){return structuredClone(this.map.get(k))}async put(k,v){this.map.set(k,structuredClone(v))}async delete(k){this.map.delete(k)}async getAlarm(){return this.alarm}async setAlarm(a){this.alarm=a}async list({prefix}){return new Map([...this.map].filter(([k])=>k.startsWith(prefix)))}
}
export async function app(){const db=new Storage();let queue=Promise.resolve();const state={storage:db,blockConcurrencyWhile(fn){const next=queue.then(fn);queue=next.catch(()=>{});return next}};const env={BOOTSTRAP_TOKEN_HASH:await digest('test-bootstrap-token'),BOOTSTRAP_EXPIRES:String(Date.now()+100000)};const store=new AuthStore(state,env);env.AUTH={idFromName:x=>x,get:()=>store};env.ASSETS={fetch:async()=>new Response('private-application')};return {env,db,store,request:async(path,{method='GET',body,token,origin='https://elo.test',ip='192.0.2.1'}={})=>worker.fetch(new Request('https://elo.test'+path,{method,headers:{'Content-Type':'application/json','Origin':origin,'CF-Connecting-IP':ip,...(token?{'Cookie':'__Host-elo_session='+token}:{})},...(body!==undefined?{body:JSON.stringify(body)}:{})}),env)}}

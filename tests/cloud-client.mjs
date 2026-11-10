import test from 'node:test';import assert from 'node:assert/strict';import vm from 'node:vm';import fs from 'node:fs';
function context(){const c={console,setTimeout,clearTimeout};vm.createContext(c);vm.runInContext(fs.readFileSync(new URL('../public/cloud.js',import.meta.url),'utf8'),c);return c}
function merge(base,local,remote){const c=context();c.b=base;c.l=local;c.r=remote;return JSON.parse(vm.runInContext('JSON.stringify(mergeClients(b,l,r))',c))}
test('Mescla entre aparelhos preserva novos clientes, exclusões e campos independentes',()=>{
 let b=[{id:'a',name:'Ana',stage:0},{id:'b',name:'Bruna',stage:0}],l=[{...b[0],name:'Ana local'},b[1],{id:'c',name:'Carla'}],r=[b[0],{...b[1],stage:2}];let m=merge(b,l,r);assert.equal(m.conflicts.length,0);assert.equal(m.clients.length,3);assert.equal(m.clients.find(c=>c.id==='b').stage,2);assert.equal(m.clients.find(c=>c.id==='a').name,'Ana local');
 m=merge(b,[{...b[0],name:'Mudou'},b[1]],[{...b[0],stage:1},b[1]]);assert.equal(m.conflicts.length,0);assert.equal(m.clients[0].name,'Mudou');assert.equal(m.clients[0].stage,1);
 m=merge(b,[{...b[0],name:'Local'},b[1]],[{...b[0],name:'Remoto'},b[1]]);assert.deepEqual(m.conflicts,['a']);
 m=merge(b,[b[1]],[{...b[0],name:'Editado'},b[1]]);assert.deepEqual(m.conflicts,['a']);m=merge(b,[b[1]],b);assert.equal(m.clients.length,1);
});
test('Edições durante o envio e defaults do servidor não perdem texto',()=>{
 const sent=[{id:'a',incoming:'Primeiro',facts:{}}],local=[{...sent[0],incoming:'Primeiro texto completo'}],remote=[{...sent[0],profile:{},legal:null}];const m=merge(sent,local,remote);assert.equal(m.conflicts.length,0);assert.equal(m.clients[0].incoming,'Primeiro texto completo');assert.deepEqual(m.clients[0].profile,{});
});

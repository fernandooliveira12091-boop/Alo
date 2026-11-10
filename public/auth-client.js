(() => {
  let checking=false;
  async function checkSession(){if(checking)return;checking=true;try{const response=await fetch('/api/auth/me',{cache:'no-store'});if(response.status===401){location.replace('/auth');return}if(!response.ok)return;const {username}=await response.json();const label=document.querySelector('#auth-user');if(label)label.textContent=username}catch{}finally{checking=false}}
  window.addEventListener('pageshow',checkSession);
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'){checkSession();if(typeof retryCloud==='function')retryCloud()}});
  setInterval(checkSession,60000);
  document.querySelector('#logout').addEventListener('click',async()=>{if(typeof cloudState!=='undefined'&&cloudState.dirty){alert('Há alterações pendentes. Sincronize ou baixe uma cópia antes de sair.');return}try{const r=await fetch('/api/auth/logout',{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'});if(!r.ok)throw Error();location.replace('/auth')}catch{alert('Não foi possível sair. Tente novamente.')}});
  checkSession();
})();

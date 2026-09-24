/* Github Pages access gate: no codes, derived keys, or plaintext included in public files. */
'use strict';
let PREFIX_TO_SCOPE={};
const manifestReady=fetch('access-manifest.json',{cache:'no-store'}).then(async res=>{if(!res.ok)throw Error('Access manifest tidak tersedia');PREFIX_TO_SCOPE=await res.json()});
const readBase64=s=>Uint8Array.from(atob(s),c=>c.charCodeAt(0));
const encoder=new TextEncoder();
async function openDataset(code,scope,prefix){
 const res=await fetch('data/'+prefix+'.enc.json',{cache:'no-store'});
 if(!res.ok)throw Error('Dataset tidak tersedia.');
 const blob=await res.json();
 if(blob.version!==1||blob.iterations!==600000)throw Error('Format dataset tidak kompatibel.');
 const baseKey=await crypto.subtle.importKey('raw',encoder.encode(code),'PBKDF2',false,['deriveKey']);
 const key=await crypto.subtle.deriveKey({name:'PBKDF2',salt:readBase64(blob.salt),iterations:blob.iterations,hash:'SHA-256'},baseKey,{name:'AES-GCM',length:256},false,['decrypt']);
 const clear=await crypto.subtle.decrypt({name:'AES-GCM',iv:readBase64(blob.iv),additionalData:encoder.encode('CSS2026|'+scope),tagLength:128},key,readBase64(blob.ciphertext));
 const data=JSON.parse(new TextDecoder().decode(clear));
 if(data.scope!==scope||!Array.isArray(data.rows))throw Error('Scope dataset tidak sesuai.');
 return data;
}
async function enterDashboard(data){
 const gate=document.getElementById('gate');gate.hidden=true;
 const app=document.getElementById('app');app.hidden=false;
 // Only plaintext of the selected scope exists in memory. Never store it in localStorage.
 window.__CSS_PREVIEW_DATA__=data;
 const s=document.createElement('script');s.src='app.js?v=3';s.onerror=()=>{app.textContent='Gagal memuat dashboard.'};document.body.append(s);
}
document.getElementById('show-code').addEventListener('change',e=>{document.getElementById('access-code').type=e.target.checked?'text':'password'});
document.getElementById('access-form').addEventListener('submit',async e=>{
 e.preventDefault();const input=document.getElementById('access-code'),code=input.value.trim();
 const button=document.getElementById('access-button'),err=document.getElementById('gate-error');err.hidden=true;
 try{await manifestReady}catch(ex){err.textContent='Konfigurasi akses belum tersedia.';err.hidden=false;return}
 if(!/^[A-Z0-9]{5}$/.test(code)){err.textContent='Masukkan tepat 5 karakter: huruf kapital atau angka 0–9.';err.hidden=false;return}
 button.disabled=true;button.textContent='Memeriksa kode…';
 try{
  let data=null;
  // No plaintext code-to-view lookup in public files; try authenticated decryption.
  for(const [prefix,scope] of Object.entries(PREFIX_TO_SCOPE)){
   try{data=await openDataset(code,scope,prefix);break}
   catch(ex){if(ex.message==='Dataset tidak tersedia.')throw ex}
  }
  if(!data)throw Error('Invalid code');
  input.value='';await enterDashboard(data);
 }
 catch(ex){err.textContent='Kode akses tidak sesuai atau dataset gagal dibuka.';err.hidden=false;console.warn('Access failed:',ex.name)}
 finally{button.disabled=false;button.textContent='Buka Dashboard'}
});

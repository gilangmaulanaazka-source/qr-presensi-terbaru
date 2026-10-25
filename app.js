(() => {
  "use strict";
  const C = window.APP_CONFIG || {};
  const DB_NAME = "FEBDays2026AttendanceDB", STORE = "attendance";
  const state = { participant:null, payload:"", scanner:null, running:false, scannerUnlocked:false, dashboardUnlocked:false, cooldown:0, rows:[], installPrompt:null };
  const $ = (s,r=document) => r.querySelector(s), $$ = (s,r=document) => [...r.querySelectorAll(s)];

  document.addEventListener("DOMContentLoaded", init);

  function init(){
    fillOptions(); bindRoutes(); bindParticipant(); bindCard(); bindScanner(); bindDashboard(); bindPwa(); restoreCard(); route();
    $("#cardDate").textContent = C.EVENT_DATE || "Tanggal kegiatan";
  }

  function fillOptions(){
    [$("#prodi"),$("#manualProdi")].forEach(sel => (C.STUDY_PROGRAMS||[]).forEach(v => sel.add(new Option(v,v))));
    [$("#semester"),$("#manualSemester")].forEach(sel => (C.SEMESTERS||[]).forEach(v => sel.add(new Option(`Semester ${v}`,v))));
  }

  function bindRoutes(){ window.addEventListener("hashchange",route); }
  function route(){
    let view=location.hash.slice(1)||"peserta";
    if(!["peserta","kartu","scanner","dashboard"].includes(view)) view="peserta";
    if(view==="kartu"&&!state.participant){ view="peserta"; history.replaceState(null,"","#peserta"); }
    $$(".view").forEach(el=>el.classList.toggle("active",el.dataset.view===view));
    $$('[data-nav]').forEach(el=>el.classList.toggle("active",el.dataset.nav===view));
    scrollTo({top:0,behavior:"smooth"});
  }

  function bindParticipant(){
    $("#participantForm").addEventListener("submit", e=>{
      e.preventDefault(); clearErrors();
      const p={name:$("#name").value.trim(),nim:$("#nim").value.trim().toUpperCase(),prodi:$("#prodi").value,semester:$("#semester").value};
      if(!validate(p)) return;
      if(!$("#consent").checked) return toast("Centang pernyataan kebenaran data terlebih dahulu.",true);
      p.token=createToken(p); p.createdAt=new Date().toISOString();
      state.participant=p; state.payload=encode(p);
      localStorage.setItem("febdays2026_last_card",JSON.stringify(p));
      renderCard(); location.hash="kartu"; toast("QR Code peserta berhasil dibuat.");
    });
    ["name","nim","prodi","semester"].forEach(id=>{ $("#"+id).addEventListener("input",()=>clearError(id)); $("#"+id).addEventListener("change",()=>clearError(id)); });
  }

  function validate(p){
    let ok=true;
    if(p.name.length<3){ setError("name","Nama minimal 3 karakter."); ok=false; }
    if(!/^[0-9A-Z.-]{6,20}$/.test(p.nim)){ setError("nim","NIM harus 6–20 karakter tanpa spasi."); ok=false; }
    if(!p.prodi){ setError("prodi","Pilih program studi."); ok=false; }
    if(!p.semester){ setError("semester","Pilih semester."); ok=false; }
    return ok;
  }
  function setError(id,msg){ $("#"+id).classList.add("invalid"); $(`[data-error-for="${id}"]`).textContent=msg; }
  function clearError(id){ $("#"+id).classList.remove("invalid"); $(`[data-error-for="${id}"]`).textContent=""; }
  function clearErrors(){ ["name","nim","prodi","semester"].forEach(clearError); }

  function createToken(p){ return "FBD26-"+hash(`${C.EVENT_ID}|${p.nim}|${p.name}|${p.prodi}|${p.semester}`); }
  function hash(text){ let h=2166136261; for(let i=0;i<text.length;i++){ h^=text.charCodeAt(i); h=Math.imul(h,16777619); } return (h>>>0).toString(36).toUpperCase().padStart(7,"0"); }
  function encode(p){ return "FEBDAYS26."+b64url(JSON.stringify({v:1,e:C.EVENT_ID,n:p.name,i:p.nim,p:p.prodi,s:p.semester,t:p.token})); }
  function decode(text){
    if(!String(text).startsWith("FEBDAYS26.")) throw Error("Format QR tidak dikenali.");
    const x=JSON.parse(unb64url(String(text).slice(10)));
    if(x.e!==C.EVENT_ID) throw Error("QR berasal dari acara yang berbeda.");
    if(!x.n||!x.i||!x.p||!x.s||!x.t) throw Error("Isi QR tidak lengkap.");
    const p={name:String(x.n),nim:String(x.i).toUpperCase(),prodi:String(x.p),semester:String(x.s),token:String(x.t)};
    if(createToken(p)!==p.token) throw Error("QR tidak valid atau telah diubah.");
    return p;
  }
  function b64url(text){ const bytes=new TextEncoder().encode(text); let bin=""; bytes.forEach(b=>bin+=String.fromCharCode(b)); return btoa(bin).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/g,""); }
  function unb64url(text){ const b=text.replace(/-/g,"+").replace(/_/g,"/")+"=".repeat((4-text.length%4)%4); const bin=atob(b); return new TextDecoder().decode(Uint8Array.from(bin,c=>c.charCodeAt(0))); }

  function restoreCard(){ try{ const p=JSON.parse(localStorage.getItem("febdays2026_last_card")||"null"); if(p){ state.participant=p; state.payload=encode(p); renderCard(); } }catch(_){ localStorage.removeItem("febdays2026_last_card"); } }
  function renderCard(){
    const p=state.participant; if(!p) return;
    $("#cardName").textContent=p.name; $("#cardNim").textContent=p.nim; $("#cardProdi").textContent=p.prodi; $("#cardSemester").textContent=p.semester; $("#participantToken").textContent=p.token;
    const box=$("#participantQr"); box.innerHTML="";
    new QRCode(box,{text:state.payload,width:210,height:210,correctLevel:QRCode.CorrectLevel.M});
  }

  function bindCard(){
    $("#newParticipantButton").addEventListener("click",()=>{$("#participantForm").reset();location.hash="peserta";});
    $("#downloadQrButton").addEventListener("click",()=>{
      const canvas=$("#participantQr canvas"), img=$("#participantQr img"), url=canvas?canvas.toDataURL("image/png"):img?.src;
      if(!url) return toast("QR Code belum tersedia.",true);
      const a=document.createElement("a"); a.href=url; a.download=`QR-FEBDAYS2026-${state.participant.nim}.png`; a.click();
    });
    $("#copyPayloadButton").addEventListener("click",async()=>{ if(!state.payload)return; await navigator.clipboard.writeText(state.payload); toast("Kode peserta berhasil disalin."); });
  }

  function bindScanner(){
    $("#unlockScannerButton").addEventListener("click",()=>{
      if($("#scannerPin").value!==String(C.ADMIN_PIN)) return toast("PIN panitia tidak valid.",true);
      state.scannerUnlocked=true; $("#scannerGate").classList.add("hidden"); $("#scannerArea").classList.remove("hidden"); toast("Scanner berhasil dibuka.");
    });
    $("#startScannerButton").addEventListener("click",startScanner);
    $("#stopScannerButton").addEventListener("click",stopScanner);
    $("#manualAttendanceForm").addEventListener("submit",manualAttendance);
  }

  async function startScanner(){
    if(!state.scannerUnlocked) return toast("Masukkan PIN panitia.",true);
    if(state.running) return;
    try{
      state.scanner=state.scanner||new Html5Qrcode("reader");
      await state.scanner.start({facingMode:"environment"},{fps:10,qrbox:(w,h)=>{const s=Math.floor(Math.min(w,h)*.68);return{width:s,height:s}},aspectRatio:1},handleScan,()=>{});
      state.running=true; $("#startScannerButton").disabled=true; $("#stopScannerButton").disabled=false;
    }catch(_){ toast("Kamera tidak dapat dibuka. Pastikan izin kamera diberikan.",true); }
  }
  async function stopScanner(){ if(!state.scanner||!state.running)return; try{await state.scanner.stop()}catch(_){} state.running=false; $("#startScannerButton").disabled=false; $("#stopScannerButton").disabled=true; }
  async function handleScan(text){
    const now=Date.now(); if(now<state.cooldown)return; state.cooldown=now+2200;
    try{ const p=decode(text), result=await saveAttendance(p,"QR Scan"); renderScan(result.record,result.duplicate?"warning":"success",result.duplicate?"Peserta sudah tercatat sebelumnya.":"Kehadiran berhasil dicatat."); beep(result.duplicate?470:760); if(navigator.vibrate)navigator.vibrate(result.duplicate?[80,60,80]:120); }
    catch(e){ renderScan(null,"error",e.message||"QR tidak valid."); beep(220); }
  }

  async function manualAttendance(e){
    e.preventDefault(); if(!state.scannerUnlocked)return toast("Buka mode panitia terlebih dahulu.",true);
    const p={name:$("#manualName").value.trim(),nim:$("#manualNim").value.trim().toUpperCase(),prodi:$("#manualProdi").value,semester:$("#manualSemester").value};
    if(p.name.length<3||!/^[0-9A-Z.-]{6,20}$/.test(p.nim)||!p.prodi||!p.semester) return toast("Lengkapi data manual dengan benar.",true);
    p.token=createToken(p); const result=await saveAttendance(p,"Input Manual"); renderScan(result.record,result.duplicate?"warning":"success",result.duplicate?"Peserta sudah tercatat sebelumnya.":"Kehadiran manual berhasil dicatat."); if(!result.duplicate)e.target.reset();
  }

  async function saveAttendance(p,method){
    const existing=await getByNim(p.nim); if(existing)return{duplicate:true,record:existing};
    const record={id:crypto.randomUUID?crypto.randomUUID():`${Date.now()}-${Math.random()}`,eventId:C.EVENT_ID,eventName:C.EVENT_NAME,timestamp:new Date().toISOString(),name:p.name,nim:p.nim,prodi:p.prodi,semester:p.semester,token:p.token,method};
    await put(record); return{duplicate:false,record};
  }

  function renderScan(r,status,msg){
    $("#scanPlaceholder").classList.add("hidden"); $("#scanResult").classList.remove("hidden");
    const b=$("#scanBadge"); b.className="result-badge"; if(status==="warning")b.classList.add("warning"); if(status==="error")b.classList.add("error"); b.textContent=status==="success"?"Berhasil":status==="warning"?"Sudah hadir":"Gagal";
    $("#scanName").textContent=r?.name||"QR tidak valid"; $("#scanNim").textContent=r?.nim||"-"; $("#scanProdi").textContent=r?.prodi||"-"; $("#scanSemester").textContent=r?.semester||"-"; $("#scanTime").textContent=formatDate(r?.timestamp||new Date().toISOString()); $("#scanMessage").textContent=msg;
  }

  function bindDashboard(){
    $("#unlockDashboardButton").addEventListener("click",async()=>{
      if($("#dashboardPin").value!==String(C.ADMIN_PIN))return toast("PIN panitia tidak valid.",true);
      state.dashboardUnlocked=true; $("#dashboardGate").classList.add("hidden"); $("#dashboardContent").classList.remove("hidden"); await loadDashboard();
    });
    $("#refreshDashboardButton").addEventListener("click",()=>state.dashboardUnlocked?loadDashboard():toast("Buka dashboard menggunakan PIN.",true));
    $("#attendanceSearch").addEventListener("input",renderTable);
    $("#exportXlsxButton").addEventListener("click",exportXlsx); $("#exportCsvButton").addEventListener("click",exportCsv); $("#exportBackupButton").addEventListener("click",exportBackup); $("#importBackupInput").addEventListener("change",importBackup); $("#clearDataButton").addEventListener("click",clearData);
  }

  async function loadDashboard(){ state.rows=(await getAll()).sort((a,b)=>new Date(b.timestamp)-new Date(a.timestamp)); renderStats(); renderTable(); }
  function renderStats(){ const today=dayKey(new Date()); $("#statPresent").textContent=state.rows.length; $("#statToday").textContent=state.rows.filter(x=>dayKey(new Date(x.timestamp))===today).length; $("#statPrograms").textContent=new Set(state.rows.map(x=>x.prodi)).size; }
  function renderTable(){
    const q=$("#attendanceSearch").value.trim().toLowerCase(), rows=state.rows.filter(x=>[x.name,x.nim,x.prodi,x.semester,x.method].some(v=>String(v).toLowerCase().includes(q))), body=$("#attendanceTableBody"); body.innerHTML="";
    if(!rows.length){body.innerHTML='<tr><td colspan="8">Belum ada data yang sesuai.</td></tr>';return}
    rows.forEach((x,i)=>{ const tr=document.createElement("tr"),labels=["No.","Waktu hadir","Nama","NIM","Program studi","Semester","Metode"],values=[i+1,formatDate(x.timestamp),x.name,x.nim,x.prodi,x.semester,x.method]; values.forEach((v,index)=>{const td=document.createElement("td");td.dataset.label=labels[index];td.textContent=v;tr.append(td)}); const td=document.createElement("td"),btn=document.createElement("button");td.dataset.label="Aksi";btn.className="icon-button";btn.type="button";btn.textContent="Hapus";btn.onclick=async()=>{if(confirm(`Hapus kehadiran ${x.name}?`)){await del(x.id);await loadDashboard();toast("Data dihapus.")}};td.append(btn);tr.append(td);body.append(tr); });
  }

  function exportRows(){return state.rows.slice().sort((a,b)=>new Date(a.timestamp)-new Date(b.timestamp)).map((x,i)=>({"No.":i+1,"Waktu Kehadiran":formatDate(x.timestamp),Nama:x.name,NIM:x.nim,"Program Studi":x.prodi,Semester:x.semester,Metode:x.method,"ID Acara":x.eventId}))}
  function exportXlsx(){
    if(!state.rows.length)return toast("Belum ada data untuk diekspor.",true); if(typeof XLSX==="undefined")return toast("Library Excel tidak tersedia. Gunakan CSV.",true);
    const ws=XLSX.utils.json_to_sheet(exportRows()); ws["!cols"]=[{wch:6},{wch:22},{wch:28},{wch:18},{wch:28},{wch:12},{wch:16},{wch:24}]; const wb=XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb,ws,"Daftar Kehadiran"); XLSX.writeFile(wb,`Kehadiran-FEB-Days-2026-${fileDate()}.xlsx`); toast("File Excel berhasil dibuat.");
  }
  function exportCsv(){
    if(!state.rows.length)return toast("Belum ada data untuk diekspor.",true); const rows=exportRows(),headers=Object.keys(rows[0]),csv=[headers.map(csvCell).join(","),...rows.map(r=>headers.map(h=>csvCell(r[h])).join(","))].join("\r\n"); download(new Blob(["\uFEFF"+csv],{type:"text/csv;charset=utf-8"}),`Kehadiran-FEB-Days-2026-${fileDate()}.csv`); toast("File CSV berhasil dibuat.");
  }
  function exportBackup(){ if(!state.rows.length)return toast("Belum ada data untuk dibackup.",true); download(new Blob([JSON.stringify({app:"FEB Days 2026 Local Attendance",version:1,eventId:C.EVENT_ID,exportedAt:new Date().toISOString(),attendance:state.rows},null,2)],{type:"application/json"}),`Backup-FEBDAYS2026-${fileDate()}.json`); toast("Backup JSON berhasil dibuat."); }
  async function importBackup(e){
    const file=e.target.files?.[0];e.target.value="";if(!file)return;
    try{const data=JSON.parse(await file.text());if(data.eventId!==C.EVENT_ID||!Array.isArray(data.attendance))throw Error("File backup tidak sesuai acara ini.");let added=0;for(const x of data.attendance){if(x.id&&x.name&&x.nim&&!await getByNim(String(x.nim).toUpperCase())){await put({...x,nim:String(x.nim).toUpperCase()});added++}}await loadDashboard();toast(`${added} data baru berhasil digabungkan.`)}catch(err){toast(err.message||"Backup tidak dapat dibaca.",true)}
  }
  async function clearData(){ if(prompt('Ketik "HAPUS" untuk menghapus seluruh data.')!=="HAPUS")return; await clearStore(); await loadDashboard(); toast("Seluruh data lokal telah dihapus."); }

  function csvCell(v){return `"${String(v??"").replace(/"/g,'""')}"`}
  function download(blob,name){const url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)}
  function formatDate(v){return new Intl.DateTimeFormat("id-ID",{dateStyle:"medium",timeStyle:"medium"}).format(new Date(v))}
  function dayKey(d){return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`}
  function fileDate(){return new Date().toISOString().slice(0,10)}
  function beep(f){try{const A=window.AudioContext||window.webkitAudioContext,c=new A(),o=c.createOscillator(),g=c.createGain();o.frequency.value=f;g.gain.value=.06;o.connect(g);g.connect(c.destination);o.start();o.stop(c.currentTime+.13)}catch(_){}}
  function toast(msg,error=false){const t=$("#toast");t.textContent=msg;t.classList.toggle("error",error);t.classList.add("show");clearTimeout(toast.timer);toast.timer=setTimeout(()=>t.classList.remove("show"),3400)}

  function bindPwa(){
    window.addEventListener("beforeinstallprompt",e=>{e.preventDefault();state.installPrompt=e;$("#installButton").classList.remove("hidden")});
    $("#installButton").addEventListener("click",async()=>{if(!state.installPrompt)return;state.installPrompt.prompt();await state.installPrompt.userChoice;state.installPrompt=null;$("#installButton").classList.add("hidden")});
    if("serviceWorker" in navigator)window.addEventListener("load",()=>navigator.serviceWorker.register("./sw.js").catch(()=>{}));
  }

  function openDb(){return new Promise((res,rej)=>{const r=indexedDB.open(DB_NAME,1);r.onupgradeneeded=()=>{const db=r.result;if(!db.objectStoreNames.contains(STORE)){const s=db.createObjectStore(STORE,{keyPath:"id"});s.createIndex("nim","nim",{unique:true});s.createIndex("timestamp","timestamp")}};r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error)})}
  async function tx(mode,fn){const db=await openDb();return new Promise((res,rej)=>{const t=db.transaction(STORE,mode),s=t.objectStore(STORE);let r;try{r=fn(s)}catch(e){db.close();return rej(e)}t.oncomplete=()=>{db.close();res(r?.result)};t.onerror=()=>{db.close();rej(t.error||r?.error)}})}
  const put=x=>tx("readwrite",s=>s.put(x)),getAll=()=>tx("readonly",s=>s.getAll()),del=id=>tx("readwrite",s=>s.delete(id)),clearStore=()=>tx("readwrite",s=>s.clear());
  async function getByNim(nim){const db=await openDb();return new Promise((res,rej)=>{const r=db.transaction(STORE,"readonly").objectStore(STORE).index("nim").get(nim);r.onsuccess=()=>{db.close();res(r.result||null)};r.onerror=()=>{db.close();rej(r.error)}})}
})();

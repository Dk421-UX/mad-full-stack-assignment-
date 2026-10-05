const $ = id => document.getElementById(id);
const steps = [...document.querySelectorAll('.step')];
const total = 10;
let current = 1;

const fields = ['fullName','email','phone','college','department','projectTitle','projectCategory','projectDescription','comments'];
const labels = ['Name','Email','Phone','College','Department','Project Title','Category','Description','Comments'];

function value(id){ return $(id)?.value.trim() || ''; }
function year(){ return document.querySelector('input[name="year"]:checked')?.value || ''; }
function photoFile(){ return $('profilePhoto')?.files[0] || null; }

function updateUI(){
  steps.forEach(s => s.classList.toggle('active', +s.dataset.step === current));
  const pct = Math.round(current / 10 * 100);
  $('stepCounter').textContent = current <= 10 ? `Step ${current} of 10` : 'Review';
  $('progressPercent').textContent = current <= 10 ? pct + '%' : '100%';
  $('progressFill').style.width = (current <= 10 ? pct : 100) + '%';
  $('prevBtn').disabled = current === 1 || current > 10;
  $('nextBtn').style.display = current <= 10 ? 'inline-flex' : 'none';
  $('navSection').classList.toggle('hidden', current >= 11);
  document.querySelectorAll('.step-dot').forEach((d,i)=>d.className='step-dot '+(i+1===current?'active':i+1<current?'done':''));
  document.querySelectorAll('.nav-dot').forEach((d,i)=>d.className='nav-dot '+(i+1===current?'active':''));
}

function makeDots(){
  $('stepDots').innerHTML = Array.from({length:10},(_,i)=>`<span class="step-dot ${i===0?'active':''}"></span>`).join('');
  $('navDots').innerHTML = Array.from({length:10},(_,i)=>`<span class="nav-dot ${i===0?'active':''}"></span>`).join('');
}

function error(id,msg){ const e=$('err-'+id); if(e){e.textContent=msg;e.classList.toggle('visible',!!msg);} const x=$(id); if(x)x.classList.toggle('has-error',!!msg); }
function clearError(id){ error(id,''); }

function validStep(n){
  if(n===1){ if(!value('fullName')){error('fullName','Please enter your full name.');return false;} }
  if(n===2){ if(!value('email') || !/^\S+@\S+\.\S+$/.test(value('email'))){error('email','Enter a valid email.');return false;} }
  if(n===3 && value('phone') && !/^\d{10}$/.test(value('phone'))){error('phone','Enter a 10-digit number.');return false;}
  if(n===6 && !year()){ $('err-year').textContent='Please select your year.'; $('err-year').classList.add('visible'); return false; }
  if(n===6){ $('err-year').classList.remove('visible'); }
  return true;
}

function review(){
  const data = [value('fullName'),value('email'),value('phone'),value('college'),value('department'),year(),value('projectTitle'),value('projectCategory'),value('projectDescription'),value('comments')];
  $('reviewCards').innerHTML = data.map((v,i)=>`<div class="review-item"><div class="review-item-icon">${i+1}</div><div class="review-item-label">${labels[i]}</div><div class="review-item-value ${v?'':'empty'}">${escapeHtml(v||'Not provided')}</div></div>`).join('');
}
function escapeHtml(s){return s.replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));}

$('nextBtn').onclick = () => { if(current<=10 && validStep(current)){ current++; if(current===11) review(); updateUI(); window.scrollTo({top:0,behavior:'smooth'}); } };
$('prevBtn').onclick = () => { if(current>1){current--;updateUI();} };
$('editBtn').onclick = () => { current=1; updateUI(); };
$('submitBtn').onclick = () => $('confirmModal').classList.add('open');
$('cancelModalBtn').onclick = () => $('confirmModal').classList.remove('open');
$('confirmSubmitBtn').onclick = submitForm;

async function submitForm(){
  const fd = new FormData();
  const map = {fullName:'name',email:'email',phone:'phone',college:'college',department:'department',projectTitle:'projectTitle',projectCategory:'projectCategory',projectDescription:'projectDescription',comments:'comments'};
  Object.entries(map).forEach(([id,key])=>fd.append(key,value(id)));
  fd.append('year',year());
  if(photoFile()) fd.append('photo',photoFile());
  const btn=$('confirmSubmitBtn'); btn.disabled=true; btn.textContent='Saving...';
  try{
    const r=await fetch('/api/students',{method:'POST',body:fd});
    const data=await r.json();
    if(!r.ok) throw new Error(data.error||'Save failed');
    $('confirmModal').classList.remove('open');
    $('submissionId').textContent='VYA-'+String(data.id).padStart(5,'0');
    const now=new Date(); $('submissionDate').textContent=now.toLocaleDateString(); $('submissionTime').textContent=now.toLocaleTimeString();
    current=12; updateUI();
  }catch(e){ alert(e.message); }
  finally{btn.disabled=false;btn.innerHTML='✓ Yes, Submit!';}
}

$('projectDescription').addEventListener('input',e=>{const n=e.target.value.length;$('charCount').textContent=`${n} / 300`;$('charBar').style.width=n/300*100+'%';});
document.querySelectorAll('input[name="year"]').forEach(r=>r.addEventListener('change',()=>document.querySelectorAll('.radio-card').forEach(c=>c.classList.toggle('selected',c.querySelector('input').checked))));
$('downloadPdfBtn').onclick=()=>window.print();
$('printBtn').onclick=()=>window.print();
$('resetBtn').onclick=()=>location.reload();
fields.forEach(id=>$(id)?.addEventListener('input',()=>clearError(id)));
makeDots(); updateUI();

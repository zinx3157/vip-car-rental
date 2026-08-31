/* VIP Car Rental — Supabase-backed GitHub Pages client */
'use strict';

const SUPABASE_URL = 'https://nlhvlykmdkjimwkyyvhw.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_zlgE2LCv9tLSRCpYY6OLVQ_1lBeEBv5';
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

const services=[['01','Mariages','Véhicule avec chauffeur, décoration et créneau garanti pour accompagner votre journée.'],['02','Transferts VIP','Aéroport, hôtels, rendez-vous et longue distance avec un chauffeur ponctuel.'],['03','Entreprises, ONG & Santé','Contrats récurrents, facturation formelle et point de contact unique.']];
const cars=[['Mercedes-Benz E-Class','Berline • 4 places','50 000 Ar / h','photo-1618843479313-40f8afb4b4d8'],['Toyota Land Cruiser','SUV 4×4 • 7 places','60 000 Ar / h','photo-1594502184342-2e12f877aa73'],['Mercedes-Benz V-Class','Van premium • 8 places','70 000 Ar / h','photo-1549317661-bd32c8ce0db2'],['Toyota Hilux','Pickup • 5 places','45 000 Ar / h','photo-1559416523-140ddc3d238c'],['Hyundai Tucson','SUV • 5 places','40 000 Ar / h','photo-1568844293986-8d0400bd4745'],['Toyota Prado','SUV premium • 7 places','55 000 Ar / h','photo-1519641471654-76ce0107ad1b']];
const trips=[['Antsirabe','170 km','3h30','150 000 Ar'],['Toamasina','354 km','6h00','280 000 Ar'],['Mahajanga','546 km','9h00','420 000 Ar'],['Fianarantsoa','411 km','7h00','320 000 Ar'],['Toliara','927 km','14h00','650 000 Ar'],['Antsiranana','1 094 km','16h00','780 000 Ar'],['Morondava','655 km','10h00','480 000 Ar'],['Sambava','586 km','9h30','450 000 Ar'],['Tolagnaro','1 110 km','16h30','800 000 Ar']];
let reservations=[];

function safeStaticMarkup(){
  const cardHTML=services.map(s=>`<article><span>${s[0]}</span><h3>${s[1]}</h3><p>${s[2]}</p><button type="button" onclick="show('booking')">Demander un devis →</button></article>`).join('');
  document.querySelector('#service-cards').innerHTML=cardHTML;
  document.querySelector('#home-services').innerHTML=`<section class="section cards">${cardHTML}</section>`;
  document.querySelector('#fleet-grid').innerHTML=cars.map(c=>`<article class="vehicle"><img src="https://images.unsplash.com/${c[3]}?auto=format&fit=crop&w=900&q=80" alt="${c[0]}" loading="lazy"><div><p class="kick">${c[1]}</p><h3>${c[0]}</h3><footer><b>${c[2]}</b><button type="button" class="secondary" onclick="show('booking')">Réserver</button></footer></div></article>`).join('');
  document.querySelector('#route-list').innerHTML=trips.map(r=>`<div class="route"><b>Tana → ${r[0]}</b><span>${r[1]}</span><span>${r[2]}</span><strong>${r[3]}</strong></div>`).join('');
}

function notify(message,kind='success'){
  const toast=document.querySelector('#toast');
  toast.textContent=message; toast.dataset.kind=kind; toast.classList.add('show');
  clearTimeout(notify.timer); notify.timer=setTimeout(()=>toast.classList.remove('show'),5000);
}
function setBusy(form,busy,label){
  const button=form.querySelector('button[type="submit"]');
  button.disabled=busy; button.setAttribute('aria-busy',String(busy));
  if(!button.dataset.label) button.dataset.label=button.textContent;
  button.textContent=busy?label:button.dataset.label;
}
function setFieldError(input,message=''){
  const error=document.querySelector(`#${input.id}-error`);
  input.setAttribute('aria-invalid',String(Boolean(message)));
  if(error) error.textContent=message;
}
function validatePhone(value){return /^\+?[0-9](?:[0-9 .()-]{6,18}[0-9])$/.test(value.trim())}

async function show(id){
  if(id==='admin'){
    const {data:{session}}=await supabaseClient.auth.getSession();
    if(!session){notify('Connectez-vous pour accéder à l’administration.','error');id='login'}
  }
  document.querySelectorAll('.view').forEach(x=>x.classList.add('hidden'));
  document.querySelector('#'+id).classList.remove('hidden');
  document.querySelector('#footer').classList.toggle('hidden',id==='admin'||id==='login');
  document.querySelector('#nav').classList.remove('open');
  const menu=document.querySelector('.hamb'); menu?.setAttribute('aria-expanded','false');
  history.replaceState(null,'',id==='home'?'./':`#${id}`); scrollTo(0,0);
  if(id==='admin') await renderAdmin('overview');
}
function toggleMenu(){const nav=document.querySelector('#nav');const open=nav.classList.toggle('open');document.querySelector('.hamb').setAttribute('aria-expanded',String(open))}

async function submitBooking(event){
  event.preventDefault(); const form=event.currentTarget;
  const phone=form.elements.phone, date=form.elements.date;
  setFieldError(phone,''); setFieldError(date,'');
  if(!validatePhone(phone.value)){setFieldError(phone,'Saisissez un numéro valide, avec indicatif si possible.');phone.focus();return}
  if(date.value < new Date().toISOString().slice(0,10)){setFieldError(date,'La date doit être aujourd’hui ou ultérieure.');date.focus();return}
  if(!form.reportValidity()) return;
  const data=Object.fromEntries(new FormData(form));
  setBusy(form,true,'Envoi en cours…');
  const {error}=await supabaseClient.from('reservations').insert({
    customer_name:data.name.trim(),phone:data.phone.trim(),email:data.email.trim().toLowerCase(),
    pickup_location:data.from.trim(),destination:data.to.trim(),pickup_date:data.date,pickup_time:data.time,
    vehicle_type:data.vehicle,service_type:data.service,notes:data.notes.trim()||null
  });
  setBusy(form,false);
  if(error){console.error(error);notify('Envoi impossible. Vérifiez la connexion ou la configuration Supabase.','error');return}
  form.reset(); setMinimumDate(); notify('Demande envoyée. Nous vous recontacterons rapidement.');
}

async function login(event){
  event.preventDefault(); const form=event.currentTarget;
  const email=form.elements.email,password=form.elements.password;
  setFieldError(email,'');setFieldError(password,'');if(!form.reportValidity())return;setBusy(form,true,'Connexion…');
  const {error}=await supabaseClient.auth.signInWithPassword({email:email.value.trim(),password:password.value});
  setBusy(form,false);
  if(error){setFieldError(password,'Email ou mot de passe incorrect.');password.focus();return}
  form.reset();await show('admin');
}
async function logout(){await supabaseClient.auth.signOut();reservations=[];notify('Vous êtes déconnecté.');await show('home')}
async function loadReservations(){
  const {data,error}=await supabaseClient.from('reservations').select('*').order('created_at',{ascending:false});
  if(error){console.error(error);notify('Impossible de charger les réservations.','error');return false}
  reservations=data||[];return true;
}
function el(tag,text,className){const node=document.createElement(tag);if(text!==undefined)node.textContent=text;if(className)node.className=className;return node}
function renderTable(container){
  const panel=el('div',undefined,'panel'),h=el('h3','Réservations'),table=el('table');
  table.innerHTML='<thead><tr><th>Référence</th><th>Client</th><th>Date</th><th>Trajet</th><th>Statut</th></tr></thead>';
  const body=document.createElement('tbody');
  if(!reservations.length){const tr=document.createElement('tr'),td=el('td','Aucune réservation pour le moment.');td.colSpan=5;tr.append(td);body.append(tr)}
  reservations.forEach(r=>{
    const tr=document.createElement('tr');
    const ref=el('td'),client=el('td'),date=el('td'),route=el('td'),status=el('td');
    ref.append(el('b',r.reference_code||r.id.slice(0,8).toUpperCase()));
    client.append(el('b',r.customer_name),el('small',r.phone),el('small',r.email));
    date.append(document.createTextNode(r.pickup_date),el('small',r.pickup_time?.slice(0,5)||''));
    route.append(document.createTextNode(r.pickup_location),el('small',`→ ${r.destination}`));
    const select=document.createElement('select');select.setAttribute('aria-label',`Statut de ${r.reference_code||r.customer_name}`);
    ['En attente','Confirmée','En mission','Terminée','Annulée'].forEach(s=>{const o=el('option',s);o.value=s;o.selected=r.status===s;select.append(o)});
    select.addEventListener('change',()=>statusChange(r.id,select.value));status.append(select);tr.append(ref,client,date,route,status);body.append(tr);
  });
  table.append(body);panel.append(h,table);container.append(panel);
}
async function statusChange(id,status){
  const {error}=await supabaseClient.from('reservations').update({status}).eq('id',id);
  if(error){notify('Le statut n’a pas été mis à jour.','error');return}
  await renderAdmin('reservations');notify('Statut mis à jour.');
}
async function renderAdmin(tab){
  if(!await loadReservations())return;
  const content=document.querySelector('#adminContent');content.replaceChildren();
  const pending=reservations.filter(x=>x.status==='En attente').length;
  document.querySelector('#bellCount').textContent=pending;
  const titles={overview:'Vue d’ensemble',reservations:'Réservations',fleetAdmin:'Flotte',routesAdmin:'Trajets',clients:'Clients'};
  document.querySelector('#adminTitle').textContent=titles[tab];
  if(tab==='overview'){
    const stats=el('div',undefined,'stats');[['Réservations',reservations.length],['En attente',pending],['Véhicules',9],['Trajets',9]].forEach(([k,v])=>{const a=el('article',undefined,'stat');a.append(el('span',k),el('strong',String(v)));stats.append(a)});content.append(stats);renderTable(content);
  }else if(tab==='reservations')renderTable(content);
  else if(tab==='fleetAdmin'){const p=el('div',undefined,'panel');p.append(el('h3','Flotte active'));cars.forEach(c=>p.append(el('p',`${c[0]} • ${c[1]} • ${c[2]}`)));content.append(p)}
  else if(tab==='routesAdmin'){const p=el('div',undefined,'panel');p.append(el('h3','Trajets tarifés'));trips.forEach(r=>p.append(el('p',`Tana → ${r[0]} • ${r[1]} • ${r[3]}`)));content.append(p)}
  else {const p=el('div',undefined,'panel');p.append(el('h3','Clients'));const unique=[...new Map(reservations.map(r=>[r.email,r])).values()];unique.forEach(r=>p.append(el('p',`${r.customer_name} • ${r.email} • ${r.phone}`)));if(!unique.length)p.append(document.createTextNode('Aucun client.'));content.append(p)}
}
function adminTab(tab,button){document.querySelectorAll('.admin aside button').forEach(x=>x.classList.remove('active'));button.classList.add('active');renderAdmin(tab)}
function setMinimumDate(){const d=document.querySelector('#booking-date');if(d)d.min=new Date().toISOString().slice(0,10)}

document.addEventListener('DOMContentLoaded',async()=>{
  safeStaticMarkup();setMinimumDate();
  document.querySelector('#bookingForm').addEventListener('submit',submitBooking);
  document.querySelector('#loginForm').addEventListener('submit',login);
  const route=location.hash.slice(1);if(route&&document.getElementById(route))await show(route);
});
supabaseClient.auth.onAuthStateChange((event)=>{if(event==='SIGNED_OUT'&&!document.querySelector('#admin').classList.contains('hidden'))show('home')});

window.show=show;window.toggleMenu=toggleMenu;window.adminTab=adminTab;window.logout=logout;window.notify=notify;

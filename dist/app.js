/* Heftruck Balanslab — alle instellingen blijven lokaal in de browser. */
(() => {
  'use strict';
  const M=window.BalansModel, $=id=>document.getElementById(id);
  const fmt=(n,d=0)=>new Intl.NumberFormat('nl-NL',{maximumFractionDigits:d,minimumFractionDigits:d}).format(n);
  const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
  const C={teal:'#248577',orange:'#e69043',purple:'#7962b8',red:'#c74738',ink:'#28473d',soft:'#9da98f'};
  let state={...M.defaults}, result=M.compute(state), view='side', tab='lab', activeExercise=null, feedback='', feedbackOK=false, selectedFactor=null;
  let completed=[];
  try { const saved=JSON.parse(localStorage.getItem('balanslab-progress-v1')||'[]'); if(Array.isArray(saved)) completed=[...new Set(saved.filter(x=>Number.isInteger(x)&&x>=0&&x<7))]; } catch(e) {}
  const controls=[
    {key:'weight',name:'Lastgewicht',unit:'kg',min:0,max:3000,step:50,start:'0 kg',end:'3.000 kg',help:'Het gewicht van de lading, inclusief pallet.',group:'load'},
    {key:'center',name:'Lastafstand (LZP)',unit:'mm',min:300,max:1200,step:25,start:'300 mm',end:'1.200 mm',help:'Vanaf de vorkrug tot het zwaartepunt van de last.',group:'load'},
    {key:'height',name:'Hefhoogte',unit:'mm',min:100,max:4500,step:100,start:'100 mm',end:'4.500 mm',help:'Hoogte van de vorken boven de vloer.',group:'load'},
    {key:'tilt',name:'Mastneiging',unit:'°',min:-6,max:6,step:1,start:'−6° achterover',end:'+6° voorover',help:'Voorover brengt de last verder van de vooras.',group:'load'},
    {key:'brake',name:'Remvertraging',unit:'m/s²',min:0,max:4,step:0.2,start:'0 · geen remming',end:'4 · krachtig',help:'Effect van remmen bij vooruitrijden.',group:'motion'},
    {key:'speed',name:'Snelheid in de bocht',unit:'km/u',min:0,max:15,step:0.5,start:'0 km/u',end:'15 km/u',help:'Bij 0 km/u is er geen bochteffect.',group:'motion'},
    {key:'radius',name:'Bochtstraal',unit:'m',min:1.5,max:8,step:0.5,start:'1,5 m · krap',end:'8 m · ruim',help:'Een kleinere straal geeft een sterkere zijdelingse kracht.',group:'motion'},
    {key:'slope',name:'Langshelling',unit:'°',min:-8,max:8,step:1,start:'−8° opwaarts',end:'+8° neerwaarts',help:'Positief: de last wijst naar beneden op de helling.',group:'motion'},
    {key:'offset',name:'Last uit het midden',unit:'mm',min:-350,max:350,step:25,start:'−350 mm · binnen',end:'+350 mm · buiten',help:'Positief: verplaatsing naar de buitenzijde van de bocht.',group:'motion'}
  ];
  const factors=[
    {key:'weight',icon:'↓',title:'Lastgewicht',body:'Meer massa in de last trekt het gezamenlijke zwaartepunt naar voren. Het lastmoment neemt toe. Ook een compacte, zware last kan de balans verstoren.',try:'Vergroot de last van 1.000 naar 2.500 kg. Volg de groene stip en de marge.',setup:{...M.defaults},insight:'Meer lastgewicht trekt het gezamenlijke zwaartepunt naar de last. De kantellijn bij de voorwielen blijft op dezelfde plek.'},
    {key:'center',icon:'↔',title:'Lastafstand',body:'Het lastzwaartepunt ligt bij een gelijkmatig verdeelde last ongeveer in het midden. Een lange last of ruimte tussen last en vorkrug vergroot de hefboomarm. Het toegestane gewicht neemt af.',try:'Laat 1.500 kg gelijk en schuif de afstand van 500 naar 1.000 mm.',setup:{...M.defaults,weight:1500},insight:'De arm loopt vanaf de vooras tot het lastzwaartepunt. Een grotere lastafstand vergroot het kantelende moment, ook bij hetzelfde gewicht.'},
    {key:'height',icon:'↟',title:'Hefhoogte',body:'Heffen brengt het gezamenlijke zwaartepunt omhoog. Op een vlakke vloer met verticale mast verandert daardoor het statische voorovermoment niet. Bij remmen en bochten neemt het kantelrisico wel toe.',try:'Vergelijk 200 en 4.000 mm. Voeg daarna 2 m/s² remvertraging toe.',setup:{...M.defaults,weight:1500},insight:'Een hoog zwaartepunt vergroot de verschuiving van de krachtprojectie bij remmen, bochten en een helling. Hoogte alleen verschuift het statische zwaartepunt niet naar voren.'},
    {key:'tilt',icon:'∠',title:'Mastneiging',body:'Voorover neigen brengt de last naar voren en vergroot het lastmoment. Dit effect is sterker bij een hoog geheven last. Achterover neigen geeft geen toestemming om het fabrikantdiagram te overschrijden.',try:'Neig bij 3.500 mm hefhoogte voorzichtig van −6° naar +6°.',setup:{...M.defaults,weight:1500,height:3500},insight:'Bij een hoog geheven last verplaatst een kleine mastneiging het lastzwaartepunt al duidelijk naar voren. Let op de oranje stip en de langere arm.'},
    {key:'brake',icon:'⇥',title:'Remmen',body:'Bij remmen tijdens vooruitrijden wil de massa doorbewegen. De resulterende kracht grijpt verder naar voren op de grond aan. Het fysieke zwaartepunt springt daarbij niet ineens naar voren.',try:'Stel de last hoog in en verhoog de remvertraging. Vergelijk groen en paars.',setup:{...M.defaults,weight:1500,height:3500},insight:'Bij remmen verschuift vooral de paarse krachtprojectie naar voren. Het groene massazwaartepunt blijft bij dezelfde last en maststand op zijn plek.'},
    {key:'speed',icon:'↱',title:'Snelheid & bochtstraal',body:'In een bocht verplaatst de krachtprojectie naar de buitenzijde. Het effect groeit met het kwadraat van de snelheid: twee keer zo snel geeft vier keer de zijdelingse versnelling bij dezelfde straal.',try:'Vergelijk 5 en 10 km/u in dezelfde bocht. Maak daarna de bocht ruimer.',setup:{...M.defaults,weight:1200,height:3000,speed:5,radius:3},insight:'Snelheid werkt kwadratisch door in de bocht: a = v² / r. Een hoog zwaartepunt en een krappe bocht maken de zijwaartse marge kleiner.'},
    {key:'slope',icon:'╱',title:'Helling',body:'Op een helling wijst de zwaartekracht niet loodrecht op de vloer. De krachtprojectie verschuift ten opzichte van het steunvlak. Dit lab toont alleen een langshelling; een dwarshelling wordt niet berekend.',try:'Vergelijk een vlakke vloer en 6° neerwaarts, eerst met een lage en dan een hoge last.',setup:{...M.defaults,weight:1500,height:3000},insight:'De vloer en de heftruck hellen samen. De zwaartekracht blijft recht omlaag werken. Neerwaarts met de last naar beneden verschuift de krachtprojectie richting de voorste kantellijn.'},
    {key:'offset',icon:'⇄',title:'Lastverdeling',body:'Een last uit het midden trekt het gezamenlijke zwaartepunt zijwaarts. Naar de buitenkant van een bocht wordt de marge nog kleiner. Een onregelmatige last heeft niet altijd het zwaartepunt in het geometrische midden.',try:'Verplaats de last naar de buitenzijde van een bocht. Kijk naar de driehoek.',setup:{...M.defaults,weight:1500,height:2000,speed:6,radius:3},insight:'Een ongelijke lastverdeling verschuift het massazwaartepunt zijwaarts. Valt dit samen met de buitenzijde van de bocht, dan neemt de marge verder af.'}
  ];
  const exercises=[
    {title:'De lange last',label:'LASTAFSTAND',desc:'Een pallet van 1.800 kg ligt met het zwaartepunt op 900 mm. Dat is buiten het fictieve lastdiagram. Breng de last dichter bij de vorkrug.',predict:'Wat gebeurt er met het gezamenlijke zwaartepunt als je de last dichterbij brengt?',goal:'Breng de afstand terug tot maximaal 550 mm. Houd het gewicht op 1.800 kg.',setup:{...M.defaults,weight:1800,center:900},keys:['center'],check:s=>s.center<=550,success:'De kortere arm verlaagt het lastmoment. Het gezamenlijke zwaartepunt ligt verder achter de vooras en de last valt weer binnen het fictieve diagram.',hint:'Verklein de lastzwaartepuntafstand met de schuif. Het gewicht blijft in deze opdracht gelijk.'},
    {title:'Remmen met een hoge last',label:'HOOGTE & REMMEN',desc:'De heftruck remt met een last op 4.000 mm. De krachtprojectie ligt voor de kantellijn. Laat zien waarom je laag moet rijden.',predict:'Blijft de groene stip op dezelfde horizontale plek als je de last laat zakken?',goal:'Verlaag de hefhoogte tot maximaal 300 mm. Laat de remvertraging op 2 m/s² staan.',setup:{...M.defaults,weight:1500,height:4000,brake:2},keys:['height'],check:s=>s.height<=300,success:'Laag vervoeren vermindert de invloed van het remmen. De paarse projectie komt terug binnen het steunvlak, terwijl het statische voorovermoment gelijk blijft.',hint:'Laat de vorken zakken. Kijk hoe de afstand tussen de groene en paarse stip afneemt.'},
    {title:'Rustig door de bocht',label:'SNELHEID',desc:'Met een geheven last van 1.200 kg rijdt de heftruck 12 km/u door een bocht van 3 meter. De buitenste kantellijn wordt overschreden.',predict:'Hoe sterk neemt het bochteffect af als je de snelheid halveert?',goal:'Verlaag de snelheid tot maximaal 5 km/u. Laat hoogte en bochtstraal gelijk.',setup:{...M.defaults,weight:1200,height:3000,speed:12,radius:3},keys:['speed'],check:s=>s.speed<=5,success:'De zijdelingse versnelling daalt met het kwadraat van de snelheid. Bij halveren van de snelheid blijft een kwart van de bochtversnelling over. In de praktijk rijd je ook met een lage last.',hint:'Open Rijden & ondergrond en verlaag de bochtsnelheid. Bekijk de paarse stip in het bovenaanzicht.'},
    {title:'Niet voorover met de last',label:'MASTNEIGING',desc:'Een last van 1.500 kg staat op 3.500 mm hoogte, met de mast 6° voorover. Onderzoek hoe de maststand de arm vergroot.',predict:'Waarom heeft dezelfde neiging bovenin meer effect dan vlak boven de vloer?',goal:'Breng de mast naar 0°. Houd de hoogte en het gewicht gelijk.',setup:{...M.defaults,weight:1500,height:3500,tilt:6},keys:['tilt'],check:s=>s.tilt===0,success:'Door de mast recht te zetten komt het lastzwaartepunt dichter bij de vooras. De hefboomarm wordt korter. Het fictieve lastdiagram blijft een aparte grens.',hint:'Zet de mastneiging op 0°. Volg de oranje stip en het lastmoment.'},
    {title:'Herstel de hele situatie',label:'COMBINEER JE INZICHT',desc:'Een lange last, hoge vorken, een krappe bocht en stevig remmen: meerdere factoren versterken elkaar. Pas nu zelf verschillende instellingen aan.',predict:'Welke twee veranderingen leveren volgens jou het meeste voordeel op?',goal:'Maak de last laag (max. 300 mm), rijd max. 4 km/u en rem rustig (max. 1 m/s²). Blijf binnen het fictieve lastdiagram en houd minimaal 150 mm marge.',setup:{...M.defaults,weight:1800,center:850,height:3500,tilt:4,speed:10,brake:2.6,radius:2.5,offset:150},keys:null,check:(s,r)=>s.height<=300&&s.speed<=4&&s.brake<=1&&r.utilization<=1&&r.margin>=.15,success:'Je hebt meerdere oorzaken aangepakt. Een lage, goed geplaatste last en rustige bewegingen geven in dit model weer marge. Toets een echte taak altijd aan het juiste lastdiagram.',hint:'Begin met laag rijden, een lagere snelheid en rustig remmen. Controleer daarna lastafstand, maststand en lastverdeling.'}
  ];
  exercises.push(
    {type:'diagram',title:'Lees het Deltalinqs-diagram',label:'JOUW TRAININGSDIAGRAM',desc:'Gebruik het aangeleverde lastdiagram. Lees de lastgrens af bij 4.000 mm hefhoogte en 1.000 mm lastzwaartepuntafstand.'},
    {type:'diagram',title:'Lees de Toyota-lasttabel',label:'ECHTE FABRIKANTGEGEVENS',desc:'Oefen met de gepubliceerde restcapaciteiten van de Toyota Traigo 48 9FBEK16T. Ontdek het effect van hoogte en lastafstand.'}
  );
  const presets={standard:{...M.defaults},long:{...M.defaults,weight:1800,center:1000},high:{...M.defaults,weight:1500,height:4000,brake:3},turn:{...M.defaults,weight:1200,height:3000,speed:12,radius:3}};

  function buildControls() {
    for(const group of ['load','motion']) {
      $(group+'Controls').innerHTML=controls.filter(c=>c.group===group).map(c=>`<div class="control" data-key="${c.key}"><div class="controlhead"><label for="range-${c.key}">${c.name}<button type="button" data-info="${c.key}" aria-label="Uitleg over ${c.name}">ⓘ</button></label><span class="numberwrap"><input id="number-${c.key}" type="number" min="${c.min}" max="${c.max}" step="${c.step}" value="${state[c.key]}" aria-label="${c.name} invoeren"><small>${c.unit}</small></span></div><input id="range-${c.key}" type="range" min="${c.min}" max="${c.max}" step="${c.step}" value="${state[c.key]}" aria-label="${c.name}"><div class="rangecaption"><span>${c.start}</span><span>${c.end}</span></div><p class="controlhelp">${c.help}</p></div>`).join('');
    }
    for(const c of controls) {
      $('range-'+c.key).addEventListener('input',e=>setControl(c,Number(e.target.value)));
      $('number-'+c.key).addEventListener('input',e=>{
        const value=Number(e.target.value);
        if(e.target.value===''||!Number.isFinite(value)||value<c.min||value>c.max)return;
        state[c.key]=value;selectedFactor=c.key==='radius'?'speed':c.key;feedback='';feedbackOK=false;render();
      });
      $('number-'+c.key).addEventListener('change',e=>{
        const value=Number(e.target.value); setControl(c,Number.isFinite(value)?value:state[c.key]);
      });
    }
  }
  function setControl(c,value) {
    const rounded=Number((c.min+Math.round((clamp(value,c.min,c.max)-c.min)/c.step)*c.step).toFixed(3));
    state[c.key]=rounded;
    const f=factors.find(f=>f.key===c.key||(c.key==='radius'&&f.key==='speed'));
    selectedFactor=f?.key; feedback=''; feedbackOK=false;
    document.querySelectorAll('[data-preset]').forEach(b=>b.classList.remove('active'));
    render();
  }
  function syncControls() {
    for(const c of controls) {
      const r=$('range-'+c.key),n=$('number-'+c.key),locked=activeExercise!==null&&exercises[activeExercise].keys&&!exercises[activeExercise].keys.includes(c.key);
      r.value=state[c.key];if(document.activeElement!==n)n.value=state[c.key];r.disabled=locked;n.disabled=locked;
      r.setAttribute('aria-valuetext',fmt(state[c.key],c.step<1?1:0)+' '+c.unit);
      r.style.setProperty('--range',((state[c.key]-c.min)/(c.max-c.min)*100)+'%');
      n.title=locked?'Deze instelling blijft gelijk tijdens deze opdracht':'';
    }
    document.querySelectorAll('[data-preset]').forEach(b=>b.disabled=activeExercise!==null);
  }
  function showTab(next) {
    tab=next;
    for(const id of ['lab','learn','practice']) $(id).hidden=id!==next;
    document.querySelectorAll('[data-tab]').forEach(b=>{b.classList.toggle('active',b.dataset.tab===next);if(b.dataset.tab===next)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current');});
    if(next==='practice') renderPractice();
  }
  function showControls(group) {
    $('loadControls').hidden=group!=='load';$('motionControls').hidden=group!=='motion';
    document.querySelectorAll('[data-control]').forEach(b=>{b.classList.toggle('selected',b.dataset.control===group);b.setAttribute('aria-pressed',String(b.dataset.control===group));});
  }
  function setView(v) {view=v;render();}
  function cross(x,y,color,size=6) {return `<circle cx="${x}" cy="${y}" r="${size+3}" fill="white"/><circle cx="${x}" cy="${y}" r="${size}" fill="${color}"/><path d="M${x-size} ${y}h${2*size}M${x} ${y-size}v${2*size}" stroke="white" stroke-width="1"/>`;}
  function badge(x,y,text,color,w=190) {w=Math.max(w,text.length*8.5+25);return `<rect x="${x-w/2}" y="${y-17}" width="${w}" height="34" rx="5" fill="white" fill-opacity=".95"/><text x="${x}" y="${y+6}" text-anchor="middle" fill="${color}" font-size="18" font-weight="600">${text}</text>`;}
  function wheel(x,r) {
    return `<g transform="translate(${x},${-r})"><circle r="${r}" fill="#25322d" stroke="#17251f" stroke-width=".025"/><circle r="${r*.83}" fill="url(#tyre)"/><circle r="${r*.56}" fill="#b0b6a7" stroke="#737e6f" stroke-width=".025"/><circle r="${r*.34}" fill="#7c897c"/><circle r="${r*.16}" fill="#3b5143"/>${Array.from({length:7},(_,i)=>{const a=i*Math.PI*2/7;return `<circle cx="${Math.cos(a)*r*.42}" cy="${Math.sin(a)*r*.42}" r=".018" fill="#455448"/>`;}).join('')}${Array.from({length:12},(_,i)=>{const a=i*30;return `<path d="M-.04 ${-r*.91}l.11 .035" stroke="#4b5547" stroke-width=".028" transform="rotate(${a})"/>`;}).join('')}</g>`;
  }
  function drawScene() {
    if(view==='top') return drawTopScene();
    const r=result,s=state,S=Math.min(124,345/(Math.max(2.45,s.height/1000+1.03))),ox=440,gy=386;
    const xp=x=>ox+x*S,yp=z=>gy-z*S;
    const loadH=s.height/1000-0.10,depth=s.center/1000*2,mastH=Math.max(2.45,loadH+1.03);
    const tip=r.status==='tip'&&r.edge==='voor'?Math.min(9,2+Math.abs(r.margin)*20):0;
    const lx=xp(r.lx),ly=yp(r.lz),cx=xp(r.x),cy=yp(r.z),px=xp(r.px);
    const dimY=435;
    const plane=(x,y)=>{const p=M.floorToWorld((x-ox)/S,(gy-y)/S,s.slope);return {x:ox+p.x*S,y:gy-p.z*S};};
    const cgScreen=plane(cx,cy),labelY=Math.max(94,cgScreen.y-72),counterAnchor=plane(xp(-2.0),yp(.99));
    const planeBadge=(x,y,text,color,width)=>{const p=plane(x,y);return badge(p.x,clamp(p.y,35,468),text,color,width);};
    const slopeText=(s.slope>0?'+':'')+fmt(s.slope)+'° · '+(s.slope>0?'neerwaarts':s.slope<0?'opwaarts':'vlak');
    $('scene').innerHTML=`<defs>
      <linearGradient id="bodyGold" x1="0" y1="0" x2=".5" y2="1"><stop stop-color="#f4c56d"/><stop offset="1" stop-color="#d79a36"/></linearGradient>
      <linearGradient id="counter" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#627768"/><stop offset="1" stop-color="#344b3e"/></linearGradient>
      <linearGradient id="box" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#ddba82"/><stop offset="1" stop-color="#bd9258"/></linearGradient>
      <radialGradient id="tyre"><stop stop-color="#4f5d4c"/><stop offset=".7" stop-color="#303d30"/><stop offset="1" stop-color="#1d2b22"/></radialGradient>
      <pattern id="fineGrid" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M40 0H0V40" fill="none" stroke="#dce3d4" stroke-width=".6"/></pattern>
      <pattern id="floor" width="80" height="22" patternUnits="userSpaceOnUse" patternTransform="skewX(-35)"><path d="M0 0V22" stroke="#d9e0d1" stroke-width="1"/></pattern>
      <marker id="dimArrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0 0L10 5 0 10" fill="none" stroke="#9ca78c" stroke-width="1.3"/></marker>
    </defs>
    <rect width="860" height="490" fill="#f3f5ef"/><rect width="860" height="386" fill="url(#fineGrid)"/>
    <path d="M690 105V386m110-281V386M690 150H800M690 225H800M690 300H800" fill="none" stroke="#e0e5d8" stroke-width="3"/><path d="M695 150l100 75m-100 0l100 75m-100 0l100 75" stroke="#e5e9df" stroke-width="1.2"/>
    <g id="inclined-world" transform="rotate(${s.slope} ${ox} ${gy})" data-slope="${s.slope}">
    <rect x="-200" y="386" width="1260" height="400" fill="#e9eee2"/><rect x="-200" y="386" width="1260" height="400" fill="url(#floor)"/><path id="floor-edge" d="M-200 386H1060" stroke="#879e73" stroke-width="2"/>
    <ellipse cx="${ox-25}" cy="393" rx="${2.9*S}" ry="10" fill="#607450" opacity=".09"/>
    <g transform="rotate(${tip},${ox},${gy})"><g transform="translate(${ox} ${gy}) scale(${S})">
      <g id="truck-body" aria-label="Compacte heftruck met zichtbaar contragewicht en korte achteroverhang">
      <path d="M-2.13-.30v-.58q0-.20.16-.22l.73-.02q.20 0 .25.16l.05.66Z" fill="url(#counter)" stroke="#354b36" stroke-width=".018"/>
      <path d="M-2.10-.91q.02-.12.14-.13h.67l.10.10Z" fill="#829074"/>
      <path d="M-2.14-.51h.39v.20h-.37Z" fill="#354a31"/>
      <path d="M-2.13-.64h.15m-.15-.08h.15m-.15-.08h.15" stroke="#9aab88" stroke-width=".018"/>
      <rect x="-2.14" y="-.89" width=".043" height=".14" rx=".01" fill="#b94735"/><rect x="-2.14" y="-.92" width=".043" height=".035" fill="#efbb73"/>
      <path d="M-1.58-.24H.19v-.36l-.16-.20-.36-.12h-.28l-.25.29h-.61l-.15-.22Z" fill="url(#bodyGold)" stroke="#b17b2d" stroke-width=".018"/>
      <path d="M-1.48-.29H-.58l.17-.28H-.63l-.20.12h-.67Z" fill="#df9e3a"/>
      <path d="M-1.05-.94h.44v.27h-.44Z" fill="#48563f"/><path d="M-1.03-.91h.40" stroke="#869278" stroke-width=".018"/>
      <path d="M-1.48-.24v-.16h.68" fill="none" stroke="#a57832" stroke-width=".022"/>
      <path d="M-.84-.16h.36v-.09h-.36Z" fill="#3c5038"/><path d="M-.79-.27h.26" stroke="#768361" stroke-width=".035"/>
      <path d="M-1.61-1.03l-.035-1.07q0-.14.14-.14h1.15l.24 1.19" stroke="#243b2c" stroke-width=".064" fill="none" stroke-linejoin="round"/>
      <path d="M-1.59-2.26H-.28" stroke="#23372a" stroke-width=".09" stroke-linecap="round"/><path d="M-1.56-2.29H-.29" stroke="#65765b" stroke-width=".021"/>
      <path d="M-1.56-2.21l.02 1.16m1.12-1.16l.22 1.16" stroke="#42543c" stroke-width=".035"/>
      <path d="M-1.48-2.15H-.43l.18.95h-1.20Z" fill="#b8cfbb" opacity=".08"/>
      <path d="M-1.26-1.71l.045.42h.34q.07 0 .07.095v.045h-.53v-.53q0-.08.075-.03Z" fill="#303f31" stroke="#52624b" stroke-width=".02"/>
      <path d="M-1.03-1.17v.15m-.18-.025h.38" stroke="#374c35" stroke-width=".025"/>
      <path d="M-.45-1.06l-.18-.58" stroke="#40543c" stroke-width=".03"/><ellipse cx="-.64" cy="-1.66" rx=".13" ry=".035" fill="none" stroke="#344b32" stroke-width=".026" transform="rotate(-15 -.64 -1.66)"/>
      <path d="M-.26-1.04l.04-.30M-.36-1.04l.015-.28" stroke="#30452d" stroke-width=".017"/><circle cx="-.22" cy="-1.36" r=".03" fill="#a44d3d"/>
      <rect x="-1.56" y="-2.36" width=".09" height=".09" rx=".02" fill="#e5a43c"/><path d="M-1.515-2.38v-.05" stroke="#617048" stroke-width=".015"/>
      <path d="M-.42-.33a.43.43 0 0 1 .84 0" fill="#e7ad48" stroke="#aa7c2d" stroke-width=".025"/>
      <path d="M-2.06-.24a.315.315 0 0 1 .62 0" fill="#4c6444"/>
      ${wheel(-1.75,.255)}${wheel(0,.32)}
      <text x="-.96" y="-.38" fill="#6b4d20" font-family="Arial" font-size=".075" font-weight="bold">BALANSLAB 20</text>
      </g>
      <g transform="translate(.35 -.1) rotate(${s.tilt})">
        <path d="M-.12 0V${-mastH}h.10V0m.08 0V${-mastH}h.08V0" fill="#4e5f50" stroke="#283e2e" stroke-width=".015"/>
        <path d="M-.06 -.3V${-mastH+.08}M.1 -.3V${-mastH+.08}" stroke="#b2b9a9" stroke-width=".02"/>
        ${Array.from({length:Math.floor(mastH*5)},(_,i)=>`<path d="M-.03 ${-.2-i*.2}h.1" stroke="#687663" stroke-width=".02"/>`).join('')}
        <path d="M-.06 ${-mastH+.06}h.2" stroke="#2b402d" stroke-width=".09" stroke-linecap="round"/>
        <path d="M-.08 -.45L-.33 -1.1" stroke="#6d7869" stroke-width=".055"/><path d="M-.08 -.45L-.23 -.84" stroke="#b5baab" stroke-width=".032"/>
        <g transform="translate(0 ${-loadH})"><path d="M-.03 .05V-.95H.02V0H${depth+.17}l-.08.04H-.03Z" fill="#596a57"/>
          <path d="M0 0H${depth}v-.1H0Z" fill="#a1804b"/>
          <path d="M0-.02h.15v.045H0Zm${depth-.15} 0h.15v.025h-.15Z" fill="#8a6e43"/>
          ${s.weight>0?`<rect x="0" y="-.8" width="${depth}" height=".7" rx=".015" fill="url(#box)" stroke="#ad874f" stroke-width=".015"/>
          <path d="M0-.77H${depth}" stroke="#ecd1a0" stroke-width=".022"/><path d="M${depth*.25}-.79v.68m${depth*.75}-.68v.68" stroke="#947447" stroke-width=".02" opacity=".55"/>
          <path d="M0-.45H${depth}" stroke="#b48b51" stroke-width=".012"/>
          <rect x=".08" y="-.69" width="${Math.min(.53,depth-.12)}" height=".16" rx=".012" fill="#f4e9d1"/>
          <text x=".13" y="-.58" font-family="Arial" font-size=".105" fill="#4b4b35" font-weight="bold">${fmt(s.weight)} kg</text>
          <path d="M${depth}-.8l.06.03v.67l-.06-.01Z" fill="#a57e48"/>`:''}
        </g>
      </g>
    </g></g>
    <path d="M${lx} ${ly+9}V${gy}" stroke="${C.orange}" stroke-width="1" stroke-dasharray="3 4" opacity=".7"/>
    ${cross(lx,ly,C.orange,5)}${cross(cx,cy,C.teal,7)}
    <path id="force-line" d="M${cx} ${cy}L${px} ${gy}" stroke="${C.purple}" stroke-width="1.5" stroke-dasharray="5 4"/>
    <circle cx="${px}" cy="${gy}" r="7" fill="${C.purple}" stroke="white" stroke-width="2"/>
    <path d="M${ox} ${gy-18}V${gy+24}" stroke="${C.red}" stroke-width="2"/>
    <path d="M${ox-5} ${gy+24}l5-8 5 8Z" fill="${C.red}"/>
    <path d="M${xp(.35)} ${dimY-13}V${dimY+7}M${lx} ${dimY-13}V${dimY+7}M${xp(.35)+3} ${dimY}H${lx-3}" stroke="#a7b297" stroke-width="1" marker-start="url(#dimArrow)" marker-end="url(#dimArrow)"/>
    </g>
    <path d="M${cgScreen.x} ${labelY+17}V${cgScreen.y-10}" stroke="${C.teal}" stroke-width="1.4" class="cgline"/>
    ${badge(cgScreen.x,labelY,'Gezamenlijk zwaartepunt',C.teal,235)}
    <path d="M${counterAnchor.x} ${counterAnchor.y}L175 230H90" fill="none" stroke="#526b44" stroke-width="1.5"/>${badge(120,211,'Contragewicht','#425e35',180)}
    ${planeBadge(ox-115,gy+32,'Vaste kantellijn',C.red,190)}
    ${planeBadge((xp(.35)+lx)/2,dimY+23,'LZP '+fmt(s.center)+' mm','#465f3c',190)}
    ${s.slope!==0?'<path id="horizontal-reference" d="M695 386H835" stroke="#7b8d70" stroke-width="1.5" stroke-dasharray="6 5"/><text x="835" y="375" text-anchor="end" font-size="14" fill="#536b47">0° horizontaal</text>':''}
    <text x="27" y="472" font-size="14" fill="#526b45">${s.slope!==0?'Langshelling '+slopeText:s.height>1800?'Aanzicht schaalt mee met de hefhoogte':'Modelheftruck · 3.200 kg'}</text>
    ${tip?`<rect x="22" y="57" width="165" height="25" rx="5" fill="#fae5dc"/><text x="34" y="74" fill="#bc5a40" font-size="16">Begin van voorover kantelen</text>`:''}`;
  }
  function drawTopScene() {
    const r=result,s=state,S=155,ox=568,oy=253,xp=x=>ox+x*S,yp=y=>oy-y*S;
    const ppx=xp(r.px),ppy=yp(r.py),cpx=xp(r.x),cpy=yp(r.y),rear=xp(-1.75),half=M.truck.track/2*S;
    $('scene').innerHTML=`<defs><pattern id="topGrid" width="35" height="35" patternUnits="userSpaceOnUse"><path d="M35 0H0V35" fill="none" stroke="#dce3d3" stroke-width=".6"/></pattern></defs><rect width="860" height="490" fill="#f3f5ef"/><rect width="860" height="490" fill="url(#topGrid)"/>
    <text x="770" y="260" font-size="17" fill="#9aa88e">Vooruit →</text>
    <g opacity=".5"><rect x="${rear-60}" y="${oy-64}" width="299" height="128" rx="38" fill="#72846b"/><rect x="${rear-60}" y="${oy-61}" width="98" height="122" rx="26" fill="#385638"/><path d="M${rear+5} ${oy-60}h200v120h-200Z" fill="#d9b76f"/><rect x="${rear+26}" y="${oy-48}" width="140" height="96" rx="6" fill="#dfe8d8" stroke="#687e60" stroke-width="8"/>
    <rect x="${rear-16}" y="${oy-72}" width="36" height="19" rx="6" fill="#314b33"/><rect x="${rear-16}" y="${oy+53}" width="36" height="19" rx="6" fill="#314b33"/>
    <rect x="${ox-24}" y="${oy-half-14}" width="48" height="27" rx="5" fill="#314b33"/><rect x="${ox-24}" y="${oy+half-13}" width="48" height="27" rx="5" fill="#314b33"/>
    <path d="M${ox+20} ${oy-63}v126" stroke="#485e43" stroke-width="9"/>
    <rect x="${ox+51}" y="${oy-63-s.offset/1000*S}" width="${s.center/1000*2*S}" height="126" rx="3" fill="#d9b77b" stroke="#a0844f" stroke-width="2"/></g>
    <path d="M${rear} ${oy}L${ox} ${oy-half}V${oy+half}Z" fill="#81ad7628" stroke="#7b9b6b" stroke-width="1.5"/>
    <path d="M${ox} ${oy-half}V${oy+half}" stroke="${r.edge==='voor'&&r.status==='tip'?C.red:'#d4775d'}" stroke-width="3"/>
    ${r.edge==='zij'&&r.status==='tip'?`<path d="M${rear} ${oy}L${ox} ${r.py>0?oy-half:oy+half}" stroke="${C.red}" stroke-width="3"/>`:''}
    <path d="M${cpx} ${cpy}L${ppx} ${ppy}" stroke="${C.purple}" stroke-width="1.8" stroke-dasharray="4 4"/>
    ${cross(cpx,cpy,C.teal,7)}${cross(ppx,ppy,C.purple,6)}
    ${cross(xp(r.lx),yp(s.offset/1000),C.orange,5)}
    <circle cx="${rear}" cy="${oy}" r="5" fill="#546d46" stroke="white" stroke-width="2"/><circle cx="${ox}" cy="${oy-half}" r="5" fill="#546d46" stroke="white" stroke-width="2"/><circle cx="${ox}" cy="${oy+half}" r="5" fill="#546d46" stroke="white" stroke-width="2"/>
    ${badge(rear,oy+65,'Draaipunt achteras','#69805b',115)}${badge(ox,oy+half+35,'Voorwielen / kantellijn',C.red,140)}
    ${badge(clamp(ppx,90,760),clamp(ppy-30,65,445),'Krachtprojectie',C.purple,110)}
    <text x="27" y="445" font-size="16" fill="#8c9c7c">Groen = massazwaartepunt · Paars = effect van alle krachten op de grond</text><text x="27" y="465" font-size="14" fill="#a1ad94">De schuine randen zijn de kantellijnen voor zijwaarts kantelen.</text>`;
  }
  function drawTriangle() {
    const r=result,xp=x=>275+x*120,yp=y=>120-y*120,back=xp(-1.75),t=M.truck.track/2*120;
    const x=xp(r.x),y=yp(r.y),px=xp(r.px),py=yp(r.py);
    const outside=px<12||px>333||py<18||py>219;
    const vx=clamp(px,14,335),vy=clamp(py,18,218);
    $('triangle').innerHTML=`<path d="M${back} 120L275 ${120-t}V${120+t}Z" fill="#e8efdf" stroke="#91ac7b" stroke-width="1.5"/><path d="M${back} 120H286" stroke="#b4c4a5" stroke-dasharray="3 4"/><path d="M275 ${120-t}V${120+t}" stroke="#cc705a" stroke-width="2.5"/>
    ${r.edge==='zij'&&r.status==='tip'?`<path d="M${back} 120L275 ${r.py>0?120-t:120+t}" stroke="${C.red}" stroke-width="3"/>`:''}
    <circle cx="${back}" cy="120" r="4" fill="#69815a" stroke="white" stroke-width="1.5"/><circle cx="275" cy="${120-t}" r="4" fill="#69815a" stroke="white" stroke-width="1.5"/><circle cx="275" cy="${120+t}" r="4" fill="#69815a" stroke="white" stroke-width="1.5"/>
    <path d="M${x} ${y}L${vx} ${vy}" stroke="${C.purple}" stroke-width="1.4" stroke-dasharray="3 3"/>
    ${cross(x,y,C.teal,5)}${cross(vx,vy,C.purple,4)}
    <text x="${back}" y="145" text-anchor="middle" fill="#91a380" font-size="14">Achteras</text><text x="282" y="124" fill="#a8b09b" font-size="14">Vooruit →</text><text x="275" y="${120+t+20}" text-anchor="middle" fill="#b16d58" font-size="14">Voorwielen</text>
    ${outside?'<text x="175" y="231" text-anchor="middle" fill="#b16d58" font-size="14">Projectie buiten beeld · richting aangegeven</text>':''}`;
  }
  function drawChart() {
    const s=state,r=result,x0=44,x1=397,y0=25,y1=199,xp=c=>x0+(c-300)/900*(x1-x0),yp=w=>y1-w/3000*(y1-y0);
    const coords=Array.from({length:46},(_,i)=>{const c=300+i*20;return [xp(c),yp(M.capacity(c,s.height))];});
    const path=coords.map((p,i)=>(i?'L':'M')+p.join(' ')).join('');
    const grid=[0,1000,2000,3000].map(w=>`<path d="M${x0} ${yp(w)}H${x1}" stroke="#e5e9dd" stroke-width=".8"/><text x="${x0-8}" y="${yp(w)+3}" text-anchor="end" fill="#a0ab92" font-size="14">${fmt(w)}</text>`).join('');
    $('loadChart').innerHTML=`${grid}<path d="${path}L${x1} ${y1}H${x0}Z" fill="#e8efdf"/><path d="${path}" fill="none" stroke="#698b56" stroke-width="2"/>
    <path d="M${x0} ${y0}V${y1}H${x1}" fill="none" stroke="#b9c5aa" stroke-width=".8"/>
    ${[300,600,900,1200].map(c=>`<text x="${xp(c)}" y="${y1+16}" text-anchor="middle" fill="#9eaa90" font-size="14">${fmt(c)}</text>`).join('')}
    <path d="M${xp(s.center)} ${y0}V${y1}M${x0} ${yp(s.weight)}H${xp(s.center)}" stroke="${r.utilization>1?'#c87859':'#91b47d'}" stroke-dasharray="3 3" stroke-width="1"/>
    ${cross(xp(s.center),yp(s.weight),r.utilization>1?C.red:'#547c41',4)}
    <text x="${clamp(xp(s.center)+9,70,320)}" y="${clamp(yp(s.weight)-10,16,190)}" fill="${r.utilization>1?C.red:'#668655'}" font-size="14" font-weight="600">${fmt(s.weight)} kg</text>
    <text x="${x0}" y="14" fill="#8a9a7a" font-size="14">Lastgewicht (kg)</text><text x="220" y="235" text-anchor="middle" fill="#9ba88c" font-size="14">Lastzwaartepuntafstand (mm)</text>`;
  }
  function updateStatus() {
    const r=result,s=state;
    const statuses={
      stable:['✓','Binnen het oefengebied','De krachtprojectie ligt binnen de driehoek en de last binnen het fictieve diagram.'],
      near:['!','De marge wordt klein','Je nadert een kantellijn of de fictieve lastgrens. Onderzoek welke factor invloed heeft.'],
      capacity:['!','Buiten het fictieve lastdiagram','De last overschrijdt de voorbeeldgrens, ook als de heftruck in het model nog niet kantelt.'],
      tip:['!','Kantellijn overschreden',r.edge==='voor'?'De krachtprojectie ligt voorbij de voorwielen: er ontstaat een voorover kantelmoment.':'De krachtprojectie ligt buiten een zijrand: er ontstaat een zijwaarts kantelmoment.']
    };
    const [icon,title,text]=statuses[r.status];
    $('statusBar').className='statusbar '+r.status;$('statusIcon').textContent=icon;$('statusTitle').textContent=title;$('statusText').textContent=text;
    $('marginMetric').textContent=fmt(r.margin*1000)+' mm';$('useMetric').textContent=fmt(r.utilization*100)+'%';$('heightMetric').textContent=fmt(r.z,2)+' m';$('capacityMetric').textContent=fmt(r.max)+' kg';
    $('sceneStatus').className='scenestatus '+r.status;$('sceneStatus').innerHTML=`<i></i><span>${r.status==='tip'?'Buiten de kantellijn':r.status==='capacity'?'Lastgrens overschreden':'Marge'} <b>${fmt(r.margin*1000)} mm</b></span>`;
    $('sceneHint').textContent=activeExercise!==null?'Opdracht '+(activeExercise+1)+' · '+exercises[activeExercise].label.toLowerCase():r.status==='tip'?'Kantellijn overschreden · herstel de situatie':s.speed>0?'Bochteffect actief · bekijk ook het bovenaanzicht':s.brake>0?'Remmen actief · volg de paarse projectie':'Verander één factor en volg de stippen';
    const slopeText=(s.slope>0?'+':'')+fmt(s.slope)+'° '+(s.slope>0?'neerwaarts':s.slope<0?'opwaarts':'vlak');
    $('viewCaption').textContent=(view==='side'?'Zijaanzicht · kantelen over de voorwielen':'Bovenaanzicht · steunvlak en zijwaartse balans')+(s.slope!==0?' · Langshelling '+slopeText+(view==='top'?' (zie zijaanzicht)':''):'');
    $('scene').setAttribute('aria-label',(view==='side'?'Heftruck en vloer in zijaanzicht':'Heftruck in bovenaanzicht')+' met langshelling '+slopeText);
    $('sideView').classList.toggle('selected',view==='side');$('topView').classList.toggle('selected',view==='top');$('sideView').setAttribute('aria-pressed',String(view==='side'));$('topView').setAttribute('aria-pressed',String(view==='top'));
    const factor=factors.find(f=>f.key===selectedFactor);
    $('liveInsight').textContent=factor?factor.insight:s.speed>0?'In een bocht verschuift de krachtprojectie naar buiten. Open het bovenaanzicht en ontdek wat snelheid, bochtstraal en hefhoogte doen.':'Meer gewicht trekt het gezamenlijke zwaartepunt naar de last toe. De kantellijn bij de voorwielen blijft op dezelfde plek.';
    $('calcContent').innerHTML=`<div class="calcgrid"><div>Statisch lastmoment<b>${fmt(r.loadMoment)} Nm</b><small>${fmt(s.weight)} kg × 9,81 × ${fmt(r.lx,3)} m vanaf de vooras</small></div><div>Stabiliserend truckmoment<b>${fmt(r.truckMoment)} Nm</b><small>3.200 kg × 9,81 × 0,650 m achter de vooras</small></div><div>Gezamenlijk zwaartepunt t.o.v. vooras<b>${fmt(r.x*1000)} mm</b><small>Negatief = achter de vooras · hoogte ${fmt(r.z,2)} m</small></div></div><p class="calcnote">Bochtversnelling: ${fmt(r.ay*9.81,2)} m/s² · vooruitgerichte krachtprojectie: x = ${fmt(r.x,3)} + ${fmt(r.z,3)} × (remming / 9,81 + tan(helling)) = ${fmt(r.px,3)} m. De statische momenten hierboven bevatten geen rem- of bochteffect.</p>`;
  }
  function renderExercise() {
    const banner=$('exerciseBanner');banner.hidden=activeExercise===null;
    if(activeExercise===null) return;
    const e=exercises[activeExercise];
    if(banner.dataset.exercise!==String(activeExercise)){
      banner.dataset.exercise=String(activeExercise);
      banner.innerHTML=`<div><span class="smalltag">EXPERIMENT ${activeExercise+1} VAN 5 · ${e.label}</span><h3>${e.title}</h3><p>${e.goal}</p><p class="prediction">Denk eerst na: ${e.predict}</p><p id="exerciseFeedback" class="feedback" role="status" hidden></p></div><div class="exercise-actions"><button class="primary" id="checkExercise">Controleer mijn oplossing</button><button class="end" id="endExercise">Vrij experimenteren</button></div>`;
    }
    $('exerciseFeedback').hidden=!feedback;$('exerciseFeedback').textContent=(feedbackOK?'✓ ':'')+feedback;$('exerciseFeedback').className='feedback '+(feedbackOK?'success':'retry');
    $('checkExercise').textContent=feedbackOK?(activeExercise===4?'Verder met lastdiagrammen →':'Volgende opdracht →'):'Controleer mijn oplossing';
    $('checkExercise').onclick=()=>{
      if(feedbackOK) {if(activeExercise<4) startExercise(activeExercise+1); else {endExercise();showTab('practice');}return;}
      feedbackOK=e.check(state,result);
      feedback=feedbackOK?e.success:e.hint;
      if(feedbackOK&&!completed.includes(activeExercise)) {completed.push(activeExercise);saveProgress();}
      renderExercise();
    };
    $('endExercise').onclick=()=>endExercise();
  }
  function saveProgress() {try{localStorage.setItem('balanslab-progress-v1',JSON.stringify(completed));}catch(e){}updateProgress();}
  function updateProgress() {$('navProgress').textContent=completed.length+'/'+exercises.length;$('progressText').textContent=completed.length+' van '+exercises.length+' opdrachten afgerond';$('progressFill').style.width=completed.length/exercises.length*100+'%';}
  function renderPractice() {
    updateProgress();
    $('exerciseList').hidden=false;$('diagramActivity').hidden=true;
    $('exerciseList').innerHTML=exercises.map((e,i)=>`<article class="exercisecard ${e.type==='diagram'?'diagram-card':''}"><div class="tasknumber">0${i+1} / ${e.label}${completed.includes(i)?'<span>✓ Afgerond</span>':''}</div><h3>${e.title}</h3><p>${e.desc}</p><button class="primary" data-exercise="${i}">${completed.includes(i)?'Nog eens proberen':'Start de opdracht'} →</button></article>`).join('');
  }
  function startExercise(i) {
    if(exercises[i].type==='diagram'){activeExercise=null;feedback='';feedbackOK=false;render();showTab('practice');window.DiagramLab.start(i);return;}
    activeExercise=i;state={...exercises[i].setup};feedback='';feedbackOK=false;selectedFactor=null;
    showTab('lab');showControls(i===2?'motion':'load');view=i===2||i===4?'top':'side';render();$('exerciseBanner').scrollIntoView({behavior:'auto',block:'start'});
  }
  function endExercise(){activeExercise=null;feedback='';feedbackOK=false;render();}
  function exploreFactor(key) {
    const f=factors.find(f=>f.key===key);if(!f)return;
    activeExercise=null;state={...f.setup};selectedFactor=key;feedback='';feedbackOK=false;
    showTab('lab');showControls(['brake','speed','slope','offset'].includes(key)?'motion':'load');view=['speed','offset'].includes(key)?'top':'side';render();$('lab').scrollIntoView({behavior:'auto',block:'start'});$('range-'+key).focus({preventScroll:true});
  }
  function render(){result=M.compute(state);syncControls();drawScene();drawTriangle();drawChart();updateStatus();renderExercise();}
  function reset(){state=activeExercise!==null?{...exercises[activeExercise].setup}:{...M.defaults};selectedFactor=null;feedback='';feedbackOK=false;view=activeExercise===2||activeExercise===4?'top':'side';render();}
  buildControls();
  $('factorGrid').innerHTML=factors.map(f=>`<article class="factor"><span class="factoricon" aria-hidden="true">${f.icon}</span><h3>${f.title}</h3><p>${f.body}</p><div class="try"><b>Probeer dit</b>${f.try}</div><button data-factor="${f.key}">Experimenteer met deze factor <span>→</span></button></article>`).join('');
  document.addEventListener('click',event=>{
    const b=event.target.closest('button');if(!b)return;
    if(b.dataset.tab)showTab(b.dataset.tab);
    if(b.dataset.goto){showTab(b.dataset.goto);document.querySelector('.tabs').scrollIntoView({behavior:'auto',block:'start'});}
    if(b.dataset.control)showControls(b.dataset.control);
    if(b.dataset.preset){state={...presets[b.dataset.preset]};selectedFactor=b.dataset.preset==='long'?'center':b.dataset.preset==='high'?'height':b.dataset.preset==='turn'?'speed':null;view=b.dataset.preset==='turn'?'top':'side';feedback='';feedbackOK=false;showControls(b.dataset.preset==='turn'?'motion':'load');render();document.querySelectorAll('[data-preset]').forEach(btn=>btn.classList.toggle('active',btn===b));}
    if(b.dataset.factor)exploreFactor(b.dataset.factor);
    if(b.dataset.info){const key=b.dataset.info==='radius'?'speed':b.dataset.info;const f=factors.find(f=>f.key===key);selectedFactor=key;$('liveInsight').textContent=f.insight;$('liveInsight').scrollIntoView({behavior:'auto',block:'nearest'});}
    if(b.dataset.exercise!==undefined)startExercise(Number(b.dataset.exercise));
  });
  $('sideView').onclick=()=>setView('side');$('topView').onclick=()=>setView('top');$('reset').onclick=reset;
  $('modelInfo').onclick=$('sources').onclick=()=>$('infoDialog').showModal();$('closeDialog').onclick=()=>$('infoDialog').close();
  $('infoDialog').addEventListener('click',e=>{if(e.target===$('infoDialog')){const box=$('infoDialog').getBoundingClientRect();if(e.clientX<box.left||e.clientX>box.right||e.clientY<box.top||e.clientY>box.bottom)$('infoDialog').close();}});
  $('clearProgress').onclick=()=>{completed=[];saveProgress();renderPractice();};
  window.completeDiagramExercise=i=>{if((i===5||i===6)&&!completed.includes(i)){completed.push(i);saveProgress();}};
  window.returnToPractice=()=>{showTab('practice');$('practice').scrollIntoView({block:'start'});};
  document.querySelectorAll('.brand,.footerbrand').forEach(a=>a.onclick=e=>{e.preventDefault();showTab('lab');window.scrollTo({top:0,behavior:'auto'});});
  updateProgress();renderPractice();render();
})();

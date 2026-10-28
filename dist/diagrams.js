/* Gepubliceerde fabrikantwaarden worden hier uitsluitend als tabel afgelezen.
   Ze vervangen de capaciteit van het fictieve simulatiemodel niet. */
(() => {
 'use strict';
 const $=id=>document.getElementById(id),fmt=n=>new Intl.NumberFormat('nl-NL').format(n);
 const source='https://toyota-forklifts.eu/guides/residual-capacity-guide/';
 const table=[{h:3000,q:[1600,1420,990]},{h:4000,q:[1600,1420,990]},{h:5000,q:[1600,1420,930]},{h:6000,q:[1350,1200,840]},{h:7000,q:[750,670,470]},{h:7500,q:[600,530,370]}];
 const centers=[500,600,1000];
 let exercise=5,height=6000,center=600,showRoute=false;
 function capacity(){return table.find(r=>r.h===height).q[centers.indexOf(center)];}
 function originalDiagram(){return `<div class="sourceframe"><h4>Lastdiagram uit jouw trainingsmateriaal</h4><svg viewBox="75 305 515 300" role="img" aria-label="Origineel lastdiagram met lijnen voor 4000 tot 6000 mm hefhoogte"><image href="assets/deltalinqs-lastdiagram-typeplaat.png" width="1294" height="694"/>${showRoute?'<path d="M440 555V412H140" fill="none" stroke="#d95720" stroke-width="4" stroke-dasharray="7 5"/><circle cx="440" cy="412" r="7" fill="#d95720" stroke="white" stroke-width="2"/>':''}</svg><p class="sourcecaption">Bron: door Jos aangeleverd Deltalinqs-trainingsmateriaal. De lijnen horen bij verschillende maximale hefhoogten.</p><button class="secondary" id="zoomOriginal">Vergroot diagram & typeplaat ↗</button></div>`;}
 function manufacturerTable(){return `<div class="sourceframe"><h4>Toyota Traigo 48 · 9FBEK16T</h4><div class="table-legend"><span><b>H</b> = hefhoogte (mm)</span><span><b>c</b> = lastafstand (mm)</span><span><b>Q</b> = restcapaciteit (kg)</span></div><div class="real-table-wrap"><table class="real-table"><caption>Fabrikanttabel: Q in kg bij hefhoogte H en afstand c</caption><thead><tr><th scope="col">H ↓ / c →</th>${centers.map(c=>`<th scope="col">${fmt(c)}</th>`).join('')}</tr></thead><tbody>${table.map(r=>`<tr class="${showRoute&&r.h===height?'selected':''}"><th scope="row">${fmt(r.h)}</th>${r.q.map((q,i)=>`<td class="${showRoute&&r.h===height&&centers[i]===center?'selected':''}">${fmt(q)}</td>`).join('')}</tr>`).join('')}</tbody></table></div><p class="sourcecaption">Waarden overgenomen uit het gepubliceerde voorbeeld van Toyota Material Handling Europe. Dit is geen diagram voor de modelheftruck in de simulator.</p><a class="textbutton" href="${source}" target="_blank" rel="noopener">Bekijk de oorspronkelijke fabrikantbron ↗</a></div>`;}
 function answerHTML(){return `<aside class="answerpanel"><span class="smalltag">LEES EERST ZELF AF</span><h4>Hoeveel kg mag je heffen?</h4>${exercise===5?'<p>Volg de lijn <b>4.000 mm</b>. Zoek onderaan <b>1.000 mm</b> lastafstand en lees links het bijbehorende gewicht af.</p><p>Een lading van <b>1.800 kg</b> wacht op je. Past die binnen deze lijn?</p>':`<p>Zoek de rij voor de hefhoogte en de kolom voor de lastafstand. Het snijpunt geeft de restcapaciteit.</p><div class="toyota-selects"><div><label for="tableHeight">Hefhoogte H</label><select id="tableHeight">${table.map(r=>`<option value="${r.h}" ${r.h===height?'selected':''}>${fmt(r.h)} mm</option>`).join('')}</select></div><div><label for="tableCenter">Lastafstand c</label><select id="tableCenter">${centers.map(c=>`<option value="${c}" ${c===center?'selected':''}>${fmt(c)} mm</option>`).join('')}</select></div></div>`}<label for="diagramAnswer">Maximale last volgens dit diagram</label><div class="answerfield"><input type="number" id="diagramAnswer" min="0" step="10" inputmode="numeric" placeholder="Jouw antwoord" aria-label="Maximale last in kilogram"><b>kg</b></div><button class="primary" id="checkDiagram">Controleer mijn antwoord</button><div id="diagramFeedback" class="answerfeedback" role="status" hidden></div><div class="activitytools"><button class="secondary" id="showRoute">${showRoute?'Verberg afleesroute':'Toon afleesroute'}</button></div></aside>`;}
 function render(){
   const box=$('diagramActivity');box.hidden=false;$('exerciseList').hidden=true;
   box.innerHTML=`<article class="chartactivity"><div class="activityhead"><div><span class="smalltag">OPDRACHT ${exercise+1} VAN 7 · LASTDIAGRAM LEZEN</span><h3>${exercise===5?'Lees het Deltalinqs-diagram':'Lees de Toyota-lasttabel'}</h3><p class="activityintro">${exercise===5?'Gebruik het originele diagram en bekijk ook de typeplaat. Dit is een afleesoefening met aangeleverd trainingsmateriaal.':'Je oefent met echte, gepubliceerde fabrikantgegevens. Verander de hoogte en afstand en lees steeds opnieuw de grens af.'}</p></div><button class="textbutton" id="backToPractice">← Alle opdrachten</button></div><div class="chartpractice-grid">${exercise===5?originalDiagram():manufacturerTable()}${answerHTML()}</div><div class="practice-note">${exercise===5?'<b>Diagram en typeplaat horen bij de machine.</b> De bijgevoegde afbeelding toont beide onderwerpen ter uitleg. Neem niet aan dat het getekende diagram bij de gefotografeerde Yale-typeplaat hoort.':'<b>Lees de tabelwaarden exact.</b> Gebruik in deze oefening alleen de vermelde hoogten en afstanden; er wordt niet tussen waarden geïnterpoleerd.'} Voor een echte taak gebruik je het diagram dat hoort bij de betreffende heftruck, mast en het voorzetapparaat.</div></article>`;
   $('backToPractice').onclick=()=>window.returnToPractice();
   $('checkDiagram').onclick=check;
   $('diagramAnswer').onkeydown=e=>{if(e.key==='Enter')check();};
   $('showRoute').onclick=()=>{const answer=$('diagramAnswer').value;showRoute=!showRoute;render();$('diagramAnswer').value=answer;};
   if(exercise===5)$('zoomOriginal').onclick=()=>$('diagramZoom').showModal();
   else{ $('tableHeight').onchange=e=>{height=Number(e.target.value);showRoute=false;render();};$('tableCenter').onchange=e=>{center=Number(e.target.value);showRoute=false;render();}; }
 }
 function check(){
   const input=$('diagramAnswer'),out=$('diagramFeedback'),value=Number(input.value),expected=exercise===5?1500:capacity();
   out.hidden=false;
   if(input.value===''){out.className='answerfeedback';out.textContent='Vul eerst het gewicht in dat je uit het diagram afleest.';input.focus();return;}
   const correct=exercise===5?Math.abs(value-expected)<=25:value===expected;
   out.className='answerfeedback'+(correct?' correct':'');
   if(correct){window.completeDiagramExercise(exercise);out.innerHTML=exercise===5?'<b>Goed afgelezen: ongeveer 1.500 kg.</b> Een last van 1.800 kg valt bij 4.000 mm hefhoogte en 1.000 mm lastafstand buiten deze lijn. Het verschil is ongeveer 300 kg.':`<b>Goed afgelezen: ${fmt(expected)} kg.</b> Dat is de tabelwaarde bij ${fmt(height)} mm hefhoogte en ${fmt(center)} mm lastafstand. Kies gerust een andere combinatie en oefen verder.`;}
   else out.textContent=exercise===5?'Kijk nog eens: volg vanaf 1.000 mm de verticale lijn naar de bovenste lijn van 4.000 mm. Lees daarna horizontaal naar de gewichtsschaal. Je mag tot 25 kg afronden.':'Controleer de juiste rij én kolom. De naam “1,6 ton” is de nominale capaciteit; de waarde op jouw snijpunt kan lager zijn. Gebruik eventueel de afleesroute.';
 }
 window.DiagramLab={start(i){exercise=i;height=6000;center=600;showRoute=false;render();$('diagramActivity').scrollIntoView({block:'start'});}};
 $('enlargeTruck').onclick=()=>{ $('truckZoomContent').innerHTML=$('scene').outerHTML;$('truckZoomContent').querySelector('svg').removeAttribute('id');$('truckZoom').showModal(); };
 $('closeTruckZoom').onclick=()=>$('truckZoom').close();
 $('closeZoom').onclick=()=>$('diagramZoom').close();
 $('joinButton').onclick=()=>$('joinDialog').showModal();$('closeJoin').onclick=()=>$('joinDialog').close();
 function setProjection(on){document.body.classList.toggle('projection',on);$('projectionMode').setAttribute('aria-pressed',String(on));try{localStorage.setItem('balanslab-projection',on?'1':'0');}catch{} }
 $('projectionMode').onclick=()=>setProjection(!document.body.classList.contains('projection'));
 try{if(window.matchMedia('(min-width:721px)').matches)setProjection(localStorage.getItem('balanslab-projection')==='1');}catch{}
 if(location.hash==='#oefenen'){document.querySelector('[data-tab="practice"]').click();$('practice').scrollIntoView({block:'start'});}
})();

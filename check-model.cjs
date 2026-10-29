const assert=require('node:assert/strict');
const {compute,defaults,capacity,floorToWorld}=require('./dist/model.js');
const base=compute(defaults), heavy=compute({...defaults,weight:2000}), long=compute({...defaults,center:1000});
assert.equal(base.status,'stable');
assert(heavy.x>base.x,'Meer massa verplaatst het zwaartepunt naar de last');
assert(long.loadMoment>base.loadMoment,'Een langere last vergroot het moment');
assert(long.max<base.max,'Een langere last verlaagt de lastgrens');
const high=compute({...defaults,height:4000});
assert.equal(high.x,base.x,'Hoogte alleen mag het statische voorovermoment niet veranderen');
assert.equal(high.loadMoment,base.loadMoment);
assert(high.z>base.z);
assert(compute({...defaults,height:4000,brake:2}).px>compute({...defaults,brake:2}).px,'Hoogte vergroot het remmende kantelmoment');
assert(compute({...defaults,height:3500,tilt:6}).lx>compute({...defaults,height:3500,tilt:0}).lx);
const v5=compute({...defaults,speed:5}),v10=compute({...defaults,speed:10});
assert(Math.abs(v10.ay/v5.ay-4)<1e-12,'Bochtversnelling is kwadratisch in snelheid');
assert.equal(compute({...defaults,brake:3}).x,base.x,'Remmen verandert de massapositie niet');
assert(compute({...defaults,slope:6}).px>base.px);
assert(compute({...defaults,offset:300}).y>base.y);
// Op een helling valt de statische krachtprojectie in de wereld recht onder het zwaartepunt.
for(const slope of [-8,-2,0,2,8]) {
 const r=compute({...defaults,slope});
 const cg=floorToWorld(r.x,r.z,slope),p=floorToWorld(r.px,0,slope);
 assert(Math.abs(cg.x-p.x)<1e-12,'De werklijn van de zwaartekracht blijft verticaal');
 const rear=floorToWorld(-1.75,0,slope),front=floorToWorld(0,0,slope);
 assert(Math.abs((front.z-rear.z)/(front.x-rear.x)+Math.tan(slope*Math.PI/180))<1e-12,'De wielcontacten volgen dezelfde vloerhelling');
}
assert.equal(capacity(500,200),2000);
assert.equal(capacity(500,4500),1400);
assert.equal(compute({...defaults,weight:1500,height:4000,brake:3}).status,'tip');
assert.equal(compute({...defaults,weight:1200,height:3000,speed:12,radius:3}).status,'tip');
assert.equal(compute({...defaults,weight:1200,height:3000,speed:5,radius:3}).status,'stable');
assert.equal(compute({...defaults,weight:1800,center:900}).status,'tip');
assert(compute({...defaults,weight:1800,center:550}).utilization<=1);
const final=compute({...defaults,weight:1800,center:300,height:200,tilt:0,speed:4,brake:0.2,radius:2.5,offset:0});
assert(final.margin>=.15&&final.utilization<=1,'De gecombineerde oefening heeft een haalbare oplossing');
for(const weight of [0,1500,3000])for(const height of [100,4500])for(const center of [300,1200])for(const tilt of [-6,6])for(const speed of [0,15]){
 const r=compute({...defaults,weight,height,center,tilt,speed,brake:4,slope:8,offset:350,radius:1.5});
 for(const [k,v] of Object.entries(r))if(typeof v==='number')assert(Number.isFinite(v),k+' moet eindig zijn');
}
console.log('Modelcontroles geslaagd: hefboom, hoogte, dynamiek, lastdiagram, oefensituaties en grenswaarden.');

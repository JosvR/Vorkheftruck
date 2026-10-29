const assert=require('node:assert/strict');
const {compute,defaults,capacity,floorToWorld,forkGeometry,forwardTip}=require('./dist/model.js');
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
// Botsingsgrens: ook bij een lage vork, lange last, mastneiging en helling.
let floorContacts=0;
for(const height of [100,200,500,1500,4500])for(const center of [300,500,1025,1200])for(const tilt of [-6,0,6])for(const slope of [-8,0,7,8]){
 const s={...defaults,weight:3000,brake:4,height,center,tilt,slope};
 const fork=forkGeometry(s),pose=forwardTip(s,compute(s)),a=pose.angle*Math.PI/180;
 assert(pose.angle>=0&&pose.angle<=pose.requested,'De contactgrens kan de kanteling alleen verkleinen');
 assert(fork.points.every(p=>p.z>=-1e-12),'Ook vóór kantelen blijft de hele vork boven de vloer');
 for(const p of fork.points){
  const x=p.x*Math.cos(a)+(p.z-.32)*Math.sin(a),z=.32-p.x*Math.sin(a)+(p.z-.32)*Math.cos(a);
  assert(z>=-1e-10,'De vork mag tijdens kantelen niet door de vloer gaan');
  const point=floorToWorld(x,z,slope),onFloor=floorToWorld(x,0,slope);
  assert((point.z-onFloor.z)*Math.cos(slope*Math.PI/180)>=-1e-10,'Vloercontact blijft correct op een helling');
 }
 if(pose.grounded){floorContacts++;assert(Math.abs(pose.clearance)<1e-9,'De vork stopt precies bij eerste vloercontact');}
}
assert(floorContacts>0,'Er worden werkelijk situaties met vloercontact getest');
for(const weight of [0,1500,3000])for(const height of [100,4500])for(const center of [300,1200])for(const tilt of [-6,6])for(const speed of [0,15]){
 const r=compute({...defaults,weight,height,center,tilt,speed,brake:4,slope:8,offset:350,radius:1.5});
 for(const [k,v] of Object.entries(r))if(typeof v==='number')assert(Number.isFinite(v),k+' moet eindig zijn');
}
console.log('Modelcontroles geslaagd: hefboom, hoogte, dynamiek, lastdiagram, oefensituaties en grenswaarden.');

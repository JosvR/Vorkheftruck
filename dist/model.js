/* Fictief trainingsmodel. Afstanden in m, massa in kg, g in m/s².
   Coördinaten: x vooruit vanaf vooras, y naar buitenzijde bocht, z omhoog. */
(function(root) {
  const truck = Object.freeze({mass:3200, x:-0.65, z:0.65, wheelbase:1.75, track:1.10, overhang:0.35, rated:2000});
  const defaults = Object.freeze({weight:1000, center:500, height:200, tilt:0, brake:0, speed:0, radius:3, slope:0, offset:0});
  const rad = n => n*Math.PI/180;
  // Van vloercoördinaten naar de horizontale wereld: positief = lastzijde omlaag.
  function floorToWorld(x,z,slope) {
    const a=rad(slope),c=Math.cos(a),s=Math.sin(a);
    return {x:x*c+z*s,z:-x*s+z*c};
  }
  // Dezelfde vorkomtrek als in de SVG, inclusief de onderkant van de hiel.
  function forkGeometry(s) {
    const a=rad(s.tilt),c=Math.cos(a),sn=Math.sin(a),depth=s.center/1000*2;
    const outline=[[-.03,.05],[-.03,-.95],[.02,-.95],[.02,0],[depth+.17,0],[depth+.09,.04]];
    const requested=s.height/1000-.10;
    const lift=Math.max(requested,...outline.map(([x,y])=>(x*sn+y*c-.10)/c));
    const points=outline.map(([x,y])=>({x:.35+x*c+(lift-y)*sn,z:.10+(lift-y)*c-x*sn}));
    return {lift,depth,points,raised:lift>requested+1e-9};
  }
  function forwardTip(s,r) {
    const requested=r.status==='tip'&&r.edge==='voor'?Math.min(9,2+Math.abs(r.margin)*20):0;
    const {points}=forkGeometry(s),axleHeight=.32;
    // De voorwielen blijven op de vloer; het chassis draait om de vooras.
    const clearance=angle=>Math.min(...points.map(p=>axleHeight-p.x*Math.sin(rad(angle))+(p.z-axleHeight)*Math.cos(rad(angle))));
    let angle=requested;
    if(clearance(angle)<0) {
      let lo=0,hi=angle;
      for(let i=0;i<45;i++){const mid=(lo+hi)/2;if(clearance(mid)>=0)lo=mid;else hi=mid;}
      angle=lo;
    }
    return {angle,requested,grounded:angle<requested-1e-7,clearance:clearance(angle)};
  }
  function heightFactor(h) {
    if(h<=1500) return 1;
    if(h<=3000) return 1-(h-1500)/1500*0.15;
    return 0.85-(h-3000)/1500*0.15;
  }
  function capacity(center,height) { return Math.min(truck.rated,truck.rated*0.85/(truck.overhang+center/1000)*heightFactor(height)); }
  function compute(s) {
    const a=rad(s.tilt), h=forkGeometry(s).lift+0.45, d=s.center/1000;
    const lx=truck.overhang+d*Math.cos(a)+h*Math.sin(a);
    const lz=0.10+h*Math.cos(a)-d*Math.sin(a);
    const mass=truck.mass+s.weight;
    const x=(truck.mass*truck.x+s.weight*lx)/mass;
    const z=(truck.mass*truck.z+s.weight*lz)/mass;
    const y=s.weight*(s.offset/1000)/mass;
    const ax=s.brake/9.81+Math.tan(rad(s.slope));
    const ay=Math.pow(s.speed/3.6,2)/s.radius/9.81;
    const px=x+z*ax, py=y+z*ay;
    // Halfvlakken van de driehoek (-L,0), (0,-t/2), (0,t/2).
    const k=truck.track/2/truck.wheelbase;
    const front=-px;
    const upper=(k*(px+truck.wheelbase)-py)/Math.sqrt(1+k*k);
    const lower=(k*(px+truck.wheelbase)+py)/Math.sqrt(1+k*k);
    const margin=Math.min(front,upper,lower);
    const edge=front<=upper&&front<=lower?'voor':'zij';
    const max=capacity(s.center,s.height), utilization=s.weight/max;
    const status=margin<=0?'tip':utilization>1.00001?'capacity':margin<0.12||utilization>=0.9?'near':'stable';
    return {lx,lz,x,y,z,px,py,mass,margin,front,edge,max,utilization,status,loadMoment:s.weight*9.81*lx,truckMoment:truck.mass*9.81*-truck.x,ax,ay};
  }
  const api={truck,defaults,compute,capacity,heightFactor,floorToWorld,forkGeometry,forwardTip};
  root.BalansModel=api;
  if(typeof module!=='undefined') module.exports=api;
})(typeof window!=='undefined'?window:globalThis);

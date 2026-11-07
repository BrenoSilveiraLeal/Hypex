import * as THREE from './vendor/three/three.module.min.js';
import { OrbitControls } from './vendor/three/OrbitControls.js';

const V = (x, y, z = 0) => new THREE.Vector3(x, y, z);
const clamp = THREE.MathUtils.clamp;

function weave(options) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 256;
  const c = canvas.getContext('2d');
  c.fillStyle = '#d7d7d7'; c.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 256; i += 4) {
    c.fillStyle = i % 8 ? '#c6c6c6' : '#ededed'; c.fillRect(i, 0, 1, 256);
    c.fillStyle = '#bbbbbb'; c.fillRect(0, i, 256, 1);
  }
  const bump = new THREE.CanvasTexture(canvas);
  bump.wrapS = bump.wrapT = THREE.RepeatWrapping;
  bump.repeat.set(options.jeans ? 12 : 20, 20);
  return bump;
}

export function buildGarment(p, selection, colors) {
  const o = { ...p.o, ...(p.modelos[selection.modelo] || {}).o };
  const color = colors[selection.cor] || colors[p.cores[0]];
  const group = new THREE.Group();
  group.name = p.id;
  group.userData.reconstruction = true;
  const bump = weave(o);
  const fabric = (hex, role = 'base') => {
    const material = new THREE.MeshPhysicalMaterial({ color: hex, roughness: o.puffer ? .58 : o.brilho ? .78 : .92, metalness: 0, sheen: .45, sheenRoughness: .85, sheenColor: new THREE.Color(hex).multiplyScalar(.55), bumpMap: bump, bumpScale: o.jeans ? .004 : .0015, side: THREE.DoubleSide });
    material.userData.role = role;
    return material;
  };
  const base = fabric(color.a), trim = fabric(color.a, 'trim'), contrast = fabric(color.b, 'contrast');
  trim.color.multiplyScalar(.82);
  const seam = new THREE.MeshStandardMaterial({ color: new THREE.Color(color.a).multiplyScalar(.63), roughness: .9 });
  seam.userData.role = 'seam';
  const metal = new THREE.MeshStandardMaterial({ color: '#9b9c99', roughness: .28, metalness: .8 });
  const mesh = (geometry, material = base, name = 'tecido') => {
    const m = new THREE.Mesh(geometry, material); m.name = name; m.castShadow = true; m.receiveShadow = true; group.add(m); return m;
  };
  const line = (points, material = seam, radius = .004, name = 'costura') => mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map(p => V(...p))), Math.max(12, points.length * 8), radius, 6, false), material, name);
  const ring = (x, y, z, rx, rz, material = trim, radius = .022) => {
    const pts = Array.from({ length: 49 }, (_, i) => { const a = i / 48 * Math.PI * 2; return [x + Math.cos(a) * rx, y, z + Math.sin(a) * rz]; });
    return line(pts, material, radius, 'acabamento');
  };
  const panel = (points, material = base, z = .22, back = false, name = 'painel') => {
    const shape = new THREE.Shape(points.map(p => new THREE.Vector2(...p)));
    const m = mesh(new THREE.ExtrudeGeometry(shape, { depth: .015, bevelEnabled: true, bevelSize: .009, bevelThickness: .009, bevelSegments: 2, steps: 1 }), material, name);
    m.position.z = z;
    if (back) m.rotation.y = Math.PI;
    return m;
  };
  function shell(y0, y1, width, depth, material = base, pleats = 0, centerX = 0, name = 'corpo') {
    const positions = [], uv = [], indices = [], around = 64, levels = 48;
    for (let j = 0; j <= levels; j++) {
      const t = j / levels, y = THREE.MathUtils.lerp(y0, y1, t);
      for (let i = 0; i <= around; i++) {
        const a = i / around * Math.PI * 2;
        const fold = 1 + .013 * Math.sin(a * 13 + t * 4) + .008 * Math.sin(a * 23 - t * 6) + pleats * Math.cos(a * 24);
        positions.push(centerX + Math.cos(a) * width(t) * fold, y, Math.sin(a) * depth(t) * fold);
        uv.push(i / around, t);
        if (j < levels && i < around) { const k = j * (around + 1) + i; indices.push(k, k + around + 1, k + 1, k + 1, k + around + 1, k + around + 2); }
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    g.setIndex(indices); g.computeVertexNormals();
    return mesh(g, material, name);
  }
  function sleeve(side, long) {
    const start = V(side * .48, .55, 0), end = V(side * (long ? .87 : .99), long ? -.68 : .18, -.015);
    const tangent = end.clone().sub(start).normalize(), u = V(0, 0, 1), v = new THREE.Vector3().crossVectors(tangent, u).normalize();
    const pos = [], uv = [], ix = [], n = 36, rows = 32;
    for (let j = 0; j <= rows; j++) {
      const t = j / rows, center = start.clone().lerp(end, t);
      const radius = THREE.MathUtils.lerp(o.puffer ? .24 : .19, long ? .115 : .165, t) + (o.puffer ? .022 * Math.sin(t * Math.PI * 14) : .005 * Math.sin(t * 43));
      for (let i = 0; i <= n; i++) {
        const a = i / n * Math.PI * 2;
        const point = center.clone().addScaledVector(u, Math.cos(a) * radius).addScaledVector(v, Math.sin(a) * radius);
        pos.push(point.x, point.y, point.z); uv.push(i / n, t);
        if (j < rows && i < n) { const k = j * (n + 1) + i; ix.push(k, k + 1, k + n + 1, k + 1, k + n + 2, k + n + 1); }
      }
    }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(ix); g.computeVertexNormals(); mesh(g, base, 'manga');
    const points = Array.from({ length: 37 }, (_, i) => { const a = i / 36 * Math.PI * 2; return end.clone().addScaledVector(u, Math.cos(a) * (long ? .117 : .167)).addScaledVector(v, Math.sin(a) * (long ? .117 : .167)).toArray(); });
    line(points, trim, long ? .025 : .009, 'punho');
  }
  const hanger = (y = 1.02, half = .56) => {
    line([[-half, y - .25, 0], [-half * .55, y - .06, 0], [0, y + .08, 0], [half * .55, y - .06, 0], [half, y - .25, 0], [0, y - .28, 0], [-half, y - .25, 0]], metal, .014, 'cabide');
    line([[0, y + .08, 0], [0, y + .24, 0], [.11, y + .35, 0], [.10, y + .47, 0], [0, y + .50, 0], [-.08, y + .43, 0]], metal, .013, 'gancho');
  };
  function top() {
    const cropped = o.hy && o.hy < 250, long = o.manga !== 'curta' && o.manga !== 'regata';
    const bottom = cropped ? -.20 : o.hy > 380 ? -1.16 : -.80;
    const wide = .54 + (o.largo || 0) * .002;
    shell(bottom, .88, t => t > .83 ? THREE.MathUtils.lerp(wide, .205, (t - .83) / .17) : wide * (1 - .065 * Math.sin(t * Math.PI)), t => .20 + .045 * Math.sin(t * Math.PI) + (o.puffer ? .033 * Math.sin(t * Math.PI * 16) : .007 * Math.sin(t * 32)));
    if (o.manga !== 'regata') { sleeve(-1, long); sleeve(1, long); }
    ring(0, bottom, 0, wide, .20, trim, o.barra ? .035 : .015);
    ring(0, .88, 0, .205, .16, trim, .025);
    const shirt = ['camisa', 'polo'].includes(o.gola) || o.botoes;
    const jacket = o.ziper || p.art === 'tecnica';
    if (o.gola === 'alta') shell(.85, 1.07, () => .22, () => .17, trim, 0, 0, 'gola alta');
    if (shirt || o.lapela) {
      panel([[-.20,.87],[-.06,.65],[-.28,.56],[-.36,.76]], trim, .19, false, 'gola');
      panel([[.20,.87],[.06,.65],[.28,.56],[.36,.76]], trim, .19, false, 'gola');
    }
    if (o.lapela) {
      panel([[-.16,.70],[-.36,.5],[-.14,.10],[.015,.26]], trim, .25, false, 'lapela');
      panel([[.16,.70],[.36,.5],[.14,.10],[-.015,.26]], trim, .25, false, 'lapela');
    }
    if (jacket || shirt || o.lapela) {
      line([[0,.78,.205],[0,.30,.255],[0,bottom + .07,.215]], jacket ? metal : trim, jacket ? .009 : .013, 'fecho frontal');
      if (shirt || o.lapela) for (let y = .5; y > bottom + .12; y -= .23) { const b = mesh(new THREE.SphereGeometry(.024, 10, 8), trim, 'botao'); b.position.set(.035, y, .26); b.scale.z = .35; }
    }
    if (o.bolso === 'canguru') panel([[-.35,-.35],[-.24,-.16],[.24,-.16],[.35,-.35],[.35,-.60],[-.35,-.60]], base, .238, false, 'bolso canguru');
    else if (jacket || o.lapela || o.jeans) for (const side of [-1, 1]) line([[side*.25,-.20,.25],[side*.37,-.48,.23]], trim, .009, 'bolso frontal');
    if (o.puffer) for (let y = bottom + .12; y < .70; y += .20) ring(0, y, 0, wide + .002, .22, seam, .003);
    if (o.bloco) {
      const band = shell(.38, .64, () => wide + .003, () => .246, contrast, 0, 0, 'recorte de cor');
      band.material.color.set('#242724');
    }
    if (o.gola === 'capuz' || p.art === 'tecnica') {
      const hood = mesh(new THREE.SphereGeometry(.34, 40, 28, 0, Math.PI * 2, 0, Math.PI * .76), base, 'capuz traseiro');
      hood.position.set(0, .92, -.13); hood.scale.set(1, 1.08, .85);
      line([[0,.75,-.42],[0,1.02,-.43],[0,1.25,-.22]], seam, .004, 'costura do capuz');
      if (o.gola === 'capuz') for (const s of [-1,1]) line([[s*.12,.82,.24],[s*.14,.54,.29],[s*.13,.36,.27]], trim, .008, 'cordao');
    }
    line([[-wide*.82,.55,-.19],[0,.48,-.25],[wide*.82,.55,-.19]], seam, .004, 'pala traseira');
    if (shirt || o.lapela || o.jeans) line([[0,.48,-.25],[0,-.15,-.25],[0,bottom+.04,-.21]], seam, .003, 'costura traseira');
    for (const s of [-1,1]) line([[s*wide*.98,bottom+.03,0],[s*wide*.94,0,0],[s*wide*.98,.60,0]], seam, .004, 'costura lateral');
    hanger();
  }
  function pants(shorts = false) {
    const bottom = shorts ? -.24 : -1.12, hip = (o.quadril || 82) / 164;
    shell(.35,.95,t=>THREE.MathUtils.lerp(hip,.43,t),()=>.21,base,0,0,'quadril');
    for (const side of [-1,1]) {
      const center = side * .245, hem = o.jogger ? .12 : (o.boca || 48) / 240;
      shell(bottom,.49,t=>THREE.MathUtils.lerp(hem,.245,t),t=>.11+.07*t,base,0,center,'perna');
      ring(center,bottom,0,hem,.11,trim,o.jogger?.035:.014);
      line([[side*.40,.75,.16],[side*.31,.55,.20]],trim,.006,'bolso frontal');
      panel([[side*.17,.65],[side*.39,.65],[side*.37,.38],[side*.28,.34],[side*.18,.38]],base,-.218,true,'bolso traseiro');
      line([[side*.16,.67,-.23],[side*.28,.69,-.23],[side*.39,.67,-.23]],seam,.004,'costura do bolso traseiro');
      if (o.cargo) { const pocket=mesh(new THREE.BoxGeometry(.24,.26,.045,2,2,1),base,'bolso cargo lateral'); pocket.position.set(side*.43,shorts?.06:-.24,.08); line([[side*.32,-.12,.12],[side*.53,-.12,.12]],trim,.009,'aba cargo'); }
      if (o.vinco) line([[center,.35,.18],[center,-.3,.15],[center,bottom,.12]],seam,.003,'vinco');
    }
    ring(0,.92,0,.435,.215,trim,.035);
    for (const x of [-.32,-.13,.13,.32]) line([[x,.98,.16],[x,.86,.20]],trim,.015,'passante');
    line([[0,.88,.23],[.035,.67,.23],[0,.43,.22]],trim,.006,'braguilha');
    const button=mesh(new THREE.SphereGeometry(.025,12,8),metal,'botao');button.position.set(0,.92,.25);
    hanger(1.16,.43);
  }
  function skirt(dress = false) {
    const length = (o.hy || (dress ? 430 : 372)) / 270;
    const topY = dress ? .16 : .85;
    shell(topY-length,topY,t=>THREE.MathUtils.lerp((o.boca||120)/160,.36,t),t=>THREE.MathUtils.lerp(.39,.18,t),base,o.plissado?.06:.016,0,'saia');
    ring(0,topY,0,.36,.18,trim,.025);
    if (dress) {
      shell(.15,.85,t=>.35+.08*Math.sin(t*Math.PI),()=>.20,base,0,0,'corpo do vestido');
      for(const s of [-1,1]) line([[s*.30,.78,.14],[s*.31,1.02,0],[s*.30,.78,-.15]],base,.025,'alca');
      line([[0,.85,-.205],[0,.16,-.205]],seam,.004,'fecho traseiro');
    }
    hanger(dress?1.16:1.12,.38);
  }
  function underwear() {
    if(p.art==='sutia') {
      for(const s of [-1,1]) {const cup=mesh(new THREE.SphereGeometry(.28,36,24),base,'bojo');cup.position.set(s*.27,.18,.06);cup.scale.set(1,.87,.55);line([[s*.43,.26,.03],[s*.42,.82,-.03],[s*.38,.27,-.20]],base,.025,'alca');}
      ring(0,.06,0,.54,.19,trim,.045);line([[-.42,.12,-.19],[0,.13,-.23],[.42,.12,-.19]],base,.07,'faixa traseira');
    } else if(p.art==='cueca'&&o.corte!=='slip') {
      shell(-.05,.55,()=>.47,()=>.17,base);for(const s of [-1,1])shell(o.corte==='longa'?-.65:-.38,.02,()=>.22,()=>.14,base,0,s*.245,'perna');ring(0,.55,0,.47,.17,trim,.045);
      line([[0,.48,.18],[0,.12,.22],[0,-.05,.17]],seam,.005,'costura frontal');
    } else {
      panel([[-.5,.5],[.5,.5],[.40,.17],[.17,-.2],[-.17,-.2],[-.40,.17]],base,-.10,false,'roupa intima');
      ring(0,.5,0,.5,.15,trim,.032);
      line([[-.43,.15,-.08],[0,-.18,-.10],[.43,.15,-.08]],trim,.02,'acabamento traseiro');
    }
    hanger(.85,.48);
  }
  function socks() {
    for(const s of [-1,1]) {
      const x=s*.29, height=o.cano==='alto'?.9:o.cano==='soquete'?.12:.52;
      shell(-.42,height,()=>.17,()=>.14,base,0,x,'cano da meia');
      const foot=mesh(new THREE.SphereGeometry(.22,32,24),base,'pe da meia');foot.position.set(x,-.46,.17);foot.scale.set(.8,.8,1.9);
      ring(x,height,0,.17,.14,trim,.025);
      if(o.listras)for(let y=height-.08;y>height-.26;y-=.065)ring(x,y,0,.174,.144,contrast,.018);
      line([[x,height,-.145],[x,-.42,-.145],[x,-.52,-.06]],seam,.003,'costura traseira');
    }
    hanger(1.12,.48);
  }
  if (p.art==='calca') pants((o.hy||400)<300);
  else if(p.art==='saia')skirt();
  else if(p.art==='vestido')skirt(true);
  else if(['cueca','calcinha','sutia'].includes(p.art))underwear();
  else if(p.art==='meia')socks();
  else top();
  const bounds=new THREE.Box3().setFromObject(group), center=bounds.getCenter(new THREE.Vector3()), size=bounds.getSize(new THREE.Vector3());
  group.children.forEach(child=>child.position.sub(center));
  const scale=2.8/Math.max(size.y,size.x*.85);group.scale.setScalar(scale);
  group.userData.materials={base,trim,contrast,seam};
  return group;
}

function disposeObject(object) {
  const materials=new Set(),textures=new Set();
  object.traverse(o=>{o.geometry?.dispose();if(o.material)(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>materials.add(m));});
  materials.forEach(m=>{if(m.bumpMap)textures.add(m.bumpMap);m.dispose();});textures.forEach(t=>t.dispose());
}

export function mount(root, p, selection, colors) {
  const canvasHost=root.querySelector('.produto3d-canvas'),status=root.querySelector('[role="status"]');
  const renderer=new THREE.WebGLRenderer({antialias:true,alpha:true,powerPreference:'low-power'});
  renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.setClearColor(0,0);renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.25;
  canvasHost.append(renderer.domElement);
  renderer.domElement.tabIndex=0;renderer.domElement.setAttribute('aria-label',`${p.nome} em 3D. Arraste para girar; use as setas ou os botões Frente e Costas.`);
  const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(35,1,.1,50);camera.position.set(0,.10,5.5);
  scene.add(new THREE.HemisphereLight('#ffffff','#b1a899',2.8));
  const key=new THREE.DirectionalLight('#fff6e7',4.3);key.position.set(3,4,5);scene.add(key);
  const fill=new THREE.DirectionalLight('#dbe7ff',2.2);fill.position.set(-3,2,-4);scene.add(fill);
  let model=buildGarment(p,selection,colors);scene.add(model);
  const controls=new OrbitControls(camera,renderer.domElement);controls.enablePan=false;controls.enableDamping=true;controls.dampingFactor=.12;controls.minDistance=3.2;controls.maxDistance=8;controls.minPolarAngle=Math.PI*.25;controls.maxPolarAngle=Math.PI*.75;controls.target.set(0,0,0);controls.update();
  let raf=0,dead=false,spin=null,visible=true,modelIndex=selection.modelo,currentColor=selection.cor,mode='3d';
  const reduced=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
  function render(now=performance.now()) {
    raf=0;if(dead||!visible||document.hidden)return;
    const changed=controls.update();
    if(spin){const t=clamp((now-spin.start)/spin.duration,0,1),ease=1-Math.pow(1-t,3);model.rotation.y=THREE.MathUtils.lerp(spin.from,spin.to,ease);if(t<1)schedule();else spin=null;}
    renderer.render(scene,camera);if(changed)schedule();
  }
  function schedule(){if(!raf&&!dead&&visible)raf=requestAnimationFrame(render);}
  const resize=()=>{const r=root.getBoundingClientRect();if(!r.width||!r.height)return;renderer.setSize(r.width,r.height);camera.aspect=r.width/r.height;camera.updateProjectionMatrix();schedule();};
  const ro=new ResizeObserver(resize);ro.observe(root);
  const io=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;if(visible)schedule();});io.observe(root);
  controls.addEventListener('change',schedule);
  const visibility=()=>{if(!document.hidden)schedule();};document.addEventListener('visibilitychange',visibility);
  const rotateTo=angle=>{const current=model.rotation.y,target=current+Math.atan2(Math.sin(angle-current),Math.cos(angle-current));if(reduced())model.rotation.y=target;else spin={from:current,to:target,start:performance.now(),duration:550};schedule();};
  const keydown=e=>{if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home'].includes(e.key)){e.preventDefault();e.stopPropagation();if(e.key==='Home'){controls.reset();rotateTo(0);}else if(e.key==='ArrowLeft'||e.key==='ArrowRight')rotateTo(model.rotation.y+(e.key==='ArrowLeft'?-.35:.35));else {camera.position.multiplyScalar(e.key==='ArrowUp'?.9:1.1);controls.update();schedule();}}};
  renderer.domElement.addEventListener('keydown',keydown);
  const click=e=>{
    const b=e.target.closest('[data-3d]');if(!b)return;
    const action=b.dataset['3d'];
    if(action==='frente'||action==='costas'){setMode('3d');controls.reset();rotateTo(action==='frente'?0:Math.PI);}
    if(action==='mais'||action==='menos'){setMode('3d');camera.position.multiplyScalar(action==='mais'?.88:1.12);controls.update();schedule();}
    if(action==='reset'){setMode('3d');controls.reset();rotateTo(0);}
    if(action==='foto'||action==='3d')setMode(action);
  };
  const stage=root.closest('.pdp-palco');stage.addEventListener('click',click);
  function setMode(value){mode=value;root.dataset.mode=value;controls.enabled=value==='3d';stage.querySelectorAll('[data-3d="foto"], [data-3d="3d"]').forEach(b=>b.setAttribute('aria-pressed',b.dataset['3d']===value));if(value==='3d')schedule();}
  status.hidden=true;root.dataset.ready='true';resize();
  const api={
    update(next,nextSelection){
      const angle=model.rotation.y;
      const old=model;model=buildGarment(next,nextSelection,colors);model.rotation.y=angle;scene.remove(old);disposeObject(old);scene.add(model);
      if((nextSelection.cor!==currentColor||nextSelection.modelo!==modelIndex)&&mode==='3d'&&!reduced())spin={from:angle,to:angle+Math.PI*2,start:performance.now(),duration:750};
      currentColor=nextSelection.cor;modelIndex=nextSelection.modelo;schedule();
    },
    state(){const b=new THREE.Box3().setFromObject(model);return {product:p.id,depth:b.max.z-b.min.z,meshes:model.children.length,angle:model.rotation.y,color:currentColor,model:modelIndex,mode,camera:camera.position.toArray()};},
    dispose(){dead=true;cancelAnimationFrame(raf);ro.disconnect();io.disconnect();controls.dispose();stage.removeEventListener('click',click);document.removeEventListener('visibilitychange',visibility);renderer.domElement.removeEventListener('keydown',keydown);disposeObject(model);renderer.dispose();renderer.domElement.remove();}
  };
  root.viewer3d=api;return api;
}

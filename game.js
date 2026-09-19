/* Desolate Land - Game Engine */
(() => {
  const $ = (s)=>document.querySelector(s);
  const menu = $('#menu');
  const playBtn = $('#playBtn');
  const howBtn = $('#howBtn');
  const heartIntro = $('#heartIntro');
  const heartCanvas = $('#heartCanvas');
  const heartLine1 = $('#heartLine1');
  const heartSub = $('#heartSub');
  const skipHeart = $('#skipHeart');
  const ghostOverlay = $('#ghostOverlay');
  const ghostCard = $('#ghostCard');
  const ghostWrap = $('#ghostWrap');
  const cardDialog = $('#cardDialog');
  const cardNext = $('#cardNext');
  const cardProgress = $('#cardProgress');
  const cardTitle = $('#cardTitle');
  const crackOverlay = $('#crackOverlay');
  const gameContainer = $('#gameContainer');
  const gameCanvas = $('#gameCanvas');
  const ctx = gameCanvas.getContext('2d');
  const hudWave = $('#hudWave');
  const hudLevel = $('#hudLevel');
  const hudXp = $('#hudXp');
  const xpFill = $('#xpFill');
  const healthFill = $('#healthFill');
  const healthValue = $('#healthValue');
  const ammoDots = $('#ammoDots');
  const ammoInfo = $('#ammoInfo');
  const hudEnemies = $('#hudEnemies');
  const hudKills = $('#hudKills');
  const hudPoints = $('#hudPoints');
  const waveBanner = $('#waveBanner');
  const waveNumberEl = $('#waveNumber');
  const waveEnemiesEl = $('#waveEnemies');
  const upgradeScreen = $('#upgradeScreen');
  const upgradeGrid = $('#upgradeGrid');
  const pointsValueEl = $('#pointsValue');
  const continueBtn = $('#continueBtn');
  const pauseScreen = $('#pauseScreen');
  const resumeBtn = $('#resumeBtn');
  const quitBtn = $('#quitBtn');
  const healBtn = $('#healBtn');
  const reloadBtn = $('#reloadBtn');
  const damageFlash = $('#damageFlash');
  const levelToast = $('#levelToast');
  const creditsScreen = $('#creditsScreen');
  const creditsInner = $('#creditsInner');
  const joystick = $('#joystick');
  const joyStick = $('#joyStick');

  let W = innerWidth, H = innerHeight;
  function resize(){ W = innerWidth; H = innerHeight; gameCanvas.width=W; gameCanvas.height=H; if(heartCanvas) { heartCanvas.width=W; heartCanvas.height=H; } }
  window.addEventListener('resize', resize); resize();

  /* ---------- MENU ---------- */
  playBtn.addEventListener('click', ()=> startHeart());
  howBtn.addEventListener('click', ()=>{
    alert("Controles:\n• WASD / Flechas: moverte (el mundo es un vacío negro, tu silueta son bordes blancos)\n• Ratón: apuntar — Click: disparar\n• R: recargar — E: curarte (mejorable)\n• Sobrevive 10 oleadas. Arañas (veloces, enjambre), Reptiles (acuerpados, carga), Dragón (jefe, aliento)\n• Al subir de nivel ganas puntos para: Daño, Recarga, Munición, Vida, Curación");
  });

  /* ---------- HEART INTRO ---------- */
  let heartAnimId = null;
  let heartPhase = 0; //0 typing,1 beating,2 shrinking
  function startHeart(){
    menu.classList.add('hidden');
    heartIntro.classList.remove('hidden');
    // reset styles from previous shrink
    heartLine1.style.opacity=''; heartLine1.style.transform=''; heartLine1.classList.remove('visible');
    heartSub.style.opacity=''; heartSub.classList.remove('visible');
    void heartIntro.offsetWidth;
    // text sequence
    setTimeout(()=> heartLine1.classList.add('visible'), 400);
    setTimeout(()=> heartSub.classList.add('visible'), 1200);
    initHeart();
    // auto sequence
    let t0 = performance.now();
    let beatDone = false;
    let shrinkStart = null;

    function schedule(){
      const elapsed = performance.now() - t0;
      if(!beatDone && elapsed> 3400){ beatDone=true; triggerBeat(); }
      if(beatDone && elapsed> 5200 && !shrinkStart){ shrinkStart=performance.now(); startShrink(); }
      if(beatDone && elapsed> 7800){ finishHeart(); return; }
      requestAnimationFrame(schedule);
    }
    schedule();
  }
  skipHeart.addEventListener('click', finishHeart);
  function finishHeart(){
    if(heartAnimId) cancelAnimationFrame(heartAnimId);
    heartIntro.style.transition='opacity 0.9s';
    heartIntro.style.opacity='0';
    setTimeout(()=>{
      heartIntro.classList.add('hidden');
      heartIntro.style.opacity='1';
      startGhostIntro();
    }, 900);
  }
  function triggerBeat(){
    // visual beat: quick scale up
    if(window.heartBeat) window.heartBeat();
  }
  function startShrink(){
    if(window.heartShrink) window.heartShrink();
    heartLine1.style.transition='opacity 1s, transform 1s';
    heartLine1.style.opacity='0';
    heartLine1.style.transform='scale(0.6)';
    heartSub.style.opacity='0';
  }

  // HEART PARTICLE SYSTEM (adapted from Heart Animation)
  let heartParticles = [], heartTargets = [], heartPointsOrigin = [], heartTime=0, heartShrinking=false, heartBeatScale=1, heartBeatT=0;
  function initHeart(){
    const dpr = Math.min(2, devicePixelRatio||1);
    const canvas = heartCanvas;
    const c = canvas.getContext('2d');
    W = innerWidth; H = innerHeight;
    canvas.width = W*dpr; canvas.height = H*dpr;
    canvas.style.width = W+'px'; canvas.style.height = H+'px';
    c.setTransform(dpr,0,0,dpr,0,0);
    const isMobile = W < 700;
    const koef = isMobile?0.75:1;
    const width = W, height = H;
    heartParticles = [];
    heartPointsOrigin = [];
    heartTargets = [];
    heartTime = 0; heartShrinking=false; heartBeatScale=1; window.shrinkAt=null;
    const heartPos = (rad)=>{
      return [Math.pow(Math.sin(rad),3), -(15*Math.cos(rad)-5*Math.cos(2*rad)-2*Math.cos(3*rad)-Math.cos(4*rad))];
    };
    const scaleAndTranslate=(pos,sx,sy,dx,dy)=>[dx+pos[0]*sx, dy+pos[1]*sy];
    const traceCount = isMobile?20:38;
    const dr = isMobile?0.32:0.16;
    for(let i=0;i<Math.PI*2;i+=dr) heartPointsOrigin.push(scaleAndTranslate(heartPos(i), 14*koef, 0.78*koef, 0,0));
    for(let i=0;i<Math.PI*2;i+=dr) heartPointsOrigin.push(scaleAndTranslate(heartPos(i), 10*koef, 0.52*koef, 0,0));
    for(let i=0;i<Math.PI*2;i+=dr) heartPointsOrigin.push(scaleAndTranslate(heartPos(i), 5.5*koef, 0.30*koef, 0,0));
    const heartPointsCount = heartPointsOrigin.length;
    const rand=Math.random;
    for(let i=0;i<heartPointsCount;i++){
      let x = rand()*width, y= rand()*height;
      heartParticles[i]={
        vx:0,vy:0,R:2,speed: rand()*1.2+3.2,q: Math.floor(rand()*heartPointsCount),D:2*(i%2)-1,force:0.2*rand()+0.7,
        trace: Array.from({length:traceCount},()=>({x,y})),
        f:`hsla(0,${Math.floor(40*rand()+96)}%,${Math.floor(28*rand()+52)}%,0.92)`
      };
    }
    // pulse targets
    function pulse(kx,ky){
      for(let i=0;i<heartPointsOrigin.length;i++){
        heartTargets[i]=[kx*heartPointsOrigin[i][0]+width/2, ky*heartPointsOrigin[i][1]+height/2];
      }
    }
    window.heartBeat=()=>{
      heartBeatT=1; // trigger
    };
    window.heartShrink=()=>{
      heartShrinking=true;
    };

    let last=performance.now();
    function loop(now){
      heartAnimId=requestAnimationFrame(loop);
      const dt = Math.min(0.033, (now-last)/1000); last=now;
      // time progression
      let n = -Math.cos(heartTime);
      let kx = (1+n)*0.5, ky=(1+n)*0.5;
      // beat boost
      if(heartBeatT>0){
        const b = Math.sin(heartBeatT*Math.PI); // 0->0
        kx += b*0.55; ky+= b*0.55;
        heartBeatT -= dt*1.8;
        if(heartBeatT<0) heartBeatT=0;
      }
      if(heartShrinking){
        // shrink to center point
        const shrink = Math.max(0, 1 - (performance.now()%8000)*0); // we'll lerp
        // use exponential decay
        kx *= Math.max(0.08, 1 - (heartTime*0.08));
        ky *= Math.max(0.08, 1 - (heartTime*0.08));
        // actually time-based
        const s = Math.max(0.06, 1 - ((now - (window.shrinkAt||now))/1800));
        if(!window.shrinkAt) window.shrinkAt=now;
        const curShrink = Math.max(0.06, 1 - (now - window.shrinkAt)/1600);
        kx = kx * curShrink;
        ky = ky * curShrink;
      }
      pulse(kx,ky);
      heartTime += ((Math.sin(heartTime))<0?9:(n>0.8)?0.22:1)*0.014;
      c.fillStyle='rgba(0,0,0,0.18)';
      c.fillRect(0,0,width,height);
      // draw particles
      for(let i=heartParticles.length;i--;){
        const u=heartParticles[i];
        const q=heartTargets[u.q];
        if(!q) continue;
        let dx=u.trace[0].x - q[0], dy=u.trace[0].y - q[1];
        let len=Math.sqrt(dx*dx+dy*dy);
        if(10>len){
          if(0.95<Math.random()) u.q=Math.floor(Math.random()*heartPointsCount);
          else{
            if(0.99<Math.random()) u.D*=-1;
            u.q+=u.D; u.q%=heartPointsCount; if(u.q<0) u.q+=heartPointsCount;
          }
        }
        u.vx += -dx/len * u.speed * (heartShrinking?1.6:1);
        u.vy += -dy/len * u.speed * (heartShrinking?1.6:1);
        u.trace[0].x+=u.vx; u.trace[0].y+=u.vy;
        u.vx*=u.force; u.vy*=u.force;
        for(let k=0;k<u.trace.length-1;){
          const T=u.trace[k], N=u.trace[++k];
          N.x -= 0.40*(N.x-T.x);
          N.y -= 0.40*(N.y-T.y);
        }
        c.fillStyle=u.f;
        for(let k=0;k<u.trace.length;k++){
          const pt=u.trace[k];
          c.fillRect(pt.x, pt.y, 1.25,1.25);
        }
      }
      // extra glow when shrinking
      if(heartShrinking){
        const cur = Math.max(0, 1 - (now - window.shrinkAt)/1600);
        if(cur<0.25){
          c.fillStyle=`rgba(255,40,80,${0.15*(1-cur*4)})`;
          c.beginPath(); c.arc(width/2,height/2, 18+ 40*(1-cur),0,Math.PI*2); c.fill();
        }
      }
    }
    loop(performance.now());
  }

  /* ---------- GHOST CARD SYSTEM ---------- */
  let ghostQueue = [];
  let ghostIndex = 0;
  let ghostResolve = null;
  let typeInterval = null;

  function showGhostSequence(title, lines, options={}){
    return new Promise(resolve=>{
      ghostQueue = lines;
      ghostIndex = 0;
      ghostResolve = resolve;
      cardTitle.textContent = title;
      ghostOverlay.classList.remove('hidden');
      ghostOverlay.style.opacity='0';
      requestAnimationFrame(()=>{
        ghostOverlay.style.transition='opacity 0.5s';
        ghostOverlay.style.opacity='1';
      });
      buildProgress();
      showGhostLine(ghostIndex);
      // tilt
      enableTilt();
      if(options.crackAtEnd){
        // will handle after last
      }
    });
  }
  function buildProgress(){
    cardProgress.innerHTML='';
    ghostQueue.forEach((_,i)=>{
      const d=document.createElement('div');
      d.className='prog-dot'+(i===0?' active':'');
      cardProgress.appendChild(d);
    });
  }
  function updateProgress(){
    [...cardProgress.children].forEach((el,i)=> el.classList.toggle('active', i===ghostIndex));
  }
  function showGhostLine(idx){
    const text = ghostQueue[idx];
    updateProgress();
    cardDialog.innerHTML='';
    let i=0;
    clearInterval(typeInterval);
    cardNext.style.opacity='0.35'; cardNext.style.pointerEvents='none';
    typeInterval = setInterval(()=>{
      if(i<=text.length){
        cardDialog.innerHTML = typewriterHTML(text.slice(0,i));
        i++;
      } else {
        clearInterval(typeInterval);
        cardNext.style.opacity='1'; cardNext.style.pointerEvents='auto';
        cardNext.textContent = idx===ghostQueue.length-1 ? (ghostOverlay.dataset.final==='true'?'Cerrar →':'Continuar →') : 'Continuar →';
      }
    }, 22);
    // click to skip typing
    cardDialog.onclick=()=>{
      if(i < text.length){
        clearInterval(typeInterval);
        cardDialog.innerHTML = typewriterHTML(text);
        i=text.length+1;
        cardNext.style.opacity='1'; cardNext.style.pointerEvents='auto';
      }
    };
  }
  function typewriterHTML(str){
    // simple escape + em for keywords
    return str.replace(/</g,'&lt;').replace(/—/g,'—');
  }
  cardNext.addEventListener('click', ()=>{
    if(ghostIndex < ghostQueue.length-1){
      ghostIndex++;
      showGhostLine(ghostIndex);
    } else {
      // finish sequence
      clearInterval(typeInterval);
      if(ghostOverlay.dataset.crack==='true'){
        doCrack().then(()=> hideGhost());
      } else {
        hideGhost();
      }
    }
  });
  function hideGhost(){
    ghostOverlay.style.opacity='0';
    setTimeout(()=>{
      ghostOverlay.classList.add('hidden');
      ghostOverlay.style.opacity='1';
      ghostOverlay.dataset.crack='false';
      ghostOverlay.dataset.final='false';
      disableTilt();
      if(ghostResolve){ ghostResolve(); ghostResolve=null; }
    }, 420);
  }
  let tiltHandler=null;
  function enableTilt(){
    const card = ghostCard;
    tiltHandler=(e)=>{
      const rect = ghostWrap.getBoundingClientRect();
      const cx = rect.left+rect.width/2, cy=rect.top+rect.height/2;
      const dx = (e.clientX - cx)/rect.width, dy=(e.clientY - cy)/rect.height;
      card.style.transform=`rotateY(${dx*14}deg) rotateX(${-dy*14}deg) translateZ(0)`;
    };
    window.addEventListener('mousemove', tiltHandler);
    ghostWrap.addEventListener('mousemove', tiltHandler);
  }
  function disableTilt(){
    if(tiltHandler){ window.removeEventListener('mousemove', tiltHandler); ghostWrap.removeEventListener('mousemove', tiltHandler); tiltHandler=null; }
    ghostCard.style.transform='rotateY(0) rotateX(0)';
  }
  function doCrack(){
    return new Promise(res=>{
      crackOverlay.classList.add('active');
      crackOverlay.innerHTML='';
      // create shards
      const shardCount=7;
      for(let i=0;i<shardCount;i++){
        const s=document.createElement('div');
        s.className='shard';
        const x = (i/ shardCount)*100;
        const y = i%2===0? 0: 100;
        const w = 40 + Math.random()*40;
        const h = 50 + Math.random()*30;
        const rot = -30 + Math.random()*60;
        s.style.left = (x + Math.random()*10 -5) + '%';
        s.style.top = (Math.random()*80+10) + '%';
        s.style.width = w+'%';
        s.style.height = h+'%';
        s.style.transform = `rotate(${rot}deg) translateZ(0)`;
        s.style.opacity='0';
        s.style.transition=`transform 0.7s ${i*0.06}s cubic-bezier(.2,.8,.3,1), opacity 0.4s ${i*0.06}s`;
        crackOverlay.appendChild(s);
        requestAnimationFrame(()=> requestAnimationFrame(()=>{
          s.style.opacity='0.9';
          s.style.transform=`rotate(${rot}deg) translate(${ (i%2? 18:-18)}px, ${Math.random()*30-15}px)`;
        }));
      }
      // crack lines from corner
      for(let i=0;i<6;i++){
        const line=document.createElement('div');
        line.className='crack-line';
        const angle = 35 + i*12 + Math.random()*10;
        const len = 70 + Math.random()*50;
        line.style.left='92%'; line.style.top='8%';
        line.style.width=len+'%';
        line.style.transform=`rotate(${angle}deg) scaleX(0)`;
        line.style.transition=`transform 0.5s ${0.1+i*0.07}s ease-out, opacity 0.5s`;
        line.style.opacity='0';
        crackOverlay.appendChild(line);
        requestAnimationFrame(()=> requestAnimationFrame(()=>{
          line.style.transform=`rotate(${angle}deg) scaleX(1)`;
          line.style.opacity='1';
        }));
      }
      // flash
      const flash=document.createElement('div');
      flash.style.cssText='position:absolute;inset:0;background:radial-gradient(ellipse at 90% 10%, rgba(255,255,255,0.35), transparent 60%);opacity:0;transition:opacity 0.2s';
      crackOverlay.appendChild(flash);
      setTimeout(()=> flash.style.opacity='1', 300);
      setTimeout(()=> flash.style.opacity='0', 650);

      // haptic + audio tick
      try{ navigator.vibrate&&navigator.vibrate(120); }catch{}

      setTimeout(()=> res(), 1400);
    });
  }

  async function startGhostIntro(){
    ghostOverlay.dataset.crack='false';
    await showGhostSequence("— Entre el velo —", [
      "Es curioso que estés aquí, se suponía que no vendría nadie.",
      "Que mal por ti de llegar aquí, este mundo fue devastado hace poco por unas extrañas criaturas que lo devoraron todo.",
      "Lo único que puedo hacer por ti es darte un arma, la capacidad de volverte más fuerte y una forma de curarte.",
      "Te deseo suerte y que veas el final de este horrendo mundo."
    ]);
    startGame();
  }

  /* ---------- GAME ENGINE ---------- */
  let gameState='menu'; // menu, playing, paused, upgrade, waveTransition
  let currentWave=1;
  let kills=0;
  let totalKills=0;
  let score=0;
  let paused=false;
  let animId=null;
  let lastTime=0;

  const upgradeDefs = {
    damage: { name:'Daño', icon:'⚔', cls:'dmg', desc:'Aumenta el daño de cada disparo. Revienta quitina y escamas.', getVal: (p)=> `${p.damage} → ${p.damage+4}` , apply:(p)=>{p.damage+=4}},
    ammo:   { name:'Munición', icon:'▭', cls:'ammo', desc:'Más balas por cargador. Menos pausas, más masacre.', getVal:(p)=> `${p.magSize} → ${p.magSize+4}`, apply:(p)=>{p.magSize+=4}},
    reload: { name:'Recarga', icon:'↻', cls:'reload', desc:'Disparas más rápido y recargas en un suspiro.', getVal:(p)=> `${(p.fireCooldown|0)}ms → ${Math.max(90,p.fireCooldown-30)}ms`, apply:(p)=>{p.fireCooldown=Math.max(90,p.fireCooldown-30); p.reloadTime=Math.max(0.45,p.reloadTime-0.10)}},
    hp:     { name:'Vitalidad', icon:'♥', cls:'hp', desc:'Tu silueta aguanta más. +20 de vida máxima.', getVal:(p)=> `${p.maxHp} → ${p.maxHp+20}`, apply:(p)=>{p.maxHp+=20; p.hp+=20}},
    heal:   { name:'Curación', icon:'✦', cls:'heal', desc:'Cada curación restaura más. El vacío también puede sanar.', getVal:(p)=> `${p.healAmount} → ${p.healAmount+10}`, apply:(p)=>{p.healAmount+=10}},
  };

  const waveDefs = [
    { spiders:8, reptiles:0, dragons:0 },
    { spiders:12, reptiles:0, dragons:0 },
    { spiders:16, reptiles:0, dragons:0 },
    { spiders:10, reptiles:2, dragons:0 },
    { spiders:8, reptiles:4, dragons:0 },
    { spiders:10, reptiles:6, dragons:0 },
    { spiders:6, reptiles:4, dragons:1 },
    { spiders:8, reptiles:5, dragons:2 },
    { spiders:10, reptiles:6, dragons:2 },
    { spiders:14, reptiles:7, dragons:3 },
  ];

  // Player
  const player = {
    x:0,y:0, angle:0,
    radius:16,
    hp:100, maxHp:100,
    damage:18,
    fireCooldown:280, // ms
    lastShot:0,
    magSize:12,
    ammo:12,
    reloading:false,
    reloadTime:1.15, // sec
    reloadTimer:0,
    healAmount:30,
    healCooldown:7, // sec
    healTimer:0,
    speed:3.9,
    level:1, xp:0, xpNeeded:100, skillPoints:0,
    kills:0,
    invul:0,
  };
  let keys={};
  let mouse={x:W/2,y:H/2, down:false};
  let bullets=[], enemies=[], particles=[], enemyBullets=[];
  let camera={x:0,y:0};
  let screenshake=0;

  // Input
  window.addEventListener('keydown', e=>{
    const k=e.key.toLowerCase();
    keys[k]=true;
    if(k==='r') tryReload();
    if(k==='e') tryHeal();
    if(k==='p' || k==='escape') togglePause();
    if(k===' '){ /* space also heal? */ }
  });
  window.addEventListener('keyup', e=>{ keys[e.key.toLowerCase()]=false; });
  window.addEventListener('mousedown', e=>{ if(gameState==='playing') mouse.down=true; });
  window.addEventListener('mouseup', e=>{ mouse.down=false; });
  window.addEventListener('mousemove', e=>{ mouse.x=e.clientX; mouse.y=e.clientY; });
  gameCanvas.addEventListener('touchmove', e=>{
    if(e.touches[0]){ mouse.x=e.touches[0].clientX; mouse.y=e.touches[0].clientY; }
  }, {passive:true});
  // joystick
  let joyActive=false, joyVec={x:0,y:0};
  if(joyStick){
    const base = joystick;
    const rect=()=>base.getBoundingClientRect();
    const handleMove=(cx,cy)=>{
      const r=rect(); const centerX=r.left+r.width/2, centerY=r.top+r.height/2;
      let dx=cx-centerX, dy=cy-centerY;
      const max=48; const len=Math.hypot(dx,dy); if(len>max){ dx=dx/len*max; dy=dy/len*max; }
      joyStick.style.transform=`translate(${dx}px, ${dy}px)`;
      joyVec.x=dx/max; joyVec.y=dy/max;
    };
    joystick.addEventListener('pointerdown', e=>{ joyActive=true; joystick.setPointerCapture(e.pointerId); });
    joystick.addEventListener('pointermove', e=>{ if(!joyActive) return; handleMove(e.clientX,e.clientY); });
    window.addEventListener('pointerup', ()=>{
      if(!joyActive) return; joyActive=false; joyStick.style.transform='translate(0,0)'; joyVec={x:0,y:0};
    });
    // mobile shoot button?
    gameCanvas.addEventListener('touchstart', e=>{
      if(e.touches.length===1){ mouse.down=true; }
    });
    gameCanvas.addEventListener('touchend', ()=> mouse.down=false);
  }
  healBtn.addEventListener('click', tryHeal);
  reloadBtn.addEventListener('click', tryReload);

  function tryHeal(){
    if(player.healTimer>0 || player.hp>=player.maxHp || player.hp<=0) return;
    const before=player.hp;
    player.hp=Math.min(player.maxHp, player.hp+player.healAmount);
    player.healTimer=player.healCooldown;
    spawnHealParticles();
    // flash
    damageFlash.style.background='radial-gradient(ellipse at center, rgba(0,230,160,0.16), transparent 70%)';
    damageFlash.classList.add('active');
    setTimeout(()=> damageFlash.classList.remove('active'), 220);
    // audio tick via web audio
    playTone(680,0.12,0.12,'sine',0.18);
    playTone(880,0.12,0.22,'sine',0.14);
  }
  function tryReload(){
    if(player.reloading || player.ammo===player.magSize) return;
    player.reloading=true;
    player.reloadTimer=player.reloadTime;
    playTone(180,0.08,0,'square',0.12);
  }
  function togglePause(){
    if(gameState!=='playing' && gameState!=='paused') return;
    if(paused){ paused=false; gameState='playing'; pauseScreen.classList.add('hidden'); lastTime=performance.now(); requestAnimationFrame(loop); }
    else { paused=true; gameState='paused'; pauseScreen.classList.remove('hidden'); }
  }
  resumeBtn.addEventListener('click', togglePause);
  quitBtn.addEventListener('click', ()=>{
    paused=false; pauseScreen.classList.add('hidden');
    endToMenu();
  });
  function endToMenu(){
    cancelAnimationFrame(animId);
    gameContainer.classList.add('hidden');
    menu.classList.remove('hidden');
    gameState='menu';
  }

  // Audio helper
  let audioCtx=null;
  function playTone(freq,dur,delay=0,type='sine',vol=0.2){
    try{
      if(!audioCtx) audioCtx=new (window.AudioContext||window.webkitAudioContext)();
      const t=audioCtx.currentTime+delay;
      const o=audioCtx.createOscillator(); const g=audioCtx.createGain();
      o.type=type; o.frequency.value=freq; o.connect(g); g.connect(audioCtx.destination);
      g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t+dur);
      o.start(t); o.stop(t+dur+0.02);
    }catch{}
  }

  function spawnHealParticles(){
    for(let i=0;i<14;i++){
      const a=Math.random()*Math.PI*2;
      particles.push({x:player.x, y:player.y, vx:Math.cos(a)* (2+Math.random()*3), vy:Math.sin(a)*(2+Math.random()*3), life:0.7, maxLife:0.7, size:2+Math.random()*3, color:`hsla(152, 92%, 58%, 0.95)`});
    }
  }

  function startGame(){
    // reset player
    Object.assign(player, {
      x:0,y:0, angle:0, hp:100, maxHp:100, damage:18, fireCooldown:280, lastShot:0, magSize:12, ammo:12, reloading:false, reloadTimer:0, healAmount:30, healCooldown:7, healTimer:0, level:1, xp:0, xpNeeded:100, skillPoints:0, kills:0, invul:0, speed:3.9
    });
    bullets=[]; enemies=[]; particles=[]; enemyBullets=[];
    camera={x:0,y:0}; currentWave=1; kills=0; totalKills=0; score=0; screenshake=0;
    gameContainer.classList.remove('hidden');
    gameState='playing';
    resize();
    lastTime=performance.now();
    // show wave 1 banner then spawn
    runWave(currentWave);
    requestAnimationFrame(loop);
  }

  async function runWave(n){
    const def = waveDefs[n-1];
    hudWave.textContent=n;
    // banner
    waveNumberEl.textContent = n;
    const parts=[];
    if(def.spiders) parts.push(`${def.spiders} × Arañas`);
    if(def.reptiles) parts.push(`${def.reptiles} × Reptiles`);
    if(def.dragons) parts.push(`${def.dragons} × Dragón`);
    waveEnemiesEl.textContent = parts.join('  •  ');
    waveBanner.classList.remove('hidden');
    // subtle ghost card announce for wave?
    waveBanner.classList.remove('show');
    void waveBanner.offsetWidth;
    waveBanner.classList.add('show');
    playTone(220,0.5,0,'sine',0.22); playTone(330,0.5,0.12,'sine',0.18);
    await new Promise(r=> setTimeout(r, 2200));
    waveBanner.classList.remove('show');
    setTimeout(()=> waveBanner.classList.add('hidden'), 500);
    spawnWave(def);
    updateHUD();
  }

  function spawnWave(def){
    const total = def.spiders+def.reptiles+def.dragons;
    // spawn stagger
    let idx=0;
    function spawnOne(){
      if(idx<def.spiders){ spawnEnemy('spider'); }
      else if(idx<def.spiders+def.reptiles){ spawnEnemy('reptile'); }
      else if(idx<total){ spawnEnemy('dragon'); }
      idx++;
      if(idx<total) setTimeout(spawnOne, 320 + Math.random()*280);
    }
    spawnOne();
  }

  function spawnEnemy(type){
    const angle = Math.random()*Math.PI*2;
    const dist = Math.max(W,H)*0.62 + 80 + Math.random()*120;
    const x = player.x + Math.cos(angle)*dist;
    const y = player.y + Math.sin(angle)*dist;
    let e;
    if(type==='spider'){
      e = new Spider(x,y);
    } else if(type==='reptile'){
      e = new Reptile(x,y);
    } else {
      e = new Dragon(x,y);
    }
    enemies.push(e);
  }

  // Base Enemy
  class Enemy{
    constructor(x,y, hp, radius, speed, damage, xp){
      this.x=x; this.y=y; this.hp=hp; this.maxHp=hp; this.radius=radius; this.speed=speed; this.damage=damage; this.xp=xp;
      this.angle=Math.atan2(player.y - y, player.x - x);
      this.hitFlash=0;
      this.dead=false;
      this.knockX=0; this.knockY=0;
    }
    takeDamage(d){
      this.hp-=d; this.hitFlash=0.18;
      this.knockX += (Math.random()-0.5)*1.2;
      this.knockY += (Math.random()-0.5)*1.2;
      playTone(120+Math.random()*80,0.07,0,'square',0.11);
      for(let i=0;i<3;i++) particles.push({x:this.x+ (Math.random()-0.5)*this.radius, y:this.y+(Math.random()-0.5)*this.radius, vx:(Math.random()-0.5)*6, vy:(Math.random()-0.5)*6, life:0.35, maxLife:0.35, size:1.5+Math.random()*2.2, color: this.hitColor||'rgba(255,255,255,0.95)'});
      if(this.hp<=0){ this.die(); }
    }
    die(){
      if(this.dead) return;
      this.dead=true;
      kills++; totalKills++; score+= this.xp * 10;
      // xp
      gainXP(this.xp);
      // death particles
      for(let i=0;i<18;i++){
        const a=Math.random()*Math.PI*2;
        particles.push({x:this.x, y:this.y, vx:Math.cos(a)*(1.5+Math.random()*5), vy:Math.sin(a)*(1.5+Math.random()*5), life:0.6+Math.random()*0.4, maxLife:0.9, size:1.2+Math.random()*3, color:this.deathColor||'rgba(255,255,255,0.9)'});
      }
      playTone(60,0.28,0,'sawtooth',0.18); playTone(30,0.4,0.08,'sine',0.14);
      screenshake = Math.min(12, screenshake+ (this.radius>40?9:5));
    }
    moveTowards(dt){
      const dx = player.x - this.x, dy = player.y - this.y;
      const dist = Math.hypot(dx,dy);
      const targetAngle = Math.atan2(dy,dx);
      // smooth rotation
      let da = targetAngle - this.angle;
      da = Math.atan2(Math.sin(da), Math.cos(da));
      const turnSpeed = this.turnSpeed || 0.12;
      this.angle += da * turnSpeed;
      // move
      if(dist> 10){
        this.x += Math.cos(this.angle)* this.speed * dt*60;
        this.y += Math.sin(this.angle)* this.speed * dt*60;
      }
      this.x+= this.knockX; this.y+= this.knockY;
      this.knockX*=0.82; this.knockY*=0.82;
    }
    checkPlayerCollision(){
      const d = Math.hypot(this.x - player.x, this.y - player.y);
      if(d < this.radius + player.radius -2){
        if(player.invul<=0){
          player.hp -= this.damage*0.16; // per frame while touching? reduce
          // Actually apply tick damage every ~0.35s
          if(!this._lastHit || performance.now() - this._lastHit > 420){
            player.hp -= this.damage;
            this._lastHit = performance.now();
            player.invul=0.18;
            damageFlash.classList.add('active');
            setTimeout(()=> damageFlash.classList.remove('active'), 140);
            screenshake= Math.max(screenshake, 6);
            playTone(80,0.18,0,'square',0.2);
            if(player.hp<=0) onPlayerDeath();
          }
        }
      }
    }
  }

  class Spider extends Enemy{
    constructor(x,y){
      super(x,y, 28 + Math.random()*6, 17, 1.9+Math.random()*0.55, 8, 14);
      this.turnSpeed=0.22;
      this.hitColor='rgba(205,255,180,0.95)';
      this.deathColor='rgba(180,255,130,0.95)';
      this.walkPhase=Math.random()*Math.PI*2;
      this.jitterX= (Math.random()-0.5)*10;
      this.jitterY= (Math.random()-0.5)*10;
    }
    update(dt){
      if(this.dead) return;
      this.walkPhase+= dt*7;
      // spider jitters
      const wobbleX = Math.cos(this.walkPhase*1.3)*2.2;
      const wobbleY = Math.sin(this.walkPhase*1.7)*2.2;
      // lunge occasionally when close
      const dist = Math.hypot(player.x-this.x, player.y-this.y);
      let spd = this.speed;
      if(dist<180 && Math.random()<0.015) spd*=2.4;
      // temporarily boost
      const old = this.speed; this.speed=spd;
      this.moveTowards(dt);
      this.speed=old;
      this.x+= wobbleX*dt*8; this.y+= wobbleY*dt*8;
      if(this.hitFlash>0) this.hitFlash-=dt;
      this.checkPlayerCollision();
    }
    draw(c, cam){
      const sx = this.x - cam.x + W/2, sy = this.y - cam.y + H/2;
      c.save();
      c.translate(sx,sy);
      c.rotate(this.angle);
      // shadow
      c.fillStyle='rgba(0,0,0,0.28)';
      c.beginPath(); c.ellipse(0,3, this.radius*0.9, this.radius*0.55,0,0,Math.PI*2); c.fill();
      // legs - inspired by spider cursor lines
      c.strokeStyle= this.hitFlash>0 ? 'rgba(255,255,255,0.95)' : 'rgba(190,255,170,0.95)';
      c.lineWidth=1.35;
      c.lineCap='round';
      const legCount=8;
      for(let i=0;i<legCount;i++){
        const side = i<4? -1:1;
        const idx = i%4;
        const spread = (idx/3 -0.5)* 1.9; // angle spread
        const baseAng = side* (0.55 + spread*0.6);
        const len1= this.radius*1.15, len2= this.radius*1.05;
        // joint wobble
        const wob = Math.sin(this.walkPhase + i*0.9)*0.35;
        const a1 = baseAng + wob*0.6;
        const a2 = baseAng + wob;
        // leg segments with slight noise
        const x1 = Math.cos(a1)*len1, y1=Math.sin(a1)*len1;
        const x2 = x1 + Math.cos(a2)*len2, y2= y1+ Math.sin(a2)*len2;
        c.beginPath();
        c.moveTo(0,0);
        // curve via quadratic
        c.lineTo(x1*0.55, y1*0.55);
        c.lineTo(x2, y2);
        c.stroke();
        // tiny foot dot
        c.fillStyle='rgba(210,255,200,0.9)';
        c.beginPath(); c.arc(x2,y2,1.1,0,Math.PI*2); c.fill();
        c.strokeStyle= this.hitFlash>0 ? 'rgba(255,255,255,0.95)' : 'rgba(190,255,170,0.95)';
      }
      // web threads faint to center (like cursor)
      c.strokeStyle='rgba(180,255,180,0.14)';
      c.lineWidth=0.7;
      for(let i=0;i<3;i++){
        const a = this.walkPhase*0.3 + i*2.1;
        c.beginPath();
        c.moveTo(0,0);
        c.lineTo(Math.cos(a)*this.radius*2.2, Math.sin(a)*this.radius*2.2);
        c.stroke();
      }
      // body - two circles (cephalothorax + abdomen)
      // abdomen
      c.fillStyle= this.hitFlash>0 ? '#fff' : '#0e1a0e';
      c.strokeStyle='rgba(190,255,170,0.95)';
      c.lineWidth=1.5;
      c.beginPath(); c.ellipse(-this.radius*0.35,0, this.radius*0.72, this.radius*0.62,0,0,Math.PI*2); c.fill(); c.stroke();
      // cephalothorax
      c.fillStyle= this.hitFlash>0?'#fff':'#1e2e1e';
      c.beginPath(); c.ellipse(this.radius*0.22,0, this.radius*0.55, this.radius*0.46,0,0,Math.PI*2); c.fill(); c.stroke();
      // eyes (4)
      c.fillStyle= this.hitFlash>0?'#ff2640':'#ff3a4a';
      c.shadowColor='#ff2640'; c.shadowBlur=6;
      for(let i=-1;i<=1;i+=2){
        c.beginPath(); c.arc(this.radius*0.45, i*3.2, 1.7,0,Math.PI*2); c.fill();
      }
      c.shadowBlur=0;
      // hp bar
      if(this.hp < this.maxHp){
        c.fillStyle='rgba(0,0,0,0.55)'; c.fillRect(-this.radius, -this.radius-10, this.radius*2, 3);
        c.fillStyle='#7aff7a'; c.fillRect(-this.radius, -this.radius-10, this.radius*2 * (this.hp/this.maxHp), 3);
      }
      c.restore();
    }
  }

  class Reptile extends Enemy{
    constructor(x,y){
      super(x,y, 92, 30, 1.28, 16, 36);
      this.turnSpeed=0.08;
      this.hitColor='rgba(120,230,255,0.95)';
      this.deathColor='rgba(120,220,255,0.9)';
      this.segments=9;
      this.segLen=10;
      this.body=[];
      for(let i=0;i<this.segments;i++) this.body.push({x,y});
      this.legPhase=Math.random()*Math.PI*2;
      this.tailWag=0;
    }
    update(dt){
      if(this.dead) return;
      this.legPhase+= dt*6.5;
      this.tailWag+= dt*4;
      this.moveTowards(dt);
      // body follow
      this.body[0]={x:this.x, y:this.y};
      for(let i=1;i<this.segments;i++){
        const prev=this.body[i-1], cur=this.body[i];
        const dx= prev.x - cur.x, dy=prev.y - cur.y;
        const d=Math.hypot(dx,dy);
        const target = this.segLen * (1 - i*0.06);
        if(d> target){
          const nx=dx/d, ny=dy/d;
          this.body[i]={ x: prev.x - nx*target, y: prev.y - ny*target };
        }
      }
      if(this.hitFlash>0) this.hitFlash-=dt;
      this.checkPlayerCollision();
      // tail whip damage if close
      const tail=this.body[this.body.length-1];
      if(Math.hypot(tail.x-player.x, tail.y-player.y)< 22+player.radius){
        if(!this._tailHit || performance.now()-this._tailHit>800){
          player.hp-=10; this._tailHit=performance.now();
          player.invul=0.12; damageFlash.classList.add('active'); setTimeout(()=>damageFlash.classList.remove('active'),120);
          if(player.hp<=0) onPlayerDeath();
        }
      }
    }
    draw(c,cam){
      const sx0 = this.x - cam.x + W/2, sy0 = this.y - cam.y + H/2;
      // draw body segments from tail to head for layering
      for(let i=this.body.length-1;i>=0;i--){
        const p=this.body[i];
        const sx= p.x - cam.x + W/2, sy= p.y - cam.y + H/2;
        const t = i/this.body.length;
        const r = (1 - t*0.55)*11 + 4;
        const hue = this.hitFlash>0 ? 0 : 175;
        const col = this.hitFlash>0 ? '#fff' : `hsl(${185 - t*14}, 42%, ${16 + (1-t)*10}%)`;
        c.fillStyle=col;
        c.strokeStyle= this.hitFlash>0?'#fff':`hsla(185, 55%, 62%, ${0.95 - t*0.2})`;
        c.lineWidth=1.2;
        // add slight wag to tail
        const wag = Math.sin(this.tailWag + i*0.6)* (i/this.body.length)*6;
        c.beginPath();
        c.ellipse(sx, sy+wag, r, r*0.82, 0,0,Math.PI*2);
        c.fill(); c.stroke();
        // dorsal spikes
        if(i%2===0 && i>0 && i<this.body.length-1){
          c.fillStyle='rgba(120,240,255,0.85)';
          c.beginPath();
          c.moveTo(sx, sy+wag - r*0.82);
          c.lineTo(sx-4, sy+wag - r*0.82 -6);
          c.lineTo(sx+4, sy+wag - r*0.82 -6);
          c.closePath(); c.fill();
        }
        // legs for first segments
        if(i===1 || i===3){
          for(let side=-1; side<=1; side+=2){
            const legX = sx + side* (r+5);
            const legY = sy+wag + 4;
            const footWob = Math.sin(this.legPhase + i + (side*1.2))*8;
            c.strokeStyle='rgba(180,245,255,0.95)';
            c.lineWidth=2.2;
            c.beginPath();
            c.moveTo(sx, sy+wag);
            c.lineTo(legX, legY+footWob*0.3);
            c.lineTo(legX+ side*6, legY+footWob);
            c.stroke();
            // foot
            c.fillStyle='rgba(200,255,255,0.95)';
            c.beginPath(); c.arc(legX+ side*6, legY+footWob, 2,0,Math.PI*2); c.fill();
          }
        }
      }
      // head
      c.save();
      c.translate(sx0,sy0);
      c.rotate(this.angle);
      c.fillStyle= this.hitFlash>0?'#fff':'#0f2a2f';
      c.strokeStyle='rgba(120,240,255,0.95)';
      c.lineWidth=1.4;
      // snout
      c.beginPath();
      c.moveTo(10,-8); c.lineTo(22,-4); c.lineTo(22,4); c.lineTo(10,8); c.closePath();
      c.fill(); c.stroke();
      // head block
      c.beginPath(); c.ellipse(0,0, 14,10,0,0,Math.PI*2); c.fill(); c.stroke();
      // eye
      c.fillStyle= this.hitFlash>0?'#fff':'#ff3b30';
      c.shadowColor='#ff3b30'; c.shadowBlur=7;
      c.beginPath(); c.arc(4, -4, 2.4,0,Math.PI*2); c.fill();
      c.beginPath(); c.arc(4, 4, 2.4,0,Math.PI*2); c.fill();
      c.shadowBlur=0;
      // nostril
      c.fillStyle='rgba(0,0,0,0.7)';
      c.beginPath(); c.arc(18,0,1.1,0,Math.PI*2); c.fill();
      // hp
      c.rotate(-this.angle);
      if(this.hp < this.maxHp){
        c.fillStyle='rgba(0,0,0,0.6)'; c.fillRect(-18, -22, 36,4);
        c.fillStyle='#6af0ff'; c.fillRect(-18, -22, 36*(this.hp/this.maxHp),4);
      }
      c.restore();
    }
  }

  class Dragon extends Enemy{
    constructor(x,y){
      super(x,y, 285, 48, 1.02, 24, 95);
      this.turnSpeed=0.045;
      this.hitColor='rgba(255,140,90,0.98)';
      this.deathColor='rgba(255,120,60,0.95)';
      this.segments=18;
      this.chain=[];
      for(let i=0;i<this.segments;i++) this.chain.push({x,y});
      this.wingPhase=Math.random()*Math.PI*2;
      this.fireTimer= 2.2 + Math.random()*1.8;
      this.hover=0;
    }
    update(dt){
      if(this.dead) return;
      this.wingPhase+= dt*7;
      this.hover+= dt*1.1;
      // dragon circles a bit around player if far
      const dist = Math.hypot(player.x-this.x, player.y-this.y);
      // move
      this.moveTowards(dt);
      // chain follow
      this.chain[0]={x:this.x, y:this.y, angle:this.angle};
      for(let i=1;i<this.segments;i++){
        const prev=this.chain[i-1], cur=this.chain[i];
        const dx=prev.x - cur.x, dy=prev.y - cur.y;
        const d=Math.hypot(dx,dy);
        const target = 14 - i*0.32;
        if(d>target){
          const nx=dx/d, ny=dy/d;
          const na = Math.atan2(dy,dx);
          this.chain[i]={ x: prev.x - nx*target, y: prev.y - ny*target, angle:na };
        } else {
          this.chain[i].angle = Math.atan2(dy,dx);
        }
      }
      // fire breath
      this.fireTimer -= dt;
      if(this.fireTimer<=0 && dist<420){
        this.breatheFire();
        this.fireTimer= 3.0 + Math.random()*1.6;
      }
      if(this.hitFlash>0) this.hitFlash-=dt;
      this.checkPlayerCollision();
      // contact fire aura tick
      if(dist< 70){
        if(!this._aura || performance.now()-this._aura> 650){
          player.hp-=8; this._aura=performance.now();
          player.invul=0.1; damageFlash.classList.add('active'); setTimeout(()=>damageFlash.classList.remove('active'),100);
          if(player.hp<=0) onPlayerDeath();
        }
      }
    }
    breatheFire(){
      const sx=this.x + Math.cos(this.angle)*26, sy=this.y+ Math.sin(this.angle)*26;
      for(let i=0;i<5;i++){
        const spread = (Math.random()-0.5)*0.45;
        const a = this.angle + spread;
        enemyBullets.push({
          x:sx, y:sy, vx: Math.cos(a)*(4.2+Math.random()*2.2), vy:Math.sin(a)*(4.2+Math.random()*2.2),
          life:1.9, radius:6, damage:14, type:'fire'
        });
      }
      // particles
      for(let i=0;i<12;i++) particles.push({x:sx,y:sy, vx:Math.cos(this.angle)*(2+Math.random()*4)+(Math.random()-0.5)*2, vy:Math.sin(this.angle)*(2+Math.random()*4)+(Math.random()-0.5)*2, life:0.45, maxLife:0.45, size:2+Math.random()*3, color:`hsla(${12+Math.random()*18}, 98%, 58%, 0.95)`});
      playTone(90,0.35,0,'sawtooth',0.24); playTone(180,0.28,0.08,'square',0.18);
      screenshake= Math.max(screenshake,7);
    }
    draw(c,cam){
      // chain spine + wings
      for(let i=this.chain.length-1;i>=0;i--){
        const p=this.chain[i];
        const sx= p.x - cam.x + W/2 + Math.sin(this.hover + i*0.5)*1.2;
        const sy= p.y - cam.y + H/2 + Math.cos(this.hover*0.7 + i*0.42)*1.2;
        const t=i/this.chain.length;
        const r = (1 - t*0.68)*16 + 6;
        const isHead = i===0;
        if(!isHead){
          // segment body
          const col = this.hitFlash>0? '#fff' : `hsl(${16 + t*8}, 72%, ${18 + (1-t)*12}%)`;
          c.fillStyle=col;
          c.strokeStyle= this.hitFlash>0?'#fff':`hsla(18, 85%, 60%, ${0.95 - t*0.3})`;
          c.lineWidth=1.25;
          c.beginPath(); c.ellipse(sx,sy, r, r*0.72, p.angle||0,0,Math.PI*2); c.fill(); c.stroke();
          // belly highlight
          c.fillStyle='rgba(255,210,160,0.08)';
          c.beginPath(); c.ellipse(sx, sy+3, r*0.55, r*0.32, p.angle||0,0,Math.PI*2); c.fill();
          // spikes along back
          if(i%3===1){
            c.fillStyle='rgba(255,90,40,0.9)';
            c.beginPath();
            const ang = (p.angle||0) - Math.PI/2;
            const bx = sx + Math.cos(ang)* r*0.72, by= sy+ Math.sin(ang)* r*0.72;
            c.moveTo(bx, by);
            c.lineTo(bx + Math.cos(ang)*10 - Math.sin(ang)*3, by+ Math.sin(ang)*10 + Math.cos(ang)*3);
            c.lineTo(bx + Math.cos(ang)*10 + Math.sin(ang)*3, by+ Math.sin(ang)*10 - Math.cos(ang)*3);
            c.closePath(); c.fill();
          }
          // wings for front segments
          if(i===3 || i===6){
            const wingFlap = Math.sin(this.wingPhase + i)* 0.45;
            c.save();
            c.translate(sx,sy);
            c.rotate((p.angle||0) + wingFlap);
            c.fillStyle='rgba(40,14,8,0.92)';
            c.strokeStyle='rgba(255,120,60,0.85)';
            c.lineWidth=1.1;
            c.beginPath();
            // left wing
            c.moveTo(0,0);
            c.quadraticCurveTo(-r*1.8, -r*2.2, -r*3.2, -2);
            c.quadraticCurveTo(-r*1.9, 6, 0,2);
            c.fill(); c.stroke();
            // right wing
            c.beginPath();
            c.moveTo(0,0);
            c.quadraticCurveTo(-r*1.8, r*2.2, -r*3.2, 2);
            c.quadraticCurveTo(-r*1.9, -6, 0,-2);
            c.fill(); c.stroke();
            c.restore();
          }
        } else {
          // head
          c.save();
          c.translate(sx,sy);
          c.rotate(p.angle||this.angle);
          // jaw
          c.fillStyle= this.hitFlash>0?'#fff':'#1a0e0a';
          c.strokeStyle='rgba(255,160,90,0.95)';
          c.lineWidth=1.4;
          c.beginPath();
          c.moveTo(12,-9); c.lineTo(30,-6); c.lineTo(30,6); c.lineTo(12,9); c.closePath();
          c.fill(); c.stroke();
          // head
          c.fillStyle= this.hitFlash>0?'#fff':'#2a140c';
          c.beginPath(); c.ellipse(0,0, 20,14,0,0,Math.PI*2); c.fill(); c.stroke();
          // horns
          c.strokeStyle='rgba(255,220,180,0.95)'; c.lineWidth=2;
          c.beginPath(); c.moveTo(-6,-10); c.quadraticCurveTo(-12,-18, -16,-14); c.stroke();
          c.beginPath(); c.moveTo(-6,10); c.quadraticCurveTo(-12,18, -16,14); c.stroke();
          // eye
          c.fillStyle=this.hitFlash>0?'#fff':'#ff2a18'; c.shadowColor='#ff3a1a'; c.shadowBlur=10;
          c.beginPath(); c.arc(4,-5,3.2,0,Math.PI*2); c.fill();
          c.beginPath(); c.arc(4,5,3.2,0,Math.PI*2); c.fill();
          c.shadowBlur=0;
          // nostril fire glow
          c.fillStyle='rgba(255,90,20,0.9)';
          c.beginPath(); c.arc(26,0,2.0,0,Math.PI*2); c.fill();
          if(this.fireTimer<0.3){
            c.fillStyle='rgba(255,160,40,0.65)';
            c.beginPath(); c.arc(30,0, 6+ Math.random()*4,0,Math.PI*2); c.fill();
          }
          c.restore();
          // hp bar
          c.fillStyle='rgba(0,0,0,0.62)'; c.fillRect(sx-26, sy-32, 52,5);
          c.fillStyle='#ff5a2a'; c.fillRect(sx-26, sy-32, 52*(this.hp/this.maxHp),5);
        }
      }
    }
  }

  function onPlayerDeath(){
    if(player.hp<=0){
      player.hp=0;
      gameState='dead';
      // fade to ghost? show game over
      playTone(55,1.2,0,'sawtooth',0.28);
      setTimeout(()=>{
        ghostOverlay.dataset.crack='false';
        showGhostSequence("— Caíste —", [
          "El vacío te ha tragado. Tu silueta blanca se apaga.",
          "Pero el mundo sigue ahí, devorándolo todo. ¿Intentarás de nuevo?"
        ]).then(()=>{
          endToMenu();
        });
      }, 400);
    }
  }

  function gainXP(amount){
    player.xp += amount;
    while(player.xp >= player.xpNeeded){
      player.xp -= player.xpNeeded;
      player.level++;
      player.xpNeeded = Math.floor(100 + (player.level-1)*44);
      player.skillPoints++;
      showLevelToast();
      playTone(520,0.18,0,'sine',0.22); playTone(780,0.22,0.12,'sine',0.18);
    }
    updateHUD();
  }
  function showLevelToast(){
    levelToast.classList.add('show');
    setTimeout(()=> levelToast.classList.remove('show'), 1700);
  }

  // Bullets
  function shoot(){
    const now=performance.now();
    if(now - player.lastShot < player.fireCooldown) return;
    if(player.reloading) return;
    if(player.ammo<=0){ tryReload(); return; }
    player.lastShot=now;
    player.ammo--;
    const mx = mouse.x - W/2, my=mouse.y - H/2;
    const ang = Math.atan2(my, mx);
    player.angle = ang;
    const sx = player.x + Math.cos(ang)*18, sy= player.y+ Math.sin(ang)*18;
    bullets.push({x:sx,y:sy, vx:Math.cos(ang)*14.5, vy:Math.sin(ang)*14.5, damage:player.damage, life:0.95, radius:3.5});
    // muzzle
    for(let i=0;i<3;i++) particles.push({x:sx,y:sy, vx:Math.cos(ang)*(1+Math.random()*2)+(Math.random()-0.5)*1.5, vy:Math.sin(ang)*(1+Math.random()*2)+(Math.random()-0.5)*1.5, life:0.14, maxLife:0.14, size:1.8+Math.random()*2, color:'rgba(255,255,255,0.95)'});
    // flash
    particles.push({x:sx,y:sy, vx:0,vy:0, life:0.08, maxLife:0.08, size:7, color:'rgba(255,255,180,0.9)'});
    playTone(880,0.06,0,'square',0.14); playTone(420,0.04,0.02,'square',0.09);
    screenshake = Math.max(screenshake, 1.6);
    updateHUD();
    if(player.ammo===0) tryReload();
  }

  // Main loop
  function loop(now){
    if(paused) return;
    const dt = Math.min(0.033, (now - lastTime)/1000);
    lastTime=now;
    if(gameState==='playing'){
      update(dt);
      render();
      // check wave complete
      if(enemies.length===0 && bullets.length<30){
        const def=waveDefs[currentWave-1];
        const expected = def.spiders+def.reptiles+def.dragons;
        if(totalWaveSpawned >= expected){
          if(currentWave < 10){
            if(player.skillPoints>0){
              gameState='upgrade';
              showUpgradeScreen();
            } else {
              currentWave++;
              totalWaveSpawned=0;
              setTimeout(()=> {
                if(gameState==='playing'){
                  runWave(currentWave);
                }
              }, 900);
            }
          } else {
            // wave 10 cleared - check for pending skill points first
            if(player.skillPoints>0){
              gameState='upgrade';
              // mark that next after upgrade is outro
              upgradeScreen.dataset.final='true';
              showUpgradeScreen();
            } else {
              gameState='waveTransition';
              setTimeout(()=> triggerOutro(), 900);
            }
          }
        }
      }
    } else if(gameState==='upgrade' || gameState==='waveTransition'){
      // still render idle frame to keep canvas fresh (no update)
      render();
    }
    animId=requestAnimationFrame(loop);
  }

  let totalWaveSpawned=0;
  // wrap to count (override original spawnEnemy)
  const _origSpawn = spawnEnemy;
  spawnEnemy = function(type){
    totalWaveSpawned++;
    const angle = Math.random()*Math.PI*2;
    const dist = Math.max(W,H)*0.62 + 80 + Math.random()*120;
    const x = player.x + Math.cos(angle)*dist;
    const y = player.y + Math.sin(angle)*dist;
    let e;
    if(type==='spider') e=new Spider(x,y);
    else if(type==='reptile') e=new Reptile(x,y);
    else e=new Dragon(x,y);
    enemies.push(e);
  };

  function update(dt){
    // player movement
    let moveX=0, moveY=0;
    if(keys['w']||keys['arrowup']) moveY-=1;
    if(keys['s']||keys['arrowdown']) moveY+=1;
    if(keys['a']||keys['arrowleft']) moveX-=1;
    if(keys['d']||keys['arrowright']) moveX+=1;
    // joystick override/add
    if(joyActive){ moveX+= joyVec.x; moveY+= joyVec.y; }
    if(moveX||moveY){
      const len=Math.hypot(moveX,moveY)||1;
      moveX/=len; moveY/=len;
      player.x += moveX * player.speed * dt*60 *0.16;
      player.y += moveY * player.speed * dt*60 *0.16;
      // angle faces movement if not aiming?
      // keep aim to mouse, but if moving and mouse not moved, face move
    }
    // aim
    const mx= mouse.x - W/2, my=mouse.y - H/2;
    if(Math.hypot(mx,my)> 6) player.angle = Math.atan2(my,mx);

    // shooting hold
    if(mouse.down) shoot();

    // reload timer
    if(player.reloading){
      player.reloadTimer-=dt;
      if(player.reloadTimer<=0){
        player.reloading=false;
        player.ammo=player.magSize;
        updateHUD();
        playTone(620,0.12,0,'sine',0.18);
      }
    }
    if(player.healTimer>0) player.healTimer-=dt;
    if(player.invul>0) player.invul-=dt;
    if(player.hp<0) player.hp=0;

    // camera follow lerp
    camera.x += (player.x - camera.x)* 0.08;
    camera.y += (player.y - camera.y)* 0.08;
    if(screenshake>0){ screenshake*= Math.pow(0.001, dt); if(screenshake<0.1) screenshake=0; }

    // bullets
    for(let i=bullets.length-1;i>=0;i--){
      const b=bullets[i];
      b.x+= b.vx; b.y+= b.vy;
      b.life-=dt;
      if(b.life<=0){ bullets.splice(i,1); continue; }
      // check enemies
      for(let j=enemies.length-1;j>=0;j--){
        const e=enemies[j];
        if(e.dead) continue;
        const d=Math.hypot(b.x - e.x, b.y - e.y);
        if(d < e.radius+ b.radius){
          e.takeDamage(b.damage);
          // impact
          for(let k=0;k<3;k++) particles.push({x:b.x,y:b.y, vx:(Math.random()-0.5)*6, vy:(Math.random()-0.5)*6, life:0.22, maxLife:0.22, size:1.5+Math.random()*2, color:'rgba(255,255,255,0.95)'});
          bullets.splice(i,1);
          if(e.dead){
            enemies.splice(j,1);
          }
          break;
        }
      }
    }
    // enemy bullets
    for(let i=enemyBullets.length-1;i>=0;i--){
      const b=enemyBullets[i];
      b.x+= b.vx; b.y+= b.vy;
      b.life-=dt;
      if(b.life<=0){ enemyBullets.splice(i,1); continue; }
      const d=Math.hypot(b.x - player.x, b.y - player.y);
      if(d < player.radius + b.radius){
        player.hp-= b.damage;
        player.invul=0.2;
        damageFlash.classList.add('active'); setTimeout(()=>damageFlash.classList.remove('active'),160);
        screenshake=Math.max(screenshake,5);
        for(let k=0;k<6;k++) particles.push({x:player.x,y:player.y, vx:(Math.random()-0.5)*7, vy:(Math.random()-0.5)*7, life:0.35, maxLife:0.35, size:1.5+Math.random()*2.5, color:'rgba(255,120,40,0.95)'});
        playTone(110,0.18,0,'square',0.2);
        enemyBullets.splice(i,1);
        if(player.hp<=0) onPlayerDeath();
        updateHUD();
      }
    }

    // enemies update
    for(let i=enemies.length-1;i>=0;i--){
      const e=enemies[i];
      e.update(dt);
      if(e.dead){
        // already handled? keep array cleaning via splice earlier? but dragons not spliced via bullet? They still die via takeDamage -> dead flag, need remove
        enemies.splice(i,1);
      }
    }

    // particles
    for(let i=particles.length-1;i>=0;i--){
      const p=particles[i];
      p.x+= p.vx; p.y+= p.vy;
      p.vx*=0.98; p.vy*=0.98; p.vy+=0.06;
      p.life-=dt;
      if(p.life<=0) particles.splice(i,1);
    }

    updateHUDTimers();
  }

  function updateHUDTimers(){
    // heal button cooldown display
    if(player.healTimer>0){
      healBtn.classList.remove('ready');
      healBtn.innerHTML=`<span class="icon">✦</span><span>${player.healTimer.toFixed(1)}s</span><div class="heal-cooldown" style="opacity:0.9">${Math.ceil(player.healTimer)}</div>`;
      healBtn.style.position='relative';
    } else {
      const ready = player.hp < player.maxHp;
      healBtn.classList.toggle('ready', ready);
      healBtn.innerHTML=`<span class="icon">✦</span><span>Curar</span>`;
    }
    if(player.reloading){
      reloadBtn.innerHTML=`<span class="icon">↻</span><span>${player.reloadTimer.toFixed(1)}s</span>`;
    } else {
      reloadBtn.innerHTML=`<span class="icon">↻</span><span>Recargar</span>`;
    }
  }

  function render(){
    // clear
    ctx.save();
    if(screenshake>0){
      ctx.translate((Math.random()-0.5)*screenshake, (Math.random()-0.5)*screenshake);
    }
    // background black + grid
    ctx.fillStyle='#050507';
    ctx.fillRect(0,0,W,H);
    // grid world-aligned
    const gridSize=60;
    const offX = - (camera.x % gridSize) ;
    const offY = - (camera.y % gridSize);
    ctx.strokeStyle='rgba(255,255,255,0.04)';
    ctx.lineWidth=1;
    ctx.beginPath();
    for(let x=offX; x<W; x+=gridSize){ ctx.moveTo(x,0); ctx.lineTo(x,H); }
    for(let y=offY; y<H; y+=gridSize){ ctx.moveTo(0,y); ctx.lineTo(W,y); }
    ctx.stroke();
    // vignette
    const grad=ctx.createRadialGradient(W/2,H/2, Math.min(W,H)*0.35, W/2,H/2, Math.min(W,H)*0.9);
    grad.addColorStop(0,'transparent');
    grad.addColorStop(1,'rgba(0,0,0,0.72)');
    ctx.fillStyle=grad;
    ctx.fillRect(0,0,W,H);
    // subtle world dust
    ctx.fillStyle='rgba(255,255,255,0.06)';
    for(let i=0;i<3;i++){
      const dx = ((camera.x*0.12 + i*340) % W);
      const dy = ((camera.y*0.08 + i*210) % H);
      // draw few dots
    }

    // draw enemy bullets (fire)
    for(const b of enemyBullets){
      const sx=b.x - camera.x + W/2, sy=b.y - camera.y + H/2;
      // fire trail
      ctx.fillStyle='rgba(255,120,40,0.22)';
      ctx.beginPath(); ctx.arc(sx - b.vx*1.2, sy - b.vy*1.2, b.radius*1.6,0,Math.PI*2); ctx.fill();
      ctx.fillStyle='#ff6a2a';
      ctx.shadowColor='#ff3a0a'; ctx.shadowBlur=10;
      ctx.beginPath(); ctx.arc(sx,sy,b.radius,0,Math.PI*2); ctx.fill();
      ctx.shadowBlur=0;
    }

    // draw bullets
    ctx.strokeStyle='rgba(255,255,255,0.95)';
    ctx.lineWidth=1.8;
    for(const b of bullets){
      const sx=b.x - camera.x + W/2, sy=b.y - camera.y + H/2;
      const len=9;
      const nx= b.vx/Math.hypot(b.vx,b.vy), ny=b.vy/Math.hypot(b.vx,b.vy);
      ctx.beginPath();
      ctx.moveTo(sx - nx*len, sy - ny*len);
      ctx.lineTo(sx, sy);
      ctx.stroke();
      ctx.fillStyle='rgba(255,255,255,0.95)';
      ctx.beginPath(); ctx.arc(sx,sy,1.2,0,Math.PI*2); ctx.fill();
    }

    // draw enemies
    for(const e of enemies) e.draw(ctx, camera);

    // draw particles
    for(const p of particles){
      const a = p.life / p.maxLife;
      const sx=p.x - camera.x + W/2, sy=p.y - camera.y + H/2;
      ctx.globalAlpha= a;
      ctx.fillStyle=p.color;
      ctx.beginPath(); ctx.arc(sx,sy, p.size*a,0,Math.PI*2); ctx.fill();
    }
    ctx.globalAlpha=1;

    // draw player (white silhouette borders, black fill)
    const px = W/2, py = H/2; // since camera follows player, player at center
    // but we have world vs screen, actual screen pos of player is W/2 + (player.x-camera.x), which lerp makes slight offset, use precise
    const psx = player.x - camera.x + W/2;
    const psy = player.y - camera.y + H/2;
    ctx.save();
    ctx.translate(psx, psy);
    ctx.rotate(player.angle);
    // invul flash
    if(player.invul>0 && Math.floor(player.invul*18)%2===0){
      ctx.globalAlpha=0.45;
    }
    // body: white outline silhouette
    ctx.fillStyle='#0a0a0e';
    ctx.strokeStyle='rgba(255,255,255,0.96)';
    ctx.lineWidth=2.2;
    ctx.shadowColor='rgba(255,255,255,0.35)'; ctx.shadowBlur=8;
    // torso circle
    ctx.beginPath(); ctx.arc(0,0, player.radius*0.9,0,Math.PI*2); ctx.fill(); ctx.stroke();
    // direction indicator (gun barrel)
    ctx.fillStyle='rgba(255,255,255,0.96)';
    ctx.fillRect(player.radius*0.2, -2.2, 18, 4.4);
    ctx.strokeStyle='rgba(255,255,255,0.96)'; ctx.lineWidth=1;
    ctx.strokeRect(player.radius*0.2, -2.2, 18,4.4);
    // inner dot (head facing)
    ctx.fillStyle='#fff';
    ctx.beginPath(); ctx.arc(4,0,2.2,0,Math.PI*2); ctx.fill();
    // health ring around player when low?
    ctx.shadowBlur=0;
    ctx.restore();

    // world border fade text? optional
    // draw aim line faint
    ctx.strokeStyle='rgba(255,255,255,0.08)';
    ctx.lineWidth=1;
    ctx.setLineDash([4,6]);
    ctx.beginPath();
    ctx.moveTo(psx + Math.cos(player.angle)*24, psy+ Math.sin(player.angle)*24);
    ctx.lineTo(psx + Math.cos(player.angle)*120, psy+ Math.sin(player.angle)*120);
    ctx.stroke();
    ctx.setLineDash([]);

    // vignette damage
    if(player.hp < 30){
      const v = (30-player.hp)/30;
      ctx.fillStyle=`rgba(255,38,64,${v*0.18})`;
      ctx.fillRect(0,0,W,H);
    }

    ctx.restore();
  }

  function updateHUD(){
    healthFill.style.width= `${Math.max(0, player.hp/player.maxHp*100)}%`;
    healthValue.textContent= `${Math.ceil(player.hp)} / ${player.maxHp}`;
    hudLevel.textContent= player.level;
    hudXp.textContent= `${player.xp} / ${player.xpNeeded} XP`;
    xpFill.style.width= `${player.xp/player.xpNeeded*100}%`;
    hudWave.textContent= currentWave;
    hudEnemies.textContent= enemies.length;
    hudKills.textContent= totalKills;
    hudPoints.textContent= score.toLocaleString();
    // ammo dots
    ammoDots.innerHTML='';
    for(let i=0;i<player.magSize;i++){
      const d=document.createElement('div');
      d.className='ammo-dot'+(i>=player.ammo?' empty':'');
      ammoDots.appendChild(d);
    }
    ammoInfo.textContent= `${player.ammo} / ${player.magSize}` + (player.reloading ? '  — RECARGANDO' : '');
    if(player.reloading) ammoInfo.style.color='#ffcc00'; else ammoInfo.style.color='rgba(255,255,255,0.6)';
  }

  function showUpgradeScreen(){
    upgradeScreen.classList.remove('hidden');
    pointsValueEl.textContent= player.skillPoints;
    buildUpgradeCards();
  }
  function buildUpgradeCards(){
    upgradeGrid.innerHTML='';
    Object.entries(upgradeDefs).forEach(([key, def])=>{
      const card=document.createElement('div');
      card.className='up-card';
      const currentVals = { damage:player.damage, magSize:player.magSize, fireCooldown:player.fireCooldown, maxHp:player.maxHp, healAmount:player.healAmount, reloadTime:player.reloadTime };
      // we need friendly display: for reload, show combined
      let nextLabel = '';
      if(key==='damage') nextLabel = `${player.damage} → ${player.damage+4} dmg`;
      else if(key==='ammo') nextLabel = `${player.magSize} → ${player.magSize+4}`;
      else if(key==='reload') nextLabel = `${player.fireCooldown}ms / ${player.reloadTime.toFixed(2)}s → ${Math.max(90,player.fireCooldown-30)}ms / ${Math.max(0.45,player.reloadTime-0.10).toFixed(2)}s`;
      else if(key==='hp') nextLabel = `${player.maxHp} → ${player.maxHp+20} HP`;
      else if(key==='heal') nextLabel = `${player.healAmount} → ${player.healAmount+10} HP`;
      card.innerHTML=`
        <div class="up-icon ${def.cls}">${def.icon}</div>
        <div class="up-name">${def.name}</div>
        <div class="up-desc">${def.desc}</div>
        <div class="up-stats"><span>Nivel actual</span><span>${nextLabel}</span></div>
        <button class="up-btn" ${player.skillPoints<=0?'disabled':''}>Mejorar — 1 Pt</button>
      `;
      const btn=card.querySelector('.up-btn');
      btn.addEventListener('click', ()=>{
        if(player.skillPoints<=0) return;
        player.skillPoints--;
        // apply
        if(key==='damage') player.damage+=4;
        else if(key==='ammo'){ player.magSize+=4; player.ammo+=4; }
        else if(key==='reload'){ player.fireCooldown=Math.max(90, player.fireCooldown-30); player.reloadTime=Math.max(0.45, player.reloadTime-0.10); }
        else if(key==='hp'){ player.maxHp+=20; player.hp+=20; }
        else if(key==='heal'){ player.healAmount+=10; }
        pointsValueEl.textContent=player.skillPoints;
        buildUpgradeCards(); // refresh
        updateHUD();
        playTone(700,0.12,0,'sine',0.2);
        if(player.skillPoints===0){
          btn.textContent='Sin puntos';
        }
      });
      upgradeGrid.appendChild(card);
    });
  }
  continueBtn.addEventListener('click', ()=>{
    const wasFinal = upgradeScreen.dataset.final==='true';
    upgradeScreen.classList.add('hidden');
    upgradeScreen.dataset.final='false';
    if(wasFinal){
      gameState='waveTransition';
      setTimeout(()=> triggerOutro(), 500);
      return;
    }
    if(currentWave <10){
      const def=waveDefs[currentWave-1];
      const expected=def.spiders+def.reptiles+def.dragons;
      if(enemies.length===0 && totalWaveSpawned>=expected){
        currentWave++;
        totalWaveSpawned=0;
        if(currentWave<=10){
          gameState='playing';
          lastTime=performance.now();
          runWave(currentWave);
        } else {
          gameState='playing';
        }
      } else {
        gameState='playing';
        lastTime=performance.now();
      }
    } else {
      gameState='playing';
      lastTime=performance.now();
    }
  });

  async function triggerOutro(){
    ghostOverlay.dataset.crack='true';
    playTone(220,0.6,0,'sine',0.18);
    await showGhostSequence("— El velo se rompe —", [
      "Oh...",
      "Lo lograste ...",
      "ah"
    ]);
    // after crack animation (handled inside showGhostSequence via doCrack) we show credits
    // small extra shatter feel
    crackOverlay.classList.remove('active');
    crackOverlay.innerHTML='';
    ghostCard.style.transform=''; ghostCard.style.opacity='';
    showCredits();
  }

  function showCredits(){
    creditsScreen.classList.remove('hidden');
    creditsInner.innerHTML=`
      <div class="credits-title">DESOLATE LAND</div>
      <div class="credits-sub">Has visto el final de este horrendo mundo</div>
      <div class="credits-divider"></div>
      <div class="credits-block">
        <strong>Diseño & Código</strong><br>
        Basado en la visión de <em>objetivo-del-juego.md</em><br>
        Corazón — <span style="color:#ff5a7a">latido único y encogimiento</span><br>
        Fantasma — carta interactiva con brillo y grieta<br>
      </div>
      <div class="credits-block">
        <strong>Enemigos</strong><br>
        <span style="color:#7aff8a">Araña</span> · enjambre veloz, patas con ruido y telaraña<br>
        <span style="color:#7af0ff">Reptil</span> · criatura segmentada con cola y carga<br>
        <span style="color:#ff8a4a">Dragón</span> · serpiente alada de 18 vértebras, aliento ígneo<br>
      </div>
      <div class="credits-block">
        <strong>Mecánicas</strong><br>
        10 oleadas · Sistema de niveles · 5 mejoras (Daño / Recarga / Munición / Vida / Curación)<br>
        Movimiento en vacío negro · Silueta de bordes blancos · Cámara centrada
      </div>
      <div class="credits-block">
        <strong>Recursos Originales</strong><br>
        Heart Animation · Interactive Ghost Card · Spider Cursor · Reptile Cursor · Dragon Cursor
      </div>
      <div class="credits-thanks">
        “Gracias por llegar hasta el final. El vacío ya no está vacío.”<br><br>
        <button class="btn-primary" onclick="document.getElementById('creditsScreen').classList.add('hidden'); document.getElementById('menu').classList.remove('hidden');">Volver al Menú</button>
      </div>
      <div style="margin-top:30px; font-family:'JetBrains Mono',monospace; font-size:10px; color:rgba(255,255,255,0.22); letter-spacing:0.16em;">© 2026 — DESOLATE LAND · PROTO</div>
    `;
    // auto hide after? leave button
    gameState='credits';
  }

  // initial HUD
  updateHUD();

  // expose for debug
  window._game={player, enemies, waveDefs};

})();

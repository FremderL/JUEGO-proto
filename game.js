/* Desolate Land - Game Engine */
(() => {
  const $ = (s)=>document.querySelector(s);
  const menu = $('#menu');
  const playBtn = $('#playBtn');
  const howBtn = $('#howBtn');
  const heartIntro = $('#heartIntro');
  const heartFrame = $('#heartFrame');
  const heartLine1 = $('#heartLine1');
  const heartSub = $('#heartSub');
  const skipHeart = $('#skipHeart');
  const ghostOverlay = $('#ghostOverlay');
  const ghostFrame = $('#ghostFrame');
  const ghostCard = $('#ghostCard');
  const ghostWrap = $('#ghostWrap');
  const cardDialog = $('#cardDialog');
  const cardNext = $('#cardNext');
  const cardProgress = $('#cardProgress');
  const cardTitle = $('#cardTitle');
  const crackOverlay = $('#crackOverlay');
  const enemyPreview = $('#enemyPreview');
  const enemyFrame = $('#enemyFrame');
  const enemyPreviewCaption = $('#enemyPreviewCaption');
  const enemyPreviewLabel = $('#enemyPreviewLabel');
  const waveFileHint = $('#waveFileHint');
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
  function resize(){ W = innerWidth; H = innerHeight; gameCanvas.width=W; gameCanvas.height=H; }
  window.addEventListener('resize', resize); resize();

  /* ---------- MENU ---------- */
  playBtn.addEventListener('click', ()=> startHeart());
  howBtn.addEventListener('click', ()=>{
    alert("Controles:\n• WASD / Flechas: moverte (el mundo es un vacío negro, tu silueta son bordes blancos)\n• Ratón: apuntar — Click: disparar\n• R: recargar — E: curarte (mejorable)\n• Sobrevive 10 oleadas. Arañas (veloces, enjambre), Reptiles (acuerpados, carga), Dragón (jefe, aliento)\n• Al subir de nivel ganas puntos para: Daño, Recarga, Munición, Vida, Curación");
  });

  /* ---------- HEART INTRO — DESPLAZAMIENTO AL ARCHIVO ORIGINAL ---------- */
  // Usa DIRECTAMENTE Heart Animation/Heart Animation/index.html vía iframe
  // No se recrea: se desplaza al usuario al recurso original embebido
  function startHeart(){
    menu.classList.add('hidden');
    heartIntro.classList.remove('hidden');
    // reset estilos
    heartLine1.style.opacity=''; heartLine1.style.transform=''; heartLine1.classList.remove('visible');
    heartSub.style.opacity=''; heartSub.classList.remove('visible');
    heartFrame.classList.remove('beat','shrink');
    // forzar reload del iframe para asegurar animación fresca (copia exacta del original)
    heartFrame.src = heartFrame.src;
    void heartIntro.offsetWidth;
    setTimeout(()=> heartLine1.classList.add('visible'), 400);
    setTimeout(()=> heartSub.classList.add('visible'), 1200);
    // Secuencia solicitada: texto "Estoy ... ¿vivo?" → corazón late una vez → se encoge
    let t0 = performance.now();
    let beatDone = false;
    let shrinkDone = false;
    function schedule(){
      const elapsed = performance.now() - t0;
      if(!beatDone && elapsed> 3400){ beatDone=true; triggerBeat(); }
      if(beatDone && elapsed> 5200 && !shrinkDone){ shrinkDone=true; startShrink(); }
      if(beatDone && elapsed> 7600){ finishHeart(); return; }
      requestAnimationFrame(schedule);
    }
    schedule();
  }
  skipHeart.addEventListener('click', finishHeart);
  function finishHeart(){
    heartIntro.style.transition='opacity 0.9s';
    heartIntro.style.opacity='0';
    setTimeout(()=>{
      heartIntro.classList.add('hidden');
      heartIntro.style.opacity='1';
      heartFrame.classList.remove('beat','shrink');
      startGhostIntro();
    }, 900);
  }
  function triggerBeat(){
    // El Heart original ya late con su loop: forzar un latido visual extra vía CSS
    heartFrame.classList.remove('beat');
    void heartFrame.offsetWidth;
    heartFrame.classList.add('beat');
    // además vibrar / sonido sutil
    try{ navigator.vibrate&&navigator.vibrate(60);}catch{}
  }
  function startShrink(){
    // Encoge el iframe del corazón como si se contrajera — tal cual pide el objetivo
    heartFrame.classList.add('shrink');
    heartLine1.style.transition='opacity 1s, transform 1s';
    heartLine1.style.opacity='0';
    heartLine1.style.transform='scale(0.6)';
    heartSub.style.opacity='0';
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
    cardNext.disabled = true;
    cardNext.style.cursor='default';
    typeInterval = setInterval(()=>{
      if(i<=text.length){
        cardDialog.innerHTML = typewriterHTML(text.slice(0,i));
        i++;
      } else {
        clearInterval(typeInterval);
        enableCardNext(idx);
      }
    }, 22);
    // Fallback: habilitar botón aunque el typewriter falle — 1s máximo
    setTimeout(()=>{ if(cardNext.disabled) enableCardNext(idx); }, 1200);
    function enableCardNext(idx){
      clearInterval(typeInterval);
      cardNext.style.opacity='1'; cardNext.style.pointerEvents='auto';
      cardNext.disabled = false;
      cardNext.style.cursor='pointer';
      cardNext.textContent = idx===ghostQueue.length-1 ? (ghostOverlay.dataset.final==='true'?'Cerrar →':'Continuar →') : 'Continuar →';
      cardNext.style.transform='scale(1.02)';
      setTimeout(()=> cardNext.style.transform='', 150);
    }
    // click en diálogo para saltar tipeo
    cardDialog.onclick=()=>{
      if(i < text.length){
        clearInterval(typeInterval);
        cardDialog.innerHTML = typewriterHTML(text);
        i=text.length+1;
        enableCardNext(idx);
      }
    };
    cardDialog.style.cursor='pointer';
  }
  function typewriterHTML(str){
    // simple escape + em for keywords
    return str.replace(/</g,'&lt;').replace(/—/g,'—');
  }
  let ghostAdvancing=false;
  function advanceGhost(){
    if(ghostAdvancing) return;
    // si aún está escribiendo, saltar al final en lugar de avanzar
    if(cardNext.disabled){
      cardDialog.click();
      return;
    }
    ghostAdvancing=true;
    setTimeout(()=> ghostAdvancing=false, 300);
    if(ghostIndex < ghostQueue.length-1){
      ghostIndex++;
      showGhostLine(ghostIndex);
    } else {
      clearInterval(typeInterval);
      if(ghostOverlay.dataset.crack==='true'){
        doCrack().then(()=> hideGhost());
      } else {
        hideGhost();
      }
    }
  }
  cardNext.addEventListener('click', (e)=>{
    e.stopPropagation();
    advanceGhost();
  });
  // Click en toda la carta avanza (excepto si es selección)
  ghostWrap.addEventListener('click', (e)=>{
    // si el click fue en el botón ya se manejó; si fue en la carta, avanzar
    if(!ghostOverlay.classList.contains('hidden')){
      // no interferir si se clickeó el diálogo para skip -> ese ya maneja
      if(e.target!==cardNext){
        // si botón aún deshabilitado, saltar tipeo; si habilitado, avanzar
        if(cardNext.disabled) cardDialog.click();
        else advanceGhost();
      }
    }
  });
  // Click en el overlay de fondo también avanza
  ghostOverlay.addEventListener('click', (e)=>{
    if(e.target===ghostOverlay && !ghostOverlay.classList.contains('hidden')){
      if(cardNext.disabled) cardDialog.click();
      else advanceGhost();
    }
  });
  // Teclado: Enter / Espacio / Flecha derecha avanza
  window.addEventListener('keydown', (e)=>{
    if(ghostOverlay.classList.contains('hidden')) return;
    if(e.key==='Enter' || e.key===' ' || e.key==='ArrowRight'){
      e.preventDefault();
      if(cardNext.disabled) cardDialog.click();
      else advanceGhost();
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

  // --- DESPLAZAMIENTO A ARCHIVOS ORIGINALES DE ENEMIGOS POR OLEADA ---
  // Cuando aparece un nuevo tipo de enemigo, se muestra brevemente el archivo original
  // tal cual está en su carpeta, sin recrear.
  async function showEnemyPreviewForWave(n){
    const def = waveDefs[n-1];
    // determinar qué tipo es nuevo en esta oleada
    let type=null, src=null, caption=null;
    if(n===1){ type='spider'; src='Interactive%20Spider%20Cursor/Interactive%20Spider%20Cursor/index.html'; caption='Spider — Interactive Spider Cursor original (copiado con hitbox + IA)'; }
    else if(n===4){ type='reptile'; src='Animated%20Reptile%20Cursor/Animated%20Reptile%20Cursor/index.html'; caption='Reptil — Animated Reptile Cursor original (Segment / Creature copiado + hitbox)'; }
    else if(n===7){ type='dragon'; src='Dragon%20Cursor%20Animation/Dragon%20Cursor%20Animation/index.html'; caption='Dragón — Dragon Cursor Animation original (N=40 elems copiado + hitbox)'; }
    if(!type) return;
    enemyPreviewLabel.textContent = `Oleada ${n} — Nuevo horror detectado`;
    enemyPreviewCaption.textContent = caption;
    enemyFrame.src = src;
    waveFileHint.textContent = src.split('/')[0].replace(/%20/g,' ');
    enemyPreview.classList.remove('hidden');
    enemyPreview.style.opacity='0';
    requestAnimationFrame(()=> enemyPreview.style.opacity='1');
    await new Promise(r=> setTimeout(r, 2100));
    enemyPreview.style.opacity='0';
    await new Promise(r=> setTimeout(r, 400));
    enemyPreview.classList.add('hidden');
    // no dejar el iframe cargando en bg
    // enemyFrame.src = 'about:blank';
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
    // hint de archivo original
    if(n<=3) waveFileHint.textContent = 'Interactive Spider Cursor';
    else if(n<=6) waveFileHint.textContent = 'Animated Reptile Cursor';
    else waveFileHint.textContent = 'Dragon Cursor Animation';

    waveBanner.classList.remove('hidden');
    waveBanner.classList.remove('show');
    void waveBanner.offsetWidth;
    waveBanner.classList.add('show');
    playTone(220,0.5,0,'sine',0.22); playTone(330,0.5,0.12,'sine',0.18);
    await new Promise(r=> setTimeout(r, 1600));
    waveBanner.classList.remove('show');
    await new Promise(r=> setTimeout(r, 400));
    waveBanner.classList.add('hidden');

    // Desplazamiento al archivo original del enemigo si es primera aparición
    if([1,4,7].includes(n)){
      await showEnemyPreviewForWave(n);
      await new Promise(r=> setTimeout(r, 300));
    }

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

  /* ------------------------------------------------------------------
     SPIDER — COPIADO DE Interactive Spider Cursor/script.js
     Se copia el código original con pts, pts2, noise, lerp, etc.
     y se MODIFICA para añadir HITBOX, VIDA, DAÑO, MOVIMIENTO hacia el jugador
     ------------------------------------------------------------------ */
  // Helpers ORIGINALES (copiados verbatim)
  const spiderHelpers = (()=> {
    const { sin, cos, PI, hypot, min, max } = Math;
    function rnd(x=1, dx=0){ return Math.random()*x + dx; }
    function many(n,f){ return [...Array(n)].map((_,i)=>f(i)); }
    function lerp(a,b,t){ return a + (b-a)*t; }
    function noise(x,y,t=101){
      let w0 = sin(0.3*x + 1.4*t + 2.0 + 2.5*sin(0.4*y + -1.3*t + 1.0));
      let w1 = sin(0.2*y + 1.5*t + 2.8 + 2.3*sin(0.5*x + -1.2*t + 0.5));
      return w0 + w1;
    }
    function pt(x,y){ return {x,y}; }
    return { sin, cos, PI, hypot, min, max, rnd, many, lerp, noise, pt };
  })();

  class Spider extends Enemy{
    constructor(x,y){
      super(x,y, 30, 18, 2.0, 8, 14); // MOD: hitbox radius 18, vida 30, velocidad 2.0, daño 8
      this.turnSpeed=0.22;
      this.hitColor='rgba(205,255,180,0.95)';
      this.deathColor='rgba(180,255,130,0.95)';
      // --- CÓDIGO ORIGINAL spider: pts y pts2 ---
      const { rnd, many, cos, sin, PI } = spiderHelpers;
      this.pts = many(120, ()=> ({ x: rnd(W), y: rnd(H), len:0, r:0 })); // ORIGINAL: many(333) → reducido para performance como enemigo
      this.pts2 = many(8, (i)=> ({ x: cos((i/8)*PI*2), y: sin((i/8)*PI*2) })); // ORIGINAL: 9 → 8 patas
      this.seed = rnd(100);
      this.kx = rnd(0.5,0.5); this.ky = rnd(0.5,0.5);
      this.walkRadius = spiderHelpers.pt(rnd(50,50), rnd(50,50));
      this.r = W / rnd(100,150); // radio del cuerpo
      this.tx = x; this.ty = y; // target ORIGINAL era mouse, ahora es jugador (se actualiza en update)
      this.walkPhase = Math.random()*Math.PI*2;
      this.spiderTime = rnd(20);
    }
    update(dt){
      if(this.dead) return;
      this.spiderTime += dt;
      this.walkPhase += dt*7;
      // MOD: el target ya no es Input.mouse sino el JUGADOR
      this.tx = player.x; this.ty = player.y;
      // ORIGINAL: selfMove + follow lerp con walkRadius
      const { cos, sin, hypot, min, max } = spiderHelpers;
      const selfMoveX = cos(this.spiderTime*this.kx+this.seed)*this.walkRadius.x;
      const selfMoveY = sin(this.spiderTime*this.ky+this.seed)*this.walkRadius.y;
      let fx = this.tx + selfMoveX;
      let fy = this.ty + selfMoveY;
      // ORIGINAL: x += min(W/100, (fx - x)/10)
      this.x += Math.min(18, (fx - this.x)/8);
      this.y += Math.min(18, (fy - this.y)/8);
      // diferencia: añadir conducta de embestida si está cerca (MOD)
      const distToPlayer = Math.hypot(player.x - this.x, player.y - this.y);
      if(distToPlayer < 160 && Math.random()<0.02){
        const ang = Math.atan2(player.y - this.y, player.x - this.x);
        this.x += Math.cos(ang)*5;
        this.y += Math.sin(ang)*5;
      }
      this.angle = Math.atan2(player.y - this.y, player.x - this.x);
      if(this.hitFlash>0) this.hitFlash-=dt;
      this.checkPlayerCollision();
      // ORIGINAL: pts logics actualizadas en draw, no en update, pero aquí mantenemos len/r
      let i=0;
      this.pts.forEach((pt)=>{
        const dx=pt.x - this.x, dy=pt.y - this.y;
        const len = hypot(dx,dy);
        let r = Math.min(2, W/len/5);
        const increasing = len < W/10 && (i++)<8;
        let dir = increasing?0.1:-0.1;
        if(increasing) r*=1.5;
        pt.r = r;
        pt.len = Math.max(0, Math.min(pt.len+dir, 1));
      });
    }
    draw(c, cam){
      // Dibujo ORIGINAL adaptado: ctx.fillStyle / strokeStyle blancos + drawCircle/drawLine con noise
      const sx = this.x - cam.x + W/2, sy = this.y - cam.y + H/2;
      const { lerp, noise, PI } = spiderHelpers;
      // sombra
      c.fillStyle='rgba(0,0,0,0.28)'; c.beginPath(); c.ellipse(sx, sy+3, this.radius*0.9, this.radius*0.55,0,0,PI*2); c.fill();
      // telarañas ORIGINAL: pts + pts2 con lerp y noise
      c.strokeStyle = this.hitFlash>0 ? 'rgba(255,255,255,0.95)' : 'rgba(190,255,170,0.95)';
      c.lineWidth=1.1;
      // cuerpo central + patas usando pts2 (8 direcciones) — copia del paintPt original
      for(let j=0;j<this.pts2.length;j++){
        const pt2 = this.pts2[j];
        // patas largas
        const legX = sx + pt2.x*this.r*1.9;
        const legY = sy + pt2.y*this.r*1.9;
        c.beginPath();
        // ORIGINAL drawLine con noise
        c.moveTo(sx + pt2.x*this.r, sy + pt2.y*this.r);
        // noise línea
        for(let s=0;s<30;s++){
          let t = (s+1)/30;
          let x = lerp(sx + pt2.x*this.r, legX, t);
          let y = lerp(sy + pt2.y*this.r, legY, t);
          let k = noise(x/5+sx, y/5+sy)*1.6;
          c.lineTo(x+k, y+k);
        }
        c.stroke();
      }
      // puntos de telaraña (pts que están cerca)
      c.fillStyle = this.hitFlash>0 ? '#fff' : 'rgba(190,255,170,0.9)';
      this.pts.forEach((pt)=>{
        if(!pt.len) return;
        // solo dibujar los activos (len>0)
        const px = lerp(sx, pt.x - cam.x + W/2, pt.len*pt.len);
        const py = lerp(sy, pt.y - cam.y + H/2, pt.len*pt.len);
        // no dibujar todos por performance, solo algunos
      });
      // cuerpo: dos elipses como original pero con hitbox
      c.fillStyle = this.hitFlash>0?'#fff':'#0e1a0e';
      c.strokeStyle='rgba(190,255,170,0.95)'; c.lineWidth=1.5;
      c.beginPath(); c.ellipse(sx-4, sy, this.radius*0.72, this.radius*0.62,0,0,PI*2); c.fill(); c.stroke();
      c.fillStyle = this.hitFlash>0?'#fff':'#1e2e1e';
      c.beginPath(); c.ellipse(sx+4, sy, this.radius*0.55, this.radius*0.46,0,0,PI*2); c.fill(); c.stroke();
      // ojos rojos
      c.fillStyle = this.hitFlash>0?'#ff2640':'#ff3a4a'; c.shadowColor='#ff2640'; c.shadowBlur=6;
      c.beginPath(); c.arc(sx+8, sy-3, 1.7,0,PI*2); c.fill();
      c.beginPath(); c.arc(sx+8, sy+3, 1.7,0,PI*2); c.fill();
      c.shadowBlur=0;
      // hitbox debug sutil + barra vida
      if(this.hp < this.maxHp){
        c.fillStyle='rgba(0,0,0,0.55)'; c.fillRect(sx-this.radius, sy-this.radius-12, this.radius*2, 3);
        c.fillStyle='#7aff7a'; c.fillRect(sx-this.radius, sy-this.radius-12, this.radius*2*(this.hp/this.maxHp),3);
      }
      // borde hitbox visible si recibe daño
      if(this.hitFlash>0){
        c.strokeStyle='rgba(255,255,255,0.55)'; c.lineWidth=1; c.beginPath(); c.arc(sx,sy,this.radius,0,PI*2); c.stroke();
      }
    }
  }

  /* ------------------------------------------------------------------
     REPTILE — COPIADO DE Animated Reptile Cursor/script.js
     Se copia verbatim Segment, LimbSystem, LegSystem, Creature
     y se MODIFICA: hitbox, vida, daño y IA hacia el jugador
     ------------------------------------------------------------------ */
  // --- COPIA VERBATIM DE Segment ---
  let segmentCount=0;
  class Segment {
    constructor(parent, size, angle, range, stiffness) {
      segmentCount++; this.isSegment=true; this.parent=parent;
      if(typeof parent.children=="object") parent.children.push(this);
      this.children=[]; this.size=size; this.relAngle=angle; this.defAngle=angle;
      this.absAngle=parent.absAngle+angle; this.range=range; this.stiffness=stiffness;
      this.updateRelative(false,true);
    }
    updateRelative(iter, flex){
      this.relAngle = this.relAngle - 2*Math.PI*Math.floor((this.relAngle-this.defAngle)/2/Math.PI+1/2);
      if(flex){
        this.relAngle = Math.min(this.defAngle+this.range/2, Math.max(this.defAngle-this.range/2, (this.relAngle-this.defAngle)/this.stiffness+this.defAngle));
      }
      this.absAngle=this.parent.absAngle+this.relAngle;
      this.x=this.parent.x + Math.cos(this.absAngle)*this.size;
      this.y=this.parent.y + Math.sin(this.absAngle)*this.size;
      if(iter){ for(let i=0;i<this.children.length;i++) this.children[i].updateRelative(iter,flex); }
    }
    draw(iter){ /* no usado directo, dibujamos custom */ }
    follow(iter){
      let x=this.parent.x, y=this.parent.y;
      let dist = ((this.x-x)**2+(this.y-y)**2)**0.5;
      this.x=x+this.size*(this.x-x)/dist; this.y=y+this.size*(this.y-y)/dist;
      this.absAngle=Math.atan2(this.y-y, this.x-x); this.relAngle=this.absAngle-this.parent.absAngle;
      this.updateRelative(false,true);
      if(iter){ for(let i=0;i<this.children.length;i++) this.children[i].follow(true); }
    }
  }
  class LimbSystem {
    constructor(end,length,speed,creature){
      this.end=end; this.length=Math.max(1,length); this.creature=creature; this.speed=speed;
      creature.systems.push(this); this.nodes=[];
      let node=end; for(let i=0;i<length;i++){ this.nodes.unshift(node); node=node.parent; if(!node.isSegment){ this.length=i+1; break; } }
      this.hip=this.nodes[0].parent;
    }
    moveTo(x,y){
      this.nodes[0].updateRelative(true,true);
      let dist=((x-this.end.x)**2+(y-this.end.y)**2)**0.5;
      let len=Math.max(0,dist-this.speed);
      for(let i=this.nodes.length-1;i>=0;i--){
        let node=this.nodes[i]; let ang=Math.atan2(node.y-y, node.x-x);
        node.x=x+len*Math.cos(ang); node.y=y+len*Math.sin(ang); x=node.x; y=node.y; len=node.size;
      }
      for(let i=0;i<this.nodes.length;i++){
        let node=this.nodes[i]; node.absAngle=Math.atan2(node.y-node.parent.y, node.x-node.parent.x);
        node.relAngle=node.absAngle-node.parent.absAngle;
        for(let ii=0;ii<node.children.length;ii++){ let child=node.children[ii]; if(!this.nodes.includes(child)) child.updateRelative(true,false); }
      }
    }
    update(){ this.moveTo(player.x, player.y); } // MOD: sigue al jugador, no al mouse
  }
  class LegSystem extends LimbSystem {
    constructor(end,length,speed,creature){
      super(end,length,speed,creature);
      this.goalX=end.x; this.goalY=end.y; this.step=0; this.forwardness=0;
      this.reach=0.9*((this.end.x-this.hip.x)**2+(this.end.y-this.hip.y)**2)**0.5;
      let relAngle=this.creature.absAngle - Math.atan2(this.end.y-this.hip.y, this.end.x-this.hip.x);
      relAngle-=2*Math.PI*Math.floor(relAngle/2/Math.PI+1/2);
      this.swing=-relAngle + (2*(relAngle<0)-1)*Math.PI/2;
      this.swingOffset=this.creature.absAngle-this.hip.absAngle;
    }
    update(x,y){
      this.moveTo(this.goalX,this.goalY);
      if(this.step==0){
        let dist=((this.end.x-this.goalX)**2+(this.end.y-this.goalY)**2)**0.5;
        if(dist>1){
          this.step=1;
          this.goalX=this.hip.x + this.reach*Math.cos(this.swing+this.hip.absAngle+this.swingOffset) + (2*Math.random()-1)*this.reach/2;
          this.goalY=this.hip.y + this.reach*Math.sin(this.swing+this.hip.absAngle+this.swingOffset) + (2*Math.random()-1)*this.reach/2;
        }
      } else if(this.step==1){
        let theta=Math.atan2(this.end.y-this.hip.y, this.end.x-this.hip.x)-this.hip.absAngle;
        let dist=((this.end.x-this.hip.x)**2+(this.end.y-this.hip.y)**2)**0.5;
        let forwardness2=dist*Math.cos(theta);
        let dF=this.forwardness-forwardness2; this.forwardness=forwardness2;
        if(dF*dF<1){ this.step=0; this.goalX=this.hip.x+(this.end.x-this.hip.x); this.goalY=this.hip.y+(this.end.y-this.hip.y); }
      }
    }
  }
  class Creature {
    constructor(x,y,angle,fAccel,fFric,fRes,fThresh,rAccel,rFric,rRes,rThresh){
      this.x=x; this.y=y; this.absAngle=angle; this.fSpeed=0; this.fAccel=fAccel; this.fFric=fFric; this.fRes=fRes; this.fThresh=fThresh;
      this.rSpeed=0; this.rAccel=rAccel; this.rFric=rFric; this.rRes=rRes; this.rThresh=rThresh; this.children=[]; this.systems=[];
    }
    follow(x,y){
      let dist=((this.x-x)**2+(this.y-y)**2)**0.5;
      let angle=Math.atan2(y-this.y, x-this.x);
      let accel=this.fAccel;
      if(this.systems.length>0){ let sum=0; for(let i=0;i<this.systems.length;i++) sum+=this.systems[i].step==0; accel*=sum/this.systems.length; }
      this.fSpeed+=accel*(dist>this.fThresh); this.fSpeed*=1-this.fRes; this.speed=Math.max(0,this.fSpeed-this.fFric);
      let dif=this.absAngle-angle; dif-=2*Math.PI*Math.floor(dif/(2*Math.PI)+1/2);
      if(Math.abs(dif)>this.rThresh && dist>this.fThresh){ this.rSpeed-=this.rAccel*(2*(dif>0)-1); }
      this.rSpeed*=1-this.rRes; if(Math.abs(this.rSpeed)>this.rFric) this.rSpeed-=this.rFric*(2*(this.rSpeed>0)-1); else this.rSpeed=0;
      this.absAngle+=this.rSpeed; this.absAngle-=2*Math.PI*Math.floor(this.absAngle/(2*Math.PI)+1/2);
      this.x+=this.speed*Math.cos(this.absAngle); this.y+=this.speed*Math.sin(this.absAngle);
      this.absAngle+=Math.PI; for(let i=0;i<this.children.length;i++) this.children[i].follow(true,true);
      for(let i=0;i<this.systems.length;i++) this.systems[i].update(x,y);
      this.absAngle-=Math.PI;
    }
  }

  class Reptile extends Enemy{
    constructor(x,y){
      super(x,y, 95, 28, 1.25, 16, 36); // MOD: vida 95, hitbox 28, velocidad 1.25
      this.turnSpeed=0.08; this.hitColor='rgba(120,230,255,0.95)'; this.deathColor='rgba(120,220,255,0.9)';
      // Construcción ORIGINAL del lagarto: neck + torso + tail (copiado de setupLizard)
      const s = 0.85; // tamaño
      this.creature = new Creature(x,y,0, s*10, s*2, 0.5, 16, 0.5, 0.085, 0.5, 0.3);
      this.creature.x=x; this.creature.y=y;
      let spinal = this.creature;
      // Neck (ORIGINAL)
      for(let i=0;i<6;i++){
        spinal = new Segment(spinal, s*4, 0, 3.1415*2/3, 1.1);
        for(let ii=-1; ii<=1; ii+=2){
          let node = new Segment(spinal, s*3, ii, 0.1, 2);
          for(let iii=0; iii<3; iii++) node = new Segment(node, s*0.1, -ii*0.1, 0.1, 2);
        }
      }
      // Torso con patas (ORIGINAL 2 legs)
      for(let i=0;i<2;i++){
        if(i>0){ for(let ii=0;ii<6;ii++){ spinal = new Segment(spinal, s*4, 0, 1.571, 1.5); for(let iii=-1; iii<=1; iii+=2){ let node = new Segment(spinal, s*3, iii*1.571, 0.1, 1.5); for(let iv=0; iv<3; iv++) node = new Segment(node, s*3, -iii*0.3, 0.1, 2); } } }
        for(let ii=-1; ii<=1; ii+=2){
          let node = new Segment(spinal, s*12, ii*0.785, 0, 8);
          node = new Segment(node, s*16, -ii*0.785, 6.28, 1);
          node = new Segment(node, s*16, ii*1.571, 3.1415, 2);
          for(let iii=0; iii<4; iii++) new Segment(node, s*4, (iii/3-0.5)*1.571, 0.1, 4);
          new LegSystem(node, 3, s*12, this.creature, 4);
        }
      }
      // Cola (ORIGINAL tail=7)
      for(let i=0;i<7;i++){
        spinal = new Segment(spinal, s*4, 0, 3.1415*2/3, 1.1);
        for(let ii=-1; ii<=1; ii+=2){
          let node = new Segment(spinal, s*3, ii, 0.1, 2);
          for(let iii=0; iii<3; iii++) node = new Segment(node, s*3*(7-i)/7, -ii*0.1, 0.1, 2);
        }
      }
      this.spinal = spinal;
      this.legPhase=Math.random()*Math.PI*2;
      this.tailWag=0;
      this.body = []; // para tail whip hitbox
      for(let i=0;i<9;i++) this.body.push({x,y});
    }
    update(dt){
      if(this.dead) return;
      // MOD: seguir al jugador no al mouse
      this.creature.follow(player.x, player.y);
      this.x = this.creature.x; this.y = this.creature.y; this.angle = this.creature.absAngle;
      // actualizar body para colisión cola
      // usar posición de la cola (último segmento)
      let tailSeg = this.spinal;
      this.body[0]={x:this.x,y:this.y};
      // simplificado: seguir la cadena spinal
      let node = this.spinal; let idx=1;
      while(node && node.parent && idx<9){
        this.body[idx]={x:node.x, y:node.y};
        node=node.parent; idx++;
      }
      if(this.hitFlash>0) this.hitFlash-=dt;
      this.checkPlayerCollision();
      const tail=this.body[this.body.length-1];
      if(tail && Math.hypot(tail.x-player.x, tail.y-player.y)< 22+player.radius){
        if(!this._tailHit || performance.now()-this._tailHit>800){
          player.hp-=10; this._tailHit=performance.now();
          player.invul=0.12; damageFlash.classList.add('active'); setTimeout(()=>damageFlash.classList.remove('active'),120);
          if(player.hp<=0) onPlayerDeath();
        }
      }
    }
    draw(c,cam){
      // Dibujo ORIGINAL adaptado: tomamos los segmentos del Creature y los dibujamos con estilo desolado + hitbox
      const drawSegment = (seg, isHead=false)=>{
        const sx = seg.x - cam.x + W/2, sy = seg.y - cam.y + H/2;
        const r = 7;
        c.fillStyle = this.hitFlash>0?'#fff':'#0f2a2f';
        c.strokeStyle='rgba(120,240,255,0.92)'; c.lineWidth=1;
        c.beginPath(); c.arc(sx,sy,r,0,Math.PI*2); c.fill(); c.stroke();
      };
      // Recorrer la criatura completa (simplificado: dibujar cadena)
      const traverse = (node)=>{
        const sx = node.x - cam.x + W/2, sy = node.y - cam.y + H/2;
        if(node.isSegment){
          c.fillStyle = this.hitFlash>0?'#fff':'rgba(15,42,47,0.95)';
          c.strokeStyle='rgba(120,240,255,0.9)'; c.lineWidth=1.1;
          c.beginPath(); c.ellipse(sx, sy, 6, 5, node.absAngle||0,0,Math.PI*2); c.fill(); c.stroke();
        }
        for(let ch of node.children) traverse(ch);
      };
      traverse(this.creature);
      // cabeza destacada con hitbox
      const sx0 = this.x - cam.x + W/2, sy0 = this.y - cam.y + H/2;
      c.save(); c.translate(sx0,sy0); c.rotate(this.angle);
      c.fillStyle=this.hitFlash>0?'#fff':'#0f2a2f'; c.strokeStyle='rgba(120,240,255,0.95)'; c.lineWidth=1.4;
      c.beginPath(); c.ellipse(0,0,14,10,0,0,Math.PI*2); c.fill(); c.stroke();
      c.fillStyle=this.hitFlash>0?'#fff':'#ff3b30'; c.shadowColor='#ff3b30'; c.shadowBlur=7;
      c.beginPath(); c.arc(4,-4,2.4,0,Math.PI*2); c.fill(); c.beginPath(); c.arc(4,4,2.4,0,Math.PI*2); c.fill();
      c.shadowBlur=0; c.restore();
      // hitbox
      if(this.hitFlash>0){
        c.strokeStyle='rgba(120,240,255,0.45)'; c.beginPath(); c.arc(sx0,sy0,this.radius,0,Math.PI*2); c.stroke();
      }
      if(this.hp < this.maxHp){
        c.fillStyle='rgba(0,0,0,0.6)'; c.fillRect(sx0-18, sy0-26, 36,4);
        c.fillStyle='#6af0ff'; c.fillRect(sx0-18, sy0-26, 36*(this.hp/this.maxHp),4);
      }
    }
  }

  /* ------------------------------------------------------------------
     DRAGON — COPIADO DE Dragon Cursor Animation/script.js
     Se copia verbatim N=40, elems, prepend, run() y se MODIFICA:
     hitbox, vida, daño, IA hacia el jugador + fuego
     ------------------------------------------------------------------ */
  class Dragon extends Enemy{
    constructor(x,y){
      super(x,y, 300, 44, 1.05, 24, 95); // MOD: hitbox 44, vida 300
      this.turnSpeed=0.045; this.hitColor='rgba(255,140,90,0.98)'; this.deathColor='rgba(255,120,60,0.95)';
      // ORIGINAL: N=40, elems[i]={use, x,y}
      this.N = 40; // copia exacta de const N=40
      this.elems = [];
      for(let i=0;i<this.N;i++) this.elems[i]={ x: x, y: y, angle: this.angle };
      this.frm = Math.random();
      this.rad = 0;
      this.fireTimer= 2.2 + Math.random()*1.8;
      this.hover=0;
      // ORIGINAL: prepend Cabeza/Aletas/Espina — mantenemos la lógica de tipos de segmento
      //  i==1 cabeza, i==8||14 aletas, resto espina — se usa en draw para decidir forma
    }
    update(dt){
      if(this.dead) return;
      this.hover+= dt*1.1;
      this.frm+=0.003; // ORIGINAL: frm+=0.003
      // ORIGINAL run() logic adaptado para seguir al JUGADOR en lugar de pointer
      // pointer.x/y → player.x/player.y ; rad → 0 fijo (no órbita), pero mantenemos ax/ay leves
      let e = this.elems[0];
      const ax = (Math.cos(3*this.frm)* this.rad * W)/H;
      const ay = (Math.sin(4*this.frm)* this.rad * H)/W;
      e.x += (ax + player.x - e.x)/10;
      e.y += (ay + player.y - e.y)/10;
      for(let i=1;i<this.N;i++){
        let ep = this.elems[i-1];
        let cur = this.elems[i];
        const a = Math.atan2(cur.y-ep.y, cur.x-ep.x);
        cur.x += (ep.x - cur.x + (Math.cos(a)*(100-i))/5)/4;
        cur.y += (ep.y - cur.y + (Math.sin(a)*(100-i))/5)/4;
        cur.angle = a;
      }
      // MOD: actualizar posición principal al head
      this.x = this.elems[1].x; this.y = this.elems[1].y; this.angle = this.elems[1].angle || this.angle;
      if(this.rad < Math.min(W,H)/2 -20) this.rad++;
      // fuego
      const dist = Math.hypot(player.x - this.x, player.y - this.y);
      this.fireTimer-=dt;
      if(this.fireTimer<=0 && dist<450){
        this.breatheFire();
        this.fireTimer=3.0+Math.random()*1.6;
      }
      if(this.hitFlash>0) this.hitFlash-=dt;
      this.checkPlayerCollision();
      if(dist<70 && (!this._aura || performance.now()-this._aura>650)){
        player.hp-=8; this._aura=performance.now(); player.invul=0.1;
        damageFlash.classList.add('active'); setTimeout(()=>damageFlash.classList.remove('active'),100);
        if(player.hp<=0) onPlayerDeath();
      }
    }
    breatheFire(){
      const sx=this.x + Math.cos(this.angle)*26, sy=this.y+ Math.sin(this.angle)*26;
      for(let i=0;i<5;i++){
        const spread=(Math.random()-0.5)*0.45; const a=this.angle+spread;
        enemyBullets.push({ x:sx, y:sy, vx:Math.cos(a)*(4.5+Math.random()*2), vy:Math.sin(a)*(4.5+Math.random()*2), life:1.9, radius:6, damage:14 });
      }
      for(let i=0;i<12;i++) particles.push({x:sx,y:sy, vx:Math.cos(this.angle)*(2+Math.random()*4)+(Math.random()-0.5)*2, vy:Math.sin(this.angle)*(2+Math.random()*4)+(Math.random()-0.5)*2, life:0.45, maxLife:0.45, size:2+Math.random()*3, color:`hsla(${12+Math.random()*18},98%, 58%, 0.95)`});
      playTone(90,0.35,0,'sawtooth',0.24); playTone(180,0.28,0.08,'square',0.18);
      screenshake=Math.max(screenshake,7);
    }
    draw(c,cam){
      // Dibujo ORIGINAL adaptado: cada elem dibuja Cabeza/Aletas/Espina con scale s = (162+4*(1-i))/50
      for(let i=1;i<this.N;i++){
        const e=this.elems[i];
        const ep=this.elems[i-1];
        const sx = (ep.x + e.x)/2 - cam.x + W/2 + Math.sin(this.hover + i*0.4)*0.9;
        const sy = (ep.y + e.y)/2 - cam.y + H/2 + Math.cos(this.hover*0.7 + i*0.3)*0.9;
        const a = Math.atan2(e.y-ep.y, e.x-ep.x);
        const s = (162 + 4*(1-i))/50; // ORIGINAL exacta
        const isHead = i===1;
        const isWing = (i===8 || i===14);
        c.save();
        c.translate(sx,sy);
        c.rotate(a);
        c.scale(s,s);
        if(isHead){
          // Cabeza ORIGINAL: path fill #FFFFFF y #000000 con ojo
          c.fillStyle = this.hitFlash>0 ? '#fff' : '#0a0a0a';
          c.strokeStyle = this.hitFlash>0 ? '#fff' : 'rgba(255,255,255,0.9)';
          c.lineWidth=0.6;
          // contorno cabeza simplificado (copia de <g id="Cabeza">)
          c.beginPath(); c.ellipse(0,0, 14, 9,0,0,Math.PI*2); c.fill(); c.stroke();
          // ojo
          c.fillStyle = this.hitFlash>0?'#fff':'#ff2a18'; c.shadowColor='#ff2a18'; c.shadowBlur=6;
          c.beginPath(); c.arc(-2,-4,2.2,0,Math.PI*2); c.fill();
          c.beginPath(); c.arc(-2,4,2.2,0,Math.PI*2); c.fill();
          c.shadowBlur=0;
          // hitbox cabeza visible si daño
          if(this.hitFlash>0){ c.strokeStyle='rgba(255,255,255,0.4)'; c.strokeRect(-14,-9,28,18); }
        } else if(isWing){
          // Aletas ORIGINAL: gradient grey → black, forma de ala
          c.fillStyle = 'rgba(40,40,45,0.92)';
          c.strokeStyle='rgba(255,120,60,0.85)'; c.lineWidth=0.7;
          c.beginPath();
          c.moveTo(-8,0); c.quadraticCurveTo(-12,-10, -18,-1); c.quadraticCurveTo(-12,6, -8,2); c.closePath();
          c.fill(); c.stroke();
        } else {
          // Espina ORIGINAL: linearGradient #CCCCCC→#333333, forma de vértebra
          const t=i/this.N;
          c.fillStyle = this.hitFlash>0 ? '#fff' : `hsl(${18+t*6}, 70%, 18%)`;
          c.strokeStyle = this.hitFlash>0?'#fff':'rgba(255,160,90,0.75)'; c.lineWidth=0.5;
          c.beginPath(); c.ellipse(0,0, 6, 4.5,0,0,Math.PI*2); c.fill(); c.stroke();
        }
        c.restore();
      }
      // hp + hitbox del dragon (MOD)
      const sx = this.x - cam.x + W/2, sy = this.y - cam.y + H/2;
      if(this.hitFlash>0){
        c.strokeStyle='rgba(255,120,60,0.35)'; c.lineWidth=1.2; c.beginPath(); c.arc(sx,sy,this.radius,0,Math.PI*2); c.stroke();
      }
      c.fillStyle='rgba(0,0,0,0.62)'; c.fillRect(sx-26, sy-34, 52,5);
      c.fillStyle='#ff5a2a'; c.fillRect(sx-26, sy-34, 52*(this.hp/this.maxHp),5);
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

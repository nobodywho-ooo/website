(function () {
  const canvas = document.getElementById('c');
  const mobile = matchMedia('(max-width: 960px)').matches;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: !mobile, alpha: true, premultipliedAlpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, mobile ? 2.5 : 2));
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.82;
  renderer.physicallyCorrectLights = true;

  const scene = new THREE.Scene();
  renderer.setClearColor(0x000000, 0);

  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);

  // --- Procedural environment: a warm studio with one broad soft light band -----
  function makeEnv() {
    const w = mobile ? 512 : 1024, h = mobile ? 256 : 512;
    const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
    const g = cv.getContext('2d');
    const sky = g.createLinearGradient(0, 0, 0, h);
    sky.addColorStop(0.00, '#22080a');
    sky.addColorStop(0.30, '#7a2412');
    sky.addColorStop(0.50, '#d98a2c');
    sky.addColorStop(0.62, '#8a2210');
    sky.addColorStop(1.00, '#140405');
    g.fillStyle = sky; g.fillRect(0, 0, w, h);
    // key softbox, upper right
    let sb = g.createRadialGradient(w * 0.68, h * 0.30, 10, w * 0.68, h * 0.30, 260);
    sb.addColorStop(0, 'rgba(255,232,180,1)');
    sb.addColorStop(0.35, 'rgba(255,196,110,0.9)');
    sb.addColorStop(1, 'rgba(240,140,60,0)');
    g.fillStyle = sb; g.fillRect(0, 0, w, h);
    // long thin strip light (gives the crisp edge highlight)
    g.fillStyle = 'rgba(255,224,160,0.95)';
    g.fillRect(w * 0.15, h * 0.18, w * 0.55, 14);
    // cool-ish fill on the far left, low
    sb = g.createRadialGradient(w * 0.12, h * 0.70, 10, w * 0.12, h * 0.70, 300);
    sb.addColorStop(0, 'rgba(200,50,40,0.7)');
    sb.addColorStop(1, 'rgba(200,50,40,0)');
    g.fillStyle = sb; g.fillRect(0, 0, w, h);
    const tex = new THREE.CanvasTexture(cv);
    tex.mapping = THREE.EquirectangularReflectionMapping;
    tex.encoding = THREE.sRGBEncoding;
    const pmrem = new THREE.PMREMGenerator(renderer);
    pmrem.compileEquirectangularShader();
    const env = pmrem.fromEquirectangular(tex).texture;
    tex.dispose(); pmrem.dispose();
    return env;
  }
  scene.environment = makeEnv();

  // --- Lights: soft overhead key, warm hemisphere, faint red rim -----------------
  const key = new THREE.DirectionalLight('#ffc774', 1.9);
  key.position.set(1.5, 8, 2.5);
  scene.add(key);
  const rim = new THREE.DirectionalLight('#d8402a', 1.0);
  rim.position.set(-6, 1, -4);
  scene.add(rim);
  scene.add(new THREE.HemisphereLight('#ffa848', '#2a0806', 0.75));
  scene.add(new THREE.AmbientLight('#6a1410', 0.5));

  // --- Matte burnt-orange material: colour comes from a vertical vertex gradient
  //     (bright amber on the top faces, orange at the top of the walls, fading to
  //     dark burnt umber at the foot), lit softly from above.
  const copper = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#ffffff'),
    vertexColors: true,
    metalness: 0.12,
    roughness: 0.78,
    envMapIntensity: 0.45,
  });
  const C_TOP   = new THREE.Color('#f2a02e');  // amber top edge
  const C_HIGH  = new THREE.Color('#e27426');  // upper wall
  const C_MID   = new THREE.Color('#b44618');  // mid wall
  const C_LOW   = new THREE.Color('#5a1a08');  // foot, burnt umber
  function paintGradient(geo, height) {
    const pos = geo.attributes.position, nrm = geo.attributes.normal;
    const col = new Float32Array(pos.count * 3);
    const c = new THREE.Color();
    for (let i = 0; i < pos.count; i++) {
      const y = pos.getY(i), ny = nrm.getY(i);
      const t = THREE.MathUtils.clamp((y + height / 2) / height, 0, 1); // 0 foot → 1 top
      if (ny > 0.85) c.copy(C_TOP);
      else if (t > 0.6) c.copy(C_MID).lerp(C_HIGH, (t - 0.6) / 0.4);
      else c.copy(C_LOW).lerp(C_MID, Math.pow(t / 0.6, 0.8));
      col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
    }
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  }

  // --- Ring segments: arc slabs with rectangular section, cut radially at the ends
  function arcSlab(rIn, rOut, spanDeg, height) {
    const span = THREE.MathUtils.degToRad(spanDeg);
    const a0 = -span / 2, a1 = span / 2;
    const shape = new THREE.Shape();
    shape.absarc(0, 0, rOut, a0, a1, false);
    shape.absarc(0, 0, rIn, a1, a0, true);
    shape.closePath();
    const geo = new THREE.ExtrudeGeometry(shape, {
      depth: height, bevelEnabled: true, bevelThickness: 0.012, bevelSize: 0.012, bevelSegments: mobile ? 1 : 2, curveSegments: mobile ? 48 : 96,
    });
    geo.rotateX(-Math.PI / 2);          // extrusion now runs along +Y
    geo.translate(0, -height / 2, 0);   // centred vertically
    geo.computeVertexNormals();
    paintGradient(geo, height);
    return geo;
  }

  const group = new THREE.Group();
  scene.add(group);

  // inner → outer: tighter arc, wider sweep as radius grows; staggered starting angles
  const specs = [
    { rIn: 1.55, rOut: 1.95, span: 84,  h: 1.55, start: 0.70 },
    { rIn: 2.45, rOut: 2.85, span: 104, h: 1.55, start: 0.42 },
    { rIn: 3.35, rOut: 3.75, span: 128, h: 1.55, start: 0.12 },
  ];
  const rings = specs.map(s => {
    const m = new THREE.Mesh(arcSlab(s.rIn, s.rOut, s.span, s.h), copper);
    m.rotation.y = s.start;
    group.add(m);
    return { mesh: m, base: s.start };
  });

  // --- Camera framing: low, close, looking across the arcs ---------------------
  group.position.set(-0.9, 0, 1.6);
  const camBase = new THREE.Vector3(0.9, 1.75, 4.3);
  const target = new THREE.Vector3(-0.6, 0.05, 0.9);

  function resize() {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (canvas.width !== Math.floor(w * renderer.getPixelRatio()) || canvas.height !== Math.floor(h * renderer.getPixelRatio())) {
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    }
  }

  const start = performance.now();
  const stage = document.getElementById('stage');
  let ready = false, lastFrame = 0, heroVisible = true;
  new IntersectionObserver(([entry]) => { heroVisible = entry.isIntersecting; }).observe(document.querySelector('.hero-space'));

  function frame(now) {
    requestAnimationFrame(frame);
    if (!heroVisible || document.hidden || !stage.getClientRects().length || (mobile && now - lastFrame < 1000 / 30)) return;
    lastFrame = now;
    resize();
    const t = (now - start) / 1000;

    // slow, continuous revolve — each arc at its own pace so the composition keeps changing
    rings[0].mesh.rotation.y = rings[0].base + t * 0.085;
    rings[1].mesh.rotation.y = rings[1].base + t * 0.060;
    rings[2].mesh.rotation.y = rings[2].base + t * 0.045;
    group.rotation.y = Math.sin(t * 0.09) * 0.10;
    group.rotation.z = Math.sin(t * 0.07 + 1.0) * 0.035;

    // gentle camera drift / breathing
    camera.position.set(
      camBase.x + Math.sin(t * 0.13) * 0.25,
      camBase.y + Math.sin(t * 0.11 + 0.7) * 0.12,
      camBase.z + Math.cos(t * 0.10) * 0.25
    );
    camera.lookAt(target);

    renderer.render(scene, camera);
    if (!ready) { stage.classList.add('is-rendering'); ready = true; }
  }
  requestAnimationFrame(frame);
  window.addEventListener('resize', resize);
})();

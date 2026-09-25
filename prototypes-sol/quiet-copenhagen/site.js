const menuButton = document.querySelector(".menu-button");
const navigation = document.querySelector(".nav");

menuButton?.addEventListener("click", () => {
  const isOpen = navigation.classList.toggle("is-open");
  menuButton.setAttribute("aria-expanded", String(isOpen));
  menuButton.textContent = isOpen ? "Close" : "Menu";
});

const copyText = async (text) => {
  if (navigator.clipboard && window.isSecureContext) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.append(textarea);
  textarea.select();
  document.execCommand("copy");
  textarea.remove();
};

document.querySelectorAll("[data-copy]").forEach((button) => {
  button.addEventListener("click", async () => {
    const label = button.textContent;
    await copyText(button.dataset.copy);
    button.textContent = "Copied";
    window.setTimeout(() => {
      button.textContent = label;
    }, 1200);
  });
});

const tabs = [...document.querySelectorAll('[role="tab"]')];

const selectTab = (selectedTab) => {
  tabs.forEach((tab) => {
    const isSelected = tab === selectedTab;
    tab.setAttribute("aria-selected", String(isSelected));
    tab.tabIndex = isSelected ? 0 : -1;
    const panel = document.getElementById(tab.getAttribute("aria-controls"));
    panel.hidden = !isSelected;
    panel.classList.toggle("is-entering", isSelected);
  });
};

tabs.forEach((tab, index) => {
  tab.addEventListener("click", () => selectTab(tab));
  tab.addEventListener("keydown", (event) => {
    if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.key)) return;
    event.preventDefault();
    const direction = ["ArrowRight", "ArrowDown"].includes(event.key) ? 1 : -1;
    const nextTab = tabs[(index + direction + tabs.length) % tabs.length];
    selectTab(nextTab);
    nextTab.focus();
  });
});

const routeDemo = document.querySelector(".route-demo");
const routeToggle = document.querySelector(".route-toggle");
const routeStatus = document.querySelector(".route-status");

routeToggle?.addEventListener("click", () => {
  const isOffline = routeDemo.classList.toggle("is-offline");
  routeToggle.setAttribute("aria-pressed", String(isOffline));
  routeToggle.textContent = isOffline ? "Restore network" : "Disconnect network";
  routeStatus.textContent = isOffline
    ? "Network unavailable. Local inference keeps running."
    : "Both routes are available. NobodyWho stays on the device.";
});

const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const revealItems = document.querySelectorAll(".reveal");

if (reducedMotion || !("IntersectionObserver" in window)) {
  revealItems.forEach((item) => item.classList.add("is-visible"));
} else {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.14 }
  );
  revealItems.forEach((item) => observer.observe(item));
}

const heroSection = document.querySelector(".hero");
const titleCanvas = document.querySelector(".hero-title-canvas");

if (heroSection) {
  if (titleCanvas && !reducedMotion) {
    runTitleParticles(titleCanvas, heroSection);
  } else {
    heroSection.classList.add("is-resolved", "is-flowing");
  }
}

function runTitleParticles(canvas, hero) {
  const heading = canvas.parentElement;
  const context = canvas.getContext("2d");
  let frame = 0;
  let stopped = false;

  const resolve = () => hero.classList.add("is-resolved", "is-flowing");
  const failsafe = window.setTimeout(resolve, 8000);
  const stop = () => {
    stopped = true;
    window.clearTimeout(failsafe);
    cancelAnimationFrame(frame);
    canvas.remove();
  };

  const easeInOutCubic = (value) =>
    value < 0.5 ? 4 * value * value * value : 1 - Math.pow(-2 * value + 2, 3) / 2;

  const parseColor = (value, backstop) => {
    if (typeof value === "string") {
      const trimmed = value.trim();
      const hex = trimmed.match(/^#([0-9a-f]{6})$/i);
      if (hex) {
        return [
          parseInt(hex[1].slice(0, 2), 16),
          parseInt(hex[1].slice(2, 4), 16),
          parseInt(hex[1].slice(4, 6), 16),
        ];
      }
      const rgb = trimmed.match(/rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)/);
      if (rgb) return [Math.round(+rgb[1]), Math.round(+rgb[2]), Math.round(+rgb[3])];
    }
    return backstop;
  };

  const start = async () => {
    await Promise.race([
      document.fonts.load("500 32px Satoshi"),
      new Promise((done) => window.setTimeout(done, 1600)),
    ]);
    if (stopped || !heading.isConnected) return;

    const headingStyle = getComputedStyle(heading);
    const fontSize = parseFloat(headingStyle.fontSize);
    const headingRect = heading.getBoundingClientRect();
    const canvasRect = canvas.getBoundingClientRect();
    const originX = headingRect.left - canvasRect.left;
    const originY = headingRect.top - canvasRect.top;
    const canvasWidth = canvasRect.width;
    const canvasHeight = canvasRect.height;
    const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(canvasWidth * pixelRatio);
    canvas.height = Math.round(canvasHeight * pixelRatio);
    context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

    const lines = [...heading.querySelectorAll(".line")];
    const lineCenters = lines.map((line) => line.offsetTop + originY + fontSize * 0.49);
    const textLeft = lines[0].offsetLeft + originX;

    const ink = parseColor(headingStyle.color, [17, 21, 22]);
    const accent = parseColor(
      getComputedStyle(document.documentElement).getPropertyValue("--accent").trim() || "#416c7e",
      [65, 108, 126]
    );

    const sampleShape = (draw, gap) => {
      const sampler = document.createElement("canvas");
      sampler.width = Math.ceil(canvasWidth);
      sampler.height = Math.ceil(canvasHeight);
      const sctx = sampler.getContext("2d");
      sctx.fillStyle = "#fff";
      sctx.strokeStyle = "#fff";
      draw(sctx);
      const pixels = sctx.getImageData(0, 0, sampler.width, sampler.height).data;
      const points = [];
      for (let y = 0; y < sampler.height; y += gap) {
        for (let x = 0; x < sampler.width; x += gap) {
          if (pixels[(y * sampler.width + x) * 4 + 3] > 140) points.push({ x, y });
        }
      }
      return points;
    };

    const sampleText = (text, centerY) =>
      sampleShape((sctx) => {
        sctx.font = `500 ${fontSize}px Satoshi, sans-serif`;
        try { sctx.letterSpacing = headingStyle.letterSpacing; } catch {}
        sctx.textAlign = "left";
        sctx.textBaseline = "middle";
        sctx.fillText(text, textLeft, centerY);
      }, 4);

    const wordPoints1 = sampleText("Less cloud.", lineCenters[0]);
    const wordPoints2 = sampleText("More control.", lineCenters[1]);

    const eyeCenter = { x: canvasWidth / 2, y: canvasHeight * 0.46 };
    const eyeWidth = Math.min(canvasWidth * 0.68, 330);
    const eyeHeight = eyeWidth * 0.52;
    const eyeIris = eyeHeight * 0.45;
    const eyePupil = eyeIris * 0.58;
    const eyePoints = [];
    for (let px = -eyeWidth / 2; px <= eyeWidth / 2; px += 4) {
      const curve = (eyeHeight / 2) * Math.cos((px / (eyeWidth / 2)) * (Math.PI / 2));
      eyePoints.push({ kind: "lid", ox: px, oy: -curve });
      eyePoints.push({ kind: "lid", ox: px, oy: curve });
    }
    for (const radius of [eyeIris, eyeIris * 0.8]) {
      const steps = Math.max(12, Math.round((Math.PI * radius) / 2));
      for (let i = 0; i < steps; i += 1) {
        const angle = (i / steps) * Math.PI * 2;
        eyePoints.push({ kind: "iris", ox: Math.cos(angle) * radius, oy: Math.sin(angle) * radius });
      }
    }
    for (let py = -eyePupil; py <= eyePupil; py += 4) {
      for (let px = -eyePupil; px <= eyePupil; px += 4) {
        if (px * px + py * py <= eyePupil * eyePupil) {
          eyePoints.push({ kind: "pupil", ox: px, oy: py });
        }
      }
    }

    if (!wordPoints1.length || !wordPoints2.length || !eyePoints.length) {
      resolve();
      stop();
      return;
    }

    const total = Math.min(
      Math.max(
        wordPoints1.length,
        wordPoints2.length,
        Math.round((canvasWidth * canvasHeight) / 90),
        700
      ),
      1700
    );
    const particles = [];
    for (let index = 0; index < total; index += 1) {
      particles.push({
        x: Math.random() * canvasWidth,
        y: Math.random() * canvasHeight,
        eye: eyePoints[index % eyePoints.length],
        word1: wordPoints1[index % wordPoints1.length],
        word2: wordPoints2[index % wordPoints2.length],
        size: 1.3 + Math.random() * 1.1,
        twinkle: Math.random() * Math.PI * 2,
        tau: 0.13 + Math.random() * 0.15,
        swayAmp: 1.2 + Math.random() * 2.2,
        swayFreq: 0.0014 + Math.random() * 0.0018,
        swayPhase: Math.random() * Math.PI * 2,
      });
    }

    const LOOK_LEFT = 1100;
    const LOOK_RIGHT = 1450;
    const LOCK = 1800;
    const FLINCH_START = 2350;
    const FLINCH_END = 2600;
    const WORD1_END = 3700;
    const FLOWING_AT = 3300;
    const WORD2_SETTLE = 4600;
    const RESOLVE_AT = 5800;
    const END_AT = 6350;

    const gazeAt = (time) => {
      if (time < LOOK_LEFT) return { x: 0, y: 0 };
      if (time < LOOK_RIGHT) return { x: -eyeIris * 0.4, y: eyeIris * 0.08 };
      if (time < LOCK) return { x: eyeIris * 0.4, y: eyeIris * 0.08 };
      return { x: 0, y: 0 };
    };

    let resolved = false;
    let flowing = false;
    let startTime = 0;
    let lastTime = 0;

    const tick = (now) => {
      if (stopped) return;
      const time = now - startTime;
      const step = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;

      const dilate = time < LOCK ? 0 : Math.min((time - LOCK) / 300, 1);
      const flinch =
        time < FLINCH_START ? 0 : Math.min((time - FLINCH_START) / (FLINCH_END - FLINCH_START), 1);
      const eyeScale = 1 + 0.07 * dilate * (1 - flinch);
      const pupilScale = (1 + 0.25 * dilate) * (1 - 0.8 * flinch);
      const lidFactor = 1 - 0.35 * flinch;
      const colorMix =
        time < WORD1_END ? 0 : easeInOutCubic(Math.min((time - WORD1_END) / 900, 1));
      const appear = Math.min(time / 300, 1);
      const fade = time > RESOLVE_AT ? Math.max(0, 1 - (time - RESOLVE_AT) / 450) : 1;
      const gaze = gazeAt(time);

      let swayScale = 0.45;
      if (time < 300) swayScale = 1;
      else if (time < FLINCH_START) swayScale = dilate > 0 ? 0.15 : 0.45;
      else if (time < 3300) swayScale = 0;
      else if (time < WORD1_END) swayScale = 0.3;
      else swayScale = 0.22;

      context.clearRect(0, 0, canvasWidth, canvasHeight);

      for (const particle of particles) {
        let targetX;
        let targetY;

        if (time < FLINCH_END) {
          const isPupil = particle.eye.kind === "pupil";
          const scale = isPupil ? pupilScale : eyeScale;
          const gazeX = particle.eye.kind === "lid" ? 0 : gaze.x;
          const gazeY = particle.eye.kind === "lid" ? 0 : gaze.y;
          targetX = eyeCenter.x + gazeX + particle.eye.ox * eyeScale;
          targetY = eyeCenter.y + gazeY + particle.eye.oy * scale * lidFactor;
        } else if (time < WORD1_END) {
          targetX = particle.word1.x;
          targetY = particle.word1.y;
        } else {
          targetX = particle.word2.x;
          targetY = particle.word2.y;
        }

        const sway = particle.swayAmp * swayScale;
        targetX += Math.sin(time * particle.swayFreq + particle.swayPhase) * sway;
        targetY += Math.cos(time * particle.swayFreq * 0.8 + particle.twinkle) * sway;

        const pull = 1 - Math.exp(-step / particle.tau);
        particle.x += (targetX - particle.x) * pull;
        particle.y += (targetY - particle.y) * pull;

        const shimmer = 0.82 + 0.18 * Math.sin(time * 0.004 + particle.twinkle);
        const red = Math.round(ink[0] + (accent[0] - ink[0]) * colorMix);
        const green = Math.round(ink[1] + (accent[1] - ink[1]) * colorMix);
        const blue = Math.round(ink[2] + (accent[2] - ink[2]) * colorMix);

        context.globalAlpha = 0.9 * shimmer * appear * fade;
        context.fillStyle = `rgb(${red}, ${green}, ${blue})`;
        context.beginPath();
        context.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        context.fill();
      }

      context.globalAlpha = 1;

      if (time > FLOWING_AT && !flowing) {
        flowing = true;
        hero.classList.add("is-flowing");
      }
      if (time > RESOLVE_AT && !resolved) {
        resolved = true;
        hero.classList.add("is-resolved");
      }

      if (time < END_AT) {
        frame = requestAnimationFrame(tick);
      } else {
        stop();
      }
    };

    startTime = performance.now();
    lastTime = startTime;
    frame = requestAnimationFrame(tick);
  };

  const initialWidth = window.innerWidth;
  window.addEventListener("resize", () => {
    if (stopped || Math.abs(window.innerWidth - initialWidth) < 60) return;
    resolve();
    stop();
  });

  start().catch(() => {
    resolve();
    stop();
  });
}

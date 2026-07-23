(function () {
  const lerp = (a, b, n) => (1 - n) * a + n * b;

  const getRandomString = (length) => {
    let result = '';
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  let mousepos = { x: 0, y: 0 };
  window.addEventListener('mousemove', (ev) => {
    mousepos = { x: ev.clientX, y: ev.clientY };
  });

  class BentoHoverItem {
    constructor(el) {
      this.el = el;
      this.deco = el.querySelector('.bento-hover-deco');
      this.renderedStyles = {
        x: { previous: 0, current: 0, amt: 0.1 },
        y: { previous: 0, current: 0, amt: 0.1 },
      };
      this.randomString = getRandomString(2000);
      this.requestId = undefined;
      this.calculateSizePosition();
      this.initEvents();
    }

    calculateSizePosition() {
      this.scrollVal = { x: window.scrollX, y: window.scrollY };
      this.rect = this.el.getBoundingClientRect();
    }

    initEvents() {
      window.addEventListener('resize', () => this.calculateSizePosition());

      this.el.addEventListener('mousemove', () => {
        this.randomString = getRandomString(2000);
      });

      this.el.addEventListener('mouseenter', () => {
        this.calculateSizePosition();
        gsap.to(this.deco, { duration: 0.5, ease: 'power3', opacity: 1 });
        this.loopRender(true);
      });

      this.el.addEventListener('mouseleave', () => {
        this.stopRendering();
        gsap.to(this.deco, { duration: 0.5, ease: 'power3', opacity: 0 });
      });
    }

    loopRender(isFirstTick = false) {
      if (!this.requestId) {
        this.requestId = requestAnimationFrame(() => this.render(isFirstTick));
      }
    }

    stopRendering() {
      if (this.requestId) {
        cancelAnimationFrame(this.requestId);
        this.requestId = undefined;
      }
    }

    render(isFirstTick) {
      this.requestId = undefined;

      const scrollDiff = {
        x: this.scrollVal.x - window.scrollX,
        y: this.scrollVal.y - window.scrollY,
      };

      this.renderedStyles.x.current = mousepos.x - (scrollDiff.x + this.rect.left);
      this.renderedStyles.y.current = mousepos.y - (scrollDiff.y + this.rect.top);

      if (isFirstTick) {
        this.renderedStyles.x.previous = this.renderedStyles.x.current;
        this.renderedStyles.y.previous = this.renderedStyles.y.current;
      }

      for (const key in this.renderedStyles) {
        this.renderedStyles[key].previous = lerp(
          this.renderedStyles[key].previous,
          this.renderedStyles[key].current,
          this.renderedStyles[key].amt
        );
      }

      gsap.set(this.el, {
        '--x': this.renderedStyles.x.previous + 'px',
        '--y': this.renderedStyles.y.previous + 'px',
      });

      this.deco.innerHTML = this.randomString;
      this.loopRender();
    }
  }

  document.querySelectorAll('.bento-hover').forEach((el) => new BentoHoverItem(el));
})();

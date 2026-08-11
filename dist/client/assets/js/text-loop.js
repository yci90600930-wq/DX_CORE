/*
 * Vanilla SVG adaptation of React Bits TextLoop (JS-CSS).
 * Source: https://reactbits.dev/text-animations/text-loop
 * License: MIT + Commons Clause, Copyright (c) David Haz.
 */
(function initializeBrandTextLoop() {
  const root = document.querySelector("#brand-text-loop");
  if (!root) return;

  const options = {
    text: "DX ✦ CORE",
    shape: "wave",
    speed: 90,
    direction: "forward",
    separator: "✦",
    curviness: 90,
    fontSize: 46,
    fontWeight: 800,
    letterSpacing: 2,
    uppercase: true,
    color: "#ffffff",
    ribbon: true,
    ribbonColor: "#5227FF",
    ribbonWidth: 86,
    pauseOnHover: true,
  };

  const svgNamespace = "http://www.w3.org/2000/svg";
  const viewWidth = 360;
  const viewHeight = 160;
  const centerX = viewWidth / 2;
  const centerY = viewHeight / 2;
  const edgePadding = 6;
  const pathId = "brand-text-loop-path";

  function buildPath(shape, curviness, ribbonWidth) {
    const curve = Math.max(0, curviness);
    const room = Math.max(20, centerY - Math.max(0, ribbonWidth) / 2 - edgePadding);

    switch (shape) {
      case "circle": {
        const radius = Math.min(90 + curve * 0.95, room);
        return `M ${centerX - radius} ${centerY} A ${radius} ${radius} 0 1 1 ${centerX + radius} ${centerY} A ${radius} ${radius} 0 1 1 ${centerX - radius} ${centerY} Z`;
      }
      case "infinity": {
        const radius = 150 + curve * 1.4;
        const height = Math.min(60 + curve * 0.95, room);
        return [
          `M ${centerX} ${centerY}`,
          `C ${centerX + radius * 0.55} ${centerY - height} ${centerX + radius} ${centerY - height} ${centerX + radius} ${centerY}`,
          `C ${centerX + radius} ${centerY + height} ${centerX + radius * 0.55} ${centerY + height} ${centerX} ${centerY}`,
          `C ${centerX - radius * 0.55} ${centerY - height} ${centerX - radius} ${centerY - height} ${centerX - radius} ${centerY}`,
          `C ${centerX - radius} ${centerY + height} ${centerX - radius * 0.55} ${centerY + height} ${centerX} ${centerY}`,
          "Z",
        ].join(" ");
      }
      case "arch": {
        const rise = Math.min(120 + curve * 1.1, room * 2);
        return `M ${viewWidth * 0.1} ${centerY + rise / 2} Q ${centerX} ${centerY - rise * 1.5} ${viewWidth * 0.9} ${centerY + rise / 2}`;
      }
      case "line":
        return `M ${-viewWidth * 0.267} ${centerY} L ${viewWidth * 1.267} ${centerY}`;
      case "wave":
      default: {
        const amplitude = Math.min(curve * 2.2, room * 2);
        const step = viewWidth * 0.267;
        return `M ${-step} ${centerY} Q ${-step / 2} ${centerY - amplitude} 0 ${centerY} T ${step} ${centerY} T ${step * 2} ${centerY} T ${step * 3} ${centerY} T ${step * 4} ${centerY} T ${viewWidth + step} ${centerY}`;
      }
    }
  }

  function createSvgElement(name, attributes = {}) {
    const element = document.createElementNS(svgNamespace, name);
    Object.entries(attributes).forEach(([key, value]) => element.setAttribute(key, String(value)));
    return element;
  }

  const accessibleTitle = document.createElement("span");
  accessibleTitle.className = "sr-only";
  accessibleTitle.textContent = "DX CORE";

  const svg = createSvgElement("svg", {
    class: "text-loop-svg",
    viewBox: `0 0 ${viewWidth} ${viewHeight}`,
    preserveAspectRatio: "xMidYMid meet",
    "aria-hidden": "true",
    focusable: "false",
  });

  const path = createSvgElement("path", {
    id: pathId,
    d: buildPath(options.shape, options.curviness, options.ribbonWidth),
    fill: "none",
    stroke: options.ribbon ? options.ribbonColor : "none",
    "stroke-width": options.ribbon ? options.ribbonWidth : 0,
    "stroke-linecap": "round",
    "stroke-linejoin": "round",
  });

  const unitText = `${options.uppercase ? options.text.toUpperCase() : options.text}\u00A0${options.separator}\u00A0`;
  const textAttributes = {
    "font-size": options.fontSize,
    "font-weight": options.fontWeight,
    "letter-spacing": options.letterSpacing,
  };

  const measureText = createSvgElement("text", {
    class: "text-loop-measure",
    ...textAttributes,
  });
  measureText.textContent = unitText;

  function createLoopText() {
    const text = createSvgElement("text", {
      class: "text-loop-text",
      fill: options.color,
      "dominant-baseline": "central",
      ...textAttributes,
    });
    const textPath = createSvgElement("textPath", {
      href: `#${pathId}`,
      startOffset: 0,
      lengthAdjust: "spacing",
    });
    text.append(textPath);
    return { text, textPath };
  }

  const head = createLoopText();
  const tail = createLoopText();
  svg.append(path, measureText, head.text, tail.text);
  root.replaceChildren(accessibleTitle, svg);

  let pathLength = 0;
  let offset = 0;
  let frameId = null;
  let previousTime = null;
  let hoverPaused = false;
  let isVisible = true;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function applyOffset(value) {
    const partner = value >= 0 ? value - pathLength : value + pathLength;
    head.textPath.setAttribute("startOffset", String(value));
    tail.textPath.setAttribute("startOffset", String(partner));
  }

  function measure() {
    try {
      pathLength = path.getTotalLength();
      const unitWidth = measureText.getComputedTextLength();
      if (!pathLength) return;
      const repetitions = unitWidth > 0 ? Math.max(1, Math.round(pathLength / unitWidth)) : 1;
      const repeatedText = unitText.repeat(repetitions);
      [head.textPath, tail.textPath].forEach((textPath) => {
        textPath.textContent = repeatedText;
        textPath.setAttribute("textLength", String(pathLength));
      });
      applyOffset(offset);
    } catch (error) {
      console.warn("TextLoop measurement error:", error);
    }
  }

  function shouldAnimate() {
    return !reduceMotion && options.speed > 0 && !hoverPaused && isVisible && !document.hidden;
  }

  function animate(time) {
    if (!shouldAnimate()) {
      frameId = null;
      previousTime = null;
      return;
    }

    if (previousTime !== null && pathLength) {
      const distance = ((time - previousTime) / 1000) * options.speed;
      const direction = options.direction === "reverse" ? -1 : 1;
      offset = (offset + distance * direction) % pathLength;
      applyOffset(offset);
    }
    previousTime = time;
    frameId = window.requestAnimationFrame(animate);
  }

  function start() {
    if (frameId === null && shouldAnimate()) frameId = window.requestAnimationFrame(animate);
  }

  function pauseForHover() {
    hoverPaused = true;
  }

  function resumeFromHover() {
    hoverPaused = false;
    start();
  }

  if (options.pauseOnHover) {
    root.addEventListener("pointerenter", pauseForHover);
    root.addEventListener("pointerleave", resumeFromHover);
  }

  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(
      ([entry]) => {
        isVisible = entry.isIntersecting;
        if (isVisible) start();
      },
      { threshold: 0.1 },
    );
    observer.observe(root);
  }

  document.addEventListener("visibilitychange", start);
  measure();
  if (document.fonts?.ready) document.fonts.ready.then(measure).catch(() => {});
  start();
})();

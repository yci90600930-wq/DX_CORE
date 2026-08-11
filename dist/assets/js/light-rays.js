/*
 * Vanilla WebGL adaptation of React Bits LightRays (JS-CSS).
 * Source: https://reactbits.dev/backgrounds/light-rays
 * License: MIT + Commons Clause, Copyright (c) David Haz.
 */
(function initializeHeroLightRays() {
  const container = document.querySelector("#hero-light-rays");
  if (!container) return;

  const options = {
    raysOrigin: "top-center",
    raysColor: "#00ffff",
    raysSpeed: 1.5,
    lightSpread: 0.8,
    rayLength: 1.2,
    pulsating: false,
    fadeDistance: 1,
    saturation: 1,
    followMouse: true,
    mouseInfluence: 0.1,
    noiseAmount: 0.1,
    distortion: 0.05,
  };

  const canvas = document.createElement("canvas");
  canvas.setAttribute("aria-hidden", "true");
  container.append(canvas);

  const gl = canvas.getContext("webgl", {
    alpha: true,
    antialias: false,
    depth: false,
    premultipliedAlpha: true,
  });

  if (!gl) {
    container.classList.add("light-rays-unavailable");
    return;
  }

  const vertexShaderSource = `
    attribute vec2 position;
    varying vec2 vUv;

    void main() {
      vUv = position * 0.5 + 0.5;
      gl_Position = vec4(position, 0.0, 1.0);
    }
  `;

  const fragmentShaderSource = `
    precision highp float;

    uniform float iTime;
    uniform vec2 iResolution;
    uniform vec2 rayPos;
    uniform vec2 rayDir;
    uniform vec3 raysColor;
    uniform float raysSpeed;
    uniform float lightSpread;
    uniform float rayLength;
    uniform float pulsating;
    uniform float fadeDistance;
    uniform float saturation;
    uniform vec2 mousePos;
    uniform float mouseInfluence;
    uniform float noiseAmount;
    uniform float distortion;

    varying vec2 vUv;

    float noise(vec2 st) {
      return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
    }

    float rayStrength(
      vec2 raySource,
      vec2 rayRefDirection,
      vec2 coord,
      float seedA,
      float seedB,
      float speed
    ) {
      vec2 sourceToCoord = coord - raySource;
      vec2 dirNorm = normalize(sourceToCoord);
      float cosAngle = dot(dirNorm, rayRefDirection);
      float distortedAngle = cosAngle + distortion * sin(iTime * 2.0 + length(sourceToCoord) * 0.01) * 0.2;
      float spreadFactor = pow(max(distortedAngle, 0.0), 1.0 / max(lightSpread, 0.001));
      float distance = length(sourceToCoord);
      float maxDistance = iResolution.x * rayLength;
      float lengthFalloff = clamp((maxDistance - distance) / maxDistance, 0.0, 1.0);
      float fadeFalloff = clamp(
        (iResolution.x * fadeDistance - distance) / (iResolution.x * fadeDistance),
        0.5,
        1.0
      );
      float pulse = pulsating > 0.5 ? (0.8 + 0.2 * sin(iTime * speed * 3.0)) : 1.0;
      float baseStrength = clamp(
        (0.45 + 0.15 * sin(distortedAngle * seedA + iTime * speed)) +
        (0.3 + 0.2 * cos(-distortedAngle * seedB + iTime * speed)),
        0.0,
        1.0
      );

      return baseStrength * lengthFalloff * fadeFalloff * spreadFactor * pulse;
    }

    void mainImage(out vec4 fragColor, in vec2 fragCoord) {
      vec2 coord = vec2(fragCoord.x, iResolution.y - fragCoord.y);
      vec2 finalRayDir = rayDir;

      if (mouseInfluence > 0.0) {
        vec2 mouseScreenPos = mousePos * iResolution.xy;
        vec2 mouseDirection = normalize(mouseScreenPos - rayPos);
        finalRayDir = normalize(mix(rayDir, mouseDirection, mouseInfluence));
      }

      vec4 rays1 = vec4(1.0) * rayStrength(
        rayPos,
        finalRayDir,
        coord,
        36.2214,
        21.11349,
        1.5 * raysSpeed
      );
      vec4 rays2 = vec4(1.0) * rayStrength(
        rayPos,
        finalRayDir,
        coord,
        22.3991,
        18.0234,
        1.1 * raysSpeed
      );

      fragColor = rays1 * 0.5 + rays2 * 0.4;

      if (noiseAmount > 0.0) {
        float n = noise(coord * 0.01 + iTime * 0.1);
        fragColor.rgb *= (1.0 - noiseAmount + noiseAmount * n);
      }

      float brightness = 1.0 - (coord.y / iResolution.y);
      fragColor.x *= 0.1 + brightness * 0.8;
      fragColor.y *= 0.3 + brightness * 0.6;
      fragColor.z *= 0.5 + brightness * 0.5;

      if (saturation != 1.0) {
        float gray = dot(fragColor.rgb, vec3(0.299, 0.587, 0.114));
        fragColor.rgb = mix(vec3(gray), fragColor.rgb, saturation);
      }

      fragColor.rgb *= raysColor;
    }

    void main() {
      vec4 color;
      mainImage(color, gl_FragCoord.xy);
      gl_FragColor = color;
    }
  `;

  function compileShader(type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      const message = gl.getShaderInfoLog(shader);
      gl.deleteShader(shader);
      throw new Error(`LightRays shader error: ${message}`);
    }
    return shader;
  }

  let program;
  try {
    const vertexShader = compileShader(gl.VERTEX_SHADER, vertexShaderSource);
    const fragmentShader = compileShader(gl.FRAGMENT_SHADER, fragmentShaderSource);
    program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    gl.deleteShader(vertexShader);
    gl.deleteShader(fragmentShader);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      throw new Error(`LightRays program error: ${gl.getProgramInfoLog(program)}`);
    }
  } catch (error) {
    console.warn(error);
    container.classList.add("light-rays-unavailable");
    canvas.remove();
    return;
  }

  const triangle = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, triangle);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);

  gl.useProgram(program);
  const positionLocation = gl.getAttribLocation(program, "position");
  gl.enableVertexAttribArray(positionLocation);
  gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

  const uniforms = {};
  [
    "iTime",
    "iResolution",
    "rayPos",
    "rayDir",
    "raysColor",
    "raysSpeed",
    "lightSpread",
    "rayLength",
    "pulsating",
    "fadeDistance",
    "saturation",
    "mousePos",
    "mouseInfluence",
    "noiseAmount",
    "distortion",
  ].forEach((name) => {
    uniforms[name] = gl.getUniformLocation(program, name);
  });

  function hexToRgb(hex) {
    const match = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return match
      ? [parseInt(match[1], 16) / 255, parseInt(match[2], 16) / 255, parseInt(match[3], 16) / 255]
      : [1, 1, 1];
  }

  function getAnchorAndDirection(origin, width, height) {
    const outside = 0.2;
    const placements = {
      "top-left": { anchor: [0, -outside * height], direction: [0, 1] },
      "top-right": { anchor: [width, -outside * height], direction: [0, 1] },
      left: { anchor: [-outside * width, 0.5 * height], direction: [1, 0] },
      right: { anchor: [(1 + outside) * width, 0.5 * height], direction: [-1, 0] },
      "bottom-left": { anchor: [0, (1 + outside) * height], direction: [0, -1] },
      "bottom-center": { anchor: [0.5 * width, (1 + outside) * height], direction: [0, -1] },
      "bottom-right": { anchor: [width, (1 + outside) * height], direction: [0, -1] },
      "top-center": { anchor: [0.5 * width, -outside * height], direction: [0, 1] },
    };
    return placements[origin] || placements["top-center"];
  }

  let width = 1;
  let height = 1;
  let isVisible = true;
  let frameId = null;
  let mouse = { x: 0.5, y: 0.5 };
  const smoothMouse = { x: 0.5, y: 0.5 };
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function resize() {
    const rect = container.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = Math.max(1, Math.round(rect.width * dpr));
    height = Math.max(1, Math.round(rect.height * dpr));
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
      gl.viewport(0, 0, width, height);
    }
  }

  function draw(time) {
    resize();
    const placement = getAnchorAndDirection(options.raysOrigin, width, height);
    smoothMouse.x = smoothMouse.x * 0.92 + mouse.x * 0.08;
    smoothMouse.y = smoothMouse.y * 0.92 + mouse.y * 0.08;

    gl.useProgram(program);
    gl.uniform1f(uniforms.iTime, reduceMotion ? 0 : time * 0.001);
    gl.uniform2f(uniforms.iResolution, width, height);
    gl.uniform2fv(uniforms.rayPos, placement.anchor);
    gl.uniform2fv(uniforms.rayDir, placement.direction);
    gl.uniform3fv(uniforms.raysColor, hexToRgb(options.raysColor));
    gl.uniform1f(uniforms.raysSpeed, options.raysSpeed);
    gl.uniform1f(uniforms.lightSpread, options.lightSpread);
    gl.uniform1f(uniforms.rayLength, options.rayLength);
    gl.uniform1f(uniforms.pulsating, options.pulsating ? 1 : 0);
    gl.uniform1f(uniforms.fadeDistance, options.fadeDistance);
    gl.uniform1f(uniforms.saturation, options.saturation);
    gl.uniform2f(uniforms.mousePos, smoothMouse.x, smoothMouse.y);
    gl.uniform1f(uniforms.mouseInfluence, options.mouseInfluence);
    gl.uniform1f(uniforms.noiseAmount, options.noiseAmount);
    gl.uniform1f(uniforms.distortion, options.distortion);
    gl.drawArrays(gl.TRIANGLES, 0, 3);

    if (!reduceMotion && isVisible && !document.hidden) {
      frameId = window.requestAnimationFrame(draw);
    } else {
      frameId = null;
    }
  }

  function start() {
    if (frameId === null) frameId = window.requestAnimationFrame(draw);
  }

  function handleMouseMove(event) {
    if (!options.followMouse || reduceMotion) return;
    const rect = container.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    mouse = {
      x: (event.clientX - rect.left) / rect.width,
      y: (event.clientY - rect.top) / rect.height,
    };
  }

  if (options.followMouse) window.addEventListener("mousemove", handleMouseMove, { passive: true });

  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(
      ([entry]) => {
        isVisible = entry.isIntersecting;
        if (isVisible) start();
      },
      { threshold: 0.1 },
    );
    observer.observe(container);
  }

  document.addEventListener("visibilitychange", () => {
    if (!document.hidden && isVisible) start();
  });

  if ("ResizeObserver" in window) {
    const resizeObserver = new ResizeObserver(() => start());
    resizeObserver.observe(container);
  } else {
    window.addEventListener("resize", start, { passive: true });
  }

  start();
})();

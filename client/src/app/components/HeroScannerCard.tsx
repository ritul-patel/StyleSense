"use client";

import { useEffect, useRef, useState, useCallback } from "react";

type AvatarData = {
  src: string;
  season: string;
  undertone: string;
  confidence: number;
  matches: { color: string; name: string }[];
  avoids: { color: string; name: string }[];
};

const AVATARS: AvatarData[] = [
  {
    src: "/home/Light Spring (female).jpg",
    season: "Light Spring",
    undertone: "Warm & Clear",
    confidence: 94,
    matches: [
      { color: "#f7d08a", name: "Peach" },
      { color: "#a5d8d3", name: "Aqua" },
      { color: "#e8a598", name: "Coral" },
      { color: "#d8e2dc", name: "Warm White" },
      { color: "#ffb5a7", name: "Melon" },
    ],
    avoids: [
      { color: "#000000", name: "Stark Black" },
      { color: "#4a0e4e", name: "Deep Plum" },
      { color: "#780000", name: "Burgundy" },
      { color: "#03045e", name: "Navy" },
    ],
  },
  {
    src: "/home/Cool Summer (male).jpg",
    season: "Cool Summer",
    undertone: "Cool & Muted",
    confidence: 91,
    matches: [
      { color: "#7b9acc", name: "Slate Blue" },
      { color: "#b5c6e0", name: "Powder Blue" },
      { color: "#c8b6ff", name: "Lavender" },
      { color: "#a3b18a", name: "Muted Mint" },
      { color: "#6c757d", name: "Medium Grey" },
    ],
    avoids: [
      { color: "#fca311", name: "Orange" },
      { color: "#e63946", name: "Warm Red" },
      { color: "#582f0e", name: "Brown" },
      { color: "#ffb703", name: "Gold" },
    ],
  },
  {
    src: "/home/Deep Autumn (female).jpg",
    season: "Deep Autumn",
    undertone: "Warm & Rich",
    confidence: 97,
    matches: [
      { color: "#b85d19", name: "Burnt Sienna" },
      { color: "#4a5d23", name: "Forest Olive" },
      { color: "#c5a059", name: "Mustard Gold" },
      { color: "#1d2b53", name: "Midnight Navy" },
      { color: "#3e2723", name: "Deep Cocoa" },
    ],
    avoids: [
      { color: "#e0f2f1", name: "Icy Blue" },
      { color: "#9e9e9e", name: "Cool Grey" },
      { color: "#ff4081", name: "Hot Pink" },
      { color: "#d500f9", name: "Magenta" },
    ],
  },
  {
    src: "/home/Warm Autumn (male).jpg",
    season: "Warm Autumn",
    undertone: "Warm & Muted",
    confidence: 93,
    matches: [
      { color: "#a67c00", name: "Bronze" },
      { color: "#bf4342", name: "Rust" },
      { color: "#5c6b73", name: "Teal Blue" },
      { color: "#253237", name: "Dark Moss" },
      { color: "#8c7851", name: "Khaki" },
    ],
    avoids: [
      { color: "#ff99c8", name: "Pastel Pink" },
      { color: "#a9def9", name: "Baby Blue" },
      { color: "#e4c1f9", name: "Lilac" },
      { color: "#d0f4de", name: "Mint" },
    ],
  },
  {
    src: "/home/Clear Winter (female).jpg",
    season: "Clear Winter",
    undertone: "Cool & Contrast",
    confidence: 98,
    matches: [
      { color: "#d90429", name: "True Red" },
      { color: "#023e8a", name: "Sapphire" },
      { color: "#2b2d42", name: "Charcoal" },
      { color: "#00b4d8", name: "Cyan" },
      { color: "#ffffff", name: "Pure White" },
    ],
    avoids: [
      { color: "#d4a373", name: "Camel" },
      { color: "#ccd5ae", name: "Sage" },
      { color: "#e9edc9", name: "Pale Yellow" },
      { color: "#faedcd", name: "Beige" },
    ],
  },
  {
    src: "/home/Deep Winter (male) .jpg",
    season: "Deep Winter",
    undertone: "Cool & Deep",
    confidence: 95,
    matches: [
      { color: "#03045e", name: "Deep Navy" },
      { color: "#4a0e4e", name: "Plum" },
      { color: "#0077b6", name: "Ocean Blue" },
      { color: "#14213d", name: "Black" },
      { color: "#8338ec", name: "Violet" },
    ],
    avoids: [
      { color: "#fdf0d5", name: "Cream" },
      { color: "#ffb703", name: "Mustard" },
      { color: "#fb8500", name: "Orange" },
      { color: "#8cb369", name: "Olive" },
    ],
  },
];

const SCAN_DURATION = 1500;
const CYCLE_INTERVAL = 4000;

export default function HeroScannerCard() {
  const [currentIndex, setCurrentIndex] = useState(2);
  const [data, setData] = useState<AvatarData>(AVATARS[2]);
  const [isScanning, setIsScanning] = useState(false);
  const [contentVisible, setContentVisible] = useState(true);
  const [activeImg, setActiveImg] = useState<1 | 2>(1);

  const img1Ref = useRef<HTMLImageElement>(null);
  const img2Ref = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const scanValRef = useRef(0);
  const animFrameRef = useRef<number>(0);

  // WebGL scanner shader
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const syncSize = () => {
      const w = canvas.clientWidth || 192;
      const h = canvas.clientHeight || 192;
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
    };
    syncSize();
    const ro = new ResizeObserver(syncSize);
    ro.observe(canvas);

    const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
    if (!gl) return;

    const vs = `attribute vec2 a_position; varying vec2 v_texCoord; void main() { v_texCoord = a_position * 0.5 + 0.5; gl_Position = vec4(a_position, 0.0, 1.0); }`;
    const fs = `precision highp float; varying vec2 v_texCoord; uniform float u_time; uniform float u_is_scanning;
float line(vec2 uv, float pos, float width) { return smoothstep(pos - width, pos, uv.y) - smoothstep(pos, pos + width, uv.y); }
void main() { vec2 uv = v_texCoord; vec3 color = vec3(0.0, 0.17, 0.57) * 0.15 * u_is_scanning;
float scanPos = sin(u_time * 2.0) * 0.45 + 0.5;
color += vec3(0.0, 0.24, 0.78) * line(uv, scanPos, 0.008) * 1.5 * u_is_scanning;
color += vec3(0.0, 0.32, 1.0) * line(uv, scanPos, 0.12) * 0.6 * u_is_scanning;
vec2 grid = fract(uv * 20.0); color += vec3(1.0) * (step(0.98, grid.x) + step(0.98, grid.y)) * 0.02 * u_is_scanning;
color *= sin(u_time * 4.0) * 0.1 + 0.9;
gl_FragColor = vec4(color, 0.8 * u_is_scanning); }`;

    const compile = (type: number, src: string) => {
      const s = gl.createShader(type)!;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      return s;
    };

    const prog = gl.createProgram()!;
    gl.attachShader(prog, compile(gl.VERTEX_SHADER, vs));
    gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, fs));
    gl.linkProgram(prog);
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const pos = gl.getAttribLocation(prog, "a_position");
    gl.enableVertexAttribArray(pos);
    gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0);

    const uTime = gl.getUniformLocation(prog, "u_time");
    const uScan = gl.getUniformLocation(prog, "u_is_scanning");

    const render = (t: number) => {
      syncSize();
      gl.viewport(0, 0, canvas.width, canvas.height);
      const target = scanValRef.current;
      if (uTime) gl.uniform1f(uTime, t * 0.001);
      if (uScan) gl.uniform1f(uScan, target);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      animFrameRef.current = requestAnimationFrame(render);
    };
    animFrameRef.current = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animFrameRef.current);
      ro.disconnect();
    };
  }, []);

  // Update shader scan value
  useEffect(() => {
    let raf: number;
    const tick = () => {
      const target = isScanning ? 1 : 0;
      scanValRef.current += (target - scanValRef.current) * 0.1;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [isScanning]);

  // Auto-cycle
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => {
        const next = (prev + 1) % AVATARS.length;
        const nextData = AVATARS[next];

        // Start scanning
        setIsScanning(true);
        setContentVisible(false);

        // Swap images
        const nextImgNode = activeImg === 1 ? img2Ref.current : img1Ref.current;
        const currentImgNode = activeImg === 1 ? img1Ref.current : img2Ref.current;
        if (nextImgNode) {
          nextImgNode.src = nextData.src;
          nextImgNode.style.opacity = "1";
        }
        if (currentImgNode) currentImgNode.style.opacity = "0";
        setActiveImg(activeImg === 1 ? 2 : 1);

        // After scan completes
        setTimeout(() => {
          setIsScanning(false);
          setData(nextData);
          setContentVisible(true);
        }, SCAN_DURATION);

        return next;
      });
    }, CYCLE_INTERVAL);

    return () => clearInterval(interval);
  }, [activeImg]);

  return (
    <div className="relative w-full bg-white rounded-[2rem] shadow-2xl p-6 lg:p-8 flex flex-col gap-6 border border-black/5">
      {/* Header */}
      <div className="flex justify-between items-center border-b border-black/5 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse" />
          <span className="text-[10px] font-bold tracking-widest text-[#1b1c1b] uppercase">
            {isScanning ? "Analyzing Features..." : "Analysis Complete"}
          </span>
        </div>
        <div
          className="text-sm font-bold text-green-600 flex items-center gap-1 transition-opacity duration-500"
          style={{ opacity: contentVisible ? 1 : 0 }}
        >
          {data.confidence}% Confidence
          <span className="material-symbols-outlined text-[18px]">check_circle</span>
        </div>
      </div>

      {/* Avatar + Profile */}
      <div className="flex flex-col sm:flex-row gap-5 items-center sm:items-start">
        {/* Avatar box */}
        <div className="relative w-36 h-36 sm:w-44 sm:h-44 rounded-2xl overflow-hidden flex-shrink-0 shadow-lg bg-white">
          <img
            ref={img1Ref}
            alt="Avatar"
            className="absolute inset-0 w-full h-full object-cover object-top"
            style={{ transition: "opacity 0.5s", opacity: 1 }}
            src={AVATARS[2].src}
          />
          <img
            ref={img2Ref}
            alt="Avatar"
            className="absolute inset-0 w-full h-full object-cover object-top"
            style={{ transition: "opacity 0.5s", opacity: 0 }}
            src={AVATARS[(2 + 1) % AVATARS.length].src}
          />
          <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full opacity-90 mix-blend-screen pointer-events-none"
          />
        </div>

        {/* Profile details */}
        <div
          className="text-center sm:text-left mt-1 sm:mt-3 transition-opacity duration-500"
          style={{ opacity: contentVisible ? 1 : 0 }}
        >
          <div className="text-[10px] font-bold text-[#002b92] tracking-widest uppercase mb-1.5">Color Profile</div>
          <div className="text-2xl sm:text-3xl font-black text-[#1b1c1b] mb-2" style={{ fontFamily: "Manrope, sans-serif" }}>
            {data.season}
          </div>
          <div className="text-xs text-[#5a6060] font-medium bg-[#f6f3f2] px-3 py-1.5 rounded-full inline-block">
            Dominant: {data.undertone}
          </div>
        </div>
      </div>

      {/* Best Matches */}
      <div className="transition-opacity duration-500" style={{ opacity: contentVisible ? 1 : 0 }}>
        <div className="text-[10px] font-bold uppercase tracking-widest text-[#747686] mb-2">Best Matches</div>
        <div className="grid grid-cols-5 gap-2.5">
          {data.matches.map((m) => (
            <div key={m.name} className="flex flex-col items-center gap-1.5">
              <div
                className="w-full aspect-square rounded-lg shadow-sm border border-black/5"
                style={{ backgroundColor: m.color }}
              />
              <span className="text-[9px] font-medium text-[#747686] text-center leading-tight">{m.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Colors to Avoid */}
      <div className="transition-opacity duration-500" style={{ opacity: contentVisible ? 1 : 0 }}>
        <div className="text-[10px] font-bold uppercase tracking-widest text-[#747686] mb-2">Colors to Avoid</div>
        <div className="flex flex-row gap-4">
          {data.avoids.map((a) => (
            <div key={a.name} className="flex flex-col items-center gap-1.5">
              <div className="relative">
                <div
                  className="w-11 h-11 rounded-full border border-black/10"
                  style={{ backgroundColor: a.color }}
                />
                <div className="absolute inset-0 flex items-center justify-center text-red-600 opacity-80">
                  <span className="material-symbols-outlined text-xl">close</span>
                </div>
              </div>
              <span className="text-[9px] font-medium text-[#747686] text-center leading-tight">{a.name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

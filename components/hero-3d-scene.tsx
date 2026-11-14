'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

export default function Hero3DScene() {
  const mountRef = useRef<HTMLDivElement>(null);
  const [webGLSupported, setWebGLSupported] = useState(true);

  useEffect(() => {
    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      setWebGLSupported(false);
      return;
    }

    const container = mountRef.current;
    if (!container) return;

    // Check WebGL availability
    try {
      const testCanvas = document.createElement('canvas');
      const gl = testCanvas.getContext('webgl') || testCanvas.getContext('experimental-webgl');
      if (!gl) {
        setWebGLSupported(false);
        return;
      }
    } catch {
      setWebGLSupported(false);
      return;
    }

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    // 1. Scene & Camera Setup
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x101114, 0.045);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 1.8, 7.5);

    // 2. Renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    container.appendChild(renderer.domElement);

    // 3. Lighting
    // Ambient fill
    const ambientLight = new THREE.AmbientLight(0x202430, 2.5);
    scene.add(ambientLight);

    // Main stadium floodlight (key light)
    const keyLight = new THREE.DirectionalLight(0xfff5e6, 3.5);
    keyLight.position.set(5, 8, 4);
    scene.add(keyLight);

    // Cyan/Lime stadium rim light
    const rimLight = new THREE.DirectionalLight(0xd5f05b, 2.0);
    rimLight.position.set(-5, 4, -4);
    scene.add(rimLight);

    // Warm competition orange accent
    const orangeLight = new THREE.PointLight(0xf15a29, 3.0, 15);
    orangeLight.position.set(0, -1, 2);
    scene.add(orangeLight);

    // 4. Stadium Arena Floor / Track Lines
    const arenaGroup = new THREE.Group();

    // Concentric running tracks
    const trackMaterial = new THREE.MeshBasicMaterial({
      color: 0x1f232b,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.6,
    });
    const floorGeo = new THREE.RingGeometry(1.8, 6.5, 64);
    const floorMesh = new THREE.Mesh(floorGeo, trackMaterial);
    floorMesh.rotation.x = -Math.PI / 2;
    floorMesh.position.y = -1.5;
    arenaGroup.add(floorMesh);

    // Glowing track line 1 (Electric lime)
    const lineGeo1 = new THREE.RingGeometry(2.8, 2.84, 64);
    const lineMat1 = new THREE.MeshBasicMaterial({
      color: 0xd5f05b,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.45,
    });
    const lineMesh1 = new THREE.Mesh(lineGeo1, lineMat1);
    lineMesh1.rotation.x = -Math.PI / 2;
    lineMesh1.position.y = -1.49;
    arenaGroup.add(lineMesh1);

    // Glowing track line 2 (Competition orange)
    const lineGeo2 = new THREE.RingGeometry(4.2, 4.24, 64);
    const lineMat2 = new THREE.MeshBasicMaterial({
      color: 0xf15a29,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.35,
    });
    const lineMesh2 = new THREE.Mesh(lineGeo2, lineMat2);
    lineMesh2.rotation.x = -Math.PI / 2;
    lineMesh2.position.y = -1.49;
    arenaGroup.add(lineMesh2);

    // Outer grid lattice
    const gridHelper = new THREE.GridHelper(14, 28, 0xd5f05b, 0x1d212a);
    gridHelper.position.y = -1.51;
    (gridHelper.material as THREE.Material).transparent = true;
    (gridHelper.material as THREE.Material).opacity = 0.25;
    arenaGroup.add(gridHelper);

    scene.add(arenaGroup);

    // 5. Championship Metallic Trophy Group
    const trophyGroup = new THREE.Group();

    // Gold metallic PBR material
    const goldMaterial = new THREE.MeshStandardMaterial({
      color: 0xdeb852,
      metalness: 0.94,
      roughness: 0.22,
      envMapIntensity: 1.5,
    });

    const obsidianMaterial = new THREE.MeshStandardMaterial({
      color: 0x121418,
      metalness: 0.6,
      roughness: 0.35,
    });

    const limeAccentMaterial = new THREE.MeshStandardMaterial({
      color: 0xd5f05b,
      emissive: 0xd5f05b,
      emissiveIntensity: 0.3,
      metalness: 0.8,
      roughness: 0.2,
    });

    // Trophy Base (Plinth)
    const baseGeo = new THREE.CylinderGeometry(0.55, 0.68, 0.35, 32);
    const baseMesh = new THREE.Mesh(baseGeo, obsidianMaterial);
    baseMesh.position.y = -0.9;
    trophyGroup.add(baseMesh);

    // Plinth Ring Accent
    const plinthRingGeo = new THREE.TorusGeometry(0.6, 0.03, 16, 48);
    const plinthRingMesh = new THREE.Mesh(plinthRingGeo, limeAccentMaterial);
    plinthRingMesh.rotation.x = Math.PI / 2;
    plinthRingMesh.position.y = -0.75;
    trophyGroup.add(plinthRingMesh);

    // Stem
    const stemGeo = new THREE.CylinderGeometry(0.18, 0.25, 0.6, 24);
    const stemMesh = new THREE.Mesh(stemGeo, goldMaterial);
    stemMesh.position.y = -0.45;
    trophyGroup.add(stemMesh);

    // Central Chalice Cup
    const cupOuterGeo = new THREE.CylinderGeometry(0.75, 0.25, 0.95, 32, 1, false);
    const cupMesh = new THREE.Mesh(cupOuterGeo, goldMaterial);
    cupMesh.position.y = 0.25;
    trophyGroup.add(cupMesh);

    // Cup rim ring
    const rimGeo = new THREE.TorusGeometry(0.75, 0.045, 16, 48);
    const rimMesh = new THREE.Mesh(rimGeo, goldMaterial);
    rimMesh.rotation.x = Math.PI / 2;
    rimMesh.position.y = 0.725;
    trophyGroup.add(rimMesh);

    // Left Handle (Torus segment)
    const handleGeo = new THREE.TorusGeometry(0.42, 0.05, 16, 32, Math.PI * 1.15);
    const handleLeft = new THREE.Mesh(handleGeo, goldMaterial);
    handleLeft.position.set(-0.78, 0.28, 0);
    handleLeft.rotation.z = Math.PI * 0.45;
    trophyGroup.add(handleLeft);

    // Right Handle (Torus segment)
    const handleRight = new THREE.Mesh(handleGeo, goldMaterial);
    handleRight.position.set(0.78, 0.28, 0);
    handleRight.rotation.z = -Math.PI * 0.45;
    handleRight.rotation.y = Math.PI;
    trophyGroup.add(handleRight);

    // Crown / Olympic Flame Finial at top
    const crownGeo = new THREE.OctahedronGeometry(0.24, 0);
    const crownMesh = new THREE.Mesh(crownGeo, limeAccentMaterial);
    crownMesh.position.y = 0.98;
    trophyGroup.add(crownMesh);

    // Internal Olympic Emblem Emblem Disc
    const emblemGeo = new THREE.CylinderGeometry(0.22, 0.22, 0.04, 32);
    const emblemMesh = new THREE.Mesh(emblemGeo, obsidianMaterial);
    emblemMesh.rotation.x = Math.PI / 2;
    emblemMesh.position.set(0, 0.25, 0.52);
    trophyGroup.add(emblemMesh);

    scene.add(trophyGroup);

    // 6. Atmospheric Floating Energy Particles
    const particleCount = 220;
    const particleGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);

    const cGold = new THREE.Color(0xf15a29);
    const cLime = new THREE.Color(0xd5f05b);
    const cWhite = new THREE.Color(0xf4f1ea);

    for (let i = 0; i < particleCount; i++) {
      const radius = 1.2 + Math.random() * 4.5;
      const theta = Math.random() * Math.PI * 2;
      positions[i * 3] = radius * Math.cos(theta);
      positions[i * 3 + 1] = -1.2 + Math.random() * 4.0;
      positions[i * 3 + 2] = radius * Math.sin(theta);

      const colorPick = Math.random();
      const pColor = colorPick > 0.6 ? cLime : colorPick > 0.3 ? cGold : cWhite;
      colors[i * 3] = pColor.r;
      colors[i * 3 + 1] = pColor.g;
      colors[i * 3 + 2] = pColor.b;
    }

    particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particleGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const particleMat = new THREE.PointsMaterial({
      size: 0.05,
      vertexColors: true,
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending,
    });

    const particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);

    // 7. Mouse Interactivity / Parallax State
    let mouseX = 0;
    let mouseY = 0;
    let targetX = 0;
    let targetY = 0;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      targetX = x * 1.8;
      targetY = -y * 1.2;
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });

    // Handle Resize
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    // 8. Animation Render Loop
    let animationFrameId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // Smooth camera lerping with inertia
      mouseX += (targetX - mouseX) * 0.05;
      mouseY += (targetY - mouseY) * 0.05;

      camera.position.x = mouseX * 2.2;
      camera.position.y = 1.8 + mouseY * 1.2;
      camera.lookAt(0, 0.4, 0);

      // Trophy subtle hover & slow rotation
      trophyGroup.rotation.y = elapsedTime * 0.35 + mouseX * 0.5;
      trophyGroup.position.y = Math.sin(elapsedTime * 1.2) * 0.08;
      crownMesh.rotation.y = elapsedTime * 1.5;

      // Arena floor subtle reactive tilt
      arenaGroup.rotation.y = -elapsedTime * 0.05;

      // Particle floating drift
      const posAttr = particleGeo.attributes.position as THREE.BufferAttribute;
      const array = posAttr.array as Float32Array;
      for (let i = 0; i < particleCount; i++) {
        array[i * 3 + 1] += 0.005; // slowly rise
        if (array[i * 3 + 1] > 3.0) {
          array[i * 3 + 1] = -1.2;
        }
      }
      posAttr.needsUpdate = true;
      particles.rotation.y = elapsedTime * 0.08;

      renderer.render(scene, camera);
    };

    animate();

    // Cleanup
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);

      // Dispose Three objects
      scene.clear();
      renderer.dispose();
      if (renderer.domElement && renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div className="absolute inset-0 w-full h-full pointer-events-none overflow-hidden select-none">
      {/* Three.js Canvas Container — full opacity for the 3D scene to be visible */}
      <div ref={mountRef} className="w-full h-full opacity-100 transition-opacity duration-1000" />

      {/* Fallback Atmospheric Ring when WebGL not available */}
      {!webGLSupported && (
        <div className="absolute inset-0 flex items-center justify-center bg-radial from-[#1B1D21]/80 via-[#101114] to-[#0A0B0E]">
          <div className="relative w-80 h-80 rounded-full border border-[#D5F05B]/20 animate-pulse flex items-center justify-center">
            <div className="w-56 h-56 rounded-full border border-[#F15A29]/25 flex items-center justify-center">
              <div className="w-36 h-36 rounded-full bg-gradient-to-tr from-[#F15A29]/20 to-[#D5F05B]/20 blur-xl" />
            </div>
          </div>
        </div>
      )}

      {/* Light bottom vignette to blend 3D scene into page — reduced to keep scene visible */}
      <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-[#101114] via-[#101114]/50 to-transparent pointer-events-none" />
      {/* Soft radial edge darkening */}
      <div className="absolute inset-0 bg-radial from-transparent via-transparent to-[#101114]/70 pointer-events-none" />
    </div>
  );
}

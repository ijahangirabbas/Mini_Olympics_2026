'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

export default function Hero3DScene() {
  const mountRef = useRef<HTMLDivElement>(null);
  const [webGLSupported, setWebGLSupported] = useState(true);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // Verify WebGL availability without hiding the trophy on reduced-motion systems
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance',
      });
    } catch {
      setWebGLSupported(false);
      return;
    }

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    // 1. Scene, Studio EnvMap & Camera Setup (centered 507823b composition)
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x0b1124, 0.045);

    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    pmremGenerator.compileEquirectangularShader();
    const envTarget = pmremGenerator.fromScene(new RoomEnvironment(), 0.04);
    scene.environment = envTarget.texture;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 1.8, 7.5);

    // 2. Renderer
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;
    renderer.domElement.style.display = 'block';
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // 3. Lighting
    const ambientLight = new THREE.AmbientLight(0x2c303d, 2.2);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xfff5e6, 3.8);
    keyLight.position.set(5, 8, 4);
    scene.add(keyLight);

    const frontFillLight = new THREE.DirectionalLight(0xffdca8, 1.8);
    frontFillLight.position.set(0, 2.5, 6);
    scene.add(frontFillLight);

    const rimLight = new THREE.DirectionalLight(0x12e2c4, 2.2);
    rimLight.position.set(-5, 4, -4);
    scene.add(rimLight);

    const orangeLight = new THREE.PointLight(0xf59e0b, 3.0, 15);
    orangeLight.position.set(0, -1, 2);
    scene.add(orangeLight);

    // 4. Stadium Arena Floor / Track Lines
    const arenaGroup = new THREE.Group();

    const floorGeo = new THREE.RingGeometry(1.8, 6.5, 64);
    const trackMaterial = new THREE.MeshBasicMaterial({
      color: 0x131b38,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.6,
    });
    const floorMesh = new THREE.Mesh(floorGeo, trackMaterial);
    floorMesh.rotation.x = -Math.PI / 2;
    floorMesh.position.y = -1.5;
    arenaGroup.add(floorMesh);

    const lineGeo1 = new THREE.RingGeometry(2.8, 2.84, 64);
    const lineMat1 = new THREE.MeshBasicMaterial({
      color: 0x12e2c4,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.45,
    });
    const lineMesh1 = new THREE.Mesh(lineGeo1, lineMat1);
    lineMesh1.rotation.x = -Math.PI / 2;
    lineMesh1.position.y = -1.49;
    arenaGroup.add(lineMesh1);

    const lineGeo2 = new THREE.RingGeometry(4.2, 4.24, 64);
    const lineMat2 = new THREE.MeshBasicMaterial({
      color: 0xf59e0b,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.35,
    });
    const lineMesh2 = new THREE.Mesh(lineGeo2, lineMat2);
    lineMesh2.rotation.x = -Math.PI / 2;
    lineMesh2.position.y = -1.49;
    arenaGroup.add(lineMesh2);

    const gridHelper = new THREE.GridHelper(14, 28, 0x12e2c4, 0x182244);
    gridHelper.position.y = -1.51;
    (gridHelper.material as THREE.Material).transparent = true;
    (gridHelper.material as THREE.Material).opacity = 0.25;
    arenaGroup.add(gridHelper);

    scene.add(arenaGroup);

    // 5. Centered Championship Metallic Trophy Group
    const trophyGroup = new THREE.Group();

    const goldMaterial = new THREE.MeshStandardMaterial({
      color: 0xf2c14e,
      metalness: 0.85,
      roughness: 0.2,
      emissive: 0x332004,
      emissiveIntensity: 0.22,
      envMapIntensity: 1.5,
    });

    const obsidianMaterial = new THREE.MeshStandardMaterial({
      color: 0x131b38,
      metalness: 0.6,
      roughness: 0.35,
      envMapIntensity: 1.0,
    });

    const limeAccentMaterial = new THREE.MeshStandardMaterial({
      color: 0x12e2c4,
      emissive: 0x12e2c4,
      emissiveIntensity: 0.45,
      metalness: 0.8,
      roughness: 0.2,
    });

    const baseMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.55, 0.68, 0.35, 32),
      obsidianMaterial
    );
    baseMesh.position.y = -0.9;
    trophyGroup.add(baseMesh);

    const plinthRingMesh = new THREE.Mesh(
      new THREE.TorusGeometry(0.6, 0.03, 16, 48),
      limeAccentMaterial
    );
    plinthRingMesh.rotation.x = Math.PI / 2;
    plinthRingMesh.position.y = -0.75;
    trophyGroup.add(plinthRingMesh);

    const stemMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.18, 0.25, 0.6, 24),
      goldMaterial
    );
    stemMesh.position.y = -0.45;
    trophyGroup.add(stemMesh);

    const cupMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.75, 0.25, 0.95, 32, 1, false),
      goldMaterial
    );
    cupMesh.position.y = 0.25;
    trophyGroup.add(cupMesh);

    const rimMesh = new THREE.Mesh(
      new THREE.TorusGeometry(0.75, 0.045, 16, 48),
      goldMaterial
    );
    rimMesh.rotation.x = Math.PI / 2;
    rimMesh.position.y = 0.725;
    trophyGroup.add(rimMesh);

    const handleGeo = new THREE.TorusGeometry(0.42, 0.05, 16, 32, Math.PI * 1.15);
    const handleLeft = new THREE.Mesh(handleGeo, goldMaterial);
    handleLeft.position.set(-0.78, 0.28, 0);
    handleLeft.rotation.z = Math.PI * 0.45;
    trophyGroup.add(handleLeft);

    const handleRight = new THREE.Mesh(handleGeo, goldMaterial);
    handleRight.position.set(0.78, 0.28, 0);
    handleRight.rotation.z = -Math.PI * 0.45;
    handleRight.rotation.y = Math.PI;
    trophyGroup.add(handleRight);

    const crownMesh = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.24, 0),
      limeAccentMaterial
    );
    crownMesh.position.y = 0.98;
    trophyGroup.add(crownMesh);

    const emblemMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.22, 0.22, 0.04, 32),
      obsidianMaterial
    );
    emblemMesh.rotation.x = Math.PI / 2;
    emblemMesh.position.set(0, 0.25, 0.52);
    trophyGroup.add(emblemMesh);

    scene.add(trophyGroup);

    // 6. Atmospheric Floating Energy Particles
    const particleCount = 220;
    const particleGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);

    const cGold = new THREE.Color(0xf59e0b);
    const cLime = new THREE.Color(0x12e2c4);
    const cWhite = new THREE.Color(0xf8fafc);

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
      if (prefersReducedMotion) return;
      const rect = container.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      targetX = x * 1.8;
      targetY = -y * 1.2;
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });

    const renderStaticFrame = () => {
      camera.lookAt(0, 0.4, 0);
      trophyGroup.rotation.y = -0.3;
      renderer.render(scene, camera);
    };

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      if (!w || !h) return;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      if (prefersReducedMotion) {
        renderStaticFrame();
      }
    };

    window.addEventListener('resize', handleResize);

    // 8. Animation Render Loop
    let animationFrameId = 0;
    const clock = new THREE.Clock();

    if (prefersReducedMotion) {
      renderStaticFrame();
    } else {
      const animate = () => {
        animationFrameId = requestAnimationFrame(animate);
        const elapsedTime = clock.getElapsedTime();

        mouseX += (targetX - mouseX) * 0.05;
        mouseY += (targetY - mouseY) * 0.05;

        camera.position.x = mouseX * 2.2;
        camera.position.y = 1.8 + mouseY * 1.2;
        camera.lookAt(0, 0.4, 0);

        trophyGroup.rotation.y = elapsedTime * 0.35 + mouseX * 0.5;
        trophyGroup.position.y = Math.sin(elapsedTime * 1.2) * 0.08;
        crownMesh.rotation.y = elapsedTime * 1.5;

        arenaGroup.rotation.y = -elapsedTime * 0.05;

        const posAttr = particleGeo.attributes.position as THREE.BufferAttribute;
        const array = posAttr.array as Float32Array;
        for (let i = 0; i < particleCount; i++) {
          array[i * 3 + 1] += 0.005;
          if (array[i * 3 + 1] > 3.0) {
            array[i * 3 + 1] = -1.2;
          }
        }
        posAttr.needsUpdate = true;
        particles.rotation.y = elapsedTime * 0.08;

        renderer.render(scene, camera);
      };

      animate();
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      if (animationFrameId) cancelAnimationFrame(animationFrameId);

      scene.traverse((obj) => {
        if (obj instanceof THREE.Mesh || obj instanceof THREE.Points) {
          obj.geometry?.dispose();
          if (Array.isArray(obj.material)) {
            obj.material.forEach((m) => m.dispose());
          } else {
            obj.material?.dispose();
          }
        }
      });

      scene.clear();
      envTarget.dispose();
      pmremGenerator.dispose();
      renderer.dispose();
      if (renderer.domElement && renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div className="hero-scene-reveal absolute inset-0 z-[1] w-full h-full pointer-events-none overflow-hidden select-none">
      {/* Three.js Canvas Container */}
      <div ref={mountRef} className="w-full h-full opacity-100 transition-opacity duration-1000" />

      {/* Centered Atmospheric Ring + Trophy Fallback when WebGL unavailable */}
      {!webGLSupported && (
        <div className="absolute inset-0 flex items-center justify-center bg-radial from-[#182244]/80 via-[#0B1124] to-[#080D1C]">
          <div className="relative w-80 h-80 rounded-full border border-[#12E2C4]/20 animate-pulse flex items-center justify-center">
            <div className="w-56 h-56 rounded-full border border-[#F59E0B]/25 flex items-center justify-center">
              <svg
                viewBox="0 0 120 120"
                className="w-36 h-36 opacity-80 drop-shadow-[0_0_24px_rgba(243,198,79,0.3)]"
                fill="none"
                aria-hidden="true"
              >
                <defs>
                  <linearGradient id="heroTrophyGoldFallback" x1="20" y1="18" x2="96" y2="102" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#FCE38A" />
                    <stop offset="50%" stopColor="#F3C64F" />
                    <stop offset="100%" stopColor="#C48F21" />
                  </linearGradient>
                </defs>
                <path
                  d="M35 28H85V48C85 63.5 73.8 76 60 76C46.2 76 35 63.5 35 48V28Z"
                  fill="url(#heroTrophyGoldFallback)"
                />
                <path
                  d="M35 34H22C22 50 28 58 37 60M85 34H98C98 50 92 58 83 60"
                  stroke="#F3C64F"
                  strokeWidth="5"
                  strokeLinecap="round"
                />
                <rect x="54" y="75" width="12" height="16" rx="2" fill="url(#heroTrophyGoldFallback)" />
                <rect x="40" y="91" width="40" height="11" rx="3" fill="#131B38" stroke="#12E2C4" strokeWidth="2" />
                <polygon points="60,10 66,18 60,26 54,18" fill="#12E2C4" />
              </svg>
            </div>
          </div>
        </div>
      )}

      {/* Light bottom vignette to blend 3D scene into page */}
      <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-[#0B1124] via-[#0B1124]/50 to-transparent pointer-events-none" />
      <div className="absolute inset-0 bg-radial from-transparent via-transparent to-[#0B1124]/70 pointer-events-none" />
    </div>
  );
}

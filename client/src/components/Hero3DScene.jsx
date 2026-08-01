import { OrbitControls, Sparkles } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";

function configureTexture(texture, { srgb = true } = {}) {
  if (!texture) {
    return null;
  }

  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = true;
  if (srgb) {
    texture.colorSpace = THREE.SRGBColorSpace;
  }
  return texture;
}

function createProceduralEarthTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    return null;
  }

  const oceanGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  oceanGradient.addColorStop(0, "#0b4f87");
  oceanGradient.addColorStop(0.5, "#0a5c9d");
  oceanGradient.addColorStop(1, "#083b67");
  ctx.fillStyle = oceanGradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const continents = [
    { x: 190, y: 170, rx: 130, ry: 75, rot: 0.3 },
    { x: 270, y: 300, rx: 85, ry: 58, rot: -0.2 },
    { x: 470, y: 180, rx: 110, ry: 70, rot: 0.1 },
    { x: 560, y: 275, rx: 140, ry: 85, rot: -0.15 },
    { x: 730, y: 165, rx: 120, ry: 65, rot: 0.22 },
    { x: 825, y: 255, rx: 100, ry: 55, rot: -0.18 }
  ];

  continents.forEach((shape, index) => {
    const landGradient = ctx.createRadialGradient(shape.x - 25, shape.y - 20, 12, shape.x, shape.y, shape.rx);
    landGradient.addColorStop(0, index % 2 === 0 ? "#6dbb5f" : "#7cc96b");
    landGradient.addColorStop(1, "#3f8741");

    ctx.save();
    ctx.translate(shape.x, shape.y);
    ctx.rotate(shape.rot);
    ctx.scale(shape.rx, shape.ry);
    ctx.beginPath();
    ctx.arc(0, 0, 1, 0, Math.PI * 2);
    ctx.closePath();
    ctx.fillStyle = landGradient;
    ctx.fill();
    ctx.restore();
  });

  for (let i = 0; i < 850; i += 1) {
    const x = Math.random() * canvas.width;
    const y = Math.random() * canvas.height;
    const alpha = 0.08 + Math.random() * 0.1;
    ctx.fillStyle = `rgba(255,255,255,${alpha})`;
    ctx.fillRect(x, y, 2, 1);
  }

  const texture = new THREE.CanvasTexture(canvas);
  return configureTexture(texture, { srgb: true });
}

function createProceduralCloudTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    return null;
  }

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  for (let i = 0; i < 260; i += 1) {
    const x = Math.random() * canvas.width;
    const y = Math.random() * canvas.height;
    const r = 10 + Math.random() * 42;
    const opacity = 0.03 + Math.random() * 0.08;
    const cloud = ctx.createRadialGradient(x, y, 0, x, y, r);
    cloud.addColorStop(0, `rgba(255,255,255,${opacity})`);
    cloud.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = cloud;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  return configureTexture(texture, { srgb: false });
}

function useOptionalTexture(path, options) {
  const [texture, setTexture] = useState(undefined);

  useEffect(() => {
    let isActive = true;
    const loader = new THREE.TextureLoader();

    loader.load(
      path,
      (loadedTexture) => {
        if (!isActive) {
          loadedTexture.dispose();
          return;
        }
        setTexture(configureTexture(loadedTexture, options));
      },
      undefined,
      () => {
        if (isActive) {
          setTexture(null);
        }
      }
    );

    return () => {
      isActive = false;
    };
  }, [options, path]);

  return texture;
}

function GlobeScene({ qualityTier }) {
  const globeGroupRef = useRef(null);
  const cloudsRef = useRef(null);
  const earthTexture = useOptionalTexture("/textures/earth-day.jpg", { srgb: true });
  const cloudTexture = useOptionalTexture("/textures/earth-clouds.png", { srgb: false });
  const normalTexture = useOptionalTexture("/textures/earth-normal.jpg", { srgb: false });
  const specularTexture = useOptionalTexture("/textures/earth-specular.jpg", { srgb: false });
  const fallbackEarthTexture = useMemo(() => createProceduralEarthTexture(), []);
  const fallbackCloudTexture = useMemo(() => createProceduralCloudTexture(), []);

  const globeMap = earthTexture === undefined ? fallbackEarthTexture : earthTexture || fallbackEarthTexture;
  const cloudMap = cloudTexture === undefined ? fallbackCloudTexture : cloudTexture || fallbackCloudTexture;
  const normalMap = normalTexture || null;
  const specularMap = specularTexture || null;

  const segments = qualityTier === "low" ? 32 : qualityTier === "medium" ? 44 : 56;

  useFrame((state, delta) => {
    if (globeGroupRef.current) {
      globeGroupRef.current.rotation.y += delta * 0.2;
      globeGroupRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.18) * 0.04;
    }

    if (cloudsRef.current) {
      cloudsRef.current.rotation.y += delta * 0.08;
    }
  });

  return (
    <group ref={globeGroupRef}>
      <mesh castShadow>
        <sphereGeometry args={[1, segments, segments]} />
        <meshPhongMaterial
          map={globeMap}
          normalMap={normalMap}
          specularMap={specularMap}
          specular="#6ab9ff"
          shininess={24}
          color="#ffffff"
          emissive="#0a2f4a"
          emissiveIntensity={0.06}
          normalScale={new THREE.Vector2(0.42, 0.42)}
        />
      </mesh>

      <mesh ref={cloudsRef}>
        <sphereGeometry args={[1.022, segments, segments]} />
        <meshStandardMaterial
          map={cloudMap}
          color="#f5fbff"
          transparent
          opacity={0.24}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      <mesh>
        <sphereGeometry args={[1.08, segments, segments]} />
        <meshBasicMaterial color="#8be2ff" transparent opacity={0.12} side={THREE.BackSide} />
      </mesh>
    </group>
  );
}

function SceneLights() {
  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[3, 2, 4]} intensity={1.15} />
      <directionalLight position={[-2, -1, -3]} intensity={0.3} color="#67e8f9" />
      <pointLight position={[0, 2.8, 1.8]} intensity={0.8} color="#22d3ee" />
      <pointLight position={[0, -2.3, -1.6]} intensity={0.32} color="#0ea5e9" />
    </>
  );
}

function MouseReactiveCamera({ enabled }) {
  const { camera, pointer } = useThree();

  useFrame((_, delta) => {
    if (!enabled) {
      return;
    }

    const targetX = pointer.x * 0.34;
    const targetY = pointer.y * 0.16;
    camera.position.x = THREE.MathUtils.lerp(camera.position.x, targetX, 2.2 * delta);
    camera.position.y = THREE.MathUtils.lerp(camera.position.y, targetY, 1.9 * delta);
    camera.lookAt(0, 0, 0);
  });

  return null;
}

function ReducedMotionFallback() {
  return (
    <div className="relative h-full w-full overflow-hidden rounded-2xl border border-cyan-200/70 bg-linear-to-br from-cyan-100/85 via-white to-sky-200/75">
      <div className="absolute -left-10 -top-10 h-40 w-40 rounded-full bg-cyan-300/35 blur-2xl" />
      <div className="absolute -bottom-8 -right-8 h-36 w-36 rounded-full bg-sky-300/35 blur-2xl" />
      <div className="absolute left-1/2 top-1/2 h-40 w-40 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-cyan-400/70" />
      <div className="absolute left-1/2 top-1/2 h-28 w-28 -translate-x-1/2 -translate-y-1/2 rounded-full border border-cyan-300/75" />
      <div className="absolute left-1/2 top-1/2 h-24 w-24 -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-500/80 shadow-[0_0_40px_rgba(34,211,238,0.55)]" />
    </div>
  );
}

export function Hero3DScene() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [isCompactViewport, setIsCompactViewport] = useState(false);
  const [qualityTier, setQualityTier] = useState("high");

  useEffect(() => {
    const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const compactViewportQuery = window.matchMedia("(max-width: 768px)");

    const applyPreferences = () => {
      setPrefersReducedMotion(reducedMotionQuery.matches);
      setIsCompactViewport(compactViewportQuery.matches);

      const memory = Number(navigator.deviceMemory || 0);
      const cores = Number(navigator.hardwareConcurrency || 0);
      const compact = compactViewportQuery.matches;

      if (compact || memory > 0 && memory <= 4 || cores > 0 && cores <= 4) {
        setQualityTier("low");
        return;
      }

      if (memory > 0 && memory <= 8 || cores > 0 && cores <= 8) {
        setQualityTier("medium");
        return;
      }

      setQualityTier("high");
    };

    applyPreferences();
    reducedMotionQuery.addEventListener("change", applyPreferences);
    compactViewportQuery.addEventListener("change", applyPreferences);

    return () => {
      reducedMotionQuery.removeEventListener("change", applyPreferences);
      compactViewportQuery.removeEventListener("change", applyPreferences);
    };
  }, []);

  if (prefersReducedMotion) {
    return (
      <div className="h-70 w-full sm:h-80">
        <ReducedMotionFallback />
      </div>
    );
  }

  const dprByTier = {
    low: [1, 1.2],
    medium: [1, 1.35],
    high: [1, 1.7]
  };

  const sparkleCountByTier = {
    low: 8,
    medium: 14,
    high: 22
  };

  const sparkleSizeByTier = {
    low: 1.5,
    medium: 2.1,
    high: 2.6
  };

  return (
    <div className="h-70 w-full overflow-hidden rounded-2xl border border-cyan-200/60 bg-linear-to-br from-cyan-100/55 via-white/70 to-sky-100/65 shadow-[inset_0_0_80px_rgba(14,165,233,0.14)] sm:h-80">
      <Canvas
        dpr={dprByTier[qualityTier]}
        camera={{ position: [0, 0, 4.6], fov: isCompactViewport ? 48 : 42 }}
        gl={{ antialias: false, powerPreference: "high-performance" }}
      >
        <color attach="background" args={["#eef9ff"]} />
        <fog attach="fog" args={["#eef9ff", 5.8, 11.5]} />
        <SceneLights />
        <MouseReactiveCamera enabled={!isCompactViewport} />
        <GlobeScene qualityTier={qualityTier} />
        <Sparkles
          count={sparkleCountByTier[qualityTier]}
          size={sparkleSizeByTier[qualityTier]}
          speed={0.12}
          opacity={0.38}
          color={new THREE.Color("#7fdcff")}
          scale={[4.4, 2.6, 2.6]}
        />
        <OrbitControls enableZoom={false} enablePan={false} enableRotate={false} autoRotate autoRotateSpeed={0.1} />
      </Canvas>
    </div>
  );
}

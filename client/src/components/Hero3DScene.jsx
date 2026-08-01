import { Float, OrbitControls, Sparkles } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

function AnimatedCore({ compact }) {
  const groupRef = useRef(null);
  const ringRef = useRef(null);

  useFrame((state, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.45;
      groupRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.4) * 0.18;
    }

    if (ringRef.current) {
      ringRef.current.rotation.x += delta * 0.2;
      ringRef.current.rotation.z -= delta * 0.3;
    }
  });

  return (
    <group ref={groupRef}>
      <Float speed={compact ? 1.4 : 2.2} rotationIntensity={compact ? 0.65 : 1} floatIntensity={compact ? 0.35 : 0.7}>
        <mesh castShadow>
          <icosahedronGeometry args={[1.05, 2]} />
          <meshStandardMaterial color="#0ea5e9" metalness={0.45} roughness={0.28} />
        </mesh>
      </Float>

      <mesh ref={ringRef}>
        <torusGeometry args={[1.75, 0.055, 16, 180]} />
        <meshStandardMaterial color="#0284c7" metalness={0.7} roughness={0.2} />
      </mesh>

      <mesh position={[0, 0, -1.35]}>
        <sphereGeometry args={[0.38, 24, 24]} />
        <meshStandardMaterial color="#0369a1" metalness={0.35} roughness={0.3} />
      </mesh>
    </group>
  );
}

function SceneLights() {
  return (
    <>
      <ambientLight intensity={0.55} />
      <directionalLight position={[3, 2, 4]} intensity={1.15} />
      <directionalLight position={[-2, -1, -3]} intensity={0.35} color="#67e8f9" />
      <pointLight position={[0, 2.8, 1.8]} intensity={0.8} color="#22d3ee" />
    </>
  );
}

function MouseReactiveCamera({ enabled }) {
  const { camera, pointer } = useThree();

  useFrame((_, delta) => {
    if (!enabled) {
      return;
    }

    const targetX = pointer.x * 0.45;
    const targetY = pointer.y * 0.22;
    camera.position.x = THREE.MathUtils.lerp(camera.position.x, targetX, 2.4 * delta);
    camera.position.y = THREE.MathUtils.lerp(camera.position.y, targetY, 2.1 * delta);
    camera.lookAt(0, 0, 0);
  });

  return null;
}

function ReducedMotionFallback() {
  return (
    <div className="relative h-full w-full overflow-hidden rounded-2xl border border-cyan-200/70 bg-linear-to-br from-cyan-100/85 via-white to-sky-200/75">
      <div className="absolute -left-10 -top-10 h-40 w-40 rounded-full bg-cyan-300/35 blur-2xl" />
      <div className="absolute -bottom-8 -right-8 h-36 w-36 rounded-full bg-sky-300/35 blur-2xl" />
      <div className="absolute left-1/2 top-1/2 h-36 w-36 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-cyan-400/70" />
      <div className="absolute left-1/2 top-1/2 h-20 w-20 -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-500/80 shadow-[0_0_40px_rgba(34,211,238,0.55)]" />
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
    low: 12,
    medium: 22,
    high: 34
  };

  const sparkleSizeByTier = {
    low: 2,
    medium: 2.6,
    high: 3.2
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
        <AnimatedCore compact={isCompactViewport} />
        <Sparkles
          count={sparkleCountByTier[qualityTier]}
          size={sparkleSizeByTier[qualityTier]}
          speed={0.18}
          opacity={0.55}
          color={new THREE.Color("#0284c7")}
          scale={[4.4, 2.6, 2.6]}
        />
        <OrbitControls enableZoom={false} enablePan={false} enableRotate={false} autoRotate autoRotateSpeed={0.42} />
      </Canvas>
    </div>
  );
}
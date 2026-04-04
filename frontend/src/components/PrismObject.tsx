"use client";

import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { MeshTransmissionMaterial, Float, Environment, Center } from "@react-three/drei";
import * as THREE from "three";

function ElegantPrism() {
  const mesh = useRef<THREE.Mesh>(null);

  // Improved geometry with finer beveling for light catches
  const geometry = useMemo(() => {
    const shape = new THREE.Shape();
    const s = 1.2;
    // Perfect equilateral triangle coordinates
    shape.moveTo(0, s);
    shape.lineTo(s * Math.cos(Math.PI / 6), -s * Math.sin(Math.PI / 6));
    shape.lineTo(-s * Math.cos(Math.PI / 6), -s * Math.sin(Math.PI / 6));
    shape.closePath();

    return new THREE.ExtrudeGeometry(shape, {
      depth: 0.4,
      bevelEnabled: true,
      bevelThickness: 0.08, // Thicker bevel for better light refraction
      bevelSize: 0.05,
      bevelSegments: 16, // Smoother edges
    });
  }, []);

  useFrame((state) => {
    if (!mesh.current) return;
    const t = state.clock.getElapsedTime();
    mesh.current.rotation.y = t * 0.2;
    mesh.current.rotation.x = Math.cos(t * 0.2) * 0.1;
  });

  return (
    <mesh ref={mesh} geometry={geometry}>
      {/* MeshTransmissionMaterial is the secret sauce for "elegant" glass.
          It handles thickness, chromatic aberration, and blurring.
      */}
      <MeshTransmissionMaterial
        backside
        samples={16}
        resolution={512}
        transmission={1.0}
        roughness={0.0}
        thickness={0.5}
        ior={1.5}
        chromaticAberration={0.06} // The "rainbow" edge effect
        anisotropy={0.1}
        distortion={0.1}
        distortionScale={0.3}
        temporalDistortion={0.1}
        color="#ffffff"
        attenuationDistance={0.5}
        attenuationColor="#ffffff"
      />
    </mesh>
  );
}

export default function PrismObject({ size = 500 }: { size?: number }) {
  return (
    <div style={{ width: size, height: size }}>
      <Canvas 
        camera={{ position: [0, 0, 5], fov: 35 }} 
        gl={{ antialias: true, alpha: true, stencil: false, depth: true }}
      >
        <color attach="background" args={["transparent"]} />
        
        {/* Environment is CRITICAL for glass. This provides the reflections. */}
        <Environment preset="city" />
        
        <ambientLight intensity={0.2} />
        <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={2} />
        <pointLight position={[-10, -10, -10]} intensity={1} color="#4361ee" />

        <Center>
          <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
            <ElegantPrism />
          </Float>
        </Center>
      </Canvas>
    </div>
  );
}
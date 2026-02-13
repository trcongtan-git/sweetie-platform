'use client';

import React, { useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Environment, Float, ContactShadows, Instance, Instances } from '@react-three/drei';
import * as THREE from 'three';

// Create a Heart Shape
const heartShape = new THREE.Shape();
const x = 0, y = 0;
heartShape.moveTo(x + 0.25, y + 0.25);
heartShape.bezierCurveTo(x + 0.25, y + 0.25, x + 0.20, y, x, y);
heartShape.bezierCurveTo(x - 0.30, y, x - 0.30, y + 0.35, x - 0.30, y + 0.35);
heartShape.bezierCurveTo(x - 0.30, y + 0.55, x - 0.10, y + 0.77, x + 0.25, y + 0.95);
heartShape.bezierCurveTo(x + 0.60, y + 0.77, x + 0.80, y + 0.55, x + 0.80, y + 0.35);
heartShape.bezierCurveTo(x + 0.80, y + 0.35, x + 0.80, y, x + 0.50, y);
heartShape.bezierCurveTo(x + 0.35, y, x + 0.25, y + 0.25, x + 0.25, y + 0.25);

// Individual falling heart
const Heart = ({ speed = 1, ...props }: any) => {
  const ref = useRef<any>();
  const [randomOffset] = useState(() => Math.random() * 100);
  
  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.getElapsedTime() + randomOffset;
    ref.current.rotation.set(Math.cos(t / 4) / 2, Math.sin(t / 4) / 2, Math.cos(t / 1.5) / 2);
    ref.current.position.y = ((t * speed) % 10) * -1 + 5; // Fall loop
  });

  return (
    <group {...props}>
      <Instance ref={ref} />
    </group>
  );
};

// Scene Manager
const Scene = () => {
   return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} />
      <Environment preset="city" />
      
      {/* Falling Hearts Instances */}
      <Instances range={50}>
        <extrudeGeometry args={[heartShape, { depth: 0.2, bevelEnabled: true, bevelSegments: 2, steps: 2, bevelSize: 0.05, bevelThickness: 0.05 }]} />
        <meshStandardMaterial color="#ff6b6b" roughness={0.3} metalness={0.1} />

        {Array.from({ length: 30 }).map((_, i) => (
          <Heart 
            key={i} 
            position={[
              (Math.random() - 0.5) * 10, // X: -5 to 5
              0, // Y: handled by animation
              (Math.random() - 0.5) * 5   // Z: -2.5 to 2.5
            ]} 
            speed={0.5 + Math.random()}
            scale={0.5 + Math.random() * 0.5}
          />
        ))}
      </Instances>

      <ContactShadows opacity={0.4} scale={20} blur={2.5} far={4} color="pink" />
    </>
   );
};

const ThreeDHeartSection = () => {
  return (
    <section 
      id="3d-section" 
      className="h-screen relative bg-pink-50"
    >
      <div className="absolute top-10 left-0 right-0 text-center z-10 pointer-events-none">
        <h2 className="text-3xl font-bold text-pink-600 font-serif">Love is in the Air</h2>
      </div>
      <Canvas camera={{ position: [0, 0, 8], fov: 50 }}>
        <Scene />
      </Canvas>
    </section>
  );
};

export default ThreeDHeartSection;

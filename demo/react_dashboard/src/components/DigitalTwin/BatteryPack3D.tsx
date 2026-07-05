import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Text } from '@react-three/drei';
import * as THREE from 'three';

interface CellData {
  id: string;
  position: [number, number, number];
  voltage: number;
  temperature: number;
  soh: number;
}

// Generate mock cell data
const generateCells = (): CellData[] => {
  const cells: CellData[] = [];
  for (let module = 0; module < 5; module++) {
    for (let cell = 0; cell < 8; cell++) {
      cells.push({
        id: `M${module + 1}_C${cell + 1}`,
        position: [
          (module - 2) * 1.2,
          (cell - 3.5) * 0.5,
          0
        ],
        voltage: 3.6 + Math.random() * 0.4,
        temperature: 25 + Math.random() * 15,
        soh: 60 + Math.random() * 40
      });
    }
  }
  return cells;
};

// Single Battery Cell Component
const BatteryCell: React.FC<{ cell: CellData }> = ({ cell }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  
  // Color based on risk level
  const color = useMemo(() => {
    if (cell.soh > 80) return new THREE.Color('#00FF88');
    if (cell.soh > 60) return new THREE.Color('#FFD700');
    if (cell.soh > 40) return new THREE.Color('#FF8C00');
    return new THREE.Color('#FF0000');
  }, [cell.soh]);
  
  // Subtle animation
  useFrame((state) => {
    if (meshRef.current) {
      const scale = 1 + Math.sin(state.clock.elapsedTime * 2 + cell.position[0]) * 0.02;
      meshRef.current.scale.setScalar(scale);
    }
  });
  
  return (
    <group position={cell.position}>
      {/* Cell body */}
      <mesh ref={meshRef}>
        <cylinderGeometry args={[0.15, 0.15, 0.6, 16]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.3}
          metalness={0.8}
          roughness={0.2}
        />
      </mesh>
      
      {/* Positive terminal */}
      <mesh position={[0, 0.35, 0]}>
        <cylinderGeometry args={[0.06, 0.06, 0.05, 8]} />
        <meshStandardMaterial color="#C0C0C0" metalness={0.9} />
      </mesh>
      
      {/* Temperature ring */}
      <mesh position={[0, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.18, 0.02, 8, 32]} />
        <meshBasicMaterial 
          color={cell.temperature > 40 ? '#FF0000' : '#3b82f6'}
          transparent
          opacity={0.6}
        />
      </mesh>
    </group>
  );
};

// Battery Pack Enclosure
const PackEnclosure: React.FC = () => (
  <group>
    {/* Main enclosure */}
    <mesh position={[0, 0, 0]}>
      <boxGeometry args={[7, 4.5, 1.5]} />
      <meshStandardMaterial 
        color="#1a1a2e" 
        transparent 
        opacity={0.2}
        side={THREE.DoubleSide}
      />
    </mesh>
    
    {/* Frame edges */}
    <lineSegments>
      <edgesGeometry args={[new THREE.BoxGeometry(7, 4.5, 1.5)]} />
      <lineBasicMaterial color="#3b82f6" />
    </lineSegments>
    
    {/* Label */}
    <Text
      position={[0, 2.8, 0]}
      fontSize={0.3}
      color="#ffffff"
      anchorX="center"
      anchorY="middle"
    >
      BATTERY PACK - BT-2024-001
    </Text>
  </group>
);

// Main 3D Scene
const Scene: React.FC = () => {
  const cells = useMemo(() => generateCells(), []);
  
  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} intensity={1} />
      <pointLight position={[-10, -10, -10]} intensity={0.5} />
      <spotLight position={[0, 10, 0]} angle={0.5} penumbra={1} intensity={0.8} />
      
      {/* Battery Pack */}
      <group>
        <PackEnclosure />
        {cells.map((cell) => (
          <BatteryCell key={cell.id} cell={cell} />
        ))}
      </group>
      
      {/* Grid */}
      <gridHelper args={[15, 15, '#333', '#222']} position={[0, -3, 0]} />
      
      {/* Controls */}
      <OrbitControls 
        enableDamping 
        dampingFactor={0.05}
        minDistance={3}
        maxDistance={15}
      />
      <PerspectiveCamera makeDefault position={[5, 3, 8]} />
    </>
  );
};

// Main Export
export const DigitalTwinView: React.FC = () => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Digital Twin</h1>
          <p className="text-[#a0a0b0]">Real-time 3D battery visualization</p>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#00ff88]" />
            <span className="text-[#a0a0b0]">Safe</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#ffd700]" />
            <span className="text-[#a0a0b0]">Warning</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#ff8c00]" />
            <span className="text-[#a0a0b0]">Critical</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#ff0000]" />
            <span className="text-[#a0a0b0]">Emergency</span>
          </div>
        </div>
      </div>
      
      <div className="bg-[#12121e] rounded-xl border border-[#2a2a3a] overflow-hidden" style={{ height: 'calc(100vh - 200px)' }}>
        <Canvas>
          <Scene />
        </Canvas>
      </div>
      
      {/* Cell Info Panel */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-[#12121e] rounded-lg p-4 border border-[#2a2a3a]">
          <p className="text-[#a0a0b0] text-sm">Total Cells</p>
          <p className="text-white text-xl font-bold">40</p>
        </div>
        <div className="bg-[#12121e] rounded-lg p-4 border border-[#2a2a3a]">
          <p className="text-[#a0a0b0] text-sm">Avg Temperature</p>
          <p className="text-white text-xl font-bold">32.4°C</p>
        </div>
        <div className="bg-[#12121e] rounded-lg p-4 border border-[#2a2a3a]">
          <p className="text-[#a0a0b0] text-sm">Avg Voltage</p>
          <p className="text-white text-xl font-bold">3.72V</p>
        </div>
        <div className="bg-[#12121e] rounded-lg p-4 border border-[#2a2a3a]">
          <p className="text-[#a0a0b0] text-sm">Risk Level</p>
          <p className="text-[#00ff88] text-xl font-bold">LOW</p>
        </div>
      </div>
    </div>
  );
};

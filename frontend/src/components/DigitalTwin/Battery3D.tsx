import { useRef, useState, useCallback, useMemo } from 'react';
import { Canvas, useFrame, ThreeEvent } from '@react-three/fiber';
import { OrbitControls, Text } from '@react-three/drei';
import * as THREE from 'three';

export interface Cell3DData {
  number: number;
  temperature: number;
  voltage: number;
  resistance: number;
  health: number;
  age: number;
  capacityRetention: number;
  predictedFailure: number;
  chargeBalance: number;
  current?: number;
}

interface Battery3DProps {
  cells: Cell3DData[];
  selectedCell: Cell3DData | null;
  onSelectCell: (cell: Cell3DData | null) => void;
  activeSim: string | null;
  showCasing: boolean;
  onToggleCasing: () => void;
}

function getCellColor(cell: Cell3DData): string {
  if (cell.temperature > 52) return '#ef4444';
  if (cell.temperature > 45) return '#f97316';
  if (cell.temperature > 38) return '#eab308';
  if (cell.voltage < 3.2 || cell.voltage > 4.25) return '#eab308';
  if (cell.health < 70) return '#f97316';
  return '#22c55e';
}

function getCellEmissive(cell: Cell3DData): string {
  if (cell.temperature > 52) return '#ef4444';
  if (cell.temperature > 45) return '#f97316';
  if (cell.temperature > 38) return '#eab308';
  return '#000000';
}

interface CellMeshProps {
  cell: Cell3DData;
  position: [number, number, number];
  isSelected: boolean;
  onClick: (cell: Cell3DData) => void;
  activeSim: string | null;
  cellIndex: number;
}

function CellMesh({ cell, position, isSelected, onClick, activeSim, cellIndex }: CellMeshProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  const color = getCellColor(cell);
  const emissive = getCellEmissive(cell);

  useFrame((state) => {
    if (!meshRef.current) return;
    const t = state.clock.elapsedTime;
    // Gentle floating animation for idle cells
    if (!activeSim) {
      meshRef.current.position.y = position[1] + Math.sin(t * 0.8 + cellIndex) * 0.02;
    }
    // Pulsing glow for selected cell
    if (isSelected && glowRef.current) {
      const s = 1 + Math.sin(t * 3) * 0.08;
      glowRef.current.scale.setScalar(s);
    }
    // Simulation animations
    if (activeSim === 'thermal-runaway') {
      const shake = Math.sin(t * 20 + cellIndex) * 0.005;
      meshRef.current.position.x = position[0] + shake;
    }
    if (activeSim === 'short-circuit' && cellIndex === 0) {
      const spark = Math.sin(t * 30) * 0.5 + 0.5;
      const mat = meshRef.current.material as THREE.MeshPhysicalMaterial;
      mat.emissiveIntensity = 0.2 + spark * 0.8;
    }
  });

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    onClick(cell);
  };

  const radius = 0.22;
  const height = 0.5;

  return (
    <group>
      {/* Glow halo for selected */}
      {isSelected && (
        <mesh ref={glowRef} position={[position[0], position[1], position[2]]}>
          <cylinderGeometry args={[radius * 1.6, radius * 1.6, height * 1.4, 24]} />
          <meshBasicMaterial
            color={color}
            transparent
            opacity={0.15}
            side={THREE.BackSide}
          />
        </mesh>
      )}

      {/* Main cell cylinder */}
      <mesh
        ref={meshRef}
        position={position}
        onClick={handleClick}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
        castShadow
        receiveShadow
      >
        <cylinderGeometry args={[radius, radius, height, 32]} />
        <meshPhysicalMaterial
          color={color}
          metalness={0.7}
          roughness={0.3}
          emissive={emissive}
          emissiveIntensity={emissive === '#000000' ? 0 : 0.3 + (isSelected ? 0.4 : 0)}
          clearcoat={0.1}
          clearcoatRoughness={0.4}
          transparent
          opacity={0.92}
        />
      </mesh>

      {/* Top terminal */}
      <mesh position={[position[0], position[1] + height / 2 + 0.02, position[2]]}>
        <cylinderGeometry args={[radius * 0.3, radius * 0.35, 0.03, 16]} />
        <meshStandardMaterial color="#94a3b8" metalness={0.9} roughness={0.2} />
      </mesh>

      {/* Bottom terminal */}
      <mesh position={[position[0], position[1] - height / 2 - 0.02, position[2]]}>
        <cylinderGeometry args={[radius * 0.3, radius * 0.35, 0.03, 16]} />
        <meshStandardMaterial color="#64748b" metalness={0.9} roughness={0.3} />
      </mesh>

      {/* Label */}
      <Text
        position={[position[0], position[1] - height / 2 - 0.12, position[2]]}
        fontSize={0.08}
        color={isSelected ? '#ffffff' : '#94a3b8'}
        anchorX="center"
        anchorY="middle"
      >
        {`C${cell.number}`}
      </Text>

      {/* Hover highlight ring */}
      {hovered && !isSelected && (
        <mesh position={[position[0], position[1], position[2]]}>
          <cylinderGeometry args={[radius * 1.2, radius * 1.2, height * 1.1, 24]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.08} side={THREE.BackSide} />
        </mesh>
      )}
    </group>
  );
}

function Casing() {
  return (
    <mesh position={[0, 0, 0]}>
      <boxGeometry args={[2.3, 1.0, 2.3]} />
      <meshPhysicalMaterial
        color="#1e293b"
        metalness={0.1}
        roughness={0.6}
        transparent
        opacity={0.15}
        side={THREE.DoubleSide}
        wireframe={false}
      />
    </mesh>
  );
}

function BusBars() {
  const bars: [number, number, number][] = [];
  for (let row = -1.5; row <= 1.5; row += 1.0) {
    bars.push([row, 0.32, 1.02]);
    bars.push([row, 0.32, -1.02]);
  }
  for (let col = -1.5; col <= 1.5; col += 1.0) {
    bars.push([1.02, 0.32, col]);
    bars.push([-1.02, 0.32, col]);
  }
  return (
    <>
      {bars.map((pos, i) => (
        <mesh key={i} position={pos}>
          <boxGeometry args={[0.03, 0.01, 0.03]} />
          <meshStandardMaterial color="#94a3b8" metalness={0.9} roughness={0.2} />
        </mesh>
      ))}
    </>
  );
}

function Floor() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.6, 0]} receiveShadow>
      <planeGeometry args={[6, 6]} />
      <meshStandardMaterial color="#0f172a" metalness={0.1} roughness={0.8} />
    </mesh>
  );
}

function CurrentFlowParticles({ activeSim }: { activeSim: string | null }) {
  const pointsRef = useRef<THREE.Points>(null);
  const particleCount = 100;

  const positions = useMemo(() => {
    const pos = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 2.5;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 0.8;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 2.5;
    }
    return pos;
  }, []);

  useFrame((state) => {
    if (!pointsRef.current || !activeSim) return;
    const positions = pointsRef.current.geometry.attributes.position.array as Float32Array;
    for (let i = 0; i < particleCount; i++) {
      positions[i * 3 + 1] += Math.sin(state.clock.elapsedTime + i) * 0.002;
      if (positions[i * 3 + 1] > 0.5) positions[i * 3 + 1] = -0.5;
    }
    pointsRef.current.geometry.attributes.position.needsUpdate = true;
  });

  if (!activeSim) return null;

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={particleCount}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        color={activeSim === 'thermal-runaway' ? '#ef4444' : '#3b82f6'}
        size={0.03}
        transparent
        opacity={0.6}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

function Scene({ cells, selectedCell, onSelectCell, activeSim, showCasing }: {
  cells: Cell3DData[];
  selectedCell: Cell3DData | null;
  onSelectCell: (cell: Cell3DData) => void;
  activeSim: string | null;
  showCasing: boolean;
}) {
  const controlsRef = useRef<any>(null);

  const handleCellClick = useCallback((cell: Cell3DData) => {
    onSelectCell(cell);
    // Auto-zoom toward cell
    const idx = cell.number - 1;
    const row = -(Math.floor(idx / 4) - 1.5);
    const col = (idx % 4) - 1.5;
    if (controlsRef.current) {
      controlsRef.current.target.set(col, 0, row);
    }
  }, [onSelectCell]);

  return (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight
        position={[5, 8, 5]}
        intensity={1.2}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
      <directionalLight position={[-3, 4, -3]} intensity={0.4} />
      <pointLight position={[0, 2, 0]} intensity={0.3} color="#60a5fa" />
      <hemisphereLight args={['#1e3a5f', '#0f172a', 0.6]} />

      <Floor />

      <group position={[0, -0.1, 0]}>
        {cells.map((cell, i) => {
          const row = Math.floor(i / 4);
          const col = i % 4;
          const x = col - 1.5;
          const z = -(row - 1.5);
          return (
            <CellMesh
              key={cell.number}
              cell={cell}
              position={[x, 0, z]}
              isSelected={selectedCell?.number === cell.number}
              onClick={handleCellClick}
              activeSim={activeSim}
              cellIndex={i}
            />
          );
        })}
      </group>

      {showCasing && <Casing />}
      <BusBars />
      <CurrentFlowParticles activeSim={activeSim} />

      <OrbitControls
        ref={controlsRef}
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        minDistance={0.8}
        maxDistance={5}
        autoRotate={!activeSim}
        autoRotateSpeed={0.5}
        target={[0, 0, 0]}
      />
    </>
  );
}

export default function Battery3D({ cells, selectedCell, onSelectCell, activeSim, showCasing, onToggleCasing }: Battery3DProps) {
  return (
    <div className="relative w-full h-full">
      <Canvas
        shadows
        camera={{ position: [2.5, 2.5, 2.5], fov: 40 }}
        style={{ background: 'linear-gradient(180deg, #020617 0%, #0f172a 50%, #1e293b 100%)' }}
      >
        <Scene
          cells={cells}
          selectedCell={selectedCell}
          onSelectCell={(c) => onSelectCell(c)}
          activeSim={activeSim}
          showCasing={showCasing}
        />
      </Canvas>

      {/* Controls overlay */}
      <div className="absolute bottom-3 left-3 z-10 flex gap-2">
        <button
          onClick={onToggleCasing}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
            showCasing
              ? 'bg-primary-600/20 border-primary-500/30 text-primary-400'
              : 'bg-dark-800/80 border-dark-600 text-dark-300 hover:text-white'
          }`}
        >
          {showCasing ? 'Hide Casing' : 'Show Casing'}
        </button>
      </div>

      {/* Controls hint */}
      <div className="absolute bottom-3 right-3 z-10 text-[10px] text-dark-500 bg-dark-900/60 backdrop-blur-sm px-2 py-1 rounded border border-dark-700">
        <span className="flex items-center gap-1">🖱 Drag to rotate · Scroll to zoom</span>
      </div>
    </div>
  );
}

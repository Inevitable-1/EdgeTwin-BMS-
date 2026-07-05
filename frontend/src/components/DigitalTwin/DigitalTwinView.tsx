import { useRef, useState, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';

interface CellProps {
  position: [number, number, number];
  temperature: number;
  soh: number;
  index: number;
  onClick: () => void;
  isSelected: boolean;
}

function BatteryCell({ position, temperature, soh, index, onClick, isSelected }: CellProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  const getColor = () => {
    if (temperature > 50) return '#ef4444';
    if (temperature > 42) return '#f97316';
    if (temperature > 35) return '#eab308';
    if (soh < 70) return '#f97316';
    return '#22c55e';
  };

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 0.8 + index * 0.3) * 0.015;
      const targetScale = isSelected ? 1.15 : hovered ? 1.08 : 1;
      meshRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.1);
    }
  });

  return (
    <mesh
      ref={meshRef}
      position={position}
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      <boxGeometry args={[0.7, 1.3, 0.7]} />
      <meshStandardMaterial
        color={getColor()}
        metalness={0.3}
        roughness={0.4}
        emissive={getColor()}
        emissiveIntensity={isSelected ? 0.6 : hovered ? 0.4 : 0.15}
      />
    </mesh>
  );
}

interface BatteryPackProps {
  cellTemps: number[];
  cellVolts: number[];
  cellSohs: number[];
  onSelectCell: (index: number) => void;
  selectedCell: number | null;
}

function BatteryPack({ cellTemps, cellSohs, onSelectCell, selectedCell }: BatteryPackProps) {
  const cells = [];
  for (let row = 0; row < 5; row++) {
    for (let col = 0; col < 8; col++) {
      const index = row * 8 + col;
      if (index < cellTemps.length) {
        cells.push(
          <BatteryCell
            key={index}
            position={[col * 1.1 - 3.85, row * 1.6 - 3.2, 0]}
            temperature={cellTemps[index]}
            soh={cellSohs[index]}
            index={index}
            onClick={() => onSelectCell(index)}
            isSelected={selectedCell === index}
          />
        );
      }
    }
  }

  return (
    <group>
      <mesh position={[0, 0, -0.4]}>
        <boxGeometry args={[9.8, 8.8, 0.3]} />
        <meshStandardMaterial color="#1e293b" metalness={0.8} roughness={0.2} />
      </mesh>
      {cells}
      {Array.from({ length: 5 }).map((_, row) => (
        <mesh key={`bar-${row}`} position={[0, row * 1.6 - 3.2, 0.4]}>
          <boxGeometry args={[9.2, 0.06, 0.06]} />
          <meshStandardMaterial color="#d97706" metalness={0.9} roughness={0.1} />
        </mesh>
      ))}
    </group>
  );
}

interface DigitalTwinViewProps {
  batteryId?: string;
  cellTemperatures?: number[];
  cellVoltages?: number[];
  onSelectCell?: (index: number, data: { voltage: number; temperature: number; soh: number; resistance: number }) => void;
}

export default function DigitalTwinView({ batteryId = 'BT-2024-001', cellTemperatures, cellVoltages, onSelectCell }: DigitalTwinViewProps) {
  const [selectedCell, setSelectedCell] = useState<number | null>(null);

  const temps = useMemo(() => cellTemperatures || Array.from({ length: 40 }, () => 25 + Math.random() * 15), [cellTemperatures]);
  const volts = useMemo(() => cellVoltages || Array.from({ length: 40 }, () => 3.4 + Math.random() * 0.6), [cellVoltages]);
  const sohs = useMemo(() => Array.from({ length: 40 }, () => 80 + Math.random() * 20), []);

  const handleCellClick = (index: number) => {
    setSelectedCell(index);
    onSelectCell?.(index, {
      voltage: volts[index],
      temperature: temps[index],
      soh: sohs[index],
      resistance: 0.02 + Math.random() * 0.08,
    });
  };

  const selectedData = selectedCell !== null ? {
    voltage: volts[selectedCell],
    temperature: temps[selectedCell],
    soh: sohs[selectedCell],
  } : null;

  return (
    <div className="bg-dark-900 border border-dark-700 rounded-xl overflow-hidden">
      <div className="p-4 border-b border-dark-700 flex items-center justify-between">
        <div>
          <h3 className="text-white font-semibold">3D Digital Twin — {batteryId}</h3>
          <p className="text-dark-400 text-sm">Click any cell for details</p>
        </div>
        <div className="flex gap-3 text-xs">
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-green-500 inline-block"></span> Healthy</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-yellow-500 inline-block"></span> Warm</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-orange-500 inline-block"></span> Hot</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-red-500 inline-block"></span> Critical</span>
        </div>
      </div>

      <div className="relative h-[500px]">
        <Canvas>
          <PerspectiveCamera makeDefault position={[0, 0, 14]} />
          <OrbitControls enablePan enableZoom enableRotate minDistance={6} maxDistance={25} />
          <ambientLight intensity={0.5} />
          <directionalLight position={[10, 10, 5]} intensity={1} />
          <pointLight position={[-10, -10, -5]} intensity={0.5} />
          <BatteryPack cellTemps={temps} cellVolts={volts} cellSohs={sohs} onSelectCell={handleCellClick} selectedCell={selectedCell} />
          <gridHelper args={[20, 20, '#334155', '#1e293b']} position={[0, -5, 0]} />
        </Canvas>

        {selectedCell !== null && selectedData && (
          <div className="absolute top-4 right-4 bg-dark-900/95 backdrop-blur-sm rounded-xl p-4 border border-dark-600 min-w-[180px]">
            <div className="text-white font-semibold mb-3">Cell {selectedCell + 1}</div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-dark-400">Voltage</span><span className="text-white font-mono">{selectedData.voltage.toFixed(3)}V</span></div>
              <div className="flex justify-between"><span className="text-dark-400">Temperature</span><span className={`font-mono ${selectedData.temperature > 45 ? 'text-red-400' : 'text-white'}`}>{selectedData.temperature.toFixed(1)}°C</span></div>
              <div className="flex justify-between"><span className="text-dark-400">SOH</span><span className="text-white font-mono">{selectedData.soh.toFixed(1)}%</span></div>
              <div className="flex justify-between"><span className="text-dark-400">Resistance</span><span className="text-white font-mono">{(0.02 + Math.random() * 0.08).toFixed(3)}Ω</span></div>
            </div>
            <div className="mt-3 pt-3 border-t border-dark-600">
              <p className="text-dark-400 text-xs">
                {selectedData.temperature > 45 ? 'High temperature detected. Check cooling.' :
                 selectedData.soh < 75 ? 'Cell degradation detected. Monitor closely.' :
                 'Cell operating within normal parameters.'}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

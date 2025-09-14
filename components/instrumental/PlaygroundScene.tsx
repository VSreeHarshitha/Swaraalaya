/// <reference types="@react-three/fiber" />
import React, { useRef, useState, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Box, Torus, Cylinder, Sparkles, Text, Float } from '@react-three/drei';
import * as THREE from 'three';

interface InstrumentProps {
    position: [number, number, number];
    label: string;
    onSelect: (label: string) => void;
    selected: boolean;
    children: React.ReactNode;
    color: string;
}

const Instrument: React.FC<InstrumentProps> = ({ position, label, onSelect, selected, children, color }) => {
    const ref = useRef<THREE.Group>(null!);
    const [isHovered, setIsHovered] = useState(false);

    const emissiveColor = useMemo(() => new THREE.Color(color), [color]);

    useFrame((state) => {
        if (ref.current) {
            const t = state.clock.getElapsedTime();
            ref.current.rotation.y = t * 0.2;
        }
    });
    
    const effectiveScale = selected ? 1.5 : (isHovered ? 1.2 : 1);
    const effectiveIntensity = selected ? 2.5 : (isHovered ? 1.5 : 0.5);

    return (
        <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.5}>
            <group 
                ref={ref} 
                position={position}
                scale={effectiveScale}
                onClick={() => onSelect(label)}
                // FIX: The `className` prop is invalid on a <group> element.
                // Replaced it with onPointerOver/onPointerOut handlers to manage cursor style.
                onPointerOver={(event) => {
                    event.stopPropagation();
                    setIsHovered(true);
                    document.body.style.cursor = 'pointer';
                }}
                onPointerOut={(event) => {
                    event.stopPropagation();
                    setIsHovered(false);
                    document.body.style.cursor = 'auto';
                }}
            >
                {children}
                <meshStandardMaterial 
                    color={color}
                    emissive={emissiveColor}
                    emissiveIntensity={effectiveIntensity}
                    toneMapped={false} 
                />
                 <Text
                    position={[0, -1, 0]}
                    fontSize={0.3}
                    color="white"
                    anchorX="center"
                    anchorY="top"
                >
                    {label}
                </Text>
            </group>
        </Float>
    );
};


interface PlaygroundSceneProps {
    onSelectInstrument: (instrument: string | null) => void;
    selectedInstrument: string | null;
}

const PlaygroundScene: React.FC<PlaygroundSceneProps> = ({ onSelectInstrument, selectedInstrument }) => {
    return (
        <div className="absolute inset-0 z-0 bg-black">
            <Canvas camera={{ position: [0, 0, 8], fov: 60 }}>
                <ambientLight intensity={0.1} />
                <pointLight position={[0, 5, 5]} color="#67e8f9" intensity={2} />
                <pointLight position={[-5, -5, 0]} color="#818cf8" intensity={1.5} />

                <Instrument 
                    position={[-3, 1, 0]} 
                    label="Piano" 
                    onSelect={onSelectInstrument}
                    selected={selectedInstrument === "Piano"}
                    color="#f472b6"
                >
                    <Box args={[1.5, 0.5, 0.5]} />
                </Instrument>

                <Instrument 
                    position={[3, 1, 0]} 
                    label="Guitar" 
                    onSelect={onSelectInstrument}
                    selected={selectedInstrument === "Guitar"}
                    color="#60a5fa"
                >
                    <Torus args={[0.7, 0.2, 16, 100]} />
                </Instrument>

                 <Instrument 
                    position={[0, -1.5, 0]} 
                    label="Drums" 
                    onSelect={onSelectInstrument}
                    selected={selectedInstrument === "Drums"}
                    color="#4ade80"
                >
                    <Cylinder args={[0.7, 0.7, 0.4, 32]} />
                </Instrument>

                <Sparkles count={80} scale={10} size={1} speed={0.4} color="#a78bfa" />
            </Canvas>
        </div>
    );
};

export default PlaygroundScene;
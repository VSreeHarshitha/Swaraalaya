/// <reference types="@react-three/fiber" />
import * as THREE from 'three';
import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';

interface NoteProps {
  position: [number, number, number];
  note: string;
}

const MusicalNote: React.FC<NoteProps> = ({ position, note }) => {
    const ref = useRef<THREE.Mesh>(null!);
    const speed = useMemo(() => 0.1 + Math.random() * 0.2, []);

    useFrame((state) => {
        if(ref.current) {
            ref.current.position.y += speed * 0.1;
            ref.current.rotation.y += speed * 0.05;
            ref.current.rotation.x += speed * 0.02;
            if(ref.current.position.y > 15) {
                ref.current.position.y = -15;
            }
        }
    });

    return (
        <Text
            ref={ref}
            position={position}
            fontSize={1.5}
            color="#a855f7" 
            anchorX="center"
            anchorY="middle"
        >
            {note}
            {/* FIX: The triple-slash directive for @react-three/fiber must be at the top of the file to be processed correctly. This allows TypeScript to recognize custom JSX elements like meshStandardMaterial. */}
            <meshStandardMaterial emissive="#a855f7" emissiveIntensity={2} toneMapped={false} />
        </Text>
    );
};


const MusicalBackground: React.FC = () => {
    const notes = useMemo(() => {
        const noteChars = ['♪', '♫', '♩', '♬'];
        return Array.from({ length: 50 }).map(() => ({
            position: [
                (Math.random() - 0.5) * 30,
                (Math.random() - 0.5) * 30,
                (Math.random() - 0.5) * 20 - 5
            ] as [number, number, number],
            note: noteChars[Math.floor(Math.random() * noteChars.length)]
        }));
    }, []);

    return (
        <div className="absolute top-0 left-0 w-full h-full -z-10">
            <Canvas camera={{ position: [0, 0, 10], fov: 75 }}>
                <ambientLight intensity={0.2} />
                <pointLight position={[10, 10, 10]} color="#8b5cf6" intensity={1.5} />
                <pointLight position={[-10, -10, -10]} color="#6366f1" intensity={1} />
                {notes.map((props, i) => (
                    <MusicalNote key={i} {...props} />
                ))}
            </Canvas>
        </div>
    );
};

export default MusicalBackground;
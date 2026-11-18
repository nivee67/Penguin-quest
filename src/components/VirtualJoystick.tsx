import React, { useRef, useState } from 'react';

interface VirtualJoystickProps {
  onChange: (vx: number, vy: number) => void;
}

export const VirtualJoystick: React.FC<VirtualJoystickProps> = ({ onChange }) => {
  const baseRef = useRef<HTMLDivElement>(null);
  const [knob, setKnob] = useState({ x: 0, y: 0 });
  const [active, setActive] = useState(false);
  const pointerIdRef = useRef<number | null>(null);

  const maxRadius = 42;

  const updateFromClient = (clientX: number, clientY: number) => {
    const el = baseRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;

    let dx = clientX - cx;
    let dy = clientY - cy;
    const dist = Math.hypot(dx, dy);

    if (dist > maxRadius) {
      dx = (dx / dist) * maxRadius;
      dy = (dy / dist) * maxRadius;
    }

    setKnob({ x: dx, y: dy });
    onChange(dx / maxRadius, dy / maxRadius);
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    pointerIdRef.current = e.pointerId;
    e.currentTarget.setPointerCapture(e.pointerId);
    setActive(true);
    updateFromClient(e.clientX, e.clientY);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (pointerIdRef.current !== e.pointerId) return;
    e.preventDefault();
    updateFromClient(e.clientX, e.clientY);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (pointerIdRef.current !== e.pointerId) return;
    e.preventDefault();
    pointerIdRef.current = null;
    setActive(false);
    setKnob({ x: 0, y: 0 });
    onChange(0, 0);
  };

  return (
    <div
      ref={baseRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      aria-label="Movement Joystick"
      role="application"
      className={`relative w-32 h-32 rounded-full touch-none select-none flex items-center justify-center transition-opacity ${
        active
          ? 'bg-slate-900/55 border-2 border-amber-300/75 opacity-100'
          : 'bg-slate-900/40 border-2 border-white/30 opacity-85'
      } backdrop-blur-sm shadow-lg`}
    >
      {/* Directional crosshairs */}
      <div className="pointer-events-none absolute inset-3 rounded-full border border-white/10" />
      <div
        className="pointer-events-none w-14 h-14 rounded-full bg-gradient-to-b from-amber-300 to-orange-500 border-2 border-white/80 shadow-md"
        style={{
          transform: `translate3d(${knob.x}px, ${knob.y}px, 0)`,
          transition: active ? 'none' : 'transform 140ms cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      />
    </div>
  );
};

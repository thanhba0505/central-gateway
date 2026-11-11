'use client';

import React, { useEffect, useRef } from 'react';

interface Star {
  x: number;
  y: number;
  radius: number;
  baseAlpha: number;
  twinkleSpeed: number;
  phase: number;
}

interface ShootingStar {
  x: number;
  y: number;
  length: number;
  speed: number;
  angle: number;
  alpha: number;
  active: boolean;
}

export function StarfieldCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Generate static/twinkling stars
    const starCount = Math.floor((width * height) / 7000);
    const stars: Star[] = [];

    for (let i = 0; i < starCount; i++) {
      stars.push({
        x: Math.random() * width,
        y: Math.random() * height * 0.85, // Most stars in upper 85% above the trees
        radius: Math.random() * 1.4 + 0.4,
        baseAlpha: Math.random() * 0.6 + 0.3,
        twinkleSpeed: Math.random() * 0.02 + 0.008,
        phase: Math.random() * Math.PI * 2,
      });
    }

    // Shooting star state
    let shootingStar: ShootingStar | null = null;
    let nextShootingStarTick = 180 + Math.random() * 300;

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);

    let tick = 0;

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Render stars
      for (let i = 0; i < stars.length; i++) {
        const star = stars[i];
        if (!star) continue;

        const twinkle = prefersReducedMotion
          ? star.baseAlpha
          : star.baseAlpha + Math.sin(tick * star.twinkleSpeed + star.phase) * 0.35;
        const currentAlpha = Math.max(0.15, Math.min(1, twinkle));

        ctx.fillStyle = `rgba(255, 255, 255, ${currentAlpha})`;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
        ctx.fill();

        // Extra subtle bloom for larger stars
        if (star.radius > 1.2 && currentAlpha > 0.6) {
          ctx.fillStyle = `rgba(224, 185, 255, ${currentAlpha * 0.3})`;
          ctx.beginPath();
          ctx.arc(star.x, star.y, star.radius * 2.2, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Shooting stars (disabled if reduced motion)
      if (!prefersReducedMotion) {
        tick++;
        if (!shootingStar && tick >= nextShootingStarTick) {
          shootingStar = {
            x: Math.random() * (width * 0.7),
            y: Math.random() * (height * 0.4),
            length: 80 + Math.random() * 60,
            speed: 9 + Math.random() * 5,
            angle: Math.PI / 4 + (Math.random() - 0.5) * 0.2, // ~45 degrees diagonal
            alpha: 1,
            active: true,
          };
          nextShootingStarTick = tick + 350 + Math.random() * 450;
        }

        if (shootingStar && shootingStar.active) {
          const dx = Math.cos(shootingStar.angle) * shootingStar.speed;
          const dy = Math.sin(shootingStar.angle) * shootingStar.speed;

          shootingStar.x += dx;
          shootingStar.y += dy;
          shootingStar.alpha -= 0.015;

          const tailX = shootingStar.x - Math.cos(shootingStar.angle) * shootingStar.length;
          const tailY = shootingStar.y - Math.sin(shootingStar.angle) * shootingStar.length;

          const gradient = ctx.createLinearGradient(shootingStar.x, shootingStar.y, tailX, tailY);
          gradient.addColorStop(0, `rgba(255, 255, 255, ${shootingStar.alpha})`);
          gradient.addColorStop(0.5, `rgba(216, 180, 254, ${shootingStar.alpha * 0.6})`);
          gradient.addColorStop(1, 'rgba(216, 180, 254, 0)');

          ctx.strokeStyle = gradient;
          ctx.lineWidth = 1.8;
          ctx.beginPath();
          ctx.moveTo(shootingStar.x, shootingStar.y);
          ctx.lineTo(tailX, tailY);
          ctx.stroke();

          if (shootingStar.alpha <= 0 || shootingStar.x > width || shootingStar.y > height) {
            shootingStar = null;
          }
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 z-0 h-full w-full"
      aria-hidden="true"
    />
  );
}

'use client';

import React from 'react';

export function PineForestBackdrop() {
  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-0 z-0 h-[45vh] min-h-[300px] w-full select-none overflow-hidden"
      aria-hidden="true"
    >
      {/* Layer 1: Distant Mountains Silhouette */}
      <svg
        className="absolute bottom-0 left-0 w-full opacity-60"
        viewBox="0 0 1440 320"
        fill="none"
        preserveAspectRatio="none"
        style={{ height: '70%' }}
      >
        <path
          d="M0,220 L120,180 L280,240 L450,140 L600,210 L780,120 L940,190 L1120,110 L1280,180 L1440,130 L1440,320 L0,320 Z"
          fill="url(#mountain-gradient)"
        />
        <defs>
          <linearGradient id="mountain-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#431677" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#250d42" stopOpacity="0.95" />
          </linearGradient>
        </defs>
      </svg>

      {/* Layer 2: Mid-ground Pine Tree Silhouettes */}
      <svg
        className="absolute bottom-0 left-0 w-full opacity-80"
        viewBox="0 0 1440 260"
        fill="none"
        preserveAspectRatio="none"
        style={{ height: '55%' }}
      >
        {/* Repeating organic pine silhouettes */}
        <path
          d="M0,260 L0,140 L25,180 L40,130 L60,175 L85,110 L110,180 L140,125 L170,190 L200,100 L230,170 L260,130 L290,195 L330,90 L370,180 L410,120 L450,200 L490,95 L530,175 L570,115 L620,190 L670,85 L720,170 L770,110 L820,185 L870,95 L920,175 L970,120 L1020,190 L1070,90 L1120,175 L1170,115 L1220,185 L1270,100 L1320,170 L1370,120 L1410,180 L1440,130 L1440,260 Z"
          fill="#1c0733"
        />
      </svg>

      {/* Layer 3: Foreground High-Detail Pine Forest Silhouette */}
      <svg
        className="absolute bottom-0 left-0 w-full"
        viewBox="0 0 1440 200"
        fill="none"
        preserveAspectRatio="none"
        style={{ height: '42%' }}
      >
        <path
          d="M0,200 L0,80 
             L15,110 L25,90 L35,115 L45,60 L55,115 L65,85 L80,120 
             L95,50 L110,110 L125,75 L140,120 L160,40 L180,110 L195,70 L215,125 
             L235,55 L255,115 L270,80 L290,130 L315,35 L340,115 L360,70 L385,125 
             L410,60 L430,120 L455,75 L480,130 L505,45 L530,120 L550,75 L575,135 
             L600,50 L625,115 L650,80 L675,125 L705,30 L735,115 L760,70 L785,130 
             L815,55 L845,120 L870,75 L895,135 L925,40 L955,120 L980,65 L1005,125 
             L1035,50 L1065,115 L1090,75 L1115,130 L1145,35 L1175,115 L1200,65 L1225,125 
             L1255,55 L1285,115 L1310,80 L1335,130 L1365,45 L1395,110 L1420,70 L1440,120 
             L1440,200 Z"
          fill="#10031f"
        />
      </svg>

      {/* Layer 4: Ambient bottom fade */}
      <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[#0e021c] to-transparent" />
    </div>
  );
}

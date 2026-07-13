'use client';

export default function PressingBackground() {
  return (
    <div className="pressing-ambient">
      {/* Halos de couleur */}
      <div
        className="halo w-72 h-72 opacity-30 animate-pulse-glow"
        style={{ background: '#C81E6E', top: '-6rem', left: '-6rem' }}
      />
      <div
        className="halo w-80 h-80 opacity-25 animate-pulse-glow"
        style={{ background: '#87CEEB', bottom: '-7rem', right: '-4rem', animationDelay: '1.2s' }}
      />
      <div
        className="halo w-56 h-56 opacity-15 animate-pulse-glow"
        style={{ background: '#F9A8D4', top: '40%', right: '10%', animationDelay: '2.4s' }}
      />

      {/* Machine à laver stylisée, en fond, qui tourne doucement */}
      <div className="absolute bottom-8 right-8 opacity-[0.14] hidden md:block">
        <div className="washing-machine animate-spin-slow">
          <div className="drum" />
          <div className="clothes animate-spin-slower" />
        </div>
      </div>

      {/* Tissus flottants (formes organiques) */}
      <div
        className="fabric-shape w-40 h-40 animate-float-slow"
        style={{ background: '#87CEEB', top: '15%', left: '8%' }}
      />
      <div
        className="fabric-shape w-28 h-28 animate-float-slower"
        style={{ background: '#C81E6E', bottom: '20%', left: '20%', animationDelay: '1s' }}
      />
      <div
        className="fabric-shape w-24 h-24 animate-float-slow"
        style={{ background: '#F9A8D4', top: '10%', right: '25%', animationDelay: '2s' }}
      />

      {/* Bulles montantes */}
      {[...Array(10)].map((_, i) => {
        const size = 6 + ((i * 7) % 18);
        const left = (i * 9.7) % 100;
        const duration = 5 + (i % 5);
        const delay = i * 0.6;
        return (
          <div
            key={i}
            className="bubble"
            style={{
              width: size,
              height: size,
              left: `${left}%`,
              animationDuration: `${duration}s`,
              animationDelay: `${delay}s`,
            }}
          />
        );
      })}

      {/* Vapeur */}
      {[...Array(3)].map((_, i) => (
        <div
          key={`steam-${i}`}
          className="steam"
          style={{
            left: `${30 + i * 22}%`,
            animationDuration: `${4 + i}s`,
            animationDelay: `${i * 1.3}s`,
          }}
        />
      ))}
    </div>
  );
}

export default function Logo({ className = 'w-8 h-8' }: { className?: string }) {
  return (
    <div className={`relative group flex items-center justify-center flex-shrink-0 ${className}`}>
      {/* Glow on hover */}
      <div className="absolute inset-0 bg-primary-500/40 rounded-xl blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      {/* Main Container */}
      <div className="relative w-full h-full bg-gradient-to-br from-primary-600 to-accent-600 rounded-xl p-[15%] shadow-lg overflow-hidden flex items-center justify-center border border-white/20 group-hover:border-primary-300/60 transition-all duration-500 ease-[cubic-bezier(0.175,0.885,0.32,1.275)] group-hover:[transform:perspective(500px)_rotateX(15deg)_rotateY(-15deg)_translateZ(10px)_scale(1.05)] group-hover:shadow-[15px_20px_35px_-5px_rgba(99,102,241,0.4)]">
        
        {/* Animated grid background */}
        <div className="absolute inset-0 opacity-20 bg-[linear-gradient(to_right,#ffffff1a_1px,transparent_1px),linear-gradient(to_bottom,#ffffff1a_1px,transparent_1px)] bg-[size:25%_25%]" />
        
        {/* Network Nodes SVG */}
        <svg viewBox="0 0 24 24" className="w-full h-full text-white relative z-10 drop-shadow-md overflow-visible">
          <style>
            {`
              @keyframes drawLine {
                0% { stroke-dashoffset: 50; }
                100% { stroke-dashoffset: 0; }
              }
              .draw-line {
                stroke-dasharray: 50;
                animation: drawLine 2s ease-out forwards;
              }
              @keyframes pulseNode {
                0%, 100% { transform: scale(1); opacity: 1; }
                50% { transform: scale(1.3); opacity: 0.8; }
              }
              .pulse-node {
                transform-origin: center;
                animation: pulseNode 2s ease-in-out infinite;
              }
            `}
          </style>
          
          {/* Paths */}
          <path d="M3 12 L9 5 L15 14 L21 7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="draw-line" />
          <path d="M3 12 L12 19 L21 7" fill="none" stroke="currentColor" strokeWidth="1.5" strokeOpacity="0.4" strokeLinecap="round" strokeLinejoin="round" />
          
          {/* Nodes */}
          <circle cx="3" cy="12" r="2.5" fill="currentColor" />
          <circle cx="9" cy="5" r="2" fill="currentColor" />
          <circle cx="15" cy="14" r="3" fill="#10b981" className="pulse-node" style={{ transformOrigin: '15px 14px' }} />
          <circle cx="12" cy="19" r="2" fill="currentColor" />
          <circle cx="21" cy="7" r="2.5" fill="currentColor" />
          
          {/* Interactive hover rings */}
          <circle cx="15" cy="14" r="5" fill="none" stroke="#10b981" strokeWidth="1" className="opacity-0 group-hover:animate-ping" style={{ transformOrigin: '15px 14px', animationDuration: '1.5s' }} />
          <circle cx="3" cy="12" r="4" fill="none" stroke="currentColor" strokeWidth="1" className="opacity-0 group-hover:animate-ping" style={{ transformOrigin: '3px 12px', animationDuration: '1.5s', animationDelay: '0.2s' }} />
          <circle cx="21" cy="7" r="4" fill="none" stroke="currentColor" strokeWidth="1" className="opacity-0 group-hover:animate-ping" style={{ transformOrigin: '21px 7px', animationDuration: '1.5s', animationDelay: '0.4s' }} />
        </svg>
      </div>
    </div>
  );
}

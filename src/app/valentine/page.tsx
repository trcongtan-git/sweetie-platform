'use client';

import React from 'react';
import IntroSection from '@/components/valentine/IntroSection';
import LetterSection from '@/components/valentine/LetterSection';
import ThreeDHeartSection from '@/components/valentine/ThreeDHeartSection';

export default function ValentinePage() {
  const [isScrollLocked, setIsScrollLocked] = React.useState(true);

  return (
    <main 
      id="valentine-container" 
      className={`w-full h-screen bg-black ${isScrollLocked ? 'overflow-hidden' : 'overflow-y-scroll no-scrollbar'}`}
    >
      <IntroSection onComplete={() => setIsScrollLocked(false)} />
      <LetterSection />
      <ThreeDHeartSection />
    </main>
  );
}

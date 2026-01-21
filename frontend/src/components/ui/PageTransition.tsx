// 🎬 Page Transitions Ultra-Fluides
// Composant wrapper pour ajouter des animations de transition entre les pages

import { ReactNode, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

interface PageTransitionProps {
  children: ReactNode;
  className?: string;
}

// Transition par défaut : Fade + Slide Up
export function PageTransition({ children, className = '' }: PageTransitionProps) {
  const location = useLocation();
  const [displayLocation, setDisplayLocation] = useState(location);
  const [transitionStage, setTransitionStage] = useState('fadeIn');

  useEffect(() => {
    if (location !== displayLocation) {
      setTransitionStage('fadeOut');
    }
  }, [location, displayLocation]);

  return (
    <div
      className={`transition-wrapper ${transitionStage} ${className}`}
      onAnimationEnd={() => {
        if (transitionStage === 'fadeOut') {
          setTransitionStage('fadeIn');
          setDisplayLocation(location);
        }
      }}
    >
      {children}
    </div>
  );
}

// Transition Slide (pour navigation latérale)
export function SlideTransition({ children, className = '' }: PageTransitionProps) {
  return (
    <div className={`animate-slide-left ${className}`}>
      {children}
    </div>
  );
}

// Transition Zoom (effet d'apparition)
export function ZoomTransition({ children, className = '' }: PageTransitionProps) {
  return (
    <div className={`animate-zoom-in ${className}`}>
      {children}
    </div>
  );
}

// Transition Blur (effet de flou)
export function BlurTransition({ children, className = '' }: PageTransitionProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(false);
    const timer = setTimeout(() => setIsVisible(true), 50);
    return () => clearTimeout(timer);
  }, [children]);

  return (
    <div
      className={`transition-all duration-300 ${
        isVisible ? 'opacity-100 blur-0 scale-100' : 'opacity-0 blur-sm scale-95'
      } ${className}`}
    >
      {children}
    </div>
  );
}

// Transition avec Progress Bar (pour chargements)
export function ProgressTransition({ children, className = '' }: PageTransitionProps) {
  const [progress, setProgress] = useState(0);
  const location = useLocation();

  useEffect(() => {
    setProgress(0);
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 10;
      });
    }, 50);

    return () => clearInterval(interval);
  }, [location]);

  return (
    <>
      {progress < 100 && (
        <div className="fixed top-0 left-0 right-0 z-[9999] h-1 bg-gray-200">
          <div
            className="h-full bg-gradient-to-r from-primary-600 via-purple-600 to-pink-600 transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
      <div className={`animate-fade-in ${className}`}>{children}</div>
    </>
  );
}

// Stagger Animation pour listes/grilles
interface StaggerProps {
  children: ReactNode[];
  delay?: number;
  className?: string;
}

export function StaggerAnimation({ children, delay = 50, className = '' }: StaggerProps) {
  return (
    <>
      {children.map((child, index) => (
        <div
          key={index}
          className={`animate-slide-up ${className}`}
          style={{ animationDelay: `${index * delay}ms` }}
        >
          {child}
        </div>
      ))}
    </>
  );
}

// Route Transition wrapper (à utiliser dans App.tsx)
export function RouteTransition({ children }: { children: ReactNode }) {
  const location = useLocation();
  const [displayLocation, setDisplayLocation] = useState(location);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    if (location.pathname !== displayLocation.pathname) {
      setIsTransitioning(true);
      
      const timer = setTimeout(() => {
        setDisplayLocation(location);
        setIsTransitioning(false);
      }, 200);

      return () => clearTimeout(timer);
    }
  }, [location, displayLocation]);

  return (
    <div
      className={`transition-all duration-200 ${
        isTransitioning
          ? 'opacity-0 translate-y-4'
          : 'opacity-100 translate-y-0'
      }`}
    >
      {children}
    </div>
  );
}

// Export tout
export default {
  PageTransition,
  SlideTransition,
  ZoomTransition,
  BlurTransition,
  ProgressTransition,
  StaggerAnimation,
  RouteTransition,
};


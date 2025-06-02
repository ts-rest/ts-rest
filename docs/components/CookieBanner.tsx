'use client';

import { useEffect, useState } from 'react';
import { usePostHog } from 'posthog-js/react';
import { X, Cookie, Check } from 'lucide-react';
import Link from 'next/link';

export function cookieConsentGiven() {
  if (typeof window === 'undefined') return 'undecided';
  if (!localStorage.getItem('cookie_consent')) {
    return 'undecided';
  }
  return localStorage.getItem('cookie_consent') || 'undecided';
}

export function CookieBanner() {
  const [consentGiven, setConsentGiven] = useState('');
  const [isVisible, setIsVisible] = useState(false);
  const posthog = usePostHog();

  useEffect(() => {
    // We want this to only run once the client loads
    // or else it causes a hydration error
    const consent = cookieConsentGiven();
    setConsentGiven(consent);
    setIsVisible(consent === 'undecided');
  }, []);

  useEffect(() => {
    if (consentGiven !== '' && consentGiven !== 'undecided') {
      posthog?.set_config({
        persistence: consentGiven === 'yes' ? 'localStorage+cookie' : 'memory',
      });
    }
  }, [consentGiven, posthog]);

  const handleAcceptCookies = () => {
    localStorage.setItem('cookie_consent', 'yes');
    setConsentGiven('yes');
    setIsVisible(false);
  };

  const handleDeclineCookies = () => {
    localStorage.setItem('cookie_consent', 'no');
    setConsentGiven('no');
    setIsVisible(false);
  };

  const handleDismiss = () => {
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:bottom-4 md:right-4 md:left-auto z-50 md:max-w-sm">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg shadow-lg p-4 md:p-4">
        <div className="flex items-start gap-3">
          <Cookie className="h-5 w-5 text-purple-600 dark:text-purple-400 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm text-zinc-700 dark:text-zinc-300 mb-4 md:mb-5">
              We use tracking cookies (
              <Link href="https://posthog.com/">Posthog</Link>) to track docs
              usage and help us improve.
            </p>
            <div className="flex flex-col sm:flex-row gap-2">
              <button
                type="button"
                onClick={handleAcceptCookies}
                className="flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white text-sm sm:text-xs px-4 py-3 sm:px-3 sm:py-2 rounded-md transition-colors touch-manipulation"
              >
                <Check className="h-4 w-4 sm:h-3 sm:w-3" />
                Accept cookies
              </button>
              <button
                type="button"
                onClick={handleDeclineCookies}
                className="flex items-center justify-center gap-2 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-700 dark:hover:bg-zinc-600 text-zinc-700 dark:text-zinc-300 text-sm sm:text-xs px-4 py-3 sm:px-3 sm:py-2 rounded-md transition-colors touch-manipulation"
              >
                <X className="h-4 w-4 sm:h-3 sm:w-3" />
                Decline cookies
              </button>
            </div>
          </div>
          <button
            type="button"
            onClick={handleDismiss}
            className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 flex-shrink-0 p-1 touch-manipulation"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

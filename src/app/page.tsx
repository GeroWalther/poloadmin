'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const checkUser = async () => {
      try {
        if (!supabase) {
          router.replace('/login');
          return;
        }

        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session?.user) {
          router.replace('/dashboard');
        } else {
          router.replace('/login');
        }
      } catch (error) {
        console.error('Session check error:', error);
        router.replace('/login');
      }
    };

    checkUser();
  }, [router]);

  return (
    <div className='min-h-screen flex items-center justify-center'>
      Redirecting...
    </div>
  );
}

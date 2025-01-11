'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const checkUser = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session?.user) {
        router.replace('/dashboard');
      } else {
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

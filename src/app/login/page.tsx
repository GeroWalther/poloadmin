'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkUser = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        // Detailed session logging
        console.log('🔍 Login Page Session Check:', {
          hasSession: !!session,
          hasUser: !!session?.user,
          userId: session?.user?.id,
          email: session?.user?.email,
          accessToken: !!session?.access_token,
        });

        if (session?.user) {
          console.log('🔄 Session found, redirecting to dashboard');
          router.replace('/dashboard');
        }
      } catch (error) {
        console.error('❌ Session check error:', error);
      } finally {
        setLoading(false);
      }
    };

    checkUser();
  }, [router]);

  if (loading) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        Loading...
      </div>
    );
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      console.log('Login attempt response:', { data, error });

      if (error) throw error;

      // Check session immediately after login
      const {
        data: { session },
      } = await supabase.auth.getSession();
      console.log('Session after login attempt:', {
        hasSession: !!session,
        user: session?.user,
      });

      if (session) {
        router.replace('/dashboard');
      } else {
        throw new Error('Failed to establish session');
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className='min-h-screen flex items-center justify-center p-8'>
      <div className='max-w-md w-full'>
        <h2 className='text-2xl font-bold text-center'>Admin Login</h2>
        {error && (
          <div className='bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded'>
            {error}
          </div>
        )}
        <form onSubmit={handleLogin} className='space-y-6'>
          <div>
            <label htmlFor='email' className='block text-sm font-medium'>
              Email
            </label>
            <input
              id='email'
              type='email'
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className='mt-1 block w-full rounded border border-gray-300 px-3 py-2'
            />
          </div>
          <div>
            <label htmlFor='password' className='block text-sm font-medium'>
              Password
            </label>
            <input
              id='password'
              type='password'
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className='mt-1 block w-full rounded border border-black px-3 text-black py-2'
            />
          </div>
          <button
            type='submit'
            disabled={loading}
            className='w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-black bg-foreground hover:bg-[#cfcfcf] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black'>
            {loading ? 'Loading...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}

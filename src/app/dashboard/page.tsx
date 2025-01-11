'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

interface Magazine {
  id: string;
  title: string;
  description: string;
  pdf: string;
  created_at: string;
}

export default function Dashboard() {
  const [magazines, setMagazines] = useState<Magazine[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const checkSession = async () => {
      const {
        data: { session },
      } = (await supabase?.auth.getSession()) ?? { data: { session: null } };

      if (!session) {
        router.replace('/login');
      }
    };

    checkSession();
    fetchMagazines();
  }, [router]);

  const fetchMagazines = async () => {
    if (!supabase) return;

    const { data, error } = await supabase
      .from('magazines')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      setError(error.message);
    } else {
      setMagazines(data || []);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !supabase) return;

    setLoading(true);
    setError(null);

    try {
      const timestamp = new Date().getTime();
      const fileExt = file.name.split('.').pop();
      const fileName = `${timestamp}-${Math.random()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('magazines')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage
        .from('magazines')
        .getPublicUrl(fileName);

      const { error: dbError } = await supabase.from('magazines').insert({
        title,
        description,
        pdf: publicUrlData.publicUrl,
      });

      if (dbError) throw dbError;

      setTitle('');
      setDescription('');
      setFile(null);
      fetchMagazines();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      console.error('Upload error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    if (!supabase) return;

    try {
      await supabase.auth.signOut();
      router.refresh();
      router.replace('/login');
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!supabase) return;

    try {
      const { error } = await supabase.from('magazines').delete().eq('id', id);
      if (error) throw error;
      fetchMagazines();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      console.error('Delete error:', err);
      setError(err.message);
    }
  };

  return (
    <div className='max-w-4xl mx-auto p-8'>
      <div className='flex justify-between items-center mb-8'>
        <h1 className='text-2xl font-bold'>Magazine Dashboard</h1>
        <button
          onClick={handleSignOut}
          className='px-4 py-2 text-sm bg-red-600 text-white rounded hover:bg-red-700'>
          Sign Out
        </button>
      </div>

      <form onSubmit={handleUpload} className='mb-8 space-y-4 text-black'>
        <div>
          <label
            htmlFor='title'
            className='block text-sm font-medium text-white'>
            Magazine Title
          </label>
          <input
            id='title'
            type='text'
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className='mt-1 block w-full rounded border border-gray-300 px-3 py-2'
          />
        </div>
        <div>
          <label
            htmlFor='description'
            className='block text-sm font-medium text-white'>
            Description
          </label>
          <textarea
            id='description'
            required
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className='mt-1 block w-full rounded border border-gray-300 px-3 py-2'
          />
        </div>
        <div>
          <label htmlFor='pdf' className='block text-sm font-medium text-white'>
            PDF File
          </label>
          <input
            id='pdf'
            type='file'
            accept='.pdf'
            required
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className='mt-1 block w-full text-white'
          />
        </div>
        {error && (
          <div className='bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded'>
            {error}
          </div>
        )}
        <button
          type='submit'
          disabled={loading}
          className='w-full flex justify-center py-2 px-4 border border-transparent bg-slate-700 rounded-md shadow-sm text-sm font-medium text-white bg-foreground hover:bg-[#383838] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black'>
          {loading ? 'Uploading...' : 'Upload Magazine'}
        </button>
      </form>

      <div className='space-y-4'>
        <h2 className='text-xl font-semibold'>Uploaded Magazines</h2>
        {magazines.map((magazine) => (
          <div
            key={magazine.id}
            className='border rounded p-4 flex justify-between items-center'>
            <div>
              <h3 className='font-medium'>{magazine.title}</h3>
              <p className='text-sm text-gray-500'>
                {new Date(magazine.created_at).toLocaleDateString()}
              </p>
            </div>
            <div>
              <p>{magazine.description}</p>
            </div>
            <div className='flex items-center space-x-2'>
              <a
                href={magazine.pdf}
                target='_blank'
                rel='noopener noreferrer'
                className='px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700'>
                View PDF
              </a>
              <button
                onClick={() => handleDelete(magazine.id)}
                className='px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700'>
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

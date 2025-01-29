import type React from 'react';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';

interface MagazineFormProps {
  fetchMagazines: () => void;
}

const MagazineForm: React.FC<MagazineFormProps> = ({ fetchMagazines }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  return (
    <form onSubmit={handleUpload} className='mb-8 space-y-4'>
      <div>
        <label
          htmlFor='title'
          className='block text-sm font-medium text-gray-700'>
          Magazine Title
        </label>
        <input
          id='title'
          type='text'
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className='mt-1 block w-full rounded border border-gray-300 px-3 py-2 text-gray-900'
        />
      </div>
      <div>
        <label
          htmlFor='description'
          className='block text-sm font-medium text-gray-700'>
          Description
        </label>
        <textarea
          id='description'
          required
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className='mt-1 block w-full rounded border border-gray-300 px-3 py-2 text-gray-900'
        />
      </div>
      <div>
        <label
          htmlFor='pdf'
          className='block text-sm font-medium text-gray-700'>
          PDF File
        </label>
        <input
          id='pdf'
          type='file'
          accept='.pdf'
          required
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          className='mt-1 block w-full text-gray-700'
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
        className='w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'>
        {loading ? 'Uploading...' : 'Upload Magazine'}
      </button>
    </form>
  );
};

export default MagazineForm;

import type React from 'react';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

interface ArticleFormProps {
  fetchArticles: () => void;
}

const ArticleForm: React.FC<ArticleFormProps> = ({ fetchArticles }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [titleImage, setTitleImage] = useState<File | null>(null);
  const [images, setImages] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Add state for image previews
  const [titleImagePreview, setTitleImagePreview] = useState<string | null>(
    null
  );
  const [imagesPreviews, setImagesPreviews] = useState<string[]>([]);

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setTitleImage(null);
    setImages([]);
    setTitleImagePreview(null);
    setImagesPreviews([]);

    // Reset file input values using their IDs
    const titleImageInput = document.getElementById(
      'titleImage'
    ) as HTMLInputElement;
    const imagesInput = document.getElementById('images') as HTMLInputElement;
    if (titleImageInput) titleImageInput.value = '';
    if (imagesInput) imagesInput.value = '';
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!titleImage || !supabase) return;

    setLoading(true);
    setError(null);

    try {
      // Upload title image
      const titleImageName = await uploadFile(titleImage, 'title-images');
      console.log('Uploading additional images:', images.length); // Debug log

      // Upload additional images
      const imageUrls = await Promise.all(
        images.map(async (img) => {
          const url = await uploadFile(img, 'article-images');
          console.log('Uploaded image URL:', url); // Debug log
          return url;
        })
      );

      console.log('All image URLs:', imageUrls); // Debug log

      // Insert article data into the database
      const { error: dbError } = await supabase.from('articles').insert({
        title,
        description,
        title_image: titleImageName,
        images: imageUrls,
      });

      if (dbError) throw dbError;

      resetForm();
      fetchArticles();
    } catch (err: Error | unknown) {
      console.error('Upload error:', err);
      setError(
        err instanceof Error ? err.message : 'An unknown error occurred'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleTitleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setTitleImage(file);
      // Create preview URL
      const previewUrl = URL.createObjectURL(file);
      setTitleImagePreview(previewUrl);
    }
  };

  const handleImagesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    console.log('Selected files:', files.length); // Debug log
    setImages(files);
    // Create preview URLs
    const previews = files.map((file) => URL.createObjectURL(file));
    console.log('Preview URLs:', previews.length); // Debug log
    setImagesPreviews(previews);
  };

  // Cleanup preview URLs when component unmounts
  useEffect(() => {
    return () => {
      if (titleImagePreview) URL.revokeObjectURL(titleImagePreview);
      imagesPreviews.forEach((preview) => URL.revokeObjectURL(preview));
    };
  }, [titleImagePreview, imagesPreviews]);

  const uploadFile = async (file: File, bucket: string): Promise<string> => {
    if (!supabase) throw new Error('Supabase client not initialized');

    const timestamp = new Date().getTime();
    const fileName = `${timestamp}-${Math.random()}.${file.name
      .split('.')
      .pop()}`;

    const uploadResult = await supabase.storage
      .from(bucket)
      .upload(fileName, file);

    if (uploadResult.error) throw uploadResult.error;

    const publicUrlResult = supabase.storage
      .from(bucket)
      .getPublicUrl(fileName);

    if (!publicUrlResult.data?.publicUrl) {
      throw new Error('Failed to get public URL');
    }

    return publicUrlResult.data.publicUrl;
  };

  return (
    <form onSubmit={handleUpload} className='mb-8 space-y-4'>
      <div>
        <label
          htmlFor='title'
          className='block text-sm font-medium text-gray-700'>
          Article Title
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
          Article Text
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
          htmlFor='titleImage'
          className='block text-sm font-medium text-gray-700'>
          Title Image (PNG)
        </label>
        <input
          id='titleImage'
          type='file'
          accept='.png'
          required
          onChange={handleTitleImageChange}
          className='mt-1 block w-full text-gray-700'
        />
        {titleImagePreview && (
          <div className='mt-2'>
            <img
              src={titleImagePreview}
              alt='Title preview'
              className='h-32 w-auto object-contain'
            />
          </div>
        )}
      </div>
      <div>
        <label
          htmlFor='images'
          className='block text-sm font-medium text-gray-700'>
          Additional Images
        </label>
        <input
          id='images'
          type='file'
          accept='image/*'
          multiple
          onChange={handleImagesChange}
          className='mt-1 block w-full text-gray-700'
        />
        {imagesPreviews.length > 0 && (
          <div className='mt-2 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2'>
            {imagesPreviews.map((preview, index) => (
              <img
                key={index}
                src={preview}
                alt={`Preview ${index + 1}`}
                className='h-32 w-full object-cover rounded'
              />
            ))}
          </div>
        )}
      </div>
      {error && (
        <div className='bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded'>
          {error}
        </div>
      )}
      <button
        type='submit'
        disabled={loading}
        className='w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400'>
        {loading ? 'Uploading...' : 'Upload Article'}
      </button>
    </form>
  );
};

export default ArticleForm;

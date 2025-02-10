import type React from 'react';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import RichTextEditor from '@/components/RichTextEditor';

interface Article {
  id: string;
  title: string;
  description: string;
  title_image?: string;
  sections?: {
    subheading?: string;
    text?: string;
    images?: string[];
  }[];
  created_at: string;
}

interface ArticleFormProps {
  fetchArticles: () => void;
  articleToEdit?: Article | null;
  onCancelEdit?: () => void;
}

interface Section {
  subheading: string;
  text: string;
  images: File[];
  imagePreviews: string[];
}

const ArticleForm: React.FC<ArticleFormProps> = ({
  fetchArticles,
  articleToEdit = null,
  onCancelEdit,
}) => {
  const [title, setTitle] = useState(articleToEdit?.title || '');
  const [description, setDescription] = useState(
    articleToEdit?.description || ''
  );
  const [titleImage, setTitleImage] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [titleImagePreview, setTitleImagePreview] = useState<string | null>(
    articleToEdit?.title_image || null
  );

  // Initialize sections with existing data if editing
  const [sections, setSections] = useState<Section[]>(
    articleToEdit?.sections
      ? articleToEdit.sections.map((section) => ({
          subheading: section.subheading || '',
          text: section.text || '',
          images: [],
          imagePreviews: section.images || [],
        }))
      : Array(5)
          .fill({})
          .map(() => ({
            subheading: '',
            text: '',
            images: [],
            imagePreviews: [],
          }))
  );

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setTitleImage(null);
    setTitleImagePreview(null);
    setSections(
      Array(5)
        .fill({})
        .map(() => ({
          subheading: '',
          text: '',
          images: [],
          imagePreviews: [],
        }))
    );

    // Reset file inputs
    const titleImageInput = document.getElementById(
      'titleImage'
    ) as HTMLInputElement;
    if (titleImageInput) titleImageInput.value = '';

    // Reset section image inputs
    for (let i = 0; i < 5; i++) {
      const imageInput = document.getElementById(
        `images${i}`
      ) as HTMLInputElement;
      if (imageInput) imageInput.value = '';
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!titleImage && !articleToEdit?.title_image) {
      setError('Please select a title image');
      return;
    }

    if (!supabase) {
      setError('Database connection not initialized');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Upload title image if changed
      let titleImageUrl = articleToEdit?.title_image;
      if (titleImage) {
        titleImageUrl = await uploadFile(titleImage, 'title-images');
      }

      // Upload new section images and prepare section data
      const sectionData = await Promise.all(
        sections.map(async (section) => {
          const newImageUrls = await Promise.all(
            section.images.map((img) => uploadFile(img, 'article-images'))
          );

          const existingImageUrls = section.imagePreviews.filter(
            (url) => typeof url === 'string' && !url.startsWith('blob:')
          );

          return {
            subheading: section.subheading,
            text: section.text,
            images: [...existingImageUrls, ...newImageUrls],
          };
        })
      );

      const articleData = {
        title,
        description,
        title_image: titleImageUrl,
        sections: sectionData,
      };

      if (articleToEdit) {
        // Update existing article
        const { error: updateError } = await supabase
          .from('articles')
          .update(articleData)
          .eq('id', articleToEdit.id);

        if (updateError) throw updateError;
      } else {
        // Create new article
        const { error: insertError } = await supabase
          .from('articles')
          .insert([articleData]);

        if (insertError) throw insertError;
      }

      fetchArticles();
      if (onCancelEdit) onCancelEdit();
      resetForm();
    } catch (err) {
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
      const previewUrl = URL.createObjectURL(file);
      setTitleImagePreview(previewUrl);
    }
  };

  const handleSectionImagesChange = (
    index: number,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = Array.from(e.target.files || []);
    const previews = files.map((file) => URL.createObjectURL(file));

    setSections((prevSections) => {
      const newSections = [...prevSections];
      newSections[index] = {
        ...newSections[index],
        images: files,
        imagePreviews: previews,
      };
      return newSections;
    });
  };

  const updateSectionField = (
    index: number,
    field: 'subheading' | 'text',
    value: string
  ) => {
    setSections((prevSections) => {
      const newSections = [...prevSections];
      newSections[index] = {
        ...newSections[index],
        [field]: value,
      };
      return newSections;
    });
  };

  const removeImage = (sectionIndex: number, imageIndex: number) => {
    setSections((prevSections) => {
      const newSections = [...prevSections];
      const section = { ...newSections[sectionIndex] };

      // Remove image from previews
      section.imagePreviews = section.imagePreviews.filter(
        (_, idx) => idx !== imageIndex
      );

      // If it's a new image (File), also remove from images array
      if (imageIndex < section.images.length) {
        section.images = section.images.filter((_, idx) => idx !== imageIndex);
      }

      newSections[sectionIndex] = section;
      return newSections;
    });
  };

  // Cleanup preview URLs when component unmounts
  useEffect(() => {
    return () => {
      if (titleImagePreview) URL.revokeObjectURL(titleImagePreview);
      sections.forEach((section) => {
        section.imagePreviews.forEach((preview) =>
          URL.revokeObjectURL(preview)
        );
      });
    };
  }, [titleImagePreview, sections]);

  const uploadFile = async (file: File, bucket: string) => {
    if (!supabase) throw new Error('No supabase client');

    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `${fileName}`;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { error: uploadError, data } = await supabase.storage
      .from(bucket)
      .upload(filePath, file);

    if (uploadError) {
      throw uploadError;
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from(bucket).getPublicUrl(filePath);

    return publicUrl;
  };

  return (
    <form onSubmit={handleUpload} className='mb-8 space-y-4'>
      <div className='flex justify-between items-center mb-4'>
        <h2 className='text-xl font-semibold'>
          {articleToEdit ? 'Edit Article' : 'Create New Article'}
        </h2>
        {articleToEdit && (
          <button
            type='button'
            onClick={onCancelEdit}
            className='px-4 py-2 text-sm text-gray-600 hover:text-gray-800'>
            Cancel Edit
          </button>
        )}
      </div>
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
          htmlFor='titleImage'
          className='block text-sm font-medium text-gray-700'>
          Title Image (PNG, JPEG, WEBP, SVG, GIF, BMP, TIFF, ICO, HEIC, HEIF,
          AVIF)
        </label>
        <input
          id='titleImage'
          type='file'
          accept='.png, .jpeg, .jpg, .webp, .svg, .gif, .bmp, .tiff, .ico, .heic, .heif, .avif'
          required={!articleToEdit}
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
      {sections.map((section, index) => (
        <div key={index} className='mt-8 p-4 border rounded-lg bg-white'>
          <h3 className='text-lg font-semibold mb-4 text-gray-900'>
            Section {index + 1}
          </h3>

          <div className='space-y-4'>
            <div>
              <label
                htmlFor={`subheading${index}`}
                className='block text-sm font-medium text-gray-700'>
                Subheading {index + 1}
              </label>
              <input
                id={`subheading${index}`}
                type='text'
                value={section.subheading}
                onChange={(e) =>
                  updateSectionField(index, 'subheading', e.target.value)
                }
                className='mt-1 block w-full rounded border border-gray-300 px-3 py-2 text-gray-900'
              />
            </div>

            <div>
              <label
                htmlFor={`text${index}`}
                className='block text-sm font-medium text-gray-700'>
                Content
              </label>
              <RichTextEditor
                content={section.text}
                onChange={(html) => updateSectionField(index, 'text', html)}
              />
            </div>

            <div>
              <label
                htmlFor={`images${index}`}
                className='block text-sm font-medium text-gray-700'>
                Images for Section {index + 1}
              </label>
              <input
                id={`images${index}`}
                type='file'
                accept='image/*'
                multiple
                onChange={(e) => handleSectionImagesChange(index, e)}
                className='mt-1 block w-full text-gray-700'
              />
              {section.imagePreviews.length > 0 && (
                <div className='mt-2 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2'>
                  {section.imagePreviews.map((preview, imgIndex) => (
                    <div key={imgIndex} className='relative group'>
                      <img
                        src={preview}
                        alt={`Preview ${imgIndex + 1}`}
                        className='h-32 w-full object-cover rounded'
                      />
                      <button
                        type='button'
                        onClick={() => removeImage(index, imgIndex)}
                        className='absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity'>
                        <svg
                          xmlns='http://www.w3.org/2000/svg'
                          className='h-4 w-4'
                          viewBox='0 0 20 20'
                          fill='currentColor'>
                          <path
                            fillRule='evenodd'
                            d='M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z'
                            clipRule='evenodd'
                          />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
      {error && (
        <div className='bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded'>
          {error}
        </div>
      )}
      <button
        type='submit'
        disabled={loading}
        className='w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400'>
        {loading
          ? 'Uploading...'
          : articleToEdit
          ? 'Update Article'
          : 'Upload Article'}
      </button>
    </form>
  );
};

export default ArticleForm;

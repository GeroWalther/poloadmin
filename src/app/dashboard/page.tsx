'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import TabNavigation from './components/TabNavigation';
import MagazineForm from './components/MagazineForm';
import ArticleForm from './components/ArticleForm';

interface Magazine {
  id: string;
  title: string;
  description: string;
  pdf: string;
  created_at: string;
}

interface Article {
  id: string;
  title: string;
  description: string;
  title_image: string;
  sections?: {
    subheading?: string;
    text?: string;
    images?: string[];
  }[];
  created_at: string;
}

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<'magazines' | 'articles'>(
    'magazines'
  );
  const [magazines, setMagazines] = useState<Magazine[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_, setError] = useState<string | null>(null);
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
    fetchArticles();
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

  const fetchArticles = async () => {
    if (!supabase) return;

    const { data, error } = await supabase
      .from('articles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching articles:', error);
      return;
    }

    setArticles(data || []);
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

  const handleDelete = async (id: string, type: 'magazine' | 'article') => {
    if (!supabase) return;

    try {
      const { error } = await supabase
        .from(type === 'magazine' ? 'magazines' : 'articles')
        .delete()
        .eq('id', id);
      if (error) throw error;
      if (type === 'magazine') {
        fetchMagazines();
      } else {
        fetchArticles();
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      console.error('Delete error:', err);
      setError(err.message);
    }
  };

  return (
    <div className='min-h-screen bg-gray-100'>
      <nav className='bg-white shadow-sm'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='flex justify-between h-16'>
            <div className='flex'>
              <div className='flex-shrink-0 flex items-center'>
                <h1 className='text-2xl font-bold text-gray-900'>
                  Polo and Lifestyle Admin
                </h1>
              </div>
            </div>
            <div className='flex items-center'>
              <button
                onClick={handleSignOut}
                className='ml-3 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'>
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className='max-w-7xl mx-auto py-6 sm:px-6 lg:px-8'>
        <div className='px-4 py-6 sm:px-0'>
          <TabNavigation activeTab={activeTab} setActiveTab={setActiveTab} />

          {activeTab === 'magazines' ? (
            <>
              <MagazineForm fetchMagazines={fetchMagazines} />
              <div className='mt-8'>
                <h2 className='text-xl font-semibold mb-4 text-gray-900'>
                  Uploaded Magazines
                </h2>
                <div className='space-y-4'>
                  {magazines.map((magazine) => (
                    <div
                      key={magazine.id}
                      className='bg-white shadow overflow-hidden sm:rounded-lg'>
                      <div className='px-4 py-5 sm:px-6 flex justify-between items-center'>
                        <div>
                          <h3 className='text-lg leading-6 font-medium text-gray-900'>
                            {magazine.title}
                          </h3>
                          <p className='mt-1 max-w-2xl text-sm text-gray-500'>
                            {new Date(magazine.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div className='flex space-x-2'>
                          <a
                            href={magazine.pdf}
                            target='_blank'
                            rel='noopener noreferrer'
                            className='inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'>
                            View PDF
                          </a>
                          <button
                            onClick={() =>
                              handleDelete(magazine.id, 'magazine')
                            }
                            className='inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500'>
                            Delete
                          </button>
                        </div>
                      </div>
                      <div className='border-t border-gray-200 px-4 py-5 sm:px-6'>
                        <p className='text-sm text-gray-500'>
                          {magazine.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <>
              <ArticleForm fetchArticles={fetchArticles} />
              <div className='mt-8'>
                <h2 className='text-xl font-semibold mb-4 text-gray-900'>
                  Uploaded Articles
                </h2>
                {articles && articles.length > 0 ? (
                  <div className='space-y-4'>
                    {articles.map((article) => (
                      <div
                        key={article.id}
                        className='bg-white shadow overflow-hidden sm:rounded-lg'>
                        <div className='px-4 py-5 sm:px-6 flex justify-between items-center'>
                          <div>
                            <h3 className='text-lg leading-6 font-medium text-gray-900'>
                              {article.title}
                            </h3>
                            <p className='mt-1 max-w-2xl text-sm text-gray-500'>
                              {new Date(
                                article.created_at
                              ).toLocaleDateString()}
                            </p>
                          </div>
                          <div className='flex space-x-2'>
                            <button
                              onClick={() =>
                                handleDelete(article.id, 'article')
                              }
                              className='inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500'>
                              Delete
                            </button>
                          </div>
                        </div>
                        <div className='border-t border-gray-200 px-4 py-5 sm:px-6'>
                          <p className='text-sm text-gray-500'>
                            {article.description}
                          </p>
                          <div className='mt-4 grid grid-cols-2 gap-4'>
                            <div>
                              <h4 className='text-sm font-medium text-gray-500'>
                                Title Image
                              </h4>
                              <img
                                src={article.title_image || '/placeholder.svg'}
                                alt={article.title}
                                className='mt-1 h-32 w-full object-cover rounded-md'
                              />
                            </div>
                            <div>
                              <h4 className='text-sm font-medium text-gray-500'>
                                Sections
                              </h4>
                              {article.sections?.map(
                                (section, sectionIndex) => (
                                  <div key={sectionIndex} className='mt-4'>
                                    {section.subheading && (
                                      <h5 className='text-sm font-medium text-gray-700'>
                                        {section.subheading}
                                      </h5>
                                    )}
                                    {section.text && (
                                      <p className='text-sm text-gray-500'>
                                        {section.text}
                                      </p>
                                    )}
                                    {section.images &&
                                      section.images.length > 0 && (
                                        <div className='mt-2 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2'>
                                          {section.images.map(
                                            (image, imageIndex) => (
                                              <img
                                                key={`${sectionIndex}-${imageIndex}`}
                                                src={
                                                  image || '/placeholder.svg'
                                                }
                                                alt={`Section ${
                                                  sectionIndex + 1
                                                } image ${imageIndex + 1}`}
                                                className='h-16 w-full object-cover rounded-md'
                                              />
                                            )
                                          )}
                                        </div>
                                      )}
                                  </div>
                                )
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p>No articles found</p>
                )}
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}

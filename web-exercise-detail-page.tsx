/**
 * Exercise Detail Page - Individual Exercise View
 * Dynamic route for /exercise/[exerciseId]
 * Shows video, description, and checks premium access
 */

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import PaymentModal from '@/components/PaymentModal';
import { getExerciseAccess, hasUserAccess } from '@/utils/exerciseAccess';

// Always use new API
const NEW_API_URL = 'https://api-rejuvena.duckdns.org';

/**
 * Get video embed URL based on platform
 */
function getVideoEmbedUrl(url: string): { embedUrl: string; type: 'iframe' | 'video' } {
  if (!url) return { embedUrl: '', type: 'iframe' };

  // Direct video file
  if (url.match(/\.(mp4|webm|ogg|mov)$/i)) {
    return { embedUrl: url, type: 'video' };
  }

  // YouTube
  if (url.includes('youtube.com') || url.includes('youtu.be')) {
    if (url.includes('/embed/')) {
      return { embedUrl: url, type: 'iframe' };
    }
    const videoId = url.includes('youtu.be')
      ? url.split('youtu.be/')[1]?.split('?')[0]
      : new URL(url).searchParams.get('v');
    return { embedUrl: `https://www.youtube.com/embed/${videoId}`, type: 'iframe' };
  }

  // Vimeo
  if (url.includes('vimeo.com')) {
    if (url.includes('player.vimeo.com/video/')) {
      return { embedUrl: url, type: 'iframe' };
    }
    const videoId = url.split('vimeo.com/')[1]?.split('?')[0];
    return { embedUrl: `https://player.vimeo.com/video/${videoId}`, type: 'iframe' };
  }

  // RuTube
  if (url.includes('rutube.ru')) {
    const videoId = url.split('/video/')[1]?.split('/')[0] || url.split('/play/embed/')[1]?.split('?')[0];
    return { embedUrl: `https://rutube.ru/play/embed/${videoId}`, type: 'iframe' };
  }

  // VK Video
  if (url.includes('vk.com/video')) {
    const match = url.match(/video(-?\d+)_(\d+)/);
    if (match) {
      return { embedUrl: `https://vk.com/video_ext.php?oid=${match[1]}&id=${match[2]}`, type: 'iframe' };
    }
  }

  // Dzen
  if (url.includes('dzen.ru')) {
    return { embedUrl: url, type: 'iframe' };
  }

  return { embedUrl: url, type: 'iframe' };
}

interface ExerciseFromAPI {
  _id: string;
  title: string;
  description: string;
  content?: string;
  duration?: string;
  carouselMedia: Array<{
    type: string;
    url: string;
    filename: string;
    order: number;
  }>;
  tags: Array<{
    _id: string;
    name: string;
    slug: string;
    color: string;
  }>;
  category?: string;
  order: number;
}

export default function ExercisePage() {
  const router = useRouter();
  const { exerciseId } = router.query;
  const videoContainerRef = useRef<HTMLDivElement>(null);
  
  const [exercise, setExercise] = useState<ExerciseFromAPI | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDone, setIsDone] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [currentContentIndex, setCurrentContentIndex] = useState(0);
  const [contentItems, setContentItems] = useState<any[]>([]);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [hasAccess, setHasAccess] = useState(false);

  // Load exercise from API
  useEffect(() => {
    if (!exerciseId) return;
    
    const fetchExercise = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${NEW_API_URL}/api/exercises/public`);
        const exercises: ExerciseFromAPI[] = await response.json();
        const foundExercise = exercises.find((ex) => ex._id === exerciseId);
        
        if (foundExercise) {
          setExercise(foundExercise);
          
          // Check access
          const accessInfo = getExerciseAccess(foundExercise.tags.map(t => t.name));
          const userHasAccess = hasUserAccess(foundExercise._id);
          setHasAccess(accessInfo.isFree || userHasAccess);
          
          // If no access, show payment modal
          if (!accessInfo.isFree && !userHasAccess) {
            setPaymentModalOpen(true);
          }
        } else {
          router.push('/404');
        }
      } catch (error) {
        console.error('Failed to load exercise:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchExercise();
  }, [exerciseId, router]);

  // Build content items from carouselMedia
  useEffect(() => {
    if (!exercise) return;

    const items = exercise.carouselMedia
      .filter((c) => c.type === 'video' || c.type === 'image')
      .sort((a, b) => a.order - b.order)
      .map((c) => {
        const item: any = {
          id: c.url,
          type: c.type,
          contentPath: c.url,
          loadError: false
        };

        if (c.type === 'video') {
          const { embedUrl, type: videoType } = getVideoEmbedUrl(c.url);
          item.embedUrl = embedUrl;
          item.videoType = videoType;
        }

        return item;
      });

    setContentItems(items);
    setCurrentContentIndex(0);
  }, [exercise]);

  // Mock comments
  useEffect(() => {
    if (exercise) {
      setComments([
        {
          id: '1',
          userName: 'Ирина М.',
          userAvatar: 'https://ui-avatars.com/api/?name=Irina+M&background=ec4899&color=fff',
          text: 'Делаю это упражнение каждое утро. Главное не торопиться и делать все плавно.',
          date: '27 декабря 2025',
        },
      ]);
    }
  }, [exercise]);

  const handleToggleCompletion = () => {
    setIsDone(!isDone);
  };

  const handlePostComment = () => {
    if (!newComment.trim()) return;
    
    const comment = {
      id: Date.now().toString(),
      userName: 'Вы',
      userAvatar: 'https://ui-avatars.com/api/?name=User&background=8b5cf6&color=fff',
      text: newComment,
      date: new Date().toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' }),
    };
    
    setComments([comment, ...comments]);
    setNewComment('');
  };

  const toggleFullscreen = () => {
    if (!videoContainerRef.current) return;

    if (!document.fullscreenElement) {
      videoContainerRef.current.requestFullscreen().catch((err) => {
        console.error('Error entering fullscreen:', err);
      });
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (!exercise) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">😞</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Упражнение не найдено</h2>
          <button
            onClick={() => router.push('/exercises')}
            className="mt-4 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            Вернуться к списку
          </button>
        </div>
      </div>
    );
  }

  // Access check - show blurred content if no access
  const accessInfo = getExerciseAccess(exercise.tags.map(t => t.name));
  const showBlurred = !hasAccess;

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-3 py-3">
          <div className="flex items-center justify-between">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors flex-shrink-0"
              aria-label="Назад"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            
            <div className="flex-1 text-center px-4">
              <h1 className="text-xl font-bold">{exercise.title}</h1>
              {!accessInfo.isFree && (
                <span className="inline-block mt-1 bg-white/20 text-xs px-2 py-1 rounded-full">
                  {accessInfo.priceType === 'pro' ? 'PRO' : 'PREMIUM'}
                </span>
              )}
            </div>

            <button
              onClick={handleToggleCompletion}
              disabled={!hasAccess}
              className={`flex-shrink-0 p-2 rounded-lg transition-all ${
                isDone 
                  ? 'bg-green-500 text-white' 
                  : 'bg-white/10 hover:bg-white/20'
              } ${!hasAccess ? 'opacity-50 cursor-not-allowed' : ''}`}
              aria-label={isDone ? 'Отметить как невыполненное' : 'Отметить как выполненное'}
            >
              <svg className="w-6 h-6" fill={isDone ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto py-6 relative">
        {/* Blur overlay if no access */}
        {showBlurred && (
          <div className="absolute inset-0 z-20 backdrop-blur-md bg-white/30 flex items-center justify-center">
            <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md mx-4 text-center">
              <div className="text-6xl mb-4">🔒</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Премиум упражнение</h2>
              <p className="text-gray-600 mb-4">
                Это упражнение доступно по подписке {accessInfo.priceType === 'pro' ? 'PRO' : 'PREMIUM'}
              </p>
              <button
                onClick={() => setPaymentModalOpen(true)}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 transition-all"
              >
                Разблокировать за {accessInfo.price} ₽
              </button>
            </div>
          </div>
        )}

        {/* Video/Image Carousel */}
        {contentItems.length > 0 && (
          <div className={`bg-white shadow-lg mb-6 py-6 ${showBlurred ? 'filter blur-sm' : ''}`}>
            <div className="flex flex-col items-center">
              <div className={`w-full ${contentItems[currentContentIndex]?.type === 'image' ? 'max-w-[200px]' : 'max-w-[400px]'}`}>
                <div className="relative w-full" ref={videoContainerRef}>
                  {contentItems[currentContentIndex] && (
                    <div key={contentItems[currentContentIndex].id} className="w-full">
                      {contentItems[currentContentIndex].type === 'video' ? (
                        contentItems[currentContentIndex].videoType === 'video' ? (
                          <video
                            src={contentItems[currentContentIndex].embedUrl}
                            controls
                            controlsList="nodownload nofullscreen noremoteplayback"
                            disablePictureInPicture
                            className="w-full aspect-square object-contain bg-white rounded-lg"
                            playsInline
                            onContextMenu={(e) => e.preventDefault()}
                          />
                        ) : (
                          <div className="relative w-full aspect-square bg-black rounded-lg overflow-hidden">
                            <iframe
                              src={contentItems[currentContentIndex].embedUrl}
                              className="w-full h-full"
                              frameBorder="0"
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                              allowFullScreen
                            />
                            {!isFullscreen && (
                              <button
                                onClick={toggleFullscreen}
                                className="absolute bottom-4 right-4 bg-black/50 hover:bg-black/70 text-white p-2 rounded-lg transition-colors"
                                aria-label="Полноэкранный режим"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                                </svg>
                              </button>
                            )}
                          </div>
                        )
                      ) : (
                        <img
                          src={contentItems[currentContentIndex].contentPath}
                          alt="Exercise"
                          className="w-full aspect-square object-contain bg-white rounded-lg"
                        />
                      )}
                    </div>
                  )}

                  {/* Navigation Arrows */}
                  {contentItems.length > 1 && (
                    <>
                      {currentContentIndex > 0 && (
                        <button
                          onClick={() => setCurrentContentIndex(currentContentIndex - 1)}
                          className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white p-2 rounded-full shadow-lg transition-colors"
                        >
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                          </svg>
                        </button>
                      )}
                      
                      {currentContentIndex < contentItems.length - 1 && (
                        <button
                          onClick={() => setCurrentContentIndex(currentContentIndex + 1)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white p-2 rounded-full shadow-lg transition-colors"
                        >
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                      )}

                      {/* Dots indicator */}
                      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                        {contentItems.map((_, index) => (
                          <button
                            key={index}
                            onClick={() => setCurrentContentIndex(index)}
                            className={`w-2 h-2 rounded-full transition-colors ${
                              index === currentContentIndex ? 'bg-purple-600' : 'bg-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Hint for images (GIFs) */}
              {contentItems[currentContentIndex]?.type === 'image' && contentItems.length > 1 && (
                <div className="mt-4 w-full max-w-[400px]">
                  <div className="bg-purple-600/95 text-white text-sm px-4 py-3 rounded-lg text-center shadow-lg">
                    <p className="font-semibold mb-1">💡 Основное движение</p>
                    <p className="text-xs opacity-90">
                      Ознакомьтесь с видео инструкцией, нажмите на стрелочку вправо
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Description Section */}
        <div className={`bg-white rounded-2xl shadow-lg p-6 mb-6 mx-4 ${showBlurred ? 'filter blur-sm' : ''}`}>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Описание</h2>
          <div 
            className="prose prose-purple max-w-none"
            dangerouslySetInnerHTML={{ __html: exercise.content || exercise.description }}
          />
          {exercise.duration && (
            <div className="mt-4 text-gray-600">
              <strong>Длительность:</strong> {exercise.duration}
            </div>
          )}
        </div>

        {/* Comments Section */}
        <div className={`bg-white rounded-2xl shadow-lg p-6 mx-4 ${showBlurred ? 'filter blur-sm' : ''}`}>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Комментарии ({comments.length})
          </h2>

          {/* Add Comment */}
          <div className="mb-6">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Напишите комментарий..."
              disabled={!hasAccess}
              className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none disabled:opacity-50 disabled:cursor-not-allowed"
              rows={3}
            />
            <button
              onClick={handlePostComment}
              disabled={!newComment.trim() || !hasAccess}
              className="mt-2 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Отправить
            </button>
          </div>

          {/* Comments List */}
          <div className="space-y-4">
            {comments.length === 0 ? (
              <p className="text-gray-500 text-center py-8">Комментариев пока нет. Будьте первым!</p>
            ) : (
              comments.map((comment) => (
                <div key={comment.id} className="flex space-x-4 p-4 bg-gray-50 rounded-lg">
                  <img
                    src={comment.userAvatar}
                    alt={comment.userName}
                    className="w-12 h-12 rounded-full flex-shrink-0"
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-semibold text-gray-900">{comment.userName}</h3>
                      <span className="text-sm text-gray-500">{comment.date}</span>
                    </div>
                    <p className="text-gray-700">{comment.text}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      <PaymentModal
        isOpen={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
        price={accessInfo.price}
        exerciseName={exercise.title}
        isPro={accessInfo.priceType === 'pro'}
      />
    </div>
  );
}

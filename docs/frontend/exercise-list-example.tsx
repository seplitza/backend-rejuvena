/**
 * Example: Exercise List Page with Premium Logic
 * Complete implementation example
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import PaymentModal from '@/components/PaymentModal';
import { getExerciseAccess, hasUserAccess } from '@/utils/exerciseAccess';

interface Exercise {
  _id: string;
  title: string;
  description: string;
  content: string;
  tags: Array<{
    name: string;
    color: string;
  }>;
  carouselMedia: Array<{
    url: string;
    type: string;
  }>;
}

export default function ExercisesPage() {
  const router = useRouter();
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedPremiumExercise, setSelectedPremiumExercise] = useState<{
    name: string;
    price: number;
    isPro: boolean;
  } | null>(null);

  // Load exercises from API
  useEffect(() => {
    const loadExercises = async () => {
      try {
        const response = await fetch('https://api-rejuvena.duckdns.org/api/exercises/public');
        const data = await response.json();
        setExercises(data);
      } catch (error) {
        console.error('Failed to load exercises:', error);
      } finally {
        setLoading(false);
      }
    };

    loadExercises();
  }, []);

  const handleExerciseClick = (exercise: Exercise) => {
    const tags = exercise.tags.map(t => t.name);
    const access = getExerciseAccess(tags);
    
    // Check if locked and not purchased
    if (access.isLocked && !hasUserAccess(exercise.title)) {
      setSelectedPremiumExercise({
        name: exercise.title,
        price: access.price,
        isPro: access.isPro
      });
      setPaymentModalOpen(true);
      return;
    }
    
    // Navigate to exercise detail
    router.push(`/exercise/${exercise._id}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold">Все упражнения</h1>
          <p className="text-purple-100 mt-2">
            {exercises.length} упражнений доступно
          </p>
        </div>
      </header>

      {/* Exercise Grid */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {exercises.map(exercise => {
            const tags = exercise.tags.map(t => t.name);
            const access = getExerciseAccess(tags);
            const hasAccess = !access.isLocked || hasUserAccess(exercise.title);
            const thumbnail = exercise.carouselMedia.find(m => m.type === 'image')?.url;

            return (
              <div
                key={exercise._id}
                onClick={() => handleExerciseClick(exercise)}
                className="bg-white rounded-2xl shadow-lg overflow-hidden cursor-pointer transform transition-all hover:scale-105 hover:shadow-xl"
              >
                {/* Thumbnail */}
                <div className="relative h-48 bg-gradient-to-br from-purple-100 to-pink-100">
                  {thumbnail ? (
                    <img
                      src={thumbnail}
                      alt={exercise.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-6xl">💪</span>
                    </div>
                  )}

                  {/* Badge */}
                  {access.badge && (
                    <div className="absolute top-3 right-3">
                      <span className={`
                        inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold
                        ${access.isPro 
                          ? 'bg-gradient-to-r from-yellow-400 to-yellow-500 text-yellow-900' 
                          : 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                        }
                      `}>
                        {access.isPro && '⭐ '}
                        {access.badge}
                      </span>
                    </div>
                  )}

                  {/* Lock Icon */}
                  {!hasAccess && (
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center">
                      <svg className="w-16 h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-4">
                  <h3 className="text-lg font-bold text-gray-900 mb-2">
                    {exercise.title}
                  </h3>
                  <p className="text-sm text-gray-600 line-clamp-2">
                    {exercise.description}
                  </p>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-2 mt-3">
                    {exercise.tags.slice(0, 3).map((tag, idx) => (
                      <span
                        key={idx}
                        className="text-xs px-2 py-1 rounded-full"
                        style={{
                          backgroundColor: `${tag.color}20`,
                          color: tag.color
                        }}
                      >
                        {tag.name}
                      </span>
                    ))}
                  </div>

                  {/* CTA */}
                  <div className="mt-4">
                    {hasAccess ? (
                      <div className="flex items-center text-green-600 text-sm font-medium">
                        <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Доступно
                      </div>
                    ) : (
                      <button className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold py-2 px-4 rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all">
                        Купить за {access.price}₽
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Payment Modal */}
      {selectedPremiumExercise && (
        <PaymentModal
          isOpen={paymentModalOpen}
          onClose={() => {
            setPaymentModalOpen(false);
            setSelectedPremiumExercise(null);
          }}
          exerciseName={selectedPremiumExercise.name}
          price={selectedPremiumExercise.price}
          isPro={selectedPremiumExercise.isPro}
        />
      )}
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../api/client';
import { generateLandingContent, generateMarathonFeatures, generateUniqueSlug } from '../utils/landingGenerator';
import SectionManager from '../components/SectionManager';
import type { SectionConfig } from '../components/SectionManager';
import SectionEditorModal from '../components/sections/SectionEditorModal';
import {
  defaultFeatures,
  defaultProblems,
  defaultAbout,
  defaultSteps,
  defaultProcess,
  defaultStats,
  defaultResultsGallery,
  defaultTestimonialsGallery
} from '../types/sections';
import type {
  FeaturesSectionData,
  ProblemsSectionData,
  AboutSectionData,
  StepsSectionData,
  ProcessSectionData,
  StatsSectionData,
  ResultsGallerySectionData,
  TestimonialsGallerySectionData
} from '../types/sections';

interface Marathon {
  _id: string;
  title: string;
  description?: string;
  courseDescription?: string;
  welcomeMessage?: string;
  numberOfDays: number;
  cost: number;
  startDate: string;
}

const LandingEditor: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [marathons, setMarathons] = useState<Marathon[]>([]);
  const [selectedMarathon, setSelectedMarathon] = useState<string>('');
  
  // Section management
  const [sections, setSections] = useState<SectionConfig[]>([
    { id: 'hero', type: 'hero', title: 'Первый экран (Hero)', isVisible: true, isRequired: true, icon: '🎯' },
    { id: 'features', type: 'features', title: 'Что такое система', isVisible: true, icon: '✨' },
    { id: 'problems', type: 'problems', title: 'Проблемы которые решаем', isVisible: true, icon: '🎯' },
    { id: 'about', type: 'about', title: 'Об авторе', isVisible: true, icon: '👤' },
    { id: 'steps', type: 'steps', title: 'Ступени системы', isVisible: true, icon: '📊' },
    { id: 'process', type: 'process', title: 'Как проходит программа', isVisible: true, icon: '🔄' },
    { id: 'stats', type: 'stats', title: 'Результаты клиентов', isVisible: true, icon: '📈' },
    { id: 'resultsGallery', type: 'resultsGallery', title: 'Галерея результатов', isVisible: false, icon: '📸' },
    { id: 'testimonialsGallery', type: 'testimonialsGallery', title: 'Галерея отзывов', isVisible: false, icon: '💬' },
    { id: 'marathons', type: 'marathons', title: 'Тарифы и марафоны', isVisible: true, isRequired: true, icon: '🏃' }
  ]);

  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [sectionData, setSectionData] = useState<{
    features: FeaturesSectionData;
    problems: ProblemsSectionData;
    about: AboutSectionData;
    steps: StepsSectionData;
    process: ProcessSectionData;
    stats: StatsSectionData;
    resultsGallery: ResultsGallerySectionData;
    testimonialsGallery: TestimonialsGallerySectionData;
  }>({
    features: defaultFeatures,
    problems: defaultProblems,
    about: defaultAbout,
    steps: defaultSteps,
    process: defaultProcess,
    stats: defaultStats,
    resultsGallery: defaultResultsGallery,
    testimonialsGallery: defaultTestimonialsGallery
  });
  
  // Form state
  const [formData, setFormData] = useState({
    slug: '',
    title: '',
    metaDescription: '',
    
    // Hero
    heroTitle: '',
    heroSubtitle: '',
    heroCtaText: 'Записаться на марафон',
    heroCtaLink: '#marathons',
    
    // Marathons
    marathonsSectionTitle: 'Выберите свой уровень',
    basicMarathonId: '',
    basicTitle: 'Базовый уровень',
    basicStartDate: '',
    basicPrice: 0,
    basicDuration: '',
    basicFeatures: [] as string[],
    
    advancedMarathonId: '',
    advancedTitle: 'Продвинутый уровень',
    advancedStartDate: '',
    advancedPrice: 0,
    advancedDuration: '',
    advancedFeatures: [] as string[],
    
    isPublished: false
  });

  useEffect(() => {
    fetchMarathons();
    if (id && id !== 'new') {
      fetchLanding();
    }
  }, [id]);

  const fetchMarathons = async () => {
    try {
      const response = await api.get('/marathons');
      if (response.data.success) {
        setMarathons(response.data.marathons);
      }
    } catch (error) {
      console.error('Error fetching marathons:', error);
    }
  };

  const fetchLanding = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/landings/admin/${id}`);
      if (response.data.success) {
        const landing = response.data.landing;
        setFormData({
          slug: landing.slug,
          title: landing.title,
          metaDescription: landing.metaDescription,
          heroTitle: landing.heroSection.title,
          heroSubtitle: landing.heroSection.subtitle,
          heroCtaText: landing.heroSection.ctaButton.text,
          heroCtaLink: landing.heroSection.ctaButton.link,
          marathonsSectionTitle: landing.marathonsSection?.sectionTitle || 'Выберите свой уровень',
          basicMarathonId: landing.marathonsSection?.basic?.marathonId || '',
          basicTitle: landing.marathonsSection?.basic?.title || '',
          basicStartDate: landing.marathonsSection?.basic?.startDate || '',
          basicPrice: landing.marathonsSection?.basic?.price || 0,
          basicDuration: landing.marathonsSection?.basic?.duration || '',
          basicFeatures: landing.marathonsSection?.basic?.features || [],
          advancedMarathonId: landing.marathonsSection?.advanced?.marathonId || '',
          advancedTitle: landing.marathonsSection?.advanced?.title || '',
          advancedStartDate: landing.marathonsSection?.advanced?.startDate || '',
          advancedPrice: landing.marathonsSection?.advanced?.price || 0,
          advancedDuration: landing.marathonsSection?.advanced?.duration || '',
          advancedFeatures: landing.marathonsSection?.advanced?.features || [],
          isPublished: landing.isPublished
        });

        // Load section data
        if (landing.featuresSection) {
          setSectionData(prev => ({ ...prev, features: landing.featuresSection }));
        }
        if (landing.problemsSection) {
          setSectionData(prev => ({ ...prev, problems: landing.problemsSection }));
        }
        if (landing.aboutSection) {
          setSectionData(prev => ({ ...prev, about: landing.aboutSection }));
        }
        if (landing.stepsSection) {
          setSectionData(prev => ({ ...prev, steps: landing.stepsSection }));
        }
        if (landing.processSection) {
          setSectionData(prev => ({ ...prev, process: landing.processSection }));
        }
        if (landing.statsSection) {
          setSectionData(prev => ({ ...prev, stats: landing.statsSection }));
        }
        if (landing.resultsGallerySection) {
          setSectionData(prev => ({ ...prev, resultsGallery: landing.resultsGallerySection }));
        }
        if (landing.testimonialsGallerySection) {
          setSectionData(prev => ({ ...prev, testimonialsGallery: landing.testimonialsGallerySection }));
        }

        // Update section visibility
        setSections(prev => prev.map(section => {
          if (section.id === 'features') return { ...section, isVisible: !!landing.featuresSection };
          if (section.id === 'problems') return { ...section, isVisible: !!landing.problemsSection };
          if (section.id === 'about') return { ...section, isVisible: !!landing.aboutSection };
          if (section.id === 'steps') return { ...section, isVisible: !!landing.stepsSection };
          if (section.id === 'process') return { ...section, isVisible: !!landing.processSection };
          if (section.id === 'stats') return { ...section, isVisible: !!landing.statsSection };
          if (section.id === 'resultsGallery') return { ...section, isVisible: !!landing.resultsGallerySection };
          if (section.id === 'testimonialsGallery') return { ...section, isVisible: !!landing.testimonialsGallerySection };
          return section;
        }));
      }
    } catch (error) {
      console.error('Error fetching landing:', error);
      alert('Ошибка загрузки лендинга');
    } finally {
      setLoading(false);
    }
  };

  // Генерация контента из описания марафона
  const handleGenerateFromMarathon = () => {
    if (!selectedMarathon) {
      alert('Выберите марафон для генерации');
      return;
    }

    const marathon = marathons.find(m => m._id === selectedMarathon);
    if (!marathon) return;

    // Преобразуем в MarathonData
    const marathonData = {
      title: marathon.title,
      description: marathon.description,
      courseDescription: marathon.courseDescription,
      welcomeMessage: marathon.welcomeMessage,
      numberOfDays: marathon.numberOfDays,
      cost: marathon.cost,
      startDate: new Date(marathon.startDate)
    };

    const generated = generateLandingContent(marathonData);
    const basicFeatures = generateMarathonFeatures(true, marathon.courseDescription);
    const advancedFeatures = generateMarathonFeatures(false, marathon.courseDescription);

    setFormData(prev => ({
      ...prev,
      slug: generateUniqueSlug(marathon.title, 7),
      title: generated.metaData.title,
      metaDescription: generated.metaData.description,
      heroTitle: generated.heroSection.title,
      heroSubtitle: generated.heroSection.subtitle,
      heroCtaText: generated.heroSection.ctaButton.text,
      heroCtaLink: generated.heroSection.ctaButton.link,
      basicMarathonId: marathon._id,
      basicTitle: 'Базовый уровень',
      basicStartDate: marathon.startDate,
      basicPrice: marathon.cost,
      basicDuration: `${marathon.numberOfDays} дней полного доступа`,
      basicFeatures: basicFeatures,
      advancedFeatures: advancedFeatures
    }));

    alert('✅ Контент сгенерирован по правилам эффективных лендингов!');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      
      const landingData: any = {
        slug: formData.slug,
        title: formData.title,
        metaDescription: formData.metaDescription,
        heroSection: {
          title: formData.heroTitle,
          subtitle: formData.heroSubtitle,
          ctaButton: {
            text: formData.heroCtaText,
            link: formData.heroCtaLink
          }
        },
        marathonsSection: {
          sectionTitle: formData.marathonsSectionTitle,
          basic: formData.basicMarathonId ? {
            marathonId: formData.basicMarathonId,
            title: formData.basicTitle,
            startDate: formData.basicStartDate,
            price: formData.basicPrice,
            duration: formData.basicDuration,
            features: formData.basicFeatures,
            ctaButton: {
              text: 'Начать обучение',
              link: '/marathons'
            }
          } : undefined,
          advanced: formData.advancedMarathonId ? {
            marathonId: formData.advancedMarathonId,
            title: formData.advancedTitle,
            startDate: formData.advancedStartDate,
            price: formData.advancedPrice,
            duration: formData.advancedDuration,
            features: formData.advancedFeatures,
            ctaButton: {
              text: 'Перейти на PRO',
              link: '/marathons'
            }
          } : undefined
        },
        isPublished: formData.isPublished
      };

      // Add visible sections
      const visibleSections = sections.filter(s => s.isVisible && !s.isRequired);
      visibleSections.forEach(section => {
        if (section.id === 'features') landingData.featuresSection = sectionData.features;
        if (section.id === 'problems') landingData.problemsSection = sectionData.problems;
        if (section.id === 'about') landingData.aboutSection = sectionData.about;
        if (section.id === 'steps') landingData.stepsSection = sectionData.steps;
        if (section.id === 'process') landingData.processSection = sectionData.process;
        if (section.id === 'stats') landingData.statsSection = sectionData.stats;
        if (section.id === 'resultsGallery') landingData.resultsGallerySection = sectionData.resultsGallery;
        if (section.id === 'testimonialsGallery') landingData.testimonialsGallerySection = sectionData.testimonialsGallery;
      });

      let response;
      if (id && id !== 'new') {
        response = await api.put(`/landings/${id}`, landingData);
      } else {
        response = await api.post('/landings', landingData);
      }

      if (response.data.success) {
        alert('✅ Лендинг сохранен!');
        navigate('/landings');
      }
    } catch (error: any) {
      console.error('Error saving landing:', error);
      alert(error.response?.data?.error || 'Ошибка сохранения лендинга');
    } finally {
      setLoading(false);
    }
  };

  const handleEditSection = (sectionId: string) => {
    if (!['features', 'problems', 'about', 'steps', 'process', 'stats'].includes(sectionId)) {
      alert('Для Hero и Marathons используйте основную форму');
      return;
    }
    setEditingSection(sectionId);
  };

  const handleSaveSection = (data: any) => {
    if (!editingSection) return;
    
    setSectionData(prev => ({
      ...prev,
      [editingSection]: data
    }));
  };

  if (loading && id && id !== 'new') {
    return <div className="p-6">Загрузка...</div>;
  }

  return (
    <div className="p-6 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          {id === 'new' ? 'Создать лендинг' : 'Редактировать лендинг'}
        </h1>
        <p className="text-gray-600">
          Создайте промо-страницу для марафона с применением правил эффективных лендингов
        </p>
      </div>

      {/* AI Generation Block */}
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          🤖 Умная генерация лендинга
        </h2>
        <p className="text-gray-700 mb-4">
          Выберите марафон, и система автоматически создаст продающий лендинг на основе 10 правил эффективных landing pages
        </p>
        <div className="flex gap-4">
          <select
            value={selectedMarathon}
            onChange={(e) => setSelectedMarathon(e.target.value)}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
          >
            <option value="">Выберите марафон...</option>
            {marathons.map(m => (
              <option key={m._id} value={m._id}>
                {m.title} (старт: {new Date(m.startDate).toLocaleDateString()})
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={handleGenerateFromMarathon}
            disabled={!selectedMarathon}
            className="px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ✨ Сгенерировать
          </button>
        </div>
      </div>

      {/* Section Manager */}
      <SectionManager
        sections={sections}
        onSectionsChange={setSections}
        onEditSection={handleEditSection}
      />

      {/* Main Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold mb-4">Основная информация</h3>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Slug (URL) *
              </label>
              <input
                type="text"
                required
                value={formData.slug}
                onChange={(e) => setFormData({...formData, slug: e.target.value})}
                placeholder="marathon-7-base"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Только латиница, цифры и дефисы
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Заголовок страницы *
              </label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                placeholder="Марафон Сеплица 7 этап"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Meta описание (SEO) *
            </label>
            <textarea
              required
              value={formData.metaDescription}
              onChange={(e) => setFormData({...formData, metaDescription: e.target.value})}
              placeholder="Краткое описание для поисковых систем (до 160 символов)"
              maxLength={160}
              rows={2}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              {formData.metaDescription.length}/160 символов
            </p>
          </div>
        </div>

        {/* Hero Section */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold mb-4">🎯 Первый экран (Hero)</h3>
          <p className="text-sm text-gray-600 mb-4">
            Правило №2: Продающий первый экран должен содержать оффер, выгоды и CTA
          </p>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Заголовок *
              </label>
              <input
                type="text"
                required
                value={formData.heroTitle}
                onChange={(e) => setFormData({...formData, heroTitle: e.target.value})}
                placeholder="Марафон Сеплица - 7 этап"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Подзаголовок *
              </label>
              <textarea
                required
                value={formData.heroSubtitle}
                onChange={(e) => setFormData({...formData, heroSubtitle: e.target.value})}
                placeholder="Естественное омоложение без инъекций..."
                rows={2}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Текст кнопки *
                </label>
                <input
                  type="text"
                  required
                  value={formData.heroCtaText}
                  onChange={(e) => setFormData({...formData, heroCtaText: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ссылка кнопки
                </label>
                <input
                  type="text"
                  value={formData.heroCtaLink}
                  onChange={(e) => setFormData({...formData, heroCtaLink: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Marathons Section - будет продолжение в следующем файле */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold mb-4">🏃 Секция марафонов</h3>
          <p className="text-sm text-gray-600 mb-4">
            Правило №3: Ответьте на вопросы: что продаете, сколько стоит, как заказать
          </p>

          {/* Базовый марафон */}
          <div className="border-l-4 border-blue-500 pl-4 mb-6">
            <h4 className="font-semibold mb-4 text-blue-700">Базовый уровень</h4>
            
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Марафон
                </label>
                <select
                  value={formData.basicMarathonId}
                  onChange={(e) => setFormData({...formData, basicMarathonId: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">Не выбран</option>
                  {marathons.map(m => (
                    <option key={m._id} value={m._id}>{m.title}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Цена (₽)
                </label>
                <input
                  type="number"
                  value={formData.basicPrice}
                  onChange={(e) => setFormData({...formData, basicPrice: Number(e.target.value)})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Фичи (по одной на строку)
              </label>
              <textarea
                value={formData.basicFeatures.join('\n')}
                onChange={(e) => setFormData({...formData, basicFeatures: e.target.value.split('\n').filter(f => f.trim())})}
                rows={5}
                placeholder="33 упражнения с HD-видео&#10;Лимфодренажные техники&#10;..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>

          {/* Продвинутый марафон */}
          <div className="border-l-4 border-purple-500 pl-4">
            <h4 className="font-semibold mb-4 text-purple-700">Продвинутый уровень</h4>
            
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Марафон
                </label>
                <select
                  value={formData.advancedMarathonId}
                  onChange={(e) => setFormData({...formData, advancedMarathonId: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">Не выбран</option>
                  {marathons.map(m => (
                    <option key={m._id} value={m._id}>{m.title}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Цена (₽)
                </label>
                <input
                  type="number"
                  value={formData.advancedPrice}
                  onChange={(e) => setFormData({...formData, advancedPrice: Number(e.target.value)})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Фичи (по одной на строку)
              </label>
              <textarea
                value={formData.advancedFeatures.join('\n')}
                onChange={(e) => setFormData({...formData, advancedFeatures: e.target.value.split('\n').filter(f => f.trim())})}
                rows={5}
                placeholder="Все техники базового уровня&#10;Вакуумные техники&#10;..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isPublished}
                onChange={(e) => setFormData({...formData, isPublished: e.target.checked})}
                className="w-5 h-5 text-purple-600 rounded focus:ring-purple-500"
              />
              <span className="text-sm font-medium text-gray-700">
                Опубликовать сразу
              </span>
            </label>

            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => navigate('/landings')}
                className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
              >
                Отмена
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:shadow-lg transition disabled:opacity-50"
              >
                {loading ? 'Сохранение...' : id === 'new' ? 'Создать лендинг' : 'Сохранить'}
              </button>
            </div>
          </div>
        </div>
      </form>

      {/* Section Editor Modal */}
      {editingSection && (
        <SectionEditorModal
          sectionType={editingSection}
          data={sectionData[editingSection as keyof typeof sectionData]}
          onSave={handleSaveSection}
          onClose={() => setEditingSection(null)}
        />
      )}
    </div>
  );
};

export default LandingEditor;

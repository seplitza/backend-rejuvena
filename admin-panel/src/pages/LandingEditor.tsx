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
    [key: string]: any; // Поддержка динамических ключей для копий
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
    basicOldPrice: undefined as number | undefined,
    basicDuration: '',
    basicFeatures: [] as string[],
    
    advancedMarathonId: '',
    advancedTitle: 'Продвинутый уровень',
    advancedStartDate: '',
    advancedPrice: 0,
    advancedOldPrice: undefined as number | undefined,
    advancedDuration: '',
    advancedFeatures: [] as string[],
    
    // Интерактивные элементы  
    detailModals: [] as Array<{ title: string; content: string; linkText?: string; linkUrl?: string; position?: string }>,
    enrollButtons: [] as Array<{ text: string; targetId: string; position?: string }>,
    paymentButtons: [] as Array<{ text: string; targetId: string; position?: string }>,
    videoBlocks: [] as Array<{ title?: string; videoUrl: string; poster?: string; order: number; position?: string }>,
    
    isPublished: false,
    showStartDateBlock: true // По умолчанию показываем анимированный блок с датой старта
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
        console.log('📥 Loaded landing:', landing);
        console.log('📥 Marathon IDs:', {
          basic: landing.marathonsSection?.basic?.marathonId || landing.marathonsSection?.basic?._id,
          advanced: landing.marathonsSection?.advanced?.marathonId || landing.marathonsSection?.advanced?._id,
          basicType: typeof (landing.marathonsSection?.basic?.marathonId || landing.marathonsSection?.basic?._id),
          advancedType: typeof (landing.marathonsSection?.advanced?.marathonId || landing.marathonsSection?.advanced?._id)
        });
        
        // Backend возвращает populated объекты марафонов, берем _id и конвертируем в строку
        const basicMarathonObj = landing.marathonsSection?.basic;
        const advancedMarathonObj = landing.marathonsSection?.advanced;
        
        // Извлекаем _id из объекта если это объект, иначе используем как есть
        let basicMarathonId = '';
        let advancedMarathonId = '';
        
        if (basicMarathonObj) {
          console.log('🔍 basicMarathonObj type:', typeof basicMarathonObj, basicMarathonObj);
          if (typeof basicMarathonObj === 'string') {
            basicMarathonId = basicMarathonObj;
          } else if (basicMarathonObj.marathonId) {
            // Backend populate заполняет поле marathonId внутри basic
            const marathonIdObj = basicMarathonObj.marathonId;
            if (typeof marathonIdObj === 'string') {
              basicMarathonId = marathonIdObj;
            } else if (marathonIdObj._id) {
              basicMarathonId = `${marathonIdObj._id}`;
            }
            console.log('🔍 Extracted from marathonId:', basicMarathonId);
          } else if (basicMarathonObj._id) {
            // Fallback - если структура другая
            basicMarathonId = `${basicMarathonObj._id}`;
          }
        }
        
        if (advancedMarathonObj) {
          if (typeof advancedMarathonObj === 'string') {
            advancedMarathonId = advancedMarathonObj;
          } else if (advancedMarathonObj.marathonId) {
            const marathonIdObj = advancedMarathonObj.marathonId;
            if (typeof marathonIdObj === 'string') {
              advancedMarathonId = marathonIdObj;
            } else if (marathonIdObj._id) {
              advancedMarathonId = `${marathonIdObj._id}`;
            }
          } else if (advancedMarathonObj._id) {
            advancedMarathonId = `${advancedMarathonObj._id}`;
          }
        }
        
        console.log('📥 Converted IDs:', { basicMarathonId, advancedMarathonId });
        
        setFormData({
          slug: landing.slug,
          title: landing.title,
          metaDescription: landing.metaDescription,
          heroTitle: landing.heroSection.title,
          heroSubtitle: landing.heroSection.subtitle,
          heroCtaText: landing.heroSection.ctaButton.text,
          heroCtaLink: landing.heroSection.ctaButton.link,
          marathonsSectionTitle: landing.marathonsSection?.sectionTitle || 'Выберите свой уровень',
          basicMarathonId: basicMarathonId,
          basicTitle: landing.marathonsSection?.basic?.title || '',
          basicStartDate: landing.marathonsSection?.basic?.startDate || '',
          basicPrice: landing.marathonsSection?.basic?.price || 0,
          basicOldPrice: landing.marathonsSection?.basic?.oldPrice,
          basicDuration: landing.marathonsSection?.basic?.duration || '',
          basicFeatures: landing.marathonsSection?.basic?.features || [],
          advancedMarathonId: advancedMarathonId,
          advancedTitle: landing.marathonsSection?.advanced?.title || '',
          advancedStartDate: landing.marathonsSection?.advanced?.startDate || '',
          advancedPrice: landing.marathonsSection?.advanced?.price || 0,
          advancedOldPrice: landing.marathonsSection?.advanced?.oldPrice,
          advancedDuration: landing.marathonsSection?.advanced?.duration || '',
          advancedFeatures: landing.marathonsSection?.advanced?.features || [],
          
          // Интерактивные элементы
          detailModals: landing.detailModals || [],
          enrollButtons: landing.enrollButtons || [],
          paymentButtons: landing.paymentButtons || [],
          videoBlocks: landing.videoBlocks || [],
          
          isPublished: landing.isPublished,
          showStartDateBlock: landing.showStartDateBlock !== undefined ? landing.showStartDateBlock : true
        });

        // Load section data (including copies)
        const newSectionData: any = { ...sectionData };
        const newSections: SectionConfig[] = [...sections];
        
        // Load base sections
        if (landing.featuresSection) {
          newSectionData.features = landing.featuresSection;
        }
        if (landing.problemsSection) {
          newSectionData.problems = landing.problemsSection;
        }
        if (landing.aboutSection) {
          newSectionData.about = landing.aboutSection;
        }
        if (landing.stepsSection) {
          newSectionData.steps = landing.stepsSection;
        }
        if (landing.processSection) {
          newSectionData.process = landing.processSection;
        }
        if (landing.statsSection) {
          newSectionData.stats = landing.statsSection;
        }
        if (landing.resultsGallerySection) {
          newSectionData.resultsGallery = landing.resultsGallerySection;
        }
        if (landing.testimonialsGallerySection) {
          newSectionData.testimonialsGallery = landing.testimonialsGallerySection;
        }

        // Load copied sections (e.g. featuresSection_copy_1738747234)
        Object.keys(landing).forEach(key => {
          if (key.includes('Section_copy_')) {
            // Extract type and timestamp: featuresSection_copy_1738747234 -> features-copy-1738747234
            const match = key.match(/^(\w+)Section_copy_(\d+)$/);
            if (match) {
              const baseType = match[1];
              const timestamp = match[2];
              const sectionId = `${baseType}-copy-${timestamp}`;
              
              // Add to section data
              newSectionData[sectionId] = landing[key];
              
              // Add to sections list
              const baseSection = sections.find(s => s.id === baseType);
              if (baseSection) {
                newSections.push({
                  ...baseSection,
                  id: sectionId,
                  title: `${baseSection.title} (копия)`,
                  isRequired: false,
                  isVisible: true
                });
              }
            }
          }
        });

        setSectionData(newSectionData);

        // Update section visibility for base sections
        setSections(newSections.map(section => {
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
          ...(formData.basicMarathonId && formData.basicMarathonId.trim() !== '' ? {
            basic: {
              marathonId: formData.basicMarathonId,
              title: formData.basicTitle,
              startDate: formData.basicStartDate,
              price: formData.basicPrice,
              oldPrice: formData.basicOldPrice,
              duration: formData.basicDuration,
              features: formData.basicFeatures,
              ctaButton: {
                text: 'Начать обучение',
                link: '/marathons'
              }
            }
          } : {}),
          ...(formData.advancedMarathonId && formData.advancedMarathonId.trim() !== '' ? {
            advanced: {
              marathonId: formData.advancedMarathonId,
              title: formData.advancedTitle,
              startDate: formData.advancedStartDate,
              price: formData.advancedPrice,
              oldPrice: formData.advancedOldPrice,
              duration: formData.advancedDuration,
              features: formData.advancedFeatures,
              ctaButton: {
                text: 'Перейти на PRO',
                link: '/marathons'
              }
            }
          } : {})
        },
        
        // Интерактивные элементы
        ...(formData.detailModals.length > 0 && { detailModals: formData.detailModals }),
        ...(formData.enrollButtons.length > 0 && { enrollButtons: formData.enrollButtons }),
        ...(formData.paymentButtons.length > 0 && { paymentButtons: formData.paymentButtons }),
        ...(formData.videoBlocks.length > 0 && { videoBlocks: formData.videoBlocks }),
        
        isPublished: formData.isPublished,
        showStartDateBlock: formData.showStartDateBlock
      };

      // Add visible sections (including duplicates)
      const visibleSections = sections.filter(s => s.isVisible && !s.isRequired);
      console.log('💾 Saving sections:', visibleSections.map(s => s.id));
      console.log('💾 Section data keys:', Object.keys(sectionData));
      
      visibleSections.forEach(section => {
        const baseType = section.id.split('-copy-')[0] as string;
        const sectionKey = section.id; // Используем полный ID (features или features-copy-123)
        
        console.log(`💾 Processing section ${sectionKey}:`, {
          hasData: !!sectionData[sectionKey],
          hasBaseData: !!sectionData[baseType],
          data: sectionData[sectionKey] || sectionData[baseType]
        });
        
        // Проверяем есть ли данные для этой секции (по полному ID)
        if (sectionData[sectionKey]) {
          // Для копий создаем уникальное поле (например featuresSection_copy_123)
          const fieldName = section.id.includes('-copy-') 
            ? `${baseType}Section_${section.id.split('-copy-')[1]}`
            : `${baseType}Section`;
          
          landingData[fieldName] = sectionData[sectionKey];
        } else if (sectionData[baseType]) {
          // Если это копия без своих данных, используем данные оригинала
          const fieldName = section.id.includes('-copy-') 
            ? `${baseType}Section_${section.id.split('-copy-')[1]}`
            : `${baseType}Section`;
          
          landingData[fieldName] = sectionData[baseType];
        }
      });

      console.log('📤 Sending data:', {
        marathonsSection: landingData.marathonsSection,
        allKeys: Object.keys(landingData),
        customFields: Object.keys(landingData).filter(k => /Section_\d+$/.test(k)),
        landingDataSample: landingData
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
      
      // Детальная обработка ошибки
      let errorMessage = 'Ошибка сохранения лендинга';
      let errorDetails = '';
      
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
        
        // Дополнительные детали
        if (error.response.data.details) {
          errorDetails = JSON.stringify(error.response.data.details, null, 2);
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      // Логируем полную ошибку
      console.error('🚨 Full error details:', {
        message: errorMessage,
        details: errorDetails,
        response: error.response?.data,
        status: error.response?.status
      });
      
      // Показываем подробное сообщение
      alert(`❌ Ошибка сохранения:\n\n${errorMessage}\n\n${errorDetails ? `Детали:\n${errorDetails}` : ''}\n\nПроверьте консоль браузера для подробностей.`);
    } finally {
      setLoading(false);
    }
  };

  const handleEditSection = (sectionId: string) => {
    // Извлекаем базовый тип секции (без -copy-timestamp)
    const baseType = sectionId.split('-copy-')[0];
    
    if (!['features', 'problems', 'about', 'steps', 'process', 'stats', 'resultsGallery', 'testimonialsGallery'].includes(baseType)) {
      alert('Для Hero и Marathons используйте основную форму');
      return;
    }
    setEditingSection(sectionId);
  };

  const handleSaveSection = (data: any) => {
    if (!editingSection) return;
    
    console.log(`💾 Saving section ${editingSection} with data:`, data);
    
    setSectionData(prev => {
      const newData = {
        ...prev,
        [editingSection]: data // Сохраняем с полным ID (включая -copy-)
      };
      console.log('💾 New sectionData state:', Object.keys(newData));
      return newData;
    });
    
    // Закрываем модалку после сохранения
    setEditingSection(null);
  };

  // Обработчик копирования секции с данными
  const handleDuplicateSection = (newSections: SectionConfig[]) => {
    // Находим новую секцию (последнюю добавленную копию)
    const oldSectionIds = sections.map(s => s.id);
    const newSection = newSections.find(s => !oldSectionIds.includes(s.id));
    
    if (newSection && newSection.id.includes('-copy-')) {
      const baseType = newSection.id.split('-copy-')[0];
      
      // Копируем данные оригинальной секции в новую
      if (sectionData[baseType]) {
        setSectionData(prev => ({
          ...prev,
          [newSection.id]: { ...sectionData[baseType] }
        }));
      }
    }
    
    setSections(newSections);
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
        onSectionsChange={handleDuplicateSection}
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
                rows={4}
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
                  Дата старта марафона
                </label>
                <input
                  type="date"
                  value={formData.basicStartDate ? new Date(formData.basicStartDate).toISOString().split('T')[0] : ''}
                  onChange={(e) => setFormData({...formData, basicStartDate: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                />
                <p className="text-xs text-gray-500 mt-1">Используется для обратного отсчета в блоке "Старт марафона"</p>
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
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Старая цена (₽)
                </label>
                <input
                  type="number"
                  value={formData.basicOldPrice || ''}
                  onChange={(e) => setFormData({...formData, basicOldPrice: e.target.value ? Number(e.target.value) : undefined})}
                  placeholder="Например, 4500"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                />
                <p className="text-xs text-gray-500 mt-1">Показывается перечеркнутой на лендинге</p>
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
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Старая цена (₽)
                </label>
                <input
                  type="number"
                  value={formData.advancedOldPrice || ''}
                  onChange={(e) => setFormData({...formData, advancedOldPrice: e.target.value ? Number(e.target.value) : undefined})}
                  placeholder="Например, 6000"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                />
                <p className="text-xs text-gray-500 mt-1">Показывается перечеркнутой на лендинге</p>
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

        {/* Интерактивные элементы */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold mb-4">🎯 Интерактивные элементы</h3>
          
          {/* Модальные окна "Подробнее" */}
          <div className="mb-6">
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              <span>💬 Модальные окна "Подробнее"</span>
              <span className="text-xs text-gray-500">(используйте ↑↓ для изменения порядка)</span>
            </h4>
            {formData.detailModals.map((modal, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4 mb-3">
                <div className="flex justify-between items-center mb-3">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">Модальное окно #{index + 1}</span>
                    <div className="flex gap-1">
                      {index > 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            const newModals = [...formData.detailModals];
                            [newModals[index - 1], newModals[index]] = [newModals[index], newModals[index - 1]];
                            setFormData({...formData, detailModals: newModals});
                          }}
                          className="text-gray-500 hover:text-gray-700 px-1"
                          title="Переместить вверх"
                        >
                          ↑
                        </button>
                      )}
                      {index < formData.detailModals.length - 1 && (
                        <button
                          type="button"
                          onClick={() => {
                            const newModals = [...formData.detailModals];
                            [newModals[index], newModals[index + 1]] = [newModals[index + 1], newModals[index]];
                            setFormData({...formData, detailModals: newModals});
                          }}
                          className="text-gray-500 hover:text-gray-700 px-1"
                          title="Переместить вниз"
                        >
                          ↓
                        </button>
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFormData({
                      ...formData,
                      detailModals: formData.detailModals.filter((_, i) => i !== index)
                    })}
                    className="text-red-500 hover:text-red-700 text-sm"
                  >
                    Удалить
                  </button>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Показать после секции:</label>
                    <select
                      value={modal.position || 'hero'}
                      onChange={(e) => {
                        const newModals = [...formData.detailModals];
                        newModals[index].position = e.target.value;
                        setFormData({...formData, detailModals: newModals});
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    >
                      <option value="hero">После Hero (первый экран)</option>
                      <option value="features">После "Что такое система"</option>
                      <option value="problems">После "Проблемы которые решаем"</option>
                      <option value="about">После "Об авторе"</option>
                      <option value="steps">После "Ступени системы"</option>
                      <option value="process">После "Как проходит программа"</option>
                      <option value="stats">После "Результаты клиентов"</option>
                      <option value="resultsGallery">После "Галерея результатов"</option>
                      <option value="testimonialsGallery">После "Галерея отзывов"</option>
                    </select>
                  </div>
                  <input
                    type="text"
                    placeholder="Заголовок модального окна"
                    value={modal.title}
                    onChange={(e) => {
                      const newModals = [...formData.detailModals];
                      newModals[index].title = e.target.value;
                      setFormData({...formData, detailModals: newModals});
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                  <textarea
                    placeholder="Текст (можно использовать markdown: **жирный**, *курсив*, ## заголовок)"
                    value={modal.content}
                    onChange={(e) => {
                      const newModals = [...formData.detailModals];
                      newModals[index].content = e.target.value;
                      setFormData({...formData, detailModals: newModals});
                    }}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="text"
                      placeholder="Текст ссылки (необязательно)"
                      value={modal.linkText || ''}
                      onChange={(e) => {
                        const newModals = [...formData.detailModals];
                        newModals[index].linkText = e.target.value;
                        setFormData({...formData, detailModals: newModals});
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                    <input
                      type="text"
                      placeholder="URL ссылки"
                      value={modal.linkUrl || ''}
                      onChange={(e) => {
                        const newModals = [...formData.detailModals];
                        newModals[index].linkUrl = e.target.value;
                        setFormData({...formData, detailModals: newModals});
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                  </div>
                </div>
              </div>
            ))}
            <button
              type="button"
              onClick={() => setFormData({
                ...formData,
                detailModals: [...formData.detailModals, { title: '', content: '', position: 'hero' }]
              })}
              className="text-purple-600 hover:text-purple-700 text-sm font-medium"
            >
              + Добавить модальное окно
            </button>
          </div>

          {/* Кнопки записи на марафон */}
          <div className="mb-6">
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              <span>✍️ Кнопки "Записаться на марафон"</span>
              <span className="text-xs text-gray-500">(для разных секций, используйте ↑↓ для порядка)</span>
            </h4>
            {formData.enrollButtons.map((button, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4 mb-3">
                <div className="flex justify-between items-center mb-3">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">Кнопка #{index + 1}</span>
                    <div className="flex gap-1">
                      {index > 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            const newButtons = [...formData.enrollButtons];
                            [newButtons[index - 1], newButtons[index]] = [newButtons[index], newButtons[index - 1]];
                            setFormData({...formData, enrollButtons: newButtons});
                          }}
                          className="text-gray-500 hover:text-gray-700 px-1"
                          title="Переместить вверх"
                        >
                          ↑
                        </button>
                      )}
                      {index < formData.enrollButtons.length - 1 && (
                        <button
                          type="button"
                          onClick={() => {
                            const newButtons = [...formData.enrollButtons];
                            [newButtons[index], newButtons[index + 1]] = [newButtons[index + 1], newButtons[index]];
                            setFormData({...formData, enrollButtons: newButtons});
                          }}
                          className="text-gray-500 hover:text-gray-700 px-1"
                          title="Переместить вниз"
                        >
                          ↓
                        </button>
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFormData({
                      ...formData,
                      enrollButtons: formData.enrollButtons.filter((_, i) => i !== index)
                    })}
                    className="text-red-500 hover:text-red-700 text-sm"
                  >
                    Удалить
                  </button>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Показать после секции:</label>
                    <select
                      value={button.position || 'hero'}
                      onChange={(e) => {
                        const newButtons = [...formData.enrollButtons];
                        newButtons[index].position = e.target.value;
                        setFormData({...formData, enrollButtons: newButtons});
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    >
                      <option value="hero">После Hero (первый экран)</option>
                      <option value="features">После "Что такое система"</option>
                      <option value="problems">После "Проблемы которые решаем"</option>
                      <option value="about">После "Об авторе"</option>
                      <option value="steps">После "Ступени системы"</option>
                      <option value="process">После "Как проходит программа"</option>
                      <option value="stats">После "Результаты клиентов"</option>
                      <option value="resultsGallery">После "Галерея результатов"</option>
                      <option value="testimonialsGallery">После "Галерея отзывов"</option>
                      <option value="marathons">После блока Тарифы</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="text"
                      placeholder="Текст кнопки"
                      value={button.text}
                      onChange={(e) => {
                        const newButtons = [...formData.enrollButtons];
                        newButtons[index].text = e.target.value;
                      setFormData({...formData, enrollButtons: newButtons});
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                  <input
                    type="text"
                    placeholder="ID блока (например, marathons)"
                    value={button.targetId}
                    onChange={(e) => {
                      const newButtons = [...formData.enrollButtons];
                      newButtons[index].targetId = e.target.value;
                      setFormData({...formData, enrollButtons: newButtons});
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                </div>
              </div>
            </div>
            ))}
            <button
              type="button"
              onClick={() => setFormData({
                ...formData,
                enrollButtons: [...formData.enrollButtons, { text: 'Записаться на марафон', targetId: 'marathons', position: 'hero' }]
              })}
              className="text-purple-600 hover:text-purple-700 text-sm font-medium"
            >
              + Добавить кнопку записи
            </button>
          </div>

          {/* Кнопки оплаты */}
          <div className="mb-6">
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              <span>💳 Кнопки "Оплатить сейчас"</span>
              <span className="text-xs text-gray-500">(для разных секций, используйте ↑↓ для порядка)</span>
            </h4>
            {formData.paymentButtons.map((button, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4 mb-3">
                <div className="flex justify-between items-center mb-3">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">Кнопка #{index + 1}</span>
                    <div className="flex gap-1">
                      {index > 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            const newButtons = [...formData.paymentButtons];
                            [newButtons[index - 1], newButtons[index]] = [newButtons[index], newButtons[index - 1]];
                            setFormData({...formData, paymentButtons: newButtons});
                          }}
                          className="text-gray-500 hover:text-gray-700 px-1"
                          title="Переместить вверх"
                        >
                          ↑
                        </button>
                      )}
                      {index < formData.paymentButtons.length - 1 && (
                        <button
                          type="button"
                          onClick={() => {
                            const newButtons = [...formData.paymentButtons];
                            [newButtons[index], newButtons[index + 1]] = [newButtons[index + 1], newButtons[index]];
                            setFormData({...formData, paymentButtons: newButtons});
                          }}
                          className="text-gray-500 hover:text-gray-700 px-1"
                          title="Переместить вниз"
                        >
                          ↓
                        </button>
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFormData({
                      ...formData,
                      paymentButtons: formData.paymentButtons.filter((_, i) => i !== index)
                    })}
                    className="text-red-500 hover:text-red-700 text-sm"
                  >
                    Удалить
                  </button>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Показать после секции:</label>
                    <select
                      value={button.position || 'hero'}
                      onChange={(e) => {
                        const newButtons = [...formData.paymentButtons];
                        newButtons[index].position = e.target.value;
                        setFormData({...formData, paymentButtons: newButtons});
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    >
                      <option value="hero">После Hero (первый экран)</option>
                      <option value="features">После "Что такое система"</option>
                      <option value="problems">После "Проблемы которые решаем"</option>
                      <option value="about">После "Об авторе"</option>
                      <option value="steps">После "Ступени системы"</option>
                      <option value="process">После "Как проходит программа"</option>
                      <option value="stats">После "Результаты клиентов"</option>
                      <option value="resultsGallery">После "Галерея результатов"</option>
                      <option value="testimonialsGallery">После "Галерея отзывов"</option>
                      <option value="marathons">После блока Тарифы</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="text"
                      placeholder="Текст кнопки"
                      value={button.text}
                      onChange={(e) => {
                        const newButtons = [...formData.paymentButtons];
                        newButtons[index].text = e.target.value;
                      setFormData({...formData, paymentButtons: newButtons});
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                  <input
                    type="text"
                    placeholder="ID блока (например, marathons)"
                    value={button.targetId}
                    onChange={(e) => {
                      const newButtons = [...formData.paymentButtons];
                      newButtons[index].targetId = e.target.value;
                      setFormData({...formData, paymentButtons: newButtons});
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                </div>
              </div>
            </div>
            ))}
            <button
              type="button"
              onClick={() => setFormData({
                ...formData,
                paymentButtons: [...formData.paymentButtons, { text: 'Оплатить сейчас', targetId: 'marathons', position: 'hero' }]
              })}
              className="text-purple-600 hover:text-purple-700 text-sm font-medium"
            >
              + Добавить кнопку оплаты
            </button>
          </div>

          {/* Видео блоки */}
          <div className="mb-6">
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              <span>🎥 Видео блоки</span>
              <span className="text-xs text-gray-500">(карусель если больше 1)</span>
            </h4>
            {formData.videoBlocks.map((video, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4 mb-3">
                <div className="flex justify-between items-center mb-3">
                  <span className="font-medium text-sm">Видео #{index + 1}</span>
                  <button
                    type="button"
                    onClick={() => setFormData({
                      ...formData,
                      videoBlocks: formData.videoBlocks.filter((_, i) => i !== index)
                    })}
                    className="text-red-500 hover:text-red-700 text-sm"
                  >
                    Удалить
                  </button>
                </div>
                <div className="space-y-3">
                  <input
                    type="text"
                    placeholder="Заголовок (необязательно)"
                    value={video.title || ''}
                    onChange={(e) => {
                      const newVideos = [...formData.videoBlocks];
                      newVideos[index].title = e.target.value;
                      setFormData({...formData, videoBlocks: newVideos});
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                  <input
                    type="text"
                    placeholder="URL видео (YouTube, Vimeo, прямая ссылка)"
                    value={video.videoUrl}
                    onChange={(e) => {
                      const newVideos = [...formData.videoBlocks];
                      newVideos[index].videoUrl = e.target.value;
                      setFormData({...formData, videoBlocks: newVideos});
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                  <input
                    type="text"
                    placeholder="URL постера (необязательно)"
                    value={video.poster || ''}
                    onChange={(e) => {
                      const newVideos = [...formData.videoBlocks];
                      newVideos[index].poster = e.target.value;
                      setFormData({...formData, videoBlocks: newVideos});
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                  <input
                    type="number"
                    placeholder="Порядок (0-10)"
                    value={video.order}
                    onChange={(e) => {
                      const newVideos = [...formData.videoBlocks];
                      newVideos[index].order = Number(e.target.value);
                      setFormData({...formData, videoBlocks: newVideos});
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                </div>
              </div>
            ))}
            <button
              type="button"
              onClick={() => setFormData({
                ...formData,
                videoBlocks: [...formData.videoBlocks, { videoUrl: '', order: formData.videoBlocks.length }]
              })}
              className="text-purple-600 hover:text-purple-700 text-sm font-medium"
            >
              + Добавить видео
            </button>
          </div>
        </div>

        {/* Actions */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex flex-col gap-4 mb-4">
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
            
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.showStartDateBlock}
                onChange={(e) => setFormData({...formData, showStartDateBlock: e.target.checked})}
                className="w-5 h-5 text-purple-600 rounded focus:ring-purple-500"
              />
              <span className="text-sm font-medium text-gray-700">
                🚀 Показывать анимированный блок "Старт марафона" с обратным отсчетом
              </span>
            </label>
          </div>
          
          <div className="flex items-center justify-between">

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
      {editingSection && (() => {
        // Извлекаем базовый тип для определения редактора
        const baseType = editingSection.split('-copy-')[0];
        
        return (
          <SectionEditorModal
            sectionType={baseType}
            data={sectionData[editingSection] || sectionData[baseType]}
            onSave={handleSaveSection}
            onClose={() => setEditingSection(null)}
          />
        );
      })()}
    </div>
  );
};

export default LandingEditor;

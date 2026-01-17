import { useState, FormEvent } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { signupWithEmail } from '@/store/modules/auth/slice';

export default function Signup() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { loading, error } = useAppSelector((state) => state.auth);
  
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [language, setLanguage] = useState<'ru' | 'en'>('ru'); // Русский по умолчанию

  const t = {
    ru: {
      title: 'Создать аккаунт',
      subtitle: 'Начните свой путь естественного омоложения',
      firstName: 'Имя',
      lastName: 'Фамилия',
      email: 'Email адрес',
      agree: 'Я согласен с',
      terms: 'Условиями использования',
      and: 'и',
      privacy: 'Политикой конфиденциальности',
      createAccount: 'Создать аккаунт',
      haveAccount: 'Уже есть аккаунт?',
      signIn: 'Войти',
      agreeError: 'Пожалуйста, согласитесь с условиями',
      // Modal
      successTitle: 'Регистрация прошла успешно!',
      successMessage: 'Проверьте свой email и используйте временный пароль для входа.',
      successNote: 'Обязательно смените пароль на собственный в личном кабинете.',
      goToLogin: 'Перейти на страницу входа',
    },
    en: {
      title: 'Create Account',
      subtitle: 'Start your natural rejuvenation journey',
      firstName: 'First Name',
      lastName: 'Last Name',
      email: 'Email Address',
      agree: 'I agree to the',
      terms: 'Terms and Conditions',
      and: 'and',
      privacy: 'Privacy Policy',
      createAccount: 'Create Account',
      haveAccount: 'Already have an account?',
      signIn: 'Sign In',
      agreeError: 'Please agree to terms and conditions',
      // Modal
      successTitle: 'Registration Successful!',
      successMessage: 'Check your email and use the temporary password to login.',
      successNote: 'Please change your password in your profile settings.',
      goToLogin: 'Go to Login',
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!agreedToTerms) {
      alert(t[language].agreeError);
      return;
    }
    
    const result = await dispatch(signupWithEmail({ email, firstName, lastName }));
    
    // Если регистрация успешна - показываем модальное окно
    if (result.meta.requestStatus === 'fulfilled') {
      setShowSuccessModal(true);
    }
  };

  const handleGoToLogin = () => {
    router.push('/auth/login');
  };

  return (
    <>
      <Head>
        <title>{t[language].title} - Rejuvena</title>
      </Head>
      
      {/* Language Switcher */}
      <div className="fixed top-4 right-4 z-50">
        <button
          onClick={() => setLanguage(language === 'ru' ? 'en' : 'ru')}
          className="px-4 py-2 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow flex items-center gap-2"
        >
          <span className="text-lg">{language === 'ru' ? '🇷🇺' : '🇬🇧'}</span>
          <span className="text-sm font-medium">{language === 'ru' ? 'RU' : 'EN'}</span>
        </button>
      </div>

      <div className="min-h-screen bg-gradient-to-b from-pink-50 to-white flex items-center justify-center px-4 py-12">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{t[language].title}</h1>
            <p className="text-gray-600">{t[language].subtitle}</p>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
              <strong>Error:</strong> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
                {t[language].firstName}
              </label>
              <input
                id="firstName"
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                placeholder={language === 'ru' ? 'Иван' : 'John'}
              />
            </div>

            <div>
              <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">
                {t[language].lastName}
              </label>
              <input
                id="lastName"
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                placeholder={language === 'ru' ? 'Иванов' : 'Doe'}
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                {t[language].email}
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                placeholder="example@mail.com"
              />
            </div>

            <div className="flex items-start">
              <input
                id="terms"
                type="checkbox"
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
                className="mt-1 h-4 w-4 text-pink-600 focus:ring-pink-500 border-gray-300 rounded"
              />
              <label htmlFor="terms" className="ml-2 text-sm text-gray-600">
                {t[language].agree}{' '}
                <Link href="/terms" className="text-pink-600 hover:text-pink-700 underline">
                  {t[language].terms}
                </Link>
                {' '}{t[language].and}{' '}
                <Link href="/privacy" className="text-pink-600 hover:text-pink-700 underline">
                  {t[language].privacy}
                </Link>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-pink-500 to-pink-600 text-white font-semibold py-3 rounded-lg hover:from-pink-600 hover:to-pink-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (language === 'ru' ? 'Загрузка...' : 'Loading...') : t[language].createAccount}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-600">
            {t[language].haveAccount}{' '}
            <Link href="/auth/login" className="text-pink-600 hover:text-pink-700 font-semibold">
              {t[language].signIn}
            </Link>
          </p>
        </div>
      </div>

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 transform transition-all">
            <div className="text-center">
              <div className="mb-4">
                <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
              
              <h2 className="text-2xl font-bold text-gray-900 mb-3">
                {t[language].successTitle}
              </h2>
              
              <p className="text-gray-600 mb-2">
                {t[language].successMessage}
              </p>
              
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 my-4">
                <p className="text-sm text-yellow-800">
                  ⚠️ {t[language].successNote}
                </p>
              </div>

              <button
                onClick={handleGoToLogin}
                className="w-full bg-gradient-to-r from-pink-500 to-pink-600 text-white font-semibold py-3 rounded-lg hover:from-pink-600 hover:to-pink-700 transition-all"
              >
                {t[language].goToLogin}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

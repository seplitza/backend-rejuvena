import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ExerciseList from './pages/ExerciseList';
import ExerciseEditor from './pages/ExerciseEditor';
import ExerciseCategoriesPage from './pages/ExerciseCategoriesPage';
import Comments from './pages/Comments';
import EmailTemplates from './pages/EmailTemplates';
import EmailCampaigns from './pages/EmailCampaigns';
import EmailCampaignEditor from './pages/EmailCampaignEditor';
import Users from './pages/Users';
import Notifications from './pages/Notifications';
import Orders from './pages/Orders';
import Revenue from './pages/Revenue';
import MarathonList from './pages/MarathonList';
import MarathonEditor from './pages/MarathonEditor';
import MediaLibrary from './pages/MediaLibrary';
import LandingList from './pages/LandingList';
import LandingEditor from './pages/LandingEditor';
import ThemeManagement from './pages/ThemeManagement';
import OfferManagement from './pages/OfferManagement';
import OfferEditor from './pages/OfferEditor';
// Shop pages
import Products from './pages/Products';
import ProductEditor from './pages/ProductEditor';
import ProductCategories from './pages/ProductCategories';
import PromoCodes from './pages/PromoCodes';
import FortuneWheel from './pages/FortuneWheel';
import ShopOrders from './pages/ShopOrders';
import Layout from './components/Layout';
import { getAuthToken } from './utils/auth';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getAuthToken();
    setIsAuthenticated(!!token);
    setLoading(false);
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <Router basename="/admin">
      <Routes>
        <Route path="/login" element={
          isAuthenticated ? <Navigate to="/dashboard" /> : <Login onLogin={() => setIsAuthenticated(true)} />
        } />
        
        <Route path="/" element={isAuthenticated ? <Layout onLogout={() => setIsAuthenticated(false)} /> : <Navigate to="/login" />}>
          <Route index element={<Navigate to="/dashboard" />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="exercises" element={<ExerciseList />} />
          <Route path="exercises/new" element={<ExerciseEditor />} />
          <Route path="exercises/:id" element={<ExerciseEditor />} />
          <Route path="exercise-categories" element={<ExerciseCategoriesPage />} />
          <Route path="comments" element={<Comments />} />
          <Route path="email-templates" element={<EmailTemplates />} />
          <Route path="email-campaigns" element={<EmailCampaigns />} />
          <Route path="email-campaigns/:id" element={<EmailCampaignEditor />} />
          <Route path="users" element={<Users />} />
          <Route path="notifications" element={<Notifications />} />
          <Route path="orders" element={<Orders />} />
          <Route path="revenue" element={<Revenue />} />
          <Route path="marathons" element={<MarathonList />} />
          <Route path="marathons/new" element={<MarathonEditor />} />
          <Route path="marathons/:id" element={<MarathonEditor />} />
          <Route path="landings" element={<LandingList />} />
          <Route path="landings/new" element={<LandingEditor />} />
          <Route path="landings/:id" element={<LandingEditor />} />
          <Route path="media" element={<MediaLibrary />} />
          <Route path="themes" element={<ThemeManagement />} />
          <Route path="offers" element={<OfferManagement />} />
          <Route path="offers/new" element={<OfferEditor />} />
          <Route path="offers/edit/:id" element={<OfferEditor />} />
          {/* Shop routes */}
          <Route path="products" element={<Products />} />
          <Route path="products/new" element={<ProductEditor />} />
          <Route path="products/:id" element={<ProductEditor />} />
          <Route path="product-categories" element={<ProductCategories />} />
          <Route path="promo-codes" element={<PromoCodes />} />
          <Route path="fortune-wheel" element={<FortuneWheel />} />
          <Route path="shop-orders" element={<ShopOrders />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;


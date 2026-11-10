import { Navigate, Route, Routes } from 'react-router-dom';
import { useStore } from './context/StoreContext.jsx';
import { NAV } from './utils/constants.js';
import Layout from './components/Layout.jsx';
import LoginPage from './pages/LoginPage.jsx';
import OrdersPage from './pages/OrdersPage.jsx';
import OrderPage from './pages/OrderPage.jsx';
import NewOrderPage from './pages/NewOrderPage.jsx';
import PartiesPage from './pages/PartiesPage.jsx';
import PartyPage from './pages/PartyPage.jsx';
import ServicesPage from './pages/ServicesPage.jsx';
import MyStagesPage from './pages/MyStagesPage.jsx';
import MyReviewsPage from './pages/MyReviewsPage.jsx';
import MyServicesPage from './pages/MyServicesPage.jsx';
import StatsPage from './pages/StatsPage.jsx';
import UsersPage from './pages/UsersPage.jsx';
import NotFoundPage from './pages/NotFoundPage.jsx';

/** Завантаження / помилка початкового запиту до API */
function Boot({ children }) {
  const { loading, error, load } = useStore();
  if (loading) return <div className="center-box"><div><div className="spinner" />Завантаження даних…</div></div>;
  if (error) return <div className="center-box"><div><p>{error}</p><button className="btn pri" onClick={load}>Повторити</button></div></div>;
  return children;
}

/** Захищений маршрут: без входу → /login; не та роль → на головну своєї ролі */
function Guard({ allow, children }) {
  const { user } = useStore();
  if (!user) return <Navigate to="/login" replace />;
  if (allow && !allow.includes(user.role)) return <Navigate to={NAV[user.role][0][0]} replace />;
  return children;
}

function Home() {
  const { user } = useStore();
  return <Navigate to={user ? NAV[user.role][0][0] : '/login'} replace />;
}

export default function App() {
  const page = (allow, el) => <Guard allow={allow}>{el}</Guard>;
  return (
    <Boot>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<Guard><Layout /></Guard>}>
          <Route path="/orders" element={page(['manager', 'head'], <OrdersPage />)} />
          <Route path="/orders/new" element={page(['manager'], <NewOrderPage />)} />
          <Route path="/orders/:id" element={page(['manager', 'head'], <OrderPage />)} />
          <Route path="/parties" element={page(['manager'], <PartiesPage />)} />
          <Route path="/parties/:id" element={page(['manager'], <PartyPage />)} />
          <Route path="/services" element={page(['manager'], <ServicesPage />)} />
          <Route path="/my-stages" element={page(['master'], <MyStagesPage />)} />
          <Route path="/my-reviews" element={page(['master'], <MyReviewsPage />)} />
          <Route path="/my-services" element={page(['master'], <MyServicesPage />)} />
          <Route path="/stats" element={page(['head'], <StatsPage />)} />
          <Route path="/users" element={page(['admin'], <UsersPage />)} />
        </Route>
        <Route path="/" element={<Home />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Boot>
  );
}

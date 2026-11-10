import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar.jsx';
import Toast from './Toast.jsx';
import Footer from './Footer.jsx';

/** Каркас: бічна панель + основна область + футер (Outlet — поточна сторінка). */
export default function Layout() {
  return (
    <>
      <div className="app">
        <Sidebar />
        <main className="main"><div className="main-inner"><Outlet /><Footer /></div></main>
      </div>
      <Toast />
    </>
  );
}

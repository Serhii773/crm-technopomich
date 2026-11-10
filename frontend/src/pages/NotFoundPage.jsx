import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="center-box"><div><h1>404</h1><p>Сторінку не знайдено.</p><Link to="/">На головну</Link></div></div>
  );
}

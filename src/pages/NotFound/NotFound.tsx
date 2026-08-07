import { Link } from 'react-router-dom';
import { ROUTES } from '../../constants/navigation';

// 404 page shown when the URL doesn't match any route
export function NotFound() {
  return (
    <div className="not-found">
      <h1 className="not-found__code">404</h1>
      <p className="not-found__text">Page not found</p>
      <Link to={ROUTES.dashboard} className="not-found__btn">
        Go to Dashboard
      </Link>
    </div>
  );
}

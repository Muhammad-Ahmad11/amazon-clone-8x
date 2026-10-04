import { createBrowserRouter } from 'react-router';
import { CheckoutLayout } from './components/layout/CheckoutLayout';
import { SiteLayout } from './components/layout/SiteLayout';
import { CartPage } from './pages/CartPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { DesignSystemPage } from './pages/DesignSystemPage';
import { HomePage } from './pages/HomePage';
import { NotFoundPage } from './pages/NotFoundPage';
import { OrderConfirmationPage } from './pages/OrderConfirmationPage';
import { ProductPage } from './pages/ProductPage';
import { SearchPage } from './pages/SearchPage';

/*
  Shopping pages share the full header; checkout gets its own focused layout without search or the
  category bar (recon §2.9). The confirmation returns to the full header, since shopping resumes there.
*/
export const router = createBrowserRouter([
  {
    element: <SiteLayout />,
    children: [
      { path: '/', element: <HomePage /> },
      { path: '/s', element: <SearchPage /> },
      { path: '/dp/:productId', element: <ProductPage /> },
      { path: '/cart', element: <CartPage /> },
      { path: '/order/:orderId', element: <OrderConfirmationPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
  {
    element: <CheckoutLayout />,
    children: [{ path: '/checkout', element: <CheckoutPage /> }],
  },
  { path: '/design-system', element: <DesignSystemPage /> },
]);

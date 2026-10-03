import { createBrowserRouter } from 'react-router';
import { DesignSystemPage } from './pages/DesignSystemPage';
import { FoundationIndexPage } from './pages/FoundationIndexPage';
import { NotFoundPage } from './pages/NotFoundPage';

/*
  Routes are added stage by stage. Planned:
    /                 home
    /s?k=&...         search results (all state in the URL)
    /dp/:productId    product detail (?variant=)
    /cart
    /checkout         focused layout without the main nav
    /order/:orderId   confirmation
*/
export const router = createBrowserRouter([
  { path: '/', element: <FoundationIndexPage /> },
  { path: '/design-system', element: <DesignSystemPage /> },
  { path: '*', element: <NotFoundPage /> },
]);

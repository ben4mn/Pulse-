import { createHashRouter } from 'react-router-dom';
import { App } from './App';
import { FeedPage } from './pages/FeedPage';
import { ReaderView } from './components/reader/ReaderView';
import { CommentThread } from './components/comments/CommentThread';

export const router = createHashRouter([
  {
    path: '/',
    element: <App />,
    children: [
      { index: true, element: <FeedPage /> },
      { path: 'read/:id', element: <ReaderView /> },
      { path: 'comments/:id', element: <CommentThread /> },
    ],
  },
]);

import { Outlet } from 'react-router-dom';
import TopNav from '../components/TopNav/TopNav';

export default function AppLayout() {
  return (
    <>
      <TopNav />
      <main className="app-main">
        <Outlet />
      </main>
    </>
  );
}
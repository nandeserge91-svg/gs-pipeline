import { Routes, Route } from 'react-router-dom';
import Overview from './Overview';
import Orders from './Orders';
import MyProcessedOrders from './MyProcessedOrders';
import Stats from './Stats';
import ClientDatabase from '../common/ClientDatabase';
import ExpeditionsExpress from '../admin/ExpeditionsExpress';

export default function AppelantDashboard() {
  return (
    <Routes>
      <Route index element={<Overview />} />
      <Route path="orders" element={<Orders />} />
      <Route path="expeditions" element={<ExpeditionsExpress />} />
      <Route path="processed" element={<MyProcessedOrders />} />
      <Route path="database" element={<ClientDatabase />} />
      <Route path="stats" element={<Stats />} />
    </Routes>
  );
}


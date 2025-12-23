import { Routes, Route } from 'react-router-dom';
import Overview from './Overview';
import Deliveries from './Deliveries';
import Expeditions from './Expeditions';
import Stats from './Stats';
import History from './History';

export default function LivreurDashboard() {
  return (
    <Routes>
      <Route index element={<Overview />} />
      <Route path="deliveries" element={<Deliveries />} />
      <Route path="expeditions" element={<Expeditions />} />
      <Route path="stats" element={<Stats />} />
      <Route path="history" element={<History />} />
    </Routes>
  );
}











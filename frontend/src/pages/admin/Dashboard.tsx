import { Routes, Route } from 'react-router-dom';
import Overview from './Overview';
import Orders from './Orders';
import Users from './Users';
import AttendanceV2 from './AttendanceV2'; // Version simplifiée et robuste
import Stats from './Stats';
import ProductStats from './ProductStats';
import ClientDatabase from '../common/ClientDatabase';
import CallerSupervision from '../common/CallerSupervision';
import AppelantOrders from '../appelant/Orders';
import Tournees from '../stock/Tournees';
import Products from '../stock/Products';
import Movements from '../stock/Movements';
import LiveraisonEnCours from '../stock/LiveraisonEnCours';
import ExpeditionsExpress from './ExpeditionsExpress';
import Deliveries from '../gestionnaire/Deliveries';
import ValidatedOrders from '../gestionnaire/ValidatedOrders';
import Accounting from './Accounting';
import ExpressAgence from '../gestionnaire/ExpressAgence';
import RDV from '../appelant/RDV';
import SmsSettings from './SmsSettings';

export default function AdminDashboard() {
  return (
    <Routes>
      <Route index element={<Overview />} />
      <Route path="orders" element={<Orders />} />
      <Route path="to-call" element={<AppelantOrders />} />
      <Route path="rdv" element={<RDV />} />
      <Route path="validated" element={<ValidatedOrders />} />
      <Route path="expeditions" element={<ExpeditionsExpress />} />
      <Route path="express-agence" element={<ExpressAgence />} />
      <Route path="users" element={<Users />} />
      <Route path="attendance" element={<AttendanceV2 />} />
      <Route path="tournees" element={<Tournees />} />
      <Route path="deliveries" element={<Deliveries />} />
      <Route path="products" element={<Products />} />
      <Route path="movements" element={<Movements />} />
      <Route path="livraisons-en-cours" element={<LiveraisonEnCours />} />
      <Route path="database" element={<ClientDatabase />} />
      <Route path="supervision" element={<CallerSupervision />} />
      <Route path="stats" element={<Stats />} />
      <Route path="product-stats" element={<ProductStats />} />
      <Route path="accounting" element={<Accounting />} />
      <Route path="sms-settings" element={<SmsSettings />} />
    </Routes>
  );
}


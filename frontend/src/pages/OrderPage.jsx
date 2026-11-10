import { Link, useParams } from 'react-router-dom';
import { useStore } from '../context/StoreContext.jsx';
import { cancelOrder } from '../api/operations.js';
import { ORDER } from '../utils/constants.js';
import Chip from '../components/Chip.jsx';
import OrderInfo from '../components/order/OrderInfo.jsx';
import DiagnosisPanel from '../components/order/DiagnosisPanel.jsx';
import StagesPanel from '../components/order/StagesPanel.jsx';
import { useState } from 'react';

export default function OrderPage() {
  const { id } = useParams();
  const { sel, user, run, pending } = useStore();
  const [armed, setArmed] = useState(false);
  const order = sel.order(id);
  if (!order) return <div className="empty">Замовлення не знайдено. <Link to="/orders">До списку</Link></div>;

  const readOnly = user.role !== 'manager';
  const stages = sel.stagesOf(order.id);
  const canCancel = !readOnly && order.status !== 'cancel' && order.status !== 'done';

  return (
    <>
      <div className="head">
        <div><div className="crumb"><Link to="/orders">Замовлення</Link> / {order.num}</div><h1>Замовлення {order.num}</h1></div>
        <div className="actions">
          <Chip v={ORDER[order.status]} />
          {canCancel && (
            <button className="btn sm bad" disabled={pending}
              onClick={() => (armed ? run(cancelOrder, { orderId: order.id }) : setArmed(true))}>
              {armed ? 'Підтвердити скасування' : 'Скасувати'}
            </button>
          )}
        </div>
      </div>
      <OrderInfo order={order} readOnly={readOnly} />
      <DiagnosisPanel order={order} stages={stages} readOnly={readOnly} />
      <StagesPanel order={order} stages={stages} readOnly={readOnly} />
    </>
  );
}

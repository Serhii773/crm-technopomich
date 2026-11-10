import { useStore } from '../context/StoreContext.jsx';
import { deleteOffer } from '../api/operations.js';
import { money } from '../utils/format.js';
import OfferForm from '../components/OfferForm.jsx';

export default function MyServicesPage() {
  const { db, sel, user, run, pending } = useStore();
  const pid = user.party;
  const offers = db.offers.filter((x) => x.p === pid);
  return (
    <>
      <div className="head"><div><div className="crumb">{sel.party(pid).name}</div><h1>Мої послуги</h1></div></div>
      <div className="panel"><div className="tbl-wrap"><table>
        <thead><tr><th>Послуга</th><th className="r">Ціна</th><th className="r">Термін</th><th /></tr></thead>
        <tbody>
          {offers.length ? offers.map((x) => (
            <tr key={x.s}>
              <td>{sel.svc(x.s).name}</td><td className="r num">{money(x.price)}</td><td className="r num">{x.days} дн.</td>
              <td className="r"><button className="btn sm ghost" aria-label="Прибрати послугу" disabled={pending} onClick={() => run(deleteOffer, { partyId: pid, serviceId: x.s })}>✕</button></td>
            </tr>
          )) : <tr><td colSpan="4" className="empty">Додайте послуги, щоб менеджер міг вас призначати</td></tr>}
        </tbody>
      </table></div></div>
      <OfferForm partyId={pid} title="Додати послугу" />
    </>
  );
}

import { useMemo, useState } from 'react';
import { Eye, Search, X } from 'lucide-react';
import { formatDateTime, formatMad, ORDER_STATUS_LABELS } from '../../i18n';
import { ORDER_STATUSES } from '../../types';
import type { Order, OrderStatus } from '../../types';

interface AdminOrdersTabProps {
  orders: Order[];
  onRefresh: () => Promise<void>;
}

const STATUS_STYLE: Record<OrderStatus, string> = {
  new: 'text-blue-700 bg-blue-50 border-blue-200',
  confirmed: 'text-emerald-700 bg-emerald-50 border-emerald-200',
  preparing: 'text-amber-700 bg-amber-50 border-amber-200',
  shipped: 'text-indigo-700 bg-indigo-50 border-indigo-200',
  delivered: 'text-[#064E3B] bg-[#064E3B]/10 border-[#064E3B]/30',
  cancelled: 'text-red-700 bg-red-50 border-red-200',
};

export function AdminOrdersTab({ orders, onRefresh }: AdminOrdersTabProps) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return orders.filter((o) => {
      if (statusFilter !== 'all' && o.status !== statusFilter) return false;
      if (q) {
        const hay =
          `${o.orderNumber} ${o.customerName} ${o.customerPhone} ${o.city} ${o.address}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [orders, search, statusFilter]);

  const handleStatusChange = async (orderId: string, status: OrderStatus) => {
    setUpdatingId(orderId);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        const data = (await res.json()) as { order?: Order };
        if (selectedOrder?.id === orderId && data.order) {
          setSelectedOrder(data.order);
        }
        await onRefresh();
      }
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold text-zinc-950">Gestion des commandes</h2>
        <p className="text-xs text-zinc-500 mt-0.5 tabular-nums">
          {orders.length} commande(s) enregistrée(s)
        </p>
      </div>

      {/* Search & status filter */}
      <div className="bg-white border border-zinc-200 rounded-lg p-3.5 flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[220px] max-w-sm">
          <Search className="w-4 h-4 text-zinc-400 absolute top-1/2 -translate-y-1/2 start-3" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="N° commande, client, téléphone, ville..."
            className="w-full h-9 ps-9 pe-3 rounded-md border border-zinc-200 text-xs"
          />
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium ${
              statusFilter === 'all'
                ? 'bg-zinc-900 text-white'
                : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
            }`}
          >
            Toutes
          </button>
          {ORDER_STATUSES.map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium ${
                statusFilter === st
                  ? 'bg-zinc-900 text-white'
                  : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
              }`}
            >
              {ORDER_STATUS_LABELS[st].fr}
            </button>
          ))}
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden">
        {filtered.length === 0 ? (
          <div className="py-12 text-center text-sm text-zinc-500">
            Aucune commande ne correspond aux filtres sélectionnés.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-start">
              <thead className="bg-zinc-50 border-b border-zinc-200 text-xs text-zinc-500">
                <tr>
                  <th className="py-3 px-4 text-start font-semibold">N° Commande</th>
                  <th className="py-3 px-4 text-start font-semibold">Client</th>
                  <th className="py-3 px-4 text-start font-semibold">Ville</th>
                  <th className="py-3 px-4 text-end font-semibold">Total</th>
                  <th className="py-3 px-4 text-start font-semibold">Statut</th>
                  <th className="py-3 px-4 text-start font-semibold">Date</th>
                  <th className="py-3 px-4 text-end font-semibold">Détails</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {filtered.map((order) => (
                  <tr key={order.id} className="hover:bg-zinc-50/70">
                    <td className="py-3 px-4 font-mono-tabular font-semibold text-zinc-950">
                      {order.orderNumber}
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-medium text-zinc-900">{order.customerName}</p>
                      <p className="font-mono-tabular text-xs text-zinc-500">
                        {order.customerPhone}
                      </p>
                    </td>
                    <td className="py-3 px-4 text-xs text-zinc-700">{order.city}</td>
                    <td className="py-3 px-4 text-end font-mono-tabular font-semibold text-zinc-950">
                      {formatMad(order.totalMad, 'fr')}
                    </td>
                    <td className="py-3 px-4">
                      <select
                        value={order.status}
                        disabled={updatingId === order.id}
                        onChange={(e) =>
                          void handleStatusChange(order.id, e.target.value as OrderStatus)
                        }
                        aria-label={`Statut pour ${order.orderNumber}`}
                        className={`h-8 px-2.5 rounded-md border text-xs font-semibold ${
                          STATUS_STYLE[order.status]
                        }`}
                      >
                        {ORDER_STATUSES.map((st) => (
                          <option key={st} value={st}>
                            {ORDER_STATUS_LABELS[st].fr}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="py-3 px-4 text-xs text-zinc-500 whitespace-nowrap">
                      {formatDateTime(order.createdAt, 'fr')}
                    </td>
                    <td className="py-3 px-4 text-end">
                      <button
                        type="button"
                        onClick={() => setSelectedOrder(order)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-zinc-200 text-xs font-medium text-zinc-700 hover:bg-zinc-100"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Voir</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-zinc-200 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="px-6 py-4 border-b border-zinc-200 flex items-center justify-between sticky top-0 bg-white">
              <div>
                <h3 className="font-mono-tabular text-lg font-bold text-zinc-950">
                  {selectedOrder.orderNumber}
                </h3>
                <p className="text-xs text-zinc-500">
                  {formatDateTime(selectedOrder.createdAt, 'fr')}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="p-2 rounded-lg text-zinc-500 hover:bg-zinc-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6 text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-zinc-50 border border-zinc-200 rounded-lg p-4">
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-zinc-500">Coordonnées client</p>
                  <p className="font-semibold text-zinc-950">{selectedOrder.customerName}</p>
                  <p className="font-mono-tabular text-zinc-700">{selectedOrder.customerPhone}</p>
                  <p className="text-zinc-700">
                    {selectedOrder.address}, {selectedOrder.city}
                  </p>
                  {selectedOrder.notes && (
                    <p className="text-xs text-zinc-500 pt-1">Note : {selectedOrder.notes}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-zinc-500">
                    Mettre à jour le statut
                  </label>
                  <select
                    value={selectedOrder.status}
                    disabled={updatingId === selectedOrder.id}
                    onChange={(e) =>
                      void handleStatusChange(selectedOrder.id, e.target.value as OrderStatus)
                    }
                    className="w-full h-10 px-3 rounded-lg border border-zinc-300 bg-white text-sm font-semibold"
                  >
                    {ORDER_STATUSES.map((st) => (
                      <option key={st} value={st}>
                        {ORDER_STATUS_LABELS[st].fr}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-zinc-500">
                    Mode de paiement : Paiement à la livraison (espèces)
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-zinc-500">Articles commandés</h4>
                <div className="border border-zinc-200 rounded-lg divide-y divide-zinc-100">
                  {selectedOrder.items.map((item, idx) => (
                    <div key={idx} className="p-3.5 flex items-center justify-between gap-4">
                      <div>
                        <p className="font-semibold text-zinc-900">{item.nameFr}</p>
                        <p className="text-xs text-zinc-500">
                          Taille {item.size} × {item.quantity} ·{' '}
                          <span className="font-mono-tabular">
                            {formatMad(item.unitPriceMad, 'fr')}
                          </span>
                        </p>
                      </div>
                      <span className="font-mono-tabular font-semibold text-zinc-950">
                        {formatMad(item.unitPriceMad * item.quantity, 'fr')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5 pt-3 border-t border-zinc-200">
                <div className="flex justify-between text-zinc-600">
                  <span>Sous-total</span>
                  <span className="font-mono-tabular">
                    {formatMad(selectedOrder.subtotalMad, 'fr')}
                  </span>
                </div>
                <div className="flex justify-between text-zinc-600">
                  <span>Livraison ({selectedOrder.city})</span>
                  <span className="font-mono-tabular">
                    {selectedOrder.shippingMad === 0
                      ? 'Gratuit'
                      : formatMad(selectedOrder.shippingMad, 'fr')}
                  </span>
                </div>
                <div className="flex justify-between text-base font-bold text-zinc-950 pt-2 border-t border-zinc-200">
                  <span>Total</span>
                  <span className="font-mono-tabular text-[#064E3B]">
                    {formatMad(selectedOrder.totalMad, 'fr')}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  fetchMyPayments,
  fetchMyOrders,
  requestLiveRefund,
  getInvoicePdfUrl,
  type LiveOrder,
  type LivePayment,
} from "@/lib/liveApi";
import { useStore } from "@/lib/store";
import { Card, CardHeader, Button, Badge, Modal, Textarea } from "@/components/ui";
import {
  Download,
  CreditCard,
  RefreshCw,
} from "lucide-react";

type FilterTab = "ALL" | "PENDING" | "PAID" | "FAILED" | "INVOICES" | "REFUNDS";

export default function UserPaymentsView() {
  const { toast } = useStore();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<FilterTab>("ALL");
  const [orders, setOrders] = useState<LiveOrder[]>([]);
  const [_payments, setPayments] = useState<LivePayment[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [refunds, setRefunds] = useState<any[]>([]);

  // Refund request modal
  const [refundOrder, setRefundOrder] = useState<LiveOrder | null>(null);
  const [refundReason, setRefundReason] = useState("");
  const [refundAmount, setRefundAmount] = useState(0);
  const [submittingRefund, setSubmittingRefund] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [payData, orderData] = await Promise.all([
        fetchMyPayments().catch(() => ({ payments: [], invoices: [], refunds: [] })),
        fetchMyOrders().catch(() => []),
      ]);
      setPayments(payData.payments || []);
      setInvoices((payData as any).invoices || []);
      setRefunds((payData as any).refunds || []);
      setOrders(orderData || (payData as any).orders || []);
    } catch (err: any) {
      console.error("Error loading user payments:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRequestRefund = async () => {
    if (!refundOrder) return;
    if (!refundReason.trim()) {
      toast({ title: "Reason required", body: "Please state why you are requesting a refund.", tone: "warn" });
      return;
    }

    setSubmittingRefund(true);
    try {
      await requestLiveRefund(refundOrder._id, refundAmount || refundOrder.totalAmount, refundReason);
      toast({
        title: "Refund Request Submitted",
        body: "Your request has been logged and sent to the event organizers for review.",
        tone: "success",
      });
      setRefundOrder(null);
      setRefundReason("");
      loadData();
    } catch (err: any) {
      toast({
        title: "Refund Failed",
        body: err.message || "Unable to submit refund request.",
        tone: "danger",
      });
    } finally {
      setSubmittingRefund(false);
    }
  };

  const filteredOrders = orders.filter((ord) => {
    if (activeTab === "ALL") return true;
    if (activeTab === "PENDING") return (ord.paymentStatus as string) === "PENDING" || (ord.paymentStatus as string) === "PROCESSING";
    if (activeTab === "PAID") return ord.paymentStatus === "PAID";
    if (activeTab === "FAILED") return ord.paymentStatus === "FAILED" || (ord.paymentStatus as string) === "CANCELLED";
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-display font-bold text-slate-900">
            Billing, Invoices & Orders
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage your booth reservations, tickets, session passes, and tax invoices.
          </p>
        </div>
        <Button
          size="sm"
          variant="outline"
          icon={<RefreshCw className={`size-3.5 ${loading ? "animate-spin" : ""}`} />}
          onClick={loadData}
        >
          Refresh
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3">
        {[
          { id: "ALL", label: `All Orders (${orders.length})` },
          { id: "PENDING", label: `Pending (${orders.filter((o) => (o.paymentStatus as string) === "PENDING").length})` },
          { id: "PAID", label: `Successful (${orders.filter((o) => o.paymentStatus === "PAID").length})` },
          { id: "FAILED", label: `Failed (${orders.filter((o) => o.paymentStatus === "FAILED").length})` },
          { id: "INVOICES", label: `My Invoices (${invoices.length || orders.filter((o) => o.paymentStatus === "PAID").length})` },
          { id: "REFUNDS", label: `Refund Requests (${refunds.length})` },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id as FilterTab)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeTab === t.id
                ? "bg-slate-900 text-white shadow-sm"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* INVOICES TAB */}
      {activeTab === "INVOICES" && (
        <Card className="overflow-hidden border border-slate-200 shadow-sm">
          <CardHeader
            title="Official Tax Invoices"
            subtitle="Verified PDF invoices issued for confirmed booth reservations and tickets"
          />
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-100 text-slate-700 uppercase font-semibold text-[11px] border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Invoice #</th>
                  <th className="py-3 px-4">Order Ref</th>
                  <th className="py-3 px-4">Issue Date</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Download</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {invoices.length === 0 && orders.filter((o) => o.paymentStatus === "PAID").length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      No invoices issued yet. Invoices appear automatically upon verified payment.
                    </td>
                  </tr>
                ) : (
                  (invoices.length > 0
                    ? invoices
                    : orders.filter((o) => o.paymentStatus === "PAID").map((o) => ({
                        _id: o._id,
                        invoiceNumber: `INV-${o.orderNumber.replace("ORD-", "")}`,
                        orderId: o._id,
                        orderNumber: o.orderNumber,
                        issuedAt: o.createdAt,
                        total: o.totalAmount,
                        currency: o.currency,
                        paymentStatus: "PAID",
                      }))
                  ).map((inv: any) => (
                    <tr key={inv._id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">
                        {inv.invoiceNumber}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-600">
                        #{inv.orderId?.orderNumber || inv.orderNumber || inv.orderId}
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {new Date(inv.issuedAt || inv.createdAt).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900">
                        {inv.currency || "PKR"} {(inv.total || inv.totalAmount || 0).toLocaleString()}
                      </td>
                      <td className="py-3 px-4">
                        <Badge tone="positive">Verified Paid</Badge>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <a
                          href={getInvoicePdfUrl(inv.orderId?._id || inv.orderId || inv._id)}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-900 text-white font-medium text-xs hover:bg-slate-800 transition"
                        >
                          <Download className="size-3.5" />
                          Download PDF
                        </a>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* REFUNDS TAB */}
      {activeTab === "REFUNDS" && (
        <Card className="overflow-hidden border border-slate-200 shadow-sm">
          <CardHeader
            title="Refund Requests"
            subtitle="Status and audit history of your cancellation and refund requests"
          />
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-100 text-slate-700 uppercase font-semibold text-[11px] border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Request Date</th>
                  <th className="py-3 px-4">Payment Ref</th>
                  <th className="py-3 px-4">Requested Amount</th>
                  <th className="py-3 px-4">Reason</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Admin Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {refunds.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      No refund requests logged. If you need to cancel a booking, use the Refund button on any paid order.
                    </td>
                  </tr>
                ) : (
                  refunds.map((ref: any) => (
                    <tr key={ref._id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3 px-4 text-slate-600">
                        {new Date(ref.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-800">
                        {ref.paymentId?.transactionRef || ref.paymentId || "—"}
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900">
                        PKR {ref.amount?.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 max-w-xs text-slate-600 truncate">
                        {ref.reason}
                      </td>
                      <td className="py-3 px-4">
                        <Badge
                          tone={
                            ref.status === "APPROVED"
                              ? "positive"
                              : ref.status === "REJECTED"
                              ? "danger"
                              : "warn"
                          }
                        >
                          {ref.status}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-slate-500 italic">
                        {ref.adminNotes || "Under review by organizers"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* ORDERS / PAYMENTS LIST */}
      {activeTab !== "INVOICES" && activeTab !== "REFUNDS" && (
        <Card className="overflow-hidden border border-slate-200 shadow-sm">
          <CardHeader
            title={
              activeTab === "PENDING"
                ? "Pending Payments"
                : activeTab === "PAID"
                ? "Successful Payments"
                : activeTab === "FAILED"
                ? "Failed Payments"
                : "Orders & Bookings"
            }
            subtitle="Orders created from booth selection or ticket checkout"
          />

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-100 text-slate-700 uppercase font-semibold text-[11px] border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Order Ref</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Item Details</th>
                  <th className="py-3 px-4">Total</th>
                  <th className="py-3 px-4">Payment</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      No matching orders found in this view.
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((ord) => (
                    <tr key={ord._id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">
                        #{ord.orderNumber}
                        <span className="block text-[10px] text-slate-400 font-sans">
                          {new Date(ord.createdAt).toLocaleDateString()}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-[11px] font-semibold text-slate-700 uppercase tracking-wide">
                          {ord.orderType.replace("_", " ")}
                        </span>
                      </td>
                      <td className="py-3 px-4 max-w-xs">
                        {ord.items?.map((it, idx) => (
                          <div key={idx} className="truncate">
                            <span className="font-semibold text-slate-800">
                              {it.name || it.description}
                            </span>
                            {it.quantity > 1 && (
                              <span className="text-[10px] text-slate-500"> (x{it.quantity})</span>
                            )}
                          </div>
                        ))}
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900">
                        {ord.currency} {ord.totalAmount.toLocaleString()}
                      </td>
                      <td className="py-3 px-4">
                        <Badge
                          tone={
                            ord.paymentStatus === "PAID"
                              ? "positive"
                              : ord.paymentStatus === "REFUNDED"
                              ? "warn"
                              : ord.paymentStatus === "FAILED"
                              ? "danger"
                              : "info"
                          }
                        >
                          {ord.paymentStatus}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <Badge
                          tone={
                            ord.orderStatus === "CONFIRMED" || ord.orderStatus === "PAID"
                              ? "positive"
                              : ord.orderStatus === "CANCELLED"
                              ? "danger"
                              : "warn"
                          }
                        >
                          {ord.orderStatus}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-right space-x-2">
                        {ord.paymentStatus === "PAID" ? (
                          <div className="inline-flex items-center gap-2">
                            <a
                              href={getInvoicePdfUrl(ord._id)}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-900 text-white font-medium text-[11px] hover:bg-slate-800 transition"
                            >
                              <Download className="size-3" />
                              PDF Invoice
                            </a>
                            <button
                              onClick={() => {
                                setRefundOrder(ord);
                                setRefundAmount(ord.totalAmount);
                              }}
                              className="text-[11px] text-slate-500 hover:text-red-600 transition underline"
                            >
                              Refund
                            </button>
                          </div>
                        ) : (
                          <Link
                            to={`/checkout/${ord._id}`}
                            className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-brand-600 text-white font-bold text-[11px] hover:bg-brand-700 transition"
                          >
                            <CreditCard className="size-3" />
                            Pay Now
                          </Link>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Refund Request Modal */}
      {refundOrder && (
        <Modal
          open={!!refundOrder}
          onClose={() => setRefundOrder(null)}
          title="Request Order Refund"
        >
          <div className="space-y-4 pt-2">
            <div className="bg-slate-50 p-3.5 rounded-xl text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-500">Order Reference</span>
                <span className="font-mono font-bold text-slate-800">
                  #{refundOrder.orderNumber}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Paid Amount</span>
                <span className="font-bold text-slate-900">
                  {refundOrder.currency} {refundOrder.totalAmount.toLocaleString()}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Refund Reason
              </label>
              <Textarea
                rows={3}
                placeholder="Explain the reason for cancellation or refund request..."
                value={refundReason}
                onChange={(e) => setRefundReason(e.target.value)}
              />
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
              <Button
                variant="outline"
                onClick={() => setRefundOrder(null)}
                disabled={submittingRefund}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={handleRequestRefund}
                disabled={submittingRefund || !refundReason.trim()}
              >
                Submit Refund Request
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

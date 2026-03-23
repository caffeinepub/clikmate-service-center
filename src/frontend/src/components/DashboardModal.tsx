import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Loader2,
  LogOut,
  Package,
  RefreshCw,
  Upload,
  User,
} from "lucide-react";
import { useEffect, useState } from "react";
import type { OrderRecord } from "../backend";
import { useActor } from "../hooks/useActor";

interface DashboardModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  phone: string;
  onLogout: () => void;
  onUploadClick: () => void;
}

function StatusBadge({ status }: { status: string }) {
  const lower = status.toLowerCase();
  if (lower === "pending") {
    return (
      <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-100">
        Pending
      </Badge>
    );
  }
  if (lower === "printing") {
    return (
      <Badge className="bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-100">
        Printing
      </Badge>
    );
  }
  if (lower === "ready for pickup" || lower === "ready") {
    return (
      <Badge className="bg-green-100 text-green-800 border-green-200 hover:bg-green-100">
        Ready for Pickup
      </Badge>
    );
  }
  return <Badge variant="outline">{status}</Badge>;
}

function formatDate(submittedAt: bigint): string {
  const ms = Number(submittedAt) / 1_000_000;
  const date = new Date(ms);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function DashboardModal({
  open,
  onOpenChange,
  phone,
  onLogout,
  onUploadClick,
}: DashboardModalProps) {
  const { actor } = useActor();
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && actor && phone) {
      setLoading(true);
      actor
        .getOrdersByPhone(phone)
        .then((res) => setOrders(res))
        .catch(() => setOrders([]))
        .finally(() => setLoading(false));
    }
  }, [open, actor, phone]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        data-ocid="dashboard.modal"
        className="max-w-2xl w-full rounded-2xl p-0 overflow-hidden border-0 shadow-2xl"
      >
        {/* Header */}
        <div className="hero-gradient px-8 pt-8 pb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 yellow-bg rounded-full flex items-center justify-center">
                <User className="w-6 h-6 text-gray-900" />
              </div>
              <div>
                <DialogHeader>
                  <DialogTitle className="text-white text-xl font-bold">
                    My Digital Vault
                  </DialogTitle>
                </DialogHeader>
                <p className="text-blue-200 text-sm">+91 {phone}</p>
              </div>
            </div>
            <button
              type="button"
              data-ocid="dashboard.logout.button"
              onClick={onLogout}
              className="flex items-center gap-2 text-white/70 hover:text-white text-sm transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-bold blue-text text-base flex items-center gap-2">
              <Package className="w-5 h-5" />
              Past Orders / Uploaded Documents
            </h3>
            <Button
              data-ocid="dashboard.upload_new.primary_button"
              onClick={onUploadClick}
              className="yellow-bg text-gray-900 font-semibold rounded-xl h-9 px-4 border-0 hover:opacity-90 text-xs"
            >
              <Upload className="w-3.5 h-3.5 mr-1.5" />
              Upload New Document
            </Button>
          </div>

          {loading ? (
            <div
              data-ocid="dashboard.orders.loading_state"
              className="flex items-center justify-center py-16"
            >
              <Loader2 className="w-8 h-8 animate-spin blue-text" />
            </div>
          ) : orders.length === 0 ? (
            <div
              data-ocid="dashboard.orders.empty_state"
              className="flex flex-col items-center justify-center py-16 text-center"
            >
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
                style={{ background: "oklch(0.95 0.04 95)" }}
              >
                <Package className="w-8 h-8 yellow-text" />
              </div>
              <p className="font-semibold blue-text mb-1">No orders yet</p>
              <p className="text-gray-400 text-sm">
                Upload your first document above.
              </p>
            </div>
          ) : (
            <ScrollArea className="max-h-80">
              <Table data-ocid="dashboard.orders.table">
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs font-semibold blue-text">
                      Order ID
                    </TableHead>
                    <TableHead className="text-xs font-semibold blue-text">
                      Service
                    </TableHead>
                    <TableHead className="text-xs font-semibold blue-text">
                      Date
                    </TableHead>
                    <TableHead className="text-xs font-semibold blue-text">
                      Status
                    </TableHead>
                    <TableHead className="text-xs font-semibold blue-text">
                      Action
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order, i) => (
                    <TableRow
                      key={String(order.id)}
                      data-ocid={`dashboard.orders.item.${i + 1}`}
                    >
                      <TableCell className="text-xs font-mono text-gray-500">
                        #{String(order.id)}
                      </TableCell>
                      <TableCell className="text-xs font-medium">
                        {order.serviceType}
                      </TableCell>
                      <TableCell className="text-xs text-gray-500">
                        {formatDate(order.submittedAt)}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={order.status} />
                      </TableCell>
                      <TableCell>
                        <button
                          type="button"
                          data-ocid={`dashboard.reorder.button.${i + 1}`}
                          onClick={onUploadClick}
                          className="flex items-center gap-1 text-xs font-semibold blue-text hover:opacity-70 transition-opacity"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                          Re-order
                        </button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

import type { MaskedShopOrder } from "@/backend.d";
import type { backendInterface } from "@/backend.d";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useActor } from "@/hooks/useActor";
import {
  CheckCircle2,
  Loader2,
  LogOut,
  MapPin,
  Navigation,
  Package,
  RefreshCw,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

type Screen = "login" | "dashboard";

export default function RiderDashboard() {
  const { actor, isFetching } = useActor();
  const [screen, setScreen] = useState<Screen>("login");
  const [mobile, setMobile] = useState("");
  const [pin, setPin] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [riderMobile, setRiderMobile] = useState("");

  const [deliveries, setDeliveries] = useState<MaskedShopOrder[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [selectedDelivery, setSelectedDelivery] =
    useState<MaskedShopOrder | null>(null);
  const [otpInput, setOtpInput] = useState("");
  const [otpError, setOtpError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);

  async function fetchOrders() {
    if (!actor) return;
    setLoadingOrders(true);
    try {
      const orders = await (
        actor as unknown as backendInterface
      ).getReadyForDeliveryOrders();
      setDeliveries(orders);
    } catch {
      toast.error("Failed to load orders. Please refresh.");
    } finally {
      setLoadingOrders(false);
    }
  }

  // biome-ignore lint/correctness/useExhaustiveDependencies: fetchOrders is stable
  useEffect(() => {
    if (screen === "dashboard" && actor && !isFetching) {
      fetchOrders();
    }
  }, [screen, actor, isFetching]);

  async function handleLogin() {
    setLoginError("");
    if (mobile.length !== 10 || !/^\d{10}$/.test(mobile)) {
      setLoginError("Enter a valid 10-digit mobile number.");
      return;
    }
    if (pin.length !== 4 || !/^\d{4}$/.test(pin)) {
      setLoginError("PIN must be exactly 4 digits.");
      return;
    }
    if (!actor) {
      setLoginError("Connecting to server... Please try again.");
      return;
    }
    setLoginLoading(true);
    try {
      const ok = await (actor as unknown as backendInterface).verifyRider(
        mobile,
        pin,
      );
      if (ok) {
        setRiderMobile(mobile);
        setScreen("dashboard");
      } else {
        setLoginError("Invalid mobile number or PIN.");
      }
    } catch {
      setLoginError("Server error. Please try again.");
    } finally {
      setLoginLoading(false);
    }
  }

  function handleLogout() {
    setScreen("login");
    setMobile("");
    setPin("");
    setRiderMobile("");
    setDeliveries([]);
  }

  function openOtpModal(delivery: MaskedShopOrder) {
    setSelectedDelivery(delivery);
    setOtpInput("");
    setOtpError("");
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setSelectedDelivery(null);
    setOtpInput("");
    setOtpError("");
  }

  async function handleConfirmDelivery() {
    if (!selectedDelivery || !actor) return;
    setConfirming(true);
    setOtpError("");
    try {
      await (actor as unknown as backendInterface).markOrderDelivered(
        BigInt(selectedDelivery.id),
        otpInput,
      );
      setDeliveries((prev) => prev.filter((d) => d.id !== selectedDelivery.id));
      toast.success("Delivery confirmed! Order marked as Delivered.");
      closeModal();
    } catch {
      setOtpError("Incorrect OTP. Please try again.");
    } finally {
      setConfirming(false);
    }
  }

  if (screen === "login") {
    return (
      <div
        data-ocid="rider.login.page"
        className="min-h-screen flex items-center justify-center p-4"
        style={{ background: "#0f172a" }}
      >
        <div className="w-full max-w-sm">
          <div className="flex flex-col items-center mb-8">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 shadow-lg"
              style={{ background: "#f59e0b" }}
            >
              <Package className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              ClikMate
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Delivery Partner Portal
            </p>
          </div>

          <Card
            className="border-0 shadow-2xl"
            style={{ background: "#1e293b" }}
          >
            <CardContent className="p-6">
              <h2 className="text-xl font-bold text-white mb-1">
                Delivery Rider Login
              </h2>
              <p className="text-slate-400 text-sm mb-6">
                Sign in to view your deliveries
              </p>

              <div className="space-y-4">
                <div>
                  <Label className="text-slate-300 text-sm font-medium mb-1.5 block">
                    Mobile Number
                  </Label>
                  <Input
                    data-ocid="rider.login.input"
                    type="tel"
                    inputMode="numeric"
                    placeholder="Enter 10-digit mobile number"
                    maxLength={10}
                    value={mobile}
                    onChange={(e) =>
                      setMobile(e.target.value.replace(/\D/g, ""))
                    }
                    className="h-12 text-base bg-slate-700 border-slate-600 text-white placeholder:text-slate-500 focus:border-amber-400 focus:ring-amber-400"
                    onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                  />
                </div>

                <div>
                  <Label className="text-slate-300 text-sm font-medium mb-1.5 block">
                    4-Digit PIN
                  </Label>
                  <Input
                    data-ocid="rider.pin.input"
                    type="password"
                    inputMode="numeric"
                    placeholder="Enter your PIN"
                    maxLength={4}
                    value={pin}
                    onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
                    className="h-12 text-base tracking-widest bg-slate-700 border-slate-600 text-white placeholder:text-slate-500 focus:border-amber-400 focus:ring-amber-400"
                    onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                  />
                </div>

                {loginError && (
                  <p
                    data-ocid="rider.login.error_state"
                    className="text-red-400 text-sm font-medium"
                  >
                    {loginError}
                  </p>
                )}

                <Button
                  data-ocid="rider.login.submit_button"
                  className="w-full h-12 text-base font-bold rounded-xl border-0 text-gray-900 hover:opacity-90 transition-opacity"
                  style={{ background: "#f59e0b" }}
                  onClick={handleLogin}
                  disabled={loginLoading || isFetching}
                >
                  {loginLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    "Login"
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div
      data-ocid="rider.dashboard.page"
      className="min-h-screen"
      style={{ background: "#f1f5f9" }}
    >
      {/* Header */}
      <header
        className="sticky top-0 z-40 px-4 py-3 flex items-center justify-between shadow-md"
        style={{ background: "#0f172a" }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: "#f59e0b" }}
          >
            <Package className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-white font-bold text-sm leading-tight">
              ClikMate Rider
            </p>
            <p className="text-slate-400 text-xs">{riderMobile}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            data-ocid="rider.refresh.button"
            variant="ghost"
            size="sm"
            onClick={fetchOrders}
            disabled={loadingOrders}
            className="text-slate-300 hover:text-white hover:bg-slate-700"
          >
            <RefreshCw
              className={`w-4 h-4 ${loadingOrders ? "animate-spin" : ""}`}
            />
          </Button>
          <Button
            data-ocid="rider.logout.button"
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="text-slate-300 hover:text-white hover:bg-slate-700"
          >
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </header>

      {/* Main content */}
      <main className="p-4 max-w-lg mx-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-slate-800">
            Active Deliveries
          </h2>
          {!loadingOrders && (
            <span className="text-sm text-slate-500">
              {deliveries.length} order{deliveries.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>

        {loadingOrders ? (
          <div
            data-ocid="rider.orders.loading_state"
            className="flex flex-col items-center justify-center py-20"
          >
            <Loader2
              className="w-10 h-10 animate-spin mb-3"
              style={{ color: "#f59e0b" }}
            />
            <p className="text-slate-500 text-sm">Loading deliveries...</p>
          </div>
        ) : deliveries.length === 0 ? (
          <div
            data-ocid="rider.orders.empty_state"
            className="flex flex-col items-center justify-center py-20"
          >
            <CheckCircle2
              className="w-14 h-14 mb-4"
              style={{ color: "#10b981" }}
            />
            <p className="text-slate-700 font-semibold text-lg">All Clear!</p>
            <p className="text-slate-500 text-sm mt-1">
              No pending deliveries right now.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {deliveries.map((delivery, idx) => {
              const isCOD =
                delivery.paymentMethod === "Pay at Store / Cash on Delivery";
              return (
                <Card
                  key={String(delivery.id)}
                  data-ocid={`rider.orders.item.${idx + 1}`}
                  className="border-0 shadow-md overflow-hidden"
                  style={{ background: "#fff" }}
                >
                  <CardContent className="p-0">
                    {/* Top bar */}
                    <div
                      className="px-4 py-2.5 flex items-center justify-between"
                      style={{ background: "#0f172a" }}
                    >
                      <span className="text-amber-400 font-bold text-sm">
                        #SO-{String(delivery.id)}
                      </span>
                      <Badge
                        className="text-xs font-bold border-0"
                        style={{
                          background: isCOD
                            ? "rgba(239,68,68,0.2)"
                            : "rgba(16,185,129,0.2)",
                          color: isCOD ? "#f87171" : "#34d399",
                        }}
                      >
                        {isCOD ? "COD" : "Prepaid"}
                      </Badge>
                    </div>

                    <div className="p-4">
                      <p className="font-bold text-slate-800 text-base mb-1">
                        {delivery.customerName}
                      </p>
                      <div className="flex items-start gap-1.5 mb-3">
                        <MapPin className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                        <p className="text-slate-500 text-sm leading-snug">
                          {delivery.deliveryAddress}
                        </p>
                      </div>
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-slate-400 text-xs">
                          Total Amount
                        </span>
                        <span className="font-bold text-slate-800 text-lg">
                          ₹{delivery.totalAmount}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <a
                          data-ocid="rider.orders.map_marker"
                          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(delivery.deliveryAddress)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Button
                            variant="outline"
                            className="w-full h-11 text-sm font-semibold border-slate-200 text-slate-600 hover:bg-slate-50"
                          >
                            <Navigation className="w-4 h-4 mr-1.5" />
                            View on Map
                          </Button>
                        </a>
                        <Button
                          data-ocid="rider.orders.button"
                          className="w-full h-11 text-sm font-bold border-0 text-white"
                          style={{ background: "#f59e0b" }}
                          onClick={() => openOtpModal(delivery)}
                        >
                          <CheckCircle2 className="w-4 h-4 mr-1.5" />
                          Mark Delivered
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>

      {/* OTP Modal */}
      <Dialog open={modalOpen} onOpenChange={(open) => !open && closeModal()}>
        <DialogContent
          data-ocid="rider.otp.dialog"
          className="border-0 shadow-2xl max-w-sm mx-auto"
          style={{ background: "#1e293b" }}
        >
          <DialogHeader>
            <DialogTitle className="text-white text-lg">
              Confirm Delivery
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Enter the 4-digit OTP from the customer to complete this delivery.
            </DialogDescription>
          </DialogHeader>

          {selectedDelivery && (
            <div
              className="rounded-lg p-3 mb-1"
              style={{ background: "rgba(245,158,11,0.1)" }}
            >
              <p className="text-amber-400 font-bold text-sm">
                #SO-{String(selectedDelivery.id)}
              </p>
              <p className="text-white text-sm">
                {selectedDelivery.customerName}
              </p>
            </div>
          )}

          <div>
            <Label className="text-slate-300 text-sm font-medium mb-2 block">
              Customer OTP
            </Label>
            <Input
              data-ocid="rider.otp.input"
              type="text"
              inputMode="numeric"
              placeholder="Enter OTP"
              maxLength={6}
              value={otpInput}
              onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, ""))}
              className="h-12 text-center text-2xl tracking-widest bg-slate-700 border-slate-600 text-white placeholder:text-slate-500 focus:border-amber-400"
              onKeyDown={(e) => e.key === "Enter" && handleConfirmDelivery()}
            />
            {otpError && (
              <p
                data-ocid="rider.otp.error_state"
                className="text-red-400 text-sm mt-2 font-medium"
              >
                {otpError}
              </p>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button
              data-ocid="rider.otp.cancel_button"
              variant="ghost"
              onClick={closeModal}
              className="text-slate-400 hover:text-white hover:bg-slate-700"
            >
              Cancel
            </Button>
            <Button
              data-ocid="rider.otp.confirm_button"
              className="font-bold border-0 text-gray-900"
              style={{ background: "#f59e0b" }}
              onClick={handleConfirmDelivery}
              disabled={confirming || otpInput.length < 4}
            >
              {confirming ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Verifying...
                </>
              ) : (
                "Confirm Delivery"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

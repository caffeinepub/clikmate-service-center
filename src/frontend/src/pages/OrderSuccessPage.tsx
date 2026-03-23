import { Button } from "@/components/ui/button";
import { Link, useParams } from "@/utils/router";
import { CheckCircle, Package, ShoppingBag } from "lucide-react";
import { motion } from "motion/react";

export default function OrderSuccessPage() {
  const { orderId } = useParams<{ orderId: string }>();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 via-indigo-900 to-purple-900 px-4 py-16">
      {/* Background blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute -top-24 -right-24 w-96 h-96 rounded-full"
          style={{
            background:
              "radial-gradient(circle, rgba(139,92,246,0.2) 0%, transparent 70%)",
          }}
        />
        <div
          className="absolute -bottom-16 -left-16 w-80 h-80 rounded-full"
          style={{
            background:
              "radial-gradient(circle, rgba(234,179,8,0.15) 0%, transparent 70%)",
          }}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8 md:p-10 text-center shadow-2xl">
          {/* Animated checkmark */}
          <motion.div
            initial={{ scale: 0, rotate: -30 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{
              delay: 0.2,
              duration: 0.5,
              type: "spring",
              stiffness: 200,
            }}
            className="flex justify-center mb-6"
          >
            <div className="w-20 h-20 rounded-full bg-green-400/20 border-4 border-green-400 flex items-center justify-center">
              <CheckCircle className="w-10 h-10 text-green-400" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.4 }}
          >
            <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
              Order Placed Successfully!
            </h1>
            <p className="text-white/60 text-sm mb-6">
              Your order has been received and is being processed.
            </p>

            {/* Order ID */}
            <div
              data-ocid="order_success.order_id.card"
              className="bg-white/10 border border-white/20 rounded-2xl px-6 py-4 mb-6"
            >
              <div className="text-white/50 text-xs uppercase tracking-wider mb-1">
                Order ID
              </div>
              <div className="text-2xl font-bold text-yellow-300">
                #SO-{orderId}
              </div>
            </div>

            {/* Vault message */}
            <div className="flex items-center justify-center gap-2 bg-blue-500/20 border border-blue-400/30 rounded-xl px-4 py-3 mb-8">
              <Package className="w-4 h-4 text-blue-300 shrink-0" />
              <p className="text-blue-200 text-sm">
                Track your order status in your <strong>Digital Vault</strong>
              </p>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Link to="/" className="flex-1">
                <Button
                  data-ocid="order_success.continue_shopping.button"
                  variant="outline"
                  className="w-full rounded-xl border-white/30 bg-white/10 text-white hover:bg-white/20 h-11"
                >
                  <ShoppingBag className="w-4 h-4 mr-2" />
                  Continue Shopping
                </Button>
              </Link>
              <Link to="/" className="flex-1">
                <Button
                  data-ocid="order_success.view_orders.button"
                  className="w-full rounded-xl bg-yellow-400 text-gray-900 hover:bg-yellow-300 font-bold h-11"
                >
                  View My Orders
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}

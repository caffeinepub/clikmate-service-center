import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Skeleton } from "@/components/ui/skeleton";
import { useCatalogItem } from "@/hooks/useQueries";
import { Link, useNavigate, useParams } from "@/utils/router";
import {
  AlertTriangle,
  ArrowLeft,
  ChevronRight,
  MessageCircle,
  Package,
  Printer,
} from "lucide-react";

const RETAIL_CATEGORIES = ["Tech Gadget", "Stationery", "Retail Product"];

function StockBadge({ status }: { status: string }) {
  const cls =
    status === "In Stock"
      ? "bg-green-100 text-green-700"
      : status === "Limited Stock"
        ? "bg-orange-100 text-orange-700"
        : "bg-red-100 text-red-700";
  return <Badge className={`${cls} font-semibold`}>{status}</Badge>;
}

export default function ItemDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const itemId = id ? BigInt(id) : null;
  const { data: item, isLoading } = useCatalogItem(itemId);

  const isRetail = item ? RETAIL_CATEGORIES.includes(item.category) : false;

  const imageFiles = item
    ? item.mediaFiles.filter((_, i) => item.mediaTypes[i] === "image")
    : [];
  const videoFiles = item
    ? item.mediaFiles.filter((_, i) => item.mediaTypes[i] === "video")
    : [];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div
          data-ocid="item.loading_state"
          className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10"
        >
          <Skeleton className="h-6 w-40 mb-8" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            <Skeleton className="h-80 w-full rounded-2xl" />
            <div className="space-y-4">
              <Skeleton className="h-5 w-20" />
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-6 w-24" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-11 w-40" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div data-ocid="item.error_state" className="text-center px-4">
          <AlertTriangle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-700 mb-2">
            Item Not Found
          </h1>
          <p className="text-gray-500 mb-6">
            This item may have been removed or is no longer available.
          </p>
          <Link to="/">
            <Button
              data-ocid="item.home.primary_button"
              className="blue-bg text-white hover:opacity-90"
            >
              Back to Home
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <header className="bg-white shadow-sm border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl blue-bg flex items-center justify-center">
              <Printer className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold blue-text">ClikMate</span>
          </div>
          <Link
            to="/"
            data-ocid="item.back.link"
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <nav
          className="flex items-center gap-1.5 text-sm text-gray-500 mb-8"
          aria-label="Breadcrumb"
        >
          <Link
            to="/"
            data-ocid="item.breadcrumb.link"
            className="hover:text-gray-800 transition-colors"
          >
            Home
          </Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span>{item.category}</span>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-gray-800 font-medium truncate max-w-[180px]">
            {item.name}
          </span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* Media Column */}
          <div className="space-y-4">
            {imageFiles.length > 0 ? (
              <>
                <Carousel
                  className="w-full rounded-2xl overflow-hidden shadow-card"
                  data-ocid="item.carousel"
                >
                  <CarouselContent>
                    {imageFiles.map((blob, idx) => (
                      <CarouselItem key={blob.getDirectURL()}>
                        <div className="relative aspect-[4/3] bg-gray-100">
                          <img
                            src={blob.getDirectURL()}
                            alt={`${item.name} - view ${idx + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                  {imageFiles.length > 1 && (
                    <>
                      <CarouselPrevious className="left-3" />
                      <CarouselNext className="right-3" />
                    </>
                  )}
                </Carousel>

                {/* Thumbnail strip */}
                {imageFiles.length > 1 && (
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {imageFiles.map((blob, idx) => (
                      <img
                        key={blob.getDirectURL()}
                        src={blob.getDirectURL()}
                        alt={`${item.name} - thumbnail ${idx + 1}`}
                        data-ocid={`item.thumbnail.${idx + 1}`}
                        className="w-16 h-16 rounded-lg object-cover shrink-0 border-2 border-transparent hover:border-blue-500 cursor-pointer transition-colors"
                      />
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="aspect-[4/3] rounded-2xl bg-gray-100 flex items-center justify-center">
                <Package className="w-16 h-16 text-gray-300" />
              </div>
            )}

            {/* Video Player */}
            {videoFiles.length > 0 && (
              <div className="rounded-2xl overflow-hidden shadow-card bg-black">
                {/* biome-ignore lint/a11y/useMediaCaption: user-uploaded video, no caption available */}
                <video
                  data-ocid="item.video.canvas_target"
                  src={videoFiles[0].getDirectURL()}
                  controls
                  className="w-full max-h-64 object-contain"
                />
              </div>
            )}
          </div>

          {/* Info Column */}
          <div className="space-y-5">
            <div>
              <Badge
                variant="outline"
                className="text-xs mb-3 blue-text border-blue-200"
              >
                {item.category}
              </Badge>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 leading-tight">
                {item.name}
              </h1>
            </div>

            <div className="flex items-center gap-4">
              <span className="text-3xl font-bold blue-text">{item.price}</span>
              <StockBadge status={item.stockStatus} />
            </div>

            {item.description && (
              <p className="text-gray-600 leading-relaxed text-sm sm:text-base">
                {item.description}
              </p>
            )}

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Button
                data-ocid="item.contact.primary_button"
                className="yellow-bg text-gray-900 font-semibold hover:opacity-90 h-12 px-6 rounded-full"
                onClick={() => {
                  navigate("/");
                  setTimeout(
                    () =>
                      document
                        .getElementById("contact")
                        ?.scrollIntoView({ behavior: "smooth" }),
                    200,
                  );
                }}
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                Contact for Order
              </Button>
              <Button
                data-ocid="item.back.secondary_button"
                variant="outline"
                className="h-12 px-6 rounded-full"
                onClick={() => navigate("/")}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                {isRetail ? "Back to Products" : "Back to Services"}
              </Button>
            </div>

            <div
              className="mt-4 p-4 rounded-xl border border-blue-100"
              style={{ background: "oklch(0.97 0.01 256)" }}
            >
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span className="text-base">🔒</span>
                <span>
                  100% Data Privacy Guaranteed. Your order and information stay
                  completely secure.
                </span>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="navy-bg text-white mt-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center">
          <p className="text-white/60 text-sm">
            &copy; {new Date().getFullYear()} ClikMate &mdash; Smart Online
            Service Center, Raipur.{" "}
            <a
              href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(typeof window !== "undefined" ? window.location.hostname : "")}`}
              target="_blank"
              rel="noreferrer"
              className="text-white/40 hover:text-white/70 transition-colors"
            >
              Built with caffeine.ai
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}

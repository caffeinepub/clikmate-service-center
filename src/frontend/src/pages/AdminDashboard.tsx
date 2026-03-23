import { ExternalBlob } from "@/backend";
import type {
  CatalogItem,
  CatalogItemInput,
  FilterOrders,
  OrderRecord,
  ShopOrder,
  backendInterface,
} from "@/backend.d";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useActor } from "@/hooks/useActor";
import { useInternetIdentity } from "@/hooks/useInternetIdentity";
import { Link } from "@/utils/router";
import {
  AlertTriangle,
  Bell,
  ClipboardList,
  Edit2,
  Eye,
  EyeOff,
  FilmIcon,
  FolderOpen,
  GripVertical,
  LayoutDashboard,
  Loader2,
  LogOut,
  Menu,
  Package,
  Printer,
  Search,
  Settings,
  Shield,
  Trash2,
  Upload,
  X,
  Zap,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORIES = [
  "Govt Service",
  "Printing",
  "Smart Card",
  "Resume Service",
  "Tech Gadget",
  "Stationery",
  "Retail Product",
];

const STOCK_STATUSES = ["In Stock", "Out of Stock", "Limited Stock"];

const CATEGORY_COLORS: Record<string, string> = {
  "Govt Service": "bg-blue-500/20 text-blue-300 border border-blue-500/30",
  Printing: "bg-purple-500/20 text-purple-300 border border-purple-500/30",
  "Smart Card": "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30",
  "Resume Service": "bg-amber-500/20 text-amber-300 border border-amber-500/30",
  "Tech Gadget": "bg-green-500/20 text-green-300 border border-green-500/30",
  Stationery: "bg-pink-500/20 text-pink-300 border border-pink-500/30",
  "Retail Product":
    "bg-orange-500/20 text-orange-300 border border-orange-500/30",
};

// ─── Types ────────────────────────────────────────────────────────────────────

type NavSection =
  | "dashboard"
  | "catalog"
  | "orders"
  | "active-orders"
  | "order-history"
  | "settings";

interface MediaFile {
  id: string;
  file?: File;
  previewUrl: string;
  type: "image" | "video";
  name: string;
  progress: number;
  existingBlob?: ExternalBlob;
}

interface FormState {
  name: string;
  category: string;
  description: string;
  price: string;
  stockStatus: string;
  mediaFiles: MediaFile[];
}

const EMPTY_FORM: FormState = {
  name: "",
  category: "Govt Service",
  description: "",
  price: "",
  stockStatus: "In Stock",
  mediaFiles: [],
};

// ─── Styles (inline dark theme) ───────────────────────────────────────────────

const S = {
  body: {
    backgroundColor: "#0a0f1e",
    minHeight: "100vh",
    display: "flex",
    color: "#e2e8f0",
    fontFamily: "inherit",
  } as React.CSSProperties,
  sidebar: {
    width: "260px",
    flexShrink: 0,
    backgroundColor: "#111827",
    borderRight: "1px solid rgba(255,255,255,0.07)",
    display: "flex",
    flexDirection: "column" as const,
    position: "fixed" as const,
    top: 0,
    left: 0,
    bottom: 0,
    zIndex: 40,
    overflowY: "auto" as const,
  },
  sidebarMobile: {
    width: "260px",
    flexShrink: 0,
    backgroundColor: "#111827",
    borderRight: "1px solid rgba(255,255,255,0.07)",
    display: "flex",
    flexDirection: "column" as const,
    position: "fixed" as const,
    top: 0,
    left: 0,
    bottom: 0,
    zIndex: 50,
    overflowY: "auto" as const,
  },
  mainContent: {
    flex: 1,
    marginLeft: "260px",
    display: "flex",
    flexDirection: "column" as const,
    minHeight: "100vh",
  },
  header: {
    backgroundColor: "#111827",
    borderBottom: "1px solid rgba(255,255,255,0.08)",
    padding: "0 24px",
    height: "64px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    position: "sticky" as const,
    top: 0,
    zIndex: 30,
  },
  card: {
    backgroundColor: "#1a2236",
    borderRadius: "12px",
    border: "1px solid rgba(255,255,255,0.08)",
  },
  table: {
    backgroundColor: "#111827",
    borderRadius: "16px",
    overflow: "hidden" as const,
    border: "1px solid rgba(255,255,255,0.07)",
  },
  tableHeader: {
    backgroundColor: "#1a2236",
  },
  modal: {
    backgroundColor: "#1a2236",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "16px",
    maxWidth: "700px",
    width: "100%",
    maxHeight: "90vh",
    overflowY: "auto" as const,
    position: "relative" as const,
  },
  input: {
    backgroundColor: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.12)",
    color: "#e2e8f0",
    borderRadius: "8px",
    padding: "8px 12px",
    width: "100%",
    outline: "none",
    fontSize: "14px",
  },
  dropzone: (hover: boolean) =>
    ({
      border: `2px dashed ${hover ? "#8b5cf6" : "rgba(139,92,246,0.4)"}`,
      borderRadius: "12px",
      padding: "32px 16px",
      textAlign: "center",
      cursor: "pointer",
      transition: "all 0.2s",
      backgroundColor: hover ? "rgba(139,92,246,0.1)" : "rgba(139,92,246,0.03)",
    }) as React.CSSProperties,
};

// ─── Media Uploader ───────────────────────────────────────────────────────────

function MediaUploader({
  mediaFiles,
  onChange,
}: {
  mediaFiles: MediaFile[];
  onChange: (files: MediaFile[]) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  function processFiles(fileList: FileList) {
    const newFiles: MediaFile[] = [];
    for (const file of Array.from(fileList)) {
      const isVideo = file.type.startsWith("video/");
      const isImage = file.type.startsWith("image/");
      if (!isVideo && !isImage) continue;
      const previewUrl = URL.createObjectURL(file);
      newFiles.push({
        id: `${Date.now()}-${Math.random()}`,
        file,
        previewUrl,
        type: isVideo ? "video" : "image",
        name: file.name,
        progress: 0,
      });
    }
    onChange([...mediaFiles, ...newFiles]);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length > 0) processFiles(e.dataTransfer.files);
  }

  function removeFile(id: string) {
    const removed = mediaFiles.find((f) => f.id === id);
    if (removed?.file) URL.revokeObjectURL(removed.previewUrl);
    onChange(mediaFiles.filter((f) => f.id !== id));
  }

  function handleReorderDragStart(index: number) {
    setDraggedIndex(index);
  }

  function handleReorderDragOver(e: React.DragEvent, index: number) {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;
    const newFiles = [...mediaFiles];
    const [removed] = newFiles.splice(draggedIndex, 1);
    newFiles.splice(index, 0, removed);
    setDraggedIndex(index);
    onChange(newFiles);
  }

  function handleReorderDragEnd() {
    setDraggedIndex(null);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
      <button
        type="button"
        data-ocid="admin.dropzone"
        style={S.dropzone(dragOver)}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
      >
        <Upload
          style={{
            width: 32,
            height: 32,
            margin: "0 auto 8px",
            color: "#8b5cf6",
          }}
        />
        <p
          style={{
            color: "#c4b5fd",
            fontWeight: 600,
            fontSize: 14,
            marginBottom: 4,
          }}
        >
          Drag &amp; drop images or videos here
        </p>
        <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 12 }}>
          or click to browse
        </p>
        <p
          style={{
            color: "rgba(255,255,255,0.25)",
            fontSize: 11,
            marginTop: 6,
          }}
        >
          Supports: JPG, PNG, GIF, MP4, MOV
        </p>
        <input
          ref={inputRef}
          type="file"
          accept="image/*,video/*"
          multiple
          style={{ display: "none" }}
          onChange={(e) => e.target.files && processFiles(e.target.files)}
        />
      </button>

      {mediaFiles.length > 0 && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 8,
          }}
        >
          {mediaFiles.map((mf, index) => (
            <div
              key={mf.id}
              data-ocid={`admin.media.item.${index + 1}`}
              draggable
              onDragStart={() => handleReorderDragStart(index)}
              onDragOver={(e) => handleReorderDragOver(e, index)}
              onDragEnd={handleReorderDragEnd}
              style={{
                position: "relative",
                borderRadius: 8,
                overflow: "hidden",
                border:
                  draggedIndex === index
                    ? "2px solid #8b5cf6"
                    : "1px solid rgba(255,255,255,0.1)",
                opacity: draggedIndex === index ? 0.5 : 1,
                cursor: "grab",
                backgroundColor: "#0a0f1e",
              }}
            >
              {mf.type === "image" ? (
                <img
                  src={mf.previewUrl}
                  alt={mf.name}
                  style={{ width: "100%", height: 80, objectFit: "cover" }}
                />
              ) : (
                <div
                  style={{
                    width: "100%",
                    height: 80,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: "#0a0f1e",
                  }}
                >
                  <FilmIcon
                    style={{
                      width: 24,
                      height: 24,
                      color: "#8b5cf6",
                      marginBottom: 2,
                    }}
                  />
                  <span
                    style={{
                      fontSize: 10,
                      color: "rgba(255,255,255,0.5)",
                      textAlign: "center",
                      padding: "0 4px",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      maxWidth: "100%",
                    }}
                  >
                    {mf.name}
                  </span>
                </div>
              )}
              <div style={{ position: "absolute", top: 2, left: 2 }}>
                <GripVertical
                  style={{
                    width: 14,
                    height: 14,
                    color: "rgba(255,255,255,0.6)",
                  }}
                />
              </div>
              <button
                type="button"
                data-ocid={`admin.media.delete_button.${index + 1}`}
                onClick={(e) => {
                  e.stopPropagation();
                  removeFile(mf.id);
                }}
                style={{
                  position: "absolute",
                  top: 2,
                  right: 2,
                  width: 20,
                  height: 20,
                  background: "#ef4444",
                  borderRadius: "50%",
                  border: "none",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <X style={{ width: 10, height: 10, color: "white" }} />
              </button>
              <div
                style={{
                  position: "absolute",
                  bottom: 0,
                  left: 0,
                  right: 0,
                  background: "rgba(0,0,0,0.6)",
                  padding: "2px 4px",
                }}
              >
                <p
                  style={{
                    color: "white",
                    fontSize: 9,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {mf.name}
                </p>
              </div>
              {mf.progress > 0 && mf.progress < 100 && (
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: "rgba(0,0,0,0.7)",
                  }}
                >
                  <span
                    style={{ color: "white", fontSize: 11, marginBottom: 4 }}
                  >
                    {mf.progress}%
                  </span>
                  <Progress value={mf.progress} className="w-3/4 h-1" />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Item Form Modal ──────────────────────────────────────────────────────────

function ItemFormModal({
  open,
  onClose,
  editItem,
  actor,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  editItem: CatalogItem | null;
  actor: backendInterface | null;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      if (editItem) {
        const mediaFiles: MediaFile[] = editItem.mediaFiles.map(
          (blob, idx) => ({
            id: `existing-${idx}`,
            previewUrl: blob.getDirectURL(),
            type: (editItem.mediaTypes[idx] || "image") as "image" | "video",
            name: `Media ${idx + 1}`,
            progress: 100,
            existingBlob: blob as unknown as ExternalBlob,
          }),
        );
        setForm({
          name: editItem.name,
          category: editItem.category,
          description: editItem.description,
          price: editItem.price,
          stockStatus: editItem.stockStatus,
          mediaFiles,
        });
      } else {
        setForm(EMPTY_FORM);
      }
    }
  }, [open, editItem]);

  async function handleSave() {
    if (!actor) return;
    if (!form.name.trim() || !form.price.trim()) {
      toast.error("Name and price are required.");
      return;
    }
    setSaving(true);
    try {
      const uploadedBlobs: ExternalBlob[] = [];
      const mediaTypes: string[] = [];
      for (const mf of form.mediaFiles) {
        if (mf.existingBlob) {
          uploadedBlobs.push(mf.existingBlob);
          mediaTypes.push(mf.type);
        } else if (mf.file) {
          const bytes = new Uint8Array(await mf.file.arrayBuffer());
          const blob = ExternalBlob.fromBytes(bytes).withUploadProgress(
            (pct) => {
              setForm((prev) => ({
                ...prev,
                mediaFiles: prev.mediaFiles.map((f) =>
                  f.id === mf.id ? { ...f, progress: pct } : f,
                ),
              }));
            },
          );
          uploadedBlobs.push(blob);
          mediaTypes.push(mf.type);
        }
      }
      const input: CatalogItemInput = {
        name: form.name,
        category: form.category,
        description: form.description,
        price: form.price,
        stockStatus: form.stockStatus,
        mediaFiles: uploadedBlobs,
        mediaTypes,
      };
      if (editItem) {
        await actor.updateCatalogItem(editItem.id, input);
        toast.success("Item updated!");
      } else {
        await actor.addCatalogItem(input);
        toast.success("Item added!");
      }
      onSaved();
      onClose();
    } catch (err) {
      console.error(err);
      toast.error("Failed to save item.");
    } finally {
      setSaving(false);
    }
  }

  if (!open) return null;

  const labelStyle: React.CSSProperties = {
    color: "rgba(255,255,255,0.6)",
    fontSize: 12,
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    marginBottom: 6,
    display: "block",
  };

  const inputStyle: React.CSSProperties = {
    ...S.input,
    backgroundColor: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.12)",
    color: "#e2e8f0",
  };

  return (
    <div
      role="presentation"
      data-ocid="admin.item.modal"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 100,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "rgba(0,0,0,0.7)",
        padding: "16px",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      onKeyDown={(e) => {
        if (e.key === "Escape") onClose();
      }}
    >
      <div style={S.modal}>
        {/* Modal Header */}
        <div
          style={{
            padding: "20px 24px 0",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <h2 style={{ color: "white", fontWeight: 700, fontSize: 18 }}>
            {editItem ? "Edit Item" : "Add New Catalog Item"}
          </h2>
          <button
            type="button"
            data-ocid="admin.item.close_button"
            onClick={onClose}
            style={{
              color: "rgba(255,255,255,0.5)",
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: 4,
            }}
          >
            <X style={{ width: 20, height: 20 }} />
          </button>
        </div>

        {/* Modal Body */}
        <div
          style={{
            padding: "20px 24px",
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 24,
          }}
        >
          {/* Left column */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <label htmlFor="modal-item-name" style={labelStyle}>
                Item Name *
              </label>
              <input
                id="modal-item-name"
                data-ocid="admin.item.input"
                style={inputStyle}
                placeholder="e.g. Bulk B&W Printing"
                value={form.name}
                onChange={(e) =>
                  setForm((p) => ({ ...p, name: e.target.value }))
                }
              />
            </div>

            <div>
              <label htmlFor="modal-item-category" style={labelStyle}>
                Category
              </label>
              <select
                id="modal-item-category"
                data-ocid="admin.category.select"
                style={{ ...inputStyle, appearance: "none" }}
                value={form.category}
                onChange={(e) =>
                  setForm((p) => ({ ...p, category: e.target.value }))
                }
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c} style={{ background: "#1a2236" }}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="modal-item-price" style={labelStyle}>
                Price *
              </label>
              <input
                id="modal-item-price"
                data-ocid="admin.price.input"
                style={inputStyle}
                placeholder="e.g. ₹50 or Free"
                value={form.price}
                onChange={(e) =>
                  setForm((p) => ({ ...p, price: e.target.value }))
                }
              />
            </div>

            <div>
              <label htmlFor="modal-item-stock" style={labelStyle}>
                Stock Status
              </label>
              <select
                id="modal-item-stock"
                data-ocid="admin.stock.select"
                style={{ ...inputStyle, appearance: "none" }}
                value={form.stockStatus}
                onChange={(e) =>
                  setForm((p) => ({ ...p, stockStatus: e.target.value }))
                }
              >
                {STOCK_STATUSES.map((s) => (
                  <option key={s} value={s} style={{ background: "#1a2236" }}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="modal-item-desc" style={labelStyle}>
                Description
              </label>
              <textarea
                id="modal-item-desc"
                data-ocid="admin.item.textarea"
                style={{ ...inputStyle, minHeight: 90, resize: "vertical" }}
                placeholder="Describe the service or product..."
                value={form.description}
                onChange={(e) =>
                  setForm((p) => ({ ...p, description: e.target.value }))
                }
              />
            </div>
          </div>

          {/* Right column: Media Uploader */}
          <div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginBottom: 12,
              }}
            >
              <span style={{ ...labelStyle, marginBottom: 0 }}>
                Media Gallery
              </span>
              <span
                style={{
                  backgroundColor: "rgba(139,92,246,0.3)",
                  color: "#c4b5fd",
                  borderRadius: 20,
                  padding: "2px 8px",
                  fontSize: 11,
                  fontWeight: 600,
                }}
              >
                {form.mediaFiles.length} files
              </span>
            </div>
            <MediaUploader
              mediaFiles={form.mediaFiles}
              onChange={(files) =>
                setForm((p) => ({ ...p, mediaFiles: files }))
              }
            />
          </div>
        </div>

        {/* Modal Footer */}
        <div
          style={{
            padding: "0 24px 20px",
            display: "flex",
            justifyContent: "flex-end",
            gap: 12,
          }}
        >
          <button
            type="button"
            data-ocid="admin.item.cancel_button"
            onClick={onClose}
            disabled={saving}
            style={{
              padding: "8px 20px",
              borderRadius: 8,
              border: "1px solid rgba(255,255,255,0.15)",
              background: "none",
              color: "rgba(255,255,255,0.7)",
              cursor: "pointer",
              fontSize: 14,
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            data-ocid="admin.item.save_button"
            onClick={handleSave}
            disabled={saving}
            style={{
              padding: "8px 24px",
              borderRadius: 8,
              border: "none",
              background: saving ? "#6d28d9" : "#7c3aed",
              color: "white",
              cursor: saving ? "not-allowed" : "pointer",
              fontSize: 14,
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            {saving && (
              <Loader2
                style={{
                  width: 14,
                  height: 14,
                  animation: "spin 1s linear infinite",
                }}
              />
            )}
            {saving ? "Saving..." : editItem ? "Update Item" : "Add Item"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Delete Confirm Modal ─────────────────────────────────────────────────────

function DeleteModal({
  open,
  onClose,
  onConfirm,
  itemName,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  itemName: string;
}) {
  if (!open) return null;
  return (
    <div
      role="presentation"
      data-ocid="admin.delete.dialog"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 110,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "rgba(0,0,0,0.75)",
        padding: 16,
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      onKeyDown={(e) => {
        if (e.key === "Escape") onClose();
      }}
    >
      <div
        style={{
          backgroundColor: "#1a2236",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: 16,
          padding: 24,
          maxWidth: 380,
          width: "100%",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            marginBottom: 12,
          }}
        >
          <AlertTriangle style={{ width: 22, height: 22, color: "#ef4444" }} />
          <h3 style={{ color: "white", fontWeight: 700, fontSize: 16 }}>
            Delete Item
          </h3>
        </div>
        <p
          style={{
            color: "rgba(255,255,255,0.6)",
            fontSize: 14,
            lineHeight: 1.6,
            marginBottom: 20,
          }}
        >
          Are you sure you want to permanently delete{" "}
          <strong style={{ color: "white" }}>{itemName}</strong>? This cannot be
          undone.
        </p>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
          <button
            type="button"
            data-ocid="admin.delete.cancel_button"
            onClick={onClose}
            style={{
              padding: "8px 18px",
              borderRadius: 8,
              border: "1px solid rgba(255,255,255,0.15)",
              background: "none",
              color: "rgba(255,255,255,0.7)",
              cursor: "pointer",
              fontSize: 14,
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            data-ocid="admin.delete.confirm_button"
            onClick={onConfirm}
            style={{
              padding: "8px 20px",
              borderRadius: 8,
              border: "none",
              background: "#dc2626",
              color: "white",
              cursor: "pointer",
              fontSize: 14,
              fontWeight: 600,
            }}
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Nav Item ─────────────────────────────────────────────────────────────────

function NavItem({
  icon: Icon,
  label,
  active,
  ocid,
  onClick,
}: {
  icon: React.ElementType;
  label: string;
  active: boolean;
  ocid: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      data-ocid={ocid}
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        width: "100%",
        padding: "10px 16px",
        borderRadius: 8,
        border: "none",
        cursor: "pointer",
        textAlign: "left",
        fontWeight: active ? 600 : 400,
        fontSize: 14,
        transition: "all 0.15s",
        backgroundColor: active ? "rgba(139,92,246,0.2)" : "transparent",
        color: active ? "#c4b5fd" : "rgba(255,255,255,0.55)",
        borderLeft: active ? "3px solid #8b5cf6" : "3px solid transparent",
        marginBottom: 2,
      }}
    >
      <Icon style={{ width: 18, height: 18, flexShrink: 0 }} />
      {label}
    </button>
  );
}

// ─── Stats Card ───────────────────────────────────────────────────────────────

function StatsCard({
  label,
  value,
  iconColor,
  icon: Icon,
}: {
  label: string;
  value: number | string;
  iconColor: string;
  icon: React.ElementType;
}) {
  return (
    <div
      style={{
        ...S.card,
        padding: "16px 20px",
        display: "flex",
        alignItems: "center",
        gap: 14,
      }}
    >
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: 10,
          backgroundColor: `${iconColor}22`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <Icon style={{ width: 20, height: 20, color: iconColor }} />
      </div>
      <div>
        <div
          style={{
            color: "white",
            fontWeight: 700,
            fontSize: 22,
            lineHeight: 1,
          }}
        >
          {value}
        </div>
        <div
          style={{
            color: "rgba(255,255,255,0.45)",
            fontSize: 12,
            marginTop: 2,
          }}
        >
          {label}
        </div>
      </div>
    </div>
  );
}

// ─── Catalog Section ──────────────────────────────────────────────────────────

function CatalogSection({
  items,
  loading,
  actor,
  onRefresh,
}: {
  items: CatalogItem[];
  loading: boolean;
  actor: backendInterface | null;
  onRefresh: () => void;
}) {
  const [search, setSearch] = useState("");
  const [addEditOpen, setAddEditOpen] = useState(false);
  const [editItem, setEditItem] = useState<CatalogItem | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<CatalogItem | null>(null);
  const [togglingId, setTogglingId] = useState<bigint | null>(null);
  const [deletingId, setDeletingId] = useState<bigint | null>(null);

  const filtered = items.filter(
    (item) =>
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.category.toLowerCase().includes(search.toLowerCase()),
  );

  async function handleTogglePublish(item: CatalogItem) {
    if (!actor) return;
    setTogglingId(item.id);
    try {
      await actor.togglePublishCatalogItem(item.id);
      onRefresh();
      toast.success(item.published ? "Item hidden." : "Item published!");
    } catch {
      toast.error("Failed to update publish status.");
    } finally {
      setTogglingId(null);
    }
  }

  async function handleDelete() {
    if (!actor || !deleteTarget) return;
    setDeletingId(deleteTarget.id);
    try {
      await actor.deleteCatalogItem(deleteTarget.id);
      onRefresh();
      toast.success("Item deleted.");
      setDeleteOpen(false);
      setDeleteTarget(null);
    } catch {
      toast.error("Failed to delete item.");
    } finally {
      setDeletingId(null);
    }
  }

  const published = items.filter((i) => i.published).length;
  const hidden = items.filter((i) => !i.published).length;
  const categories = new Set(items.map((i) => i.category)).size;

  return (
    <div style={{ padding: 24 }}>
      {/* Stats */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 14,
          marginBottom: 24,
        }}
      >
        <StatsCard
          label="Total Items"
          value={items.length}
          iconColor="#8b5cf6"
          icon={Package}
        />
        <StatsCard
          label="Published"
          value={published}
          iconColor="#10b981"
          icon={Eye}
        />
        <StatsCard
          label="Hidden"
          value={hidden}
          iconColor="#f59e0b"
          icon={EyeOff}
        />
        <StatsCard
          label="Categories"
          value={categories}
          iconColor="#3b82f6"
          icon={LayoutDashboard}
        />
      </div>

      {/* Table header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 16,
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <h2 style={{ color: "white", fontWeight: 700, fontSize: 16 }}>
          All Catalog Items
        </h2>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <div style={{ position: "relative" }}>
            <Search
              style={{
                position: "absolute",
                left: 10,
                top: "50%",
                transform: "translateY(-50%)",
                width: 16,
                height: 16,
                color: "rgba(255,255,255,0.35)",
              }}
            />
            <input
              data-ocid="admin.catalog.search_input"
              style={{ ...S.input, paddingLeft: 34, width: 220 }}
              placeholder="Search items..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button
            type="button"
            data-ocid="admin.catalog.primary_button"
            onClick={() => {
              setEditItem(null);
              setAddEditOpen(true);
            }}
            style={{
              padding: "8px 16px",
              borderRadius: 10,
              border: "none",
              background: "#7c3aed",
              color: "white",
              cursor: "pointer",
              fontWeight: 600,
              fontSize: 14,
              display: "flex",
              alignItems: "center",
              gap: 6,
              whiteSpace: "nowrap",
            }}
          >
            <span style={{ fontSize: 18, lineHeight: 1 }}>+</span> Add New Item
          </button>
        </div>
      </div>

      {/* Table */}
      <div style={S.table}>
        {loading ? (
          <div
            data-ocid="admin.catalog.loading_state"
            style={{
              textAlign: "center",
              padding: 60,
              color: "rgba(255,255,255,0.4)",
            }}
          >
            <Loader2
              style={{
                width: 32,
                height: 32,
                margin: "0 auto 12px",
                animation: "spin 1s linear infinite",
              }}
            />
            <p>Loading catalog...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div
            data-ocid="admin.catalog.empty_state"
            style={{
              textAlign: "center",
              padding: 60,
              color: "rgba(255,255,255,0.35)",
            }}
          >
            <Package style={{ width: 40, height: 40, margin: "0 auto 12px" }} />
            <p style={{ fontWeight: 600, marginBottom: 4 }}>
              No catalog items yet
            </p>
            <p style={{ fontSize: 13 }}>Add your first item to get started!</p>
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={S.tableHeader}>
                {[
                  "Thumbnail",
                  "Item Name",
                  "Category",
                  "Price",
                  "Stock",
                  "Status",
                  "Actions",
                ].map((h) => (
                  <th
                    key={h}
                    style={{
                      padding: "12px 16px",
                      textAlign: "left",
                      color: "rgba(255,255,255,0.4)",
                      fontSize: 11,
                      fontWeight: 600,
                      textTransform: "uppercase",
                      letterSpacing: "0.07em",
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((item, idx) => (
                <tr
                  key={String(item.id)}
                  data-ocid={`admin.catalog.row.${idx + 1}`}
                  style={{
                    backgroundColor: idx % 2 === 0 ? "#111827" : "#0f1729",
                    borderTop: "1px solid rgba(255,255,255,0.05)",
                    transition: "background 0.15s",
                  }}
                  onMouseEnter={(e) => {
                    (
                      e.currentTarget as HTMLTableRowElement
                    ).style.backgroundColor = "rgba(139,92,246,0.08)";
                  }}
                  onMouseLeave={(e) => {
                    (
                      e.currentTarget as HTMLTableRowElement
                    ).style.backgroundColor =
                      idx % 2 === 0 ? "#111827" : "#0f1729";
                  }}
                >
                  <td style={{ padding: "12px 16px" }}>
                    {item.mediaFiles.length > 0 ? (
                      <img
                        src={item.mediaFiles[0].getDirectURL()}
                        alt={item.name}
                        style={{
                          width: 48,
                          height: 48,
                          objectFit: "cover",
                          borderRadius: 8,
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: 48,
                          height: 48,
                          borderRadius: 8,
                          background:
                            "linear-gradient(135deg, #7c3aed, #3b82f6)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Package
                          style={{ width: 20, height: 20, color: "white" }}
                        />
                      </div>
                    )}
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <div
                      style={{ color: "white", fontWeight: 600, fontSize: 14 }}
                    >
                      {item.name}
                    </div>
                    {item.description && (
                      <div
                        style={{
                          color: "rgba(255,255,255,0.4)",
                          fontSize: 12,
                          marginTop: 2,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          maxWidth: 200,
                        }}
                      >
                        {item.description}
                      </div>
                    )}
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <span
                      style={{
                        display: "inline-block",
                        padding: "3px 10px",
                        borderRadius: 20,
                        fontSize: 12,
                        fontWeight: 600,
                      }}
                      className={
                        CATEGORY_COLORS[item.category] ||
                        "bg-gray-500/20 text-gray-300"
                      }
                    >
                      {item.category}
                    </span>
                  </td>
                  <td
                    style={{
                      padding: "12px 16px",
                      color: "white",
                      fontWeight: 700,
                    }}
                  >
                    {item.price}
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <span
                      style={{
                        display: "inline-block",
                        padding: "3px 10px",
                        borderRadius: 20,
                        fontSize: 12,
                        fontWeight: 600,
                        backgroundColor:
                          item.stockStatus === "In Stock"
                            ? "rgba(16,185,129,0.15)"
                            : item.stockStatus === "Out of Stock"
                              ? "rgba(239,68,68,0.15)"
                              : "rgba(245,158,11,0.15)",
                        color:
                          item.stockStatus === "In Stock"
                            ? "#34d399"
                            : item.stockStatus === "Out of Stock"
                              ? "#f87171"
                              : "#fbbf24",
                      }}
                    >
                      {item.stockStatus}
                    </span>
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <span
                      style={{
                        display: "inline-block",
                        padding: "3px 10px",
                        borderRadius: 20,
                        fontSize: 12,
                        fontWeight: 600,
                        backgroundColor: item.published
                          ? "rgba(16,185,129,0.15)"
                          : "rgba(100,116,139,0.15)",
                        color: item.published ? "#34d399" : "#94a3b8",
                      }}
                    >
                      {item.published ? "Published" : "Hidden"}
                    </span>
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <div style={{ display: "flex", gap: 4 }}>
                      <button
                        type="button"
                        data-ocid={`admin.catalog.edit_button.${idx + 1}`}
                        onClick={() => {
                          setEditItem(item);
                          setAddEditOpen(true);
                        }}
                        title="Edit"
                        style={{
                          padding: 6,
                          borderRadius: 6,
                          border: "none",
                          background: "transparent",
                          cursor: "pointer",
                          color: "rgba(255,255,255,0.5)",
                          transition: "all 0.15s",
                        }}
                        onMouseEnter={(e) => {
                          (e.currentTarget as HTMLButtonElement).style.color =
                            "#c4b5fd";
                          (
                            e.currentTarget as HTMLButtonElement
                          ).style.backgroundColor = "rgba(139,92,246,0.15)";
                        }}
                        onMouseLeave={(e) => {
                          (e.currentTarget as HTMLButtonElement).style.color =
                            "rgba(255,255,255,0.5)";
                          (
                            e.currentTarget as HTMLButtonElement
                          ).style.backgroundColor = "transparent";
                        }}
                      >
                        <Edit2 style={{ width: 15, height: 15 }} />
                      </button>
                      <button
                        type="button"
                        data-ocid={`admin.catalog.toggle.${idx + 1}`}
                        onClick={() => handleTogglePublish(item)}
                        title={item.published ? "Hide" : "Publish"}
                        disabled={togglingId === item.id}
                        style={{
                          padding: 6,
                          borderRadius: 6,
                          border: "none",
                          background: "transparent",
                          cursor: "pointer",
                          color: "rgba(255,255,255,0.5)",
                          transition: "all 0.15s",
                        }}
                        onMouseEnter={(e) => {
                          (e.currentTarget as HTMLButtonElement).style.color =
                            "#67e8f9";
                          (
                            e.currentTarget as HTMLButtonElement
                          ).style.backgroundColor = "rgba(6,182,212,0.1)";
                        }}
                        onMouseLeave={(e) => {
                          (e.currentTarget as HTMLButtonElement).style.color =
                            "rgba(255,255,255,0.5)";
                          (
                            e.currentTarget as HTMLButtonElement
                          ).style.backgroundColor = "transparent";
                        }}
                      >
                        {togglingId === item.id ? (
                          <Loader2
                            style={{
                              width: 15,
                              height: 15,
                              animation: "spin 1s linear infinite",
                            }}
                          />
                        ) : item.published ? (
                          <EyeOff style={{ width: 15, height: 15 }} />
                        ) : (
                          <Eye style={{ width: 15, height: 15 }} />
                        )}
                      </button>
                      <button
                        type="button"
                        data-ocid={`admin.catalog.delete_button.${idx + 1}`}
                        onClick={() => {
                          setDeleteTarget(item);
                          setDeleteOpen(true);
                        }}
                        title="Delete"
                        disabled={deletingId === item.id}
                        style={{
                          padding: 6,
                          borderRadius: 6,
                          border: "none",
                          background: "transparent",
                          cursor: "pointer",
                          color: "rgba(255,255,255,0.5)",
                          transition: "all 0.15s",
                        }}
                        onMouseEnter={(e) => {
                          (e.currentTarget as HTMLButtonElement).style.color =
                            "#f87171";
                          (
                            e.currentTarget as HTMLButtonElement
                          ).style.backgroundColor = "rgba(239,68,68,0.1)";
                        }}
                        onMouseLeave={(e) => {
                          (e.currentTarget as HTMLButtonElement).style.color =
                            "rgba(255,255,255,0.5)";
                          (
                            e.currentTarget as HTMLButtonElement
                          ).style.backgroundColor = "transparent";
                        }}
                      >
                        {deletingId === item.id ? (
                          <Loader2
                            style={{
                              width: 15,
                              height: 15,
                              animation: "spin 1s linear infinite",
                            }}
                          />
                        ) : (
                          <Trash2 style={{ width: 15, height: 15 }} />
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <ItemFormModal
        open={addEditOpen}
        onClose={() => setAddEditOpen(false)}
        editItem={editItem}
        actor={actor}
        onSaved={onRefresh}
      />
      <DeleteModal
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
        itemName={deleteTarget?.name ?? ""}
      />
    </div>
  );
}

// ─── Order Status Badge ───────────────────────────────────────────────────────

function OrderStatusBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; color: string }> = {
    Pending: { bg: "rgba(245,158,11,0.15)", color: "#fbbf24" },
    Printing: { bg: "rgba(59,130,246,0.15)", color: "#60a5fa" },
    "Ready for Pickup": { bg: "rgba(16,185,129,0.15)", color: "#34d399" },
    Delivered: { bg: "rgba(100,116,139,0.15)", color: "#94a3b8" },
  };
  const style = map[status] ?? {
    bg: "rgba(100,116,139,0.15)",
    color: "#94a3b8",
  };
  return (
    <span
      style={{
        display: "inline-block",
        padding: "3px 10px",
        borderRadius: 20,
        fontSize: 12,
        fontWeight: 600,
        backgroundColor: style.bg,
        color: style.color,
      }}
    >
      {status}
    </span>
  );
}

// ─── Orders Section ───────────────────────────────────────────────────────────

function OrdersSection({ actor }: { actor: backendInterface | null }) {
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!actor) return;
    const filter: FilterOrders = {};
    actor
      .filterOrders(filter)
      .then((data) => setOrders(data))
      .catch(() => toast.error("Failed to load orders."))
      .finally(() => setLoading(false));
  }, [actor]);

  return (
    <div style={{ padding: 24 }}>
      <h2
        style={{
          color: "white",
          fontWeight: 700,
          fontSize: 16,
          marginBottom: 16,
        }}
      >
        Order History
      </h2>
      <div style={S.table}>
        {loading ? (
          <div
            data-ocid="admin.orders.loading_state"
            style={{
              textAlign: "center",
              padding: 60,
              color: "rgba(255,255,255,0.4)",
            }}
          >
            <Loader2
              style={{
                width: 32,
                height: 32,
                margin: "0 auto 12px",
                animation: "spin 1s linear infinite",
              }}
            />
            <p>Loading orders...</p>
          </div>
        ) : orders.length === 0 ? (
          <div
            data-ocid="admin.orders.empty_state"
            style={{
              textAlign: "center",
              padding: 60,
              color: "rgba(255,255,255,0.35)",
            }}
          >
            <ClipboardList
              style={{ width: 40, height: 40, margin: "0 auto 12px" }}
            />
            <p style={{ fontWeight: 600 }}>No orders yet</p>
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={S.tableHeader}>
                {[
                  "Order ID",
                  "Customer",
                  "Service",
                  "Status",
                  "Date",
                  "Files",
                ].map((h) => (
                  <th
                    key={h}
                    style={{
                      padding: "12px 16px",
                      textAlign: "left",
                      color: "rgba(255,255,255,0.4)",
                      fontSize: 11,
                      fontWeight: 600,
                      textTransform: "uppercase",
                      letterSpacing: "0.07em",
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {orders.map((order, idx) => (
                <tr
                  key={String(order.id)}
                  data-ocid={`admin.orders.row.${idx + 1}`}
                  style={{
                    backgroundColor: idx % 2 === 0 ? "#111827" : "#0f1729",
                    borderTop: "1px solid rgba(255,255,255,0.05)",
                  }}
                >
                  <td
                    style={{
                      padding: "12px 16px",
                      color: "#a78bfa",
                      fontWeight: 600,
                      fontSize: 13,
                    }}
                  >
                    #{String(order.id)}
                  </td>
                  <td
                    style={{
                      padding: "12px 16px",
                      color: "white",
                      fontSize: 14,
                    }}
                  >
                    {order.name}
                  </td>
                  <td
                    style={{
                      padding: "12px 16px",
                      color: "rgba(255,255,255,0.6)",
                      fontSize: 13,
                    }}
                  >
                    {order.serviceType}
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <OrderStatusBadge status={order.status} />
                  </td>
                  <td
                    style={{
                      padding: "12px 16px",
                      color: "rgba(255,255,255,0.4)",
                      fontSize: 12,
                    }}
                  >
                    {new Date(
                      Number(order.submittedAt) / 1_000_000,
                    ).toLocaleDateString()}
                  </td>
                  <td
                    style={{
                      padding: "12px 16px",
                      color: "rgba(255,255,255,0.4)",
                      fontSize: 12,
                    }}
                  >
                    {order.uploadedFiles.length} file(s)
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// ─── Live Dashboard Section ───────────────────────────────────────────────────

function DashboardSection({ items }: { items: CatalogItem[] }) {
  const published = items.filter((i) => i.published).length;
  const metrics = [
    { label: "Items Published", value: published, icon: Eye, color: "#10b981" },
    {
      label: "Total Catalog",
      value: items.length,
      icon: Package,
      color: "#8b5cf6",
    },
    {
      label: "Categories",
      value: new Set(items.map((i) => i.category)).size,
      icon: LayoutDashboard,
      color: "#3b82f6",
    },
    {
      label: "Hidden Items",
      value: items.filter((i) => !i.published).length,
      icon: EyeOff,
      color: "#f59e0b",
    },
  ];
  const recent = [...items]
    .sort((a, b) => Number(b.createdAt) - Number(a.createdAt))
    .slice(0, 5);
  return (
    <div style={{ padding: 24 }}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 14,
          marginBottom: 28,
        }}
      >
        {metrics.map((m) => (
          <StatsCard
            key={m.label}
            label={m.label}
            value={m.value}
            iconColor={m.color}
            icon={m.icon}
          />
        ))}
      </div>
      <div style={S.card}>
        <div
          style={{
            padding: "16px 20px",
            borderBottom: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <h3 style={{ color: "white", fontWeight: 700, fontSize: 15 }}>
            Recent Catalog Activity
          </h3>
        </div>
        {recent.length === 0 ? (
          <div
            style={{
              padding: 40,
              textAlign: "center",
              color: "rgba(255,255,255,0.3)",
            }}
          >
            <p>No items yet. Add your first catalog item!</p>
          </div>
        ) : (
          <div style={{ padding: "8px 0" }}>
            {recent.map((item) => (
              <div
                key={String(item.id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  padding: "10px 20px",
                  borderBottom: "1px solid rgba(255,255,255,0.04)",
                }}
              >
                {item.mediaFiles.length > 0 ? (
                  <img
                    src={item.mediaFiles[0].getDirectURL()}
                    alt={item.name}
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 8,
                      objectFit: "cover",
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 8,
                      background: "linear-gradient(135deg, #7c3aed, #3b82f6)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Package
                      style={{ width: 16, height: 16, color: "white" }}
                    />
                  </div>
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      color: "white",
                      fontWeight: 600,
                      fontSize: 14,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {item.name}
                  </div>
                  <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 12 }}>
                    {item.category} &bull; {item.price}
                  </div>
                </div>
                <span
                  style={{
                    padding: "3px 10px",
                    borderRadius: 20,
                    fontSize: 12,
                    fontWeight: 600,
                    backgroundColor: item.published
                      ? "rgba(16,185,129,0.15)"
                      : "rgba(100,116,139,0.15)",
                    color: item.published ? "#34d399" : "#94a3b8",
                  }}
                >
                  {item.published ? "Live" : "Draft"}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Active Shop Orders Section ───────────────────────────────────────────────

const SHOP_ORDER_STATUSES = [
  "Pending",
  "Printing",
  "Ready for Pickup",
  "Delivered",
  "Cancelled",
];
const ACTIVE_STATUSES = ["Pending", "Printing", "Ready for Pickup"];

function ShopOrderStatusBadge({ status }: { status: string }) {
  const colorMap: Record<string, { bg: string; color: string }> = {
    Pending: { bg: "rgba(234,179,8,0.2)", color: "#fbbf24" },
    Printing: { bg: "rgba(59,130,246,0.2)", color: "#60a5fa" },
    "Ready for Pickup": { bg: "rgba(16,185,129,0.2)", color: "#34d399" },
    Delivered: { bg: "rgba(139,92,246,0.2)", color: "#a78bfa" },
    Cancelled: { bg: "rgba(239,68,68,0.2)", color: "#f87171" },
  };
  const c = colorMap[status] || {
    bg: "rgba(255,255,255,0.1)",
    color: "rgba(255,255,255,0.5)",
  };
  return (
    <span
      style={{
        background: c.bg,
        color: c.color,
        borderRadius: 6,
        padding: "3px 10px",
        fontSize: 12,
        fontWeight: 600,
      }}
    >
      {status}
    </span>
  );
}

function ActiveOrdersSection({ actor }: { actor: backendInterface | null }) {
  const [orders, setOrders] = useState<ShopOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<bigint | null>(null);

  function loadOrders() {
    if (!actor) return;
    setLoading(true);
    (actor as unknown as backendInterface)
      .getAllShopOrders()
      .then((data) => {
        const sorted = [...data].sort(
          (a, b) => Number(b.createdAt) - Number(a.createdAt),
        );
        setOrders(sorted);
      })
      .catch(() => toast.error("Failed to load orders."))
      .finally(() => setLoading(false));
  }

  // biome-ignore lint/correctness/useExhaustiveDependencies: loadOrders is stable
  useEffect(() => {
    loadOrders();
  }, [actor]);

  const activeOrders = orders.filter((o) => ACTIVE_STATUSES.includes(o.status));

  async function handleStatusChange(orderId: bigint, newStatus: string) {
    if (!actor) return;
    setUpdatingId(orderId);
    try {
      await (actor as unknown as backendInterface).updateShopOrderStatus(
        orderId,
        newStatus,
      );
      toast.success(`Status updated to "${newStatus}"`);
      loadOrders();
    } catch {
      toast.error("Failed to update status.");
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <div style={{ padding: 24 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 20,
        }}
      >
        <h2 style={{ color: "white", fontWeight: 700, fontSize: 16 }}>
          Active Orders
          <span
            style={{
              marginLeft: 8,
              background: "rgba(234,179,8,0.2)",
              color: "#fbbf24",
              borderRadius: 20,
              padding: "2px 10px",
              fontSize: 12,
            }}
          >
            {activeOrders.length}
          </span>
        </h2>
        <button
          type="button"
          onClick={loadOrders}
          style={{
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 8,
            padding: "6px 14px",
            color: "rgba(255,255,255,0.6)",
            cursor: "pointer",
            fontSize: 13,
          }}
        >
          Refresh
        </button>
      </div>
      <div style={S.table}>
        {loading ? (
          <div
            data-ocid="admin.active_orders.loading_state"
            style={{
              textAlign: "center",
              padding: 60,
              color: "rgba(255,255,255,0.4)",
            }}
          >
            <Loader2
              style={{
                width: 32,
                height: 32,
                margin: "0 auto 12px",
                animation: "spin 1s linear infinite",
              }}
            />
            <p>Loading active orders...</p>
          </div>
        ) : activeOrders.length === 0 ? (
          <div
            data-ocid="admin.active_orders.empty_state"
            style={{
              textAlign: "center",
              padding: 60,
              color: "rgba(255,255,255,0.35)",
            }}
          >
            <ClipboardList
              style={{ width: 40, height: 40, margin: "0 auto 12px" }}
            />
            <p style={{ fontWeight: 600 }}>No active orders</p>
            <p style={{ fontSize: 13 }}>New orders will appear here.</p>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                minWidth: 700,
              }}
            >
              <thead>
                <tr style={S.tableHeader}>
                  {[
                    "Order ID",
                    "Customer",
                    "Phone",
                    "Items",
                    "Total",
                    "Delivery",
                    "Payment",
                    "Status",
                    "Time",
                  ].map((h) => (
                    <th
                      key={h}
                      style={{
                        padding: "12px 14px",
                        textAlign: "left",
                        color: "rgba(255,255,255,0.4)",
                        fontSize: 11,
                        fontWeight: 600,
                        textTransform: "uppercase",
                        letterSpacing: "0.07em",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {activeOrders.map((order, idx) => (
                  <tr
                    key={String(order.id)}
                    data-ocid={`admin.active_orders.row.${idx + 1}`}
                    style={{
                      backgroundColor: idx % 2 === 0 ? "#111827" : "#0f1729",
                      borderTop: "1px solid rgba(255,255,255,0.05)",
                    }}
                  >
                    <td
                      style={{
                        padding: "12px 14px",
                        color: "#a78bfa",
                        fontWeight: 600,
                        fontSize: 13,
                        whiteSpace: "nowrap",
                      }}
                    >
                      #SO-{String(order.id)}
                    </td>
                    <td
                      style={{
                        padding: "12px 14px",
                        color: "white",
                        fontSize: 14,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {order.customerName}
                    </td>
                    <td
                      style={{
                        padding: "12px 14px",
                        color: "rgba(255,255,255,0.6)",
                        fontSize: 13,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {order.phone}
                    </td>
                    <td
                      style={{
                        padding: "12px 14px",
                        color: "rgba(255,255,255,0.7)",
                        fontSize: 12,
                        maxWidth: 160,
                      }}
                    >
                      {order.items
                        .map((i) => `${i.itemName} x${i.qty}`)
                        .join(", ")}
                    </td>
                    <td
                      style={{
                        padding: "12px 14px",
                        color: "#fbbf24",
                        fontWeight: 700,
                        fontSize: 13,
                        whiteSpace: "nowrap",
                      }}
                    >
                      ₹{order.totalAmount.toFixed(0)}
                    </td>
                    <td
                      style={{
                        padding: "12px 14px",
                        color: "rgba(255,255,255,0.6)",
                        fontSize: 12,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {order.deliveryMethod}
                    </td>
                    <td
                      style={{
                        padding: "12px 14px",
                        color: "rgba(255,255,255,0.6)",
                        fontSize: 12,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {order.paymentMethod}
                    </td>
                    <td style={{ padding: "12px 14px" }}>
                      {updatingId === order.id ? (
                        <Loader2
                          style={{
                            width: 16,
                            height: 16,
                            animation: "spin 1s linear infinite",
                            color: "#a78bfa",
                          }}
                        />
                      ) : (
                        <select
                          data-ocid={`admin.active_orders.status.${idx + 1}`}
                          value={order.status}
                          onChange={(e) =>
                            handleStatusChange(order.id, e.target.value)
                          }
                          style={{
                            background: "#1e2a3a",
                            border: "1px solid rgba(255,255,255,0.15)",
                            borderRadius: 6,
                            color: "white",
                            padding: "4px 8px",
                            fontSize: 12,
                            cursor: "pointer",
                          }}
                        >
                          {SHOP_ORDER_STATUSES.map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
                      )}
                    </td>
                    <td
                      style={{
                        padding: "12px 14px",
                        color: "rgba(255,255,255,0.4)",
                        fontSize: 12,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {new Date(
                        Number(order.createdAt) / 1_000_000,
                      ).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Shop Order History Section ───────────────────────────────────────────────

function OrderHistorySection({ actor }: { actor: backendInterface | null }) {
  const [orders, setOrders] = useState<ShopOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!actor) return;
    (actor as unknown as backendInterface)
      .getAllShopOrders()
      .then((data) => {
        const completed = data
          .filter((o) => ["Delivered", "Cancelled"].includes(o.status))
          .sort((a, b) => Number(b.createdAt) - Number(a.createdAt));
        setOrders(completed);
      })
      .catch(() => toast.error("Failed to load order history."))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actor]);

  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ color: "white", fontWeight: 700, fontSize: 16 }}>
          Order History
          <span
            style={{
              marginLeft: 8,
              background: "rgba(139,92,246,0.2)",
              color: "#a78bfa",
              borderRadius: 20,
              padding: "2px 10px",
              fontSize: 12,
            }}
          >
            {orders.length} completed
          </span>
        </h2>
      </div>
      <div style={S.table}>
        {loading ? (
          <div
            data-ocid="admin.order_history.loading_state"
            style={{
              textAlign: "center",
              padding: 60,
              color: "rgba(255,255,255,0.4)",
            }}
          >
            <Loader2
              style={{
                width: 32,
                height: 32,
                margin: "0 auto 12px",
                animation: "spin 1s linear infinite",
              }}
            />
            <p>Loading history...</p>
          </div>
        ) : orders.length === 0 ? (
          <div
            data-ocid="admin.order_history.empty_state"
            style={{
              textAlign: "center",
              padding: 60,
              color: "rgba(255,255,255,0.35)",
            }}
          >
            <ClipboardList
              style={{ width: 40, height: 40, margin: "0 auto 12px" }}
            />
            <p style={{ fontWeight: 600 }}>No completed orders yet</p>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                minWidth: 700,
              }}
            >
              <thead>
                <tr style={S.tableHeader}>
                  {[
                    "Order ID",
                    "Customer",
                    "Items",
                    "Total",
                    "Delivery",
                    "Payment",
                    "Status",
                    "Date",
                  ].map((h) => (
                    <th
                      key={h}
                      style={{
                        padding: "12px 14px",
                        textAlign: "left",
                        color: "rgba(255,255,255,0.4)",
                        fontSize: 11,
                        fontWeight: 600,
                        textTransform: "uppercase",
                        letterSpacing: "0.07em",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {orders.map((order, idx) => (
                  <tr
                    key={String(order.id)}
                    data-ocid={`admin.order_history.row.${idx + 1}`}
                    style={{
                      backgroundColor: idx % 2 === 0 ? "#111827" : "#0f1729",
                      borderTop: "1px solid rgba(255,255,255,0.05)",
                    }}
                  >
                    <td
                      style={{
                        padding: "12px 14px",
                        color: "#a78bfa",
                        fontWeight: 600,
                        fontSize: 13,
                      }}
                    >
                      #SO-{String(order.id)}
                    </td>
                    <td
                      style={{
                        padding: "12px 14px",
                        color: "white",
                        fontSize: 14,
                      }}
                    >
                      {order.customerName}
                    </td>
                    <td
                      style={{
                        padding: "12px 14px",
                        color: "rgba(255,255,255,0.7)",
                        fontSize: 12,
                        maxWidth: 160,
                      }}
                    >
                      {order.items
                        .map((i) => `${i.itemName} x${i.qty}`)
                        .join(", ")}
                    </td>
                    <td
                      style={{
                        padding: "12px 14px",
                        color: "#fbbf24",
                        fontWeight: 700,
                        fontSize: 13,
                      }}
                    >
                      ₹{order.totalAmount.toFixed(0)}
                    </td>
                    <td
                      style={{
                        padding: "12px 14px",
                        color: "rgba(255,255,255,0.6)",
                        fontSize: 12,
                      }}
                    >
                      {order.deliveryMethod}
                    </td>
                    <td
                      style={{
                        padding: "12px 14px",
                        color: "rgba(255,255,255,0.6)",
                        fontSize: 12,
                      }}
                    >
                      {order.paymentMethod}
                    </td>
                    <td style={{ padding: "12px 14px" }}>
                      <ShopOrderStatusBadge status={order.status} />
                    </td>
                    <td
                      style={{
                        padding: "12px 14px",
                        color: "rgba(255,255,255,0.4)",
                        fontSize: 12,
                      }}
                    >
                      {new Date(
                        Number(order.createdAt) / 1_000_000,
                      ).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Settings Section ─────────────────────────────────────────────────────────

function SettingsSection({ actor }: { actor: backendInterface | null }) {
  const [upiId, setUpiId] = useState("");
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);

  // biome-ignore lint/correctness/useExhaustiveDependencies: loaded prevents re-runs
  useEffect(() => {
    if (!actor || loaded) return;
    (actor as unknown as backendInterface)
      .getUpiSettings()
      .then((settings) => {
        if (settings) {
          setUpiId(settings.upiId);
          setQrCodeUrl(settings.qrCodeUrl);
        }
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, [actor]);

  async function handleSave() {
    if (!actor) return;
    setSaving(true);
    try {
      await (actor as unknown as backendInterface).setUpiSettings(
        upiId,
        qrCodeUrl,
      );
      toast.success("UPI settings saved successfully!");
    } catch {
      toast.error("Failed to save UPI settings.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ padding: 24 }}>
      {/* UPI Payment Settings */}
      <div style={{ ...S.card, marginBottom: 24 }}>
        <div
          style={{
            padding: "16px 20px",
            borderBottom: "1px solid rgba(255,255,255,0.08)",
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: "rgba(139,92,246,0.2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Settings style={{ width: 18, height: 18, color: "#a78bfa" }} />
          </div>
          <div>
            <h3
              style={{
                color: "white",
                fontWeight: 700,
                fontSize: 15,
                margin: 0,
              }}
            >
              UPI Payment Settings
            </h3>
            <p
              style={{
                color: "rgba(255,255,255,0.4)",
                fontSize: 12,
                margin: 0,
              }}
            >
              Configure your UPI ID and QR code for customer payments
            </p>
          </div>
        </div>
        <div style={{ padding: 20 }}>
          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}
          >
            <div>
              <div style={{ marginBottom: 16 }}>
                <label
                  htmlFor="upi-id-input"
                  style={{
                    display: "block",
                    color: "rgba(255,255,255,0.6)",
                    fontSize: 12,
                    fontWeight: 600,
                    marginBottom: 6,
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  UPI ID
                </label>
                <input
                  id="upi-id-input"
                  data-ocid="admin.settings.upi_id.input"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  placeholder="e.g. smartonline@sbi"
                  style={{ ...S.input, width: "100%" }}
                />
                <p
                  style={{
                    color: "rgba(255,255,255,0.3)",
                    fontSize: 11,
                    marginTop: 4,
                  }}
                >
                  Customers will see this UPI ID on the checkout page
                </p>
              </div>
              <div style={{ marginBottom: 16 }}>
                <label
                  htmlFor="qr-url-input"
                  style={{
                    display: "block",
                    color: "rgba(255,255,255,0.6)",
                    fontSize: 12,
                    fontWeight: 600,
                    marginBottom: 6,
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  QR Code Image URL
                </label>
                <input
                  id="qr-url-input"
                  data-ocid="admin.settings.qr_url.input"
                  value={qrCodeUrl}
                  onChange={(e) => setQrCodeUrl(e.target.value)}
                  placeholder="https://... or /assets/generated/..."
                  style={{ ...S.input, width: "100%" }}
                />
                <p
                  style={{
                    color: "rgba(255,255,255,0.3)",
                    fontSize: 11,
                    marginTop: 4,
                  }}
                >
                  Paste the URL of your UPI QR code image
                </p>
              </div>
              <button
                type="button"
                data-ocid="admin.settings.save_upi.button"
                onClick={handleSave}
                disabled={saving}
                style={{
                  padding: "10px 24px",
                  borderRadius: 10,
                  border: "none",
                  background: saving ? "rgba(139,92,246,0.4)" : "#7c3aed",
                  color: "white",
                  cursor: saving ? "not-allowed" : "pointer",
                  fontWeight: 600,
                  fontSize: 14,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                {saving && (
                  <Loader2
                    style={{
                      width: 14,
                      height: 14,
                      animation: "spin 1s linear infinite",
                    }}
                  />
                )}
                {saving ? "Saving..." : "Save UPI Settings"}
              </button>
            </div>
            <div>
              <div
                style={{
                  display: "block",
                  color: "rgba(255,255,255,0.6)",
                  fontSize: 12,
                  fontWeight: 600,
                  marginBottom: 6,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                QR Code Preview
              </div>
              <div
                style={{
                  background: "rgba(255,255,255,0.03)",
                  border: "1px dashed rgba(255,255,255,0.1)",
                  borderRadius: 12,
                  padding: 16,
                  minHeight: 200,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {qrCodeUrl ? (
                  <img
                    src={qrCodeUrl}
                    alt="QR Code Preview"
                    style={{
                      maxWidth: "100%",
                      maxHeight: 200,
                      borderRadius: 8,
                    }}
                  />
                ) : (
                  <div
                    style={{
                      textAlign: "center",
                      color: "rgba(255,255,255,0.2)",
                    }}
                  >
                    <Settings
                      style={{ width: 32, height: 32, margin: "0 auto 8px" }}
                    />
                    <p style={{ fontSize: 12 }}>
                      QR code preview will appear here
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Admin Init Screen ───────────────────────────────────────────────────────
function AdminInitScreen({
  actor,
  onSuccess,
}: {
  actor: ReturnType<typeof import("@/hooks/useActor").useActor>["actor"];
  onSuccess: () => void;
}) {
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleClaim() {
    if (!actor) return;
    setLoading(true);
    setError("");
    try {
      await (
        actor as unknown as backendInterface
      )._initializeAccessControlWithSecret(token);
      onSuccess();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      if (msg.includes("already")) {
        setError(
          "Admin ya toh already assign hai ya token galat hai. Sahi admin token enter karein.",
        );
      } else {
        setError(
          "Token galat hai ya access denied. Caffeine project settings se Admin Token check karein.",
        );
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0a0f1e",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
    >
      <div
        data-ocid="admin.init_screen"
        style={{
          background: "#1a2236",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: 20,
          padding: 40,
          maxWidth: 420,
          width: "100%",
          textAlign: "center",
        }}
      >
        <AlertTriangle
          style={{
            width: 48,
            height: 48,
            color: "#f59e0b",
            margin: "0 auto 16px",
          }}
        />
        <h2
          style={{
            color: "white",
            fontWeight: 700,
            fontSize: 18,
            marginBottom: 8,
          }}
        >
          Admin Setup Required
        </h2>
        <p
          style={{
            color: "rgba(255,255,255,0.5)",
            fontSize: 14,
            marginBottom: 24,
            lineHeight: 1.6,
          }}
        >
          Aapki identity admin ke roop mein register nahi hai. Pehli baar admin
          claim karne ke liye Caffeine project settings se Admin Token enter
          karein.
        </p>
        <div style={{ textAlign: "left", marginBottom: 16 }}>
          <label
            htmlFor="admin-token-input"
            style={{
              color: "rgba(255,255,255,0.7)",
              fontSize: 13,
              display: "block",
              marginBottom: 6,
            }}
          >
            Admin Token
          </label>
          <input
            id="admin-token-input"
            type="password"
            placeholder="Caffeine Admin Token paste karein..."
            value={token}
            onChange={(e) => setToken(e.target.value)}
            style={{
              width: "100%",
              padding: "10px 14px",
              borderRadius: 10,
              border: "1px solid rgba(255,255,255,0.15)",
              background: "#0f1829",
              color: "white",
              fontSize: 14,
              outline: "none",
              boxSizing: "border-box",
            }}
          />
        </div>
        {error && (
          <p style={{ color: "#ef4444", fontSize: 13, marginBottom: 12 }}>
            {error}
          </p>
        )}
        <button
          type="button"
          onClick={handleClaim}
          disabled={loading || !token}
          data-ocid="admin.init.claim_button"
          style={{
            width: "100%",
            padding: "12px",
            borderRadius: 10,
            border: "none",
            background: loading || !token ? "#374151" : "#7c3aed",
            color: "white",
            cursor: loading || !token ? "not-allowed" : "pointer",
            fontWeight: 600,
            fontSize: 15,
            marginBottom: 12,
          }}
        >
          {loading ? "Verify kar raha hai..." : "Admin Access Claim Karein"}
        </button>
        <Link to="/">
          <button
            type="button"
            style={{
              padding: "8px 20px",
              borderRadius: 10,
              border: "1px solid rgba(255,255,255,0.2)",
              background: "transparent",
              color: "rgba(255,255,255,0.6)",
              cursor: "pointer",
              fontSize: 13,
            }}
          >
            Back to Site
          </button>
        </Link>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AdminDashboard() {
  const { actor, isFetching } = useActor();
  const { identity, login, isLoggingIn, clear } = useInternetIdentity();

  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [checkingAdmin, setCheckingAdmin] = useState(false);
  const [activeSection, setActiveSection] = useState<NavSection>("catalog");
  const [catalogItems, setCatalogItems] = useState<CatalogItem[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  useEffect(() => {
    const handler = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);

  const isMobile = windowWidth < 768;

  useEffect(() => {
    if (!actor || isFetching) return;
    setCheckingAdmin(true);
    actor
      .isCallerAdmin()
      .then((v) => setIsAdmin(v))
      .catch(() => setIsAdmin(false))
      .finally(() => setCheckingAdmin(false));
  }, [actor, isFetching]);

  function loadCatalog() {
    if (!actor) return;
    setCatalogLoading(true);
    (actor as unknown as backendInterface)
      .getAllCatalogItems()
      .then((data) => setCatalogItems(data))
      .catch(() => toast.error("Failed to load catalog."))
      .finally(() => setCatalogLoading(false));
  }

  // biome-ignore lint/correctness/useExhaustiveDependencies: loadCatalog is stable
  useEffect(() => {
    if (actor && !isFetching && isAdmin) loadCatalog();
  }, [actor, isFetching, isAdmin]);

  const navSectionLabels: Record<NavSection, string> = {
    dashboard: "Live Dashboard",
    catalog: "Catalog Manager",
    orders: "Print Orders",
    "active-orders": "Active Orders",
    "order-history": "Order History",
    settings: "Settings",
  };

  // ── View 1: Not logged in ──────────────────────────────────────────────────
  if (!identity) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "linear-gradient(135deg, #0f1729 0%, #1a1040 100%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          overflow: "hidden",
          padding: 16,
        }}
      >
        {/* Decorative circles */}
        <div
          style={{
            position: "absolute",
            width: 400,
            height: 400,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(139,92,246,0.12) 0%, transparent 70%)",
            top: "-100px",
            right: "-100px",
            pointerEvents: "none",
          }}
        />
        <div
          style={{
            position: "absolute",
            width: 300,
            height: 300,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(234,179,8,0.08) 0%, transparent 70%)",
            bottom: "-80px",
            left: "-80px",
            pointerEvents: "none",
          }}
        />
        <div
          style={{
            position: "absolute",
            width: 200,
            height: 200,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(59,130,246,0.1) 0%, transparent 70%)",
            top: "40%",
            left: "10%",
            pointerEvents: "none",
          }}
        />

        {/* Login card */}
        <div
          style={{
            maxWidth: 420,
            width: "100%",
            background: "rgba(255,255,255,0.05)",
            backdropFilter: "blur(20px)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 24,
            padding: "40px 36px",
            boxShadow: "0 25px 60px rgba(0,0,0,0.5)",
            textAlign: "center",
          }}
        >
          {/* Logo */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 12,
              marginBottom: 28,
            }}
          >
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: "50%",
                background: "#eab308",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 4px 20px rgba(234,179,8,0.4)",
              }}
            >
              <Printer style={{ width: 26, height: 26, color: "#111" }} />
            </div>
            <div style={{ textAlign: "left" }}>
              <div
                style={{
                  color: "white",
                  fontWeight: 800,
                  fontSize: 20,
                  letterSpacing: "-0.5px",
                }}
              >
                ClikMate
              </div>
              <div
                style={{
                  color: "rgba(255,255,255,0.45)",
                  fontSize: 12,
                  marginTop: -2,
                }}
              >
                Admin Portal
              </div>
            </div>
          </div>

          <h1
            style={{
              color: "white",
              fontWeight: 700,
              fontSize: 22,
              marginBottom: 8,
            }}
          >
            Secure Admin Login
          </h1>
          <p
            style={{
              color: "rgba(255,255,255,0.55)",
              fontSize: 14,
              lineHeight: 1.6,
              marginBottom: 28,
            }}
          >
            Sign in with Internet Identity to access the dashboard
          </p>

          <button
            type="button"
            data-ocid="admin.login.primary_button"
            onClick={login}
            disabled={isLoggingIn}
            style={{
              width: "100%",
              padding: "14px",
              borderRadius: 12,
              border: "none",
              background: "#eab308",
              color: "#111",
              fontWeight: 700,
              fontSize: 15,
              cursor: isLoggingIn ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 10,
              boxShadow: "0 4px 20px rgba(234,179,8,0.35)",
              opacity: isLoggingIn ? 0.8 : 1,
              transition: "all 0.2s",
            }}
          >
            {isLoggingIn ? (
              <Loader2
                style={{
                  width: 18,
                  height: 18,
                  animation: "spin 1s linear infinite",
                }}
              />
            ) : (
              <Shield style={{ width: 18, height: 18 }} />
            )}
            {isLoggingIn ? "Signing in..." : "Login with Internet Identity"}
          </button>

          <p
            style={{
              marginTop: 16,
              color: "rgba(255,255,255,0.3)",
              fontSize: 12,
            }}
          >
            🔒 Protected by Internet Computer Identity
          </p>

          <Link
            to="/"
            data-ocid="admin.home.link"
            style={{
              display: "block",
              marginTop: 20,
              color: "rgba(255,255,255,0.45)",
              fontSize: 13,
              textDecoration: "none",
            }}
          >
            ← Back to Site
          </Link>
        </div>
      </div>
    );
  }

  // ── View 2: Checking admin / loading ──────────────────────────────────────
  if (checkingAdmin || isFetching) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#0a0f1e",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          data-ocid="admin.loading_state"
          style={{ textAlign: "center", color: "rgba(255,255,255,0.5)" }}
        >
          <Loader2
            style={{
              width: 36,
              height: 36,
              margin: "0 auto 12px",
              animation: "spin 1s linear infinite",
              color: "#8b5cf6",
            }}
          />
          <p>Verifying admin access...</p>
        </div>
      </div>
    );
  }

  // ── View 3: Access denied ─────────────────────────────────────────────────
  if (isAdmin === false) {
    return (
      <AdminInitScreen
        actor={actor}
        onSuccess={() => {
          setIsAdmin(null);
          setCheckingAdmin(true);
          actor
            ?.isCallerAdmin()
            .then((v) => setIsAdmin(v))
            .catch(() => setIsAdmin(false))
            .finally(() => setCheckingAdmin(false));
        }}
      />
    );
  }

  // ── View 4: Full Dashboard ────────────────────────────────────────────────
  const sidebarStyle = isMobile
    ? {
        ...S.sidebarMobile,
        transform: sidebarOpen ? "translateX(0)" : "translateX(-100%)",
        transition: "transform 0.3s ease",
      }
    : S.sidebar;

  const mainStyle = isMobile
    ? {
        flex: 1,
        display: "flex",
        flexDirection: "column" as const,
        minHeight: "100vh",
      }
    : S.mainContent;

  return (
    <div style={S.body}>
      {/* Mobile overlay */}
      {isMobile && sidebarOpen && (
        <div
          role="presentation"
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.6)",
            zIndex: 45,
          }}
          onClick={() => setSidebarOpen(false)}
          onKeyDown={(e) => {
            if (e.key === "Escape") setSidebarOpen(false);
          }}
        />
      )}

      {/* ── Sidebar ─────────────────────────────────────────────────────── */}
      <nav style={sidebarStyle}>
        {/* Logo */}
        <div
          style={{
            padding: "20px 16px 16px",
            borderBottom: "1px solid rgba(255,255,255,0.07)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: "#eab308",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <Printer style={{ width: 18, height: 18, color: "#111" }} />
            </div>
            <div>
              <div style={{ color: "white", fontWeight: 800, fontSize: 15 }}>
                ClikMate
              </div>
              <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 11 }}>
                Admin Panel
              </div>
            </div>
          </div>
        </div>

        {/* Nav links */}
        <div style={{ flex: 1, padding: "12px 10px" }}>
          <NavItem
            icon={LayoutDashboard}
            label="Live Dashboard"
            active={activeSection === "dashboard"}
            ocid="admin.dashboard.tab"
            onClick={() => {
              setActiveSection("dashboard");
              setSidebarOpen(false);
            }}
          />
          <NavItem
            icon={Package}
            label="Catalog Manager"
            active={activeSection === "catalog"}
            ocid="admin.catalog.tab"
            onClick={() => {
              setActiveSection("catalog");
              setSidebarOpen(false);
            }}
          />
          <NavItem
            icon={ClipboardList}
            label="Print Orders"
            active={activeSection === "orders"}
            ocid="admin.orders.tab"
            onClick={() => {
              setActiveSection("orders");
              setSidebarOpen(false);
            }}
          />
          <NavItem
            icon={Zap}
            label="Active Orders"
            active={activeSection === "active-orders"}
            ocid="admin.active_orders.tab"
            onClick={() => {
              setActiveSection("active-orders");
              setSidebarOpen(false);
            }}
          />
          <NavItem
            icon={FolderOpen}
            label="Order History"
            active={activeSection === "order-history"}
            ocid="admin.order_history.tab"
            onClick={() => {
              setActiveSection("order-history");
              setSidebarOpen(false);
            }}
          />
          <NavItem
            icon={Settings}
            label="Settings"
            active={activeSection === "settings"}
            ocid="admin.settings.tab"
            onClick={() => {
              setActiveSection("settings");
              setSidebarOpen(false);
            }}
          />
        </div>

        {/* User + Logout */}
        <div
          style={{
            padding: "12px 16px",
            borderTop: "1px solid rgba(255,255,255,0.07)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 10,
            }}
          >
            <div style={{ position: "relative" }}>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  background: "linear-gradient(135deg, #7c3aed, #3b82f6)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <span style={{ color: "white", fontWeight: 700, fontSize: 13 }}>
                  A
                </span>
              </div>
              <div
                style={{
                  position: "absolute",
                  bottom: 0,
                  right: 0,
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  backgroundColor: "#10b981",
                  border: "2px solid #111827",
                }}
              />
            </div>
            <div>
              <div style={{ color: "white", fontWeight: 600, fontSize: 13 }}>
                Admin
              </div>
              <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 11 }}>
                Active
              </div>
            </div>
          </div>
          <button
            type="button"
            data-ocid="admin.logout.button"
            onClick={clear}
            style={{
              width: "100%",
              padding: "8px",
              borderRadius: 8,
              border: "1px solid rgba(255,255,255,0.1)",
              background: "transparent",
              color: "rgba(255,255,255,0.5)",
              cursor: "pointer",
              fontSize: 13,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              transition: "all 0.15s",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.color = "#f87171";
              (e.currentTarget as HTMLButtonElement).style.borderColor =
                "rgba(239,68,68,0.4)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.color =
                "rgba(255,255,255,0.5)";
              (e.currentTarget as HTMLButtonElement).style.borderColor =
                "rgba(255,255,255,0.1)";
            }}
          >
            <LogOut style={{ width: 14, height: 14 }} />
            Logout
          </button>
        </div>
      </nav>

      {/* ── Main Content ─────────────────────────────────────────────────── */}
      <div style={mainStyle}>
        {/* Header */}
        <header style={S.header}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {isMobile && (
              <button
                type="button"
                data-ocid="admin.sidebar.toggle"
                onClick={() => setSidebarOpen((v) => !v)}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "rgba(255,255,255,0.6)",
                  padding: 4,
                }}
              >
                <Menu style={{ width: 22, height: 22 }} />
              </button>
            )}
            <h1 style={{ color: "white", fontWeight: 700, fontSize: 17 }}>
              {navSectionLabels[activeSection]}
            </h1>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button
              type="button"
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "rgba(255,255,255,0.5)",
                padding: 4,
              }}
            >
              <Bell style={{ width: 20, height: 20 }} />
            </button>
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: "50%",
                background: "linear-gradient(135deg, #7c3aed, #3b82f6)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <span style={{ color: "white", fontWeight: 700, fontSize: 14 }}>
                A
              </span>
            </div>
            <Link
              to="/"
              data-ocid="admin.back.link"
              style={{
                color: "rgba(255,255,255,0.4)",
                fontSize: 12,
                textDecoration: "none",
                padding: "4px 10px",
                borderRadius: 6,
                border: "1px solid rgba(255,255,255,0.1)",
              }}
            >
              ← Site
            </Link>
          </div>
        </header>

        {/* Section content */}
        <main style={{ flex: 1, overflowY: "auto" }}>
          {activeSection === "dashboard" && (
            <DashboardSection items={catalogItems} />
          )}
          {activeSection === "catalog" && (
            <CatalogSection
              items={catalogItems}
              loading={catalogLoading}
              actor={actor as unknown as backendInterface}
              onRefresh={loadCatalog}
            />
          )}
          {activeSection === "orders" && (
            <OrdersSection actor={actor as unknown as backendInterface} />
          )}
          {activeSection === "active-orders" && (
            <ActiveOrdersSection actor={actor as unknown as backendInterface} />
          )}
          {activeSection === "order-history" && (
            <OrderHistorySection actor={actor as unknown as backendInterface} />
          )}
          {activeSection === "settings" && (
            <SettingsSection actor={actor as unknown as backendInterface} />
          )}
        </main>
      </div>
    </div>
  );
}

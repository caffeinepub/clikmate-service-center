import { ExternalBlob } from "@/backend";
import type {
  CatalogItem,
  CatalogItemInput,
  FilterOrders,
  OrderRecord,
  Review,
  ShopOrder,
  TypesettingQuoteRequest,
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
  Star,
  Trash2,
  Upload,
  Users,
  Wallet,
  X,
  Zap,
} from "lucide-react";
import React from "react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORIES = [
  "CSC & Govt Services",
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
  "CSC & Govt Services":
    "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30",
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
  | "settings"
  | "team"
  | "wallet"
  | "reviews";

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
  requiredDocuments: string;
  mediaFiles: MediaFile[];
}

const EMPTY_FORM: FormState = {
  name: "",
  category: "CSC & Govt Services",
  description: "",
  price: "",
  stockStatus: "In Stock",
  requiredDocuments: "",
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
          requiredDocuments: editItem.requiredDocuments || "",
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
        requiredDocuments:
          form.category === "CSC & Govt Services" ? form.requiredDocuments : "",
        mediaFiles: uploadedBlobs,
        mediaTypes,
      };
      if (editItem) {
        await actor.updateCatalogItem(editItem.id, input);
        toast.success("Item updated!");
      } else {
        await actor.addCatalogItem(input);
        toast.success("Item Added Successfully");
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

            {form.category === "CSC & Govt Services" && (
              <div>
                <label htmlFor="modal-item-required-docs" style={labelStyle}>
                  Required Documents (Comma Separated)
                </label>
                <input
                  id="modal-item-required-docs"
                  data-ocid="admin.required_docs.input"
                  style={inputStyle}
                  placeholder="e.g. Aadhaar, Passport Photo, Signature"
                  value={form.requiredDocuments}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      requiredDocuments: e.target.value,
                    }))
                  }
                />
                <p
                  style={{
                    color: "rgba(167,139,250,0.7)",
                    fontSize: 11,
                    marginTop: 4,
                  }}
                >
                  Each document becomes an upload button for the customer
                </p>
              </div>
            )}
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
                    {item.category === "CSC & Govt Services" &&
                      item.requiredDocuments && (
                        <div
                          style={{
                            color: "#a78bfa",
                            fontSize: 11,
                            marginTop: 4,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            maxWidth: 200,
                          }}
                        >
                          📄 Docs: {item.requiredDocuments}
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
    "Processing/Printing": { bg: "rgba(59,130,246,0.15)", color: "#60a5fa" },
    Printing: { bg: "rgba(59,130,246,0.15)", color: "#60a5fa" },
    "Ready for Pickup": { bg: "rgba(16,185,129,0.15)", color: "#34d399" },
    "Ready for Delivery": { bg: "rgba(99,102,241,0.15)", color: "#818cf8" },
    Completed: { bg: "rgba(16,185,129,0.15)", color: "#34d399" },
    Delivered: { bg: "rgba(100,116,139,0.15)", color: "#94a3b8" },
    Cancelled: { bg: "rgba(239,68,68,0.15)", color: "#f87171" },
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

// ─── Files Viewer Modal ────────────────────────────────────────────────────────

function FilesViewerModal({
  files,
  onClose,
}: { files: ExternalBlob[]; onClose: () => void }) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "rgba(0,0,0,0.7)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
      onClick={onClose}
      onKeyDown={(e) => {
        if (e.key === "Escape") onClose();
      }}
      role="presentation"
    >
      <div
        role="presentation"
        style={{
          background: "#0f172a",
          border: "1px solid rgba(99,102,241,0.4)",
          borderRadius: 12,
          padding: 24,
          minWidth: 340,
          maxWidth: 520,
          width: "90%",
          boxShadow: "0 20px 60px rgba(0,0,0,0.6)",
        }}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 16,
          }}
        >
          <h3
            style={{ color: "white", fontWeight: 700, fontSize: 16, margin: 0 }}
          >
            📂 Customer Uploaded Files
          </h3>
          <button
            type="button"
            data-ocid="admin.files_modal.close_button"
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              color: "rgba(255,255,255,0.5)",
              cursor: "pointer",
              fontSize: 20,
              lineHeight: 1,
            }}
          >
            ×
          </button>
        </div>
        {files.length === 0 ? (
          <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 13 }}>
            No files uploaded.
          </p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {files.map((file, i) => (
              <a
                key={file.getDirectURL()}
                href={file.getDirectURL()}
                target="_blank"
                rel="noreferrer"
                data-ocid={`admin.files_modal.button.${i + 1}`}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  background: "rgba(99,102,241,0.15)",
                  border: "1px solid rgba(99,102,241,0.35)",
                  borderRadius: 8,
                  padding: "10px 14px",
                  textDecoration: "none",
                  color: "#a78bfa",
                  fontSize: 13,
                  fontWeight: 600,
                  transition: "background 0.15s",
                }}
              >
                <span style={{ fontSize: 18 }}>📄</span>
                <span style={{ flex: 1 }}>File {i + 1}</span>
                <span
                  style={{
                    background: "rgba(99,102,241,0.3)",
                    borderRadius: 4,
                    padding: "2px 8px",
                    fontSize: 11,
                    color: "#c4b5fd",
                  }}
                >
                  Download / Open
                </span>
              </a>
            ))}
          </div>
        )}
        <button
          type="button"
          data-ocid="admin.files_modal.cancel_button"
          onClick={onClose}
          style={{
            marginTop: 16,
            width: "100%",
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 8,
            color: "rgba(255,255,255,0.6)",
            padding: "8px 0",
            cursor: "pointer",
            fontSize: 13,
          }}
        >
          Close
        </button>
      </div>
    </div>
  );
}

// ─── Orders Section ───────────────────────────────────────────────────────────

function OrdersSection({ actor }: { actor: backendInterface | null }) {
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewingFiles, setViewingFiles] = useState<any[] | null>(null);
  const [updatingOrderId, setUpdatingOrderId] = useState<bigint | null>(null);

  useEffect(() => {
    if (!actor) return;
    const filter: FilterOrders = {};
    actor
      .filterOrders(filter)
      .then((data) => setOrders(data))
      .catch(() => toast.error("Failed to load orders."))
      .finally(() => setLoading(false));
  }, [actor]);

  async function handlePrintOrderStatusChange(
    orderId: bigint,
    newStatus: string,
  ) {
    if (!actor) return;
    setUpdatingOrderId(orderId);
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o)),
    );
    try {
      await actor.updateOrderStatus(orderId, newStatus);
      toast.success("Status updated");
    } catch {
      toast.error("Failed to update status");
      // revert on error
      actor
        .filterOrders({})
        .then((data) => setOrders(data))
        .catch(() => {});
    } finally {
      setUpdatingOrderId(null);
    }
  }

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
                  <td style={{ padding: "12px 16px" }}>
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 6,
                        alignItems: "flex-start",
                        minWidth: 160,
                      }}
                    >
                      {updatingOrderId === order.id ? (
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
                          data-ocid={`admin.orders.status.${idx + 1}`}
                          value={order.status}
                          onChange={(e) =>
                            handlePrintOrderStatusChange(
                              order.id,
                              e.target.value,
                            )
                          }
                          style={{
                            background: "#1e293b",
                            color: "#e2e8f0",
                            border: "1px solid #334155",
                            borderRadius: 6,
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
                      {order.uploadedFiles.length > 0 && (
                        <button
                          type="button"
                          data-ocid={`admin.orders.view_files.${idx + 1}`}
                          onClick={() => setViewingFiles(order.uploadedFiles)}
                          style={{
                            background: "rgba(99,102,241,0.2)",
                            color: "#818cf8",
                            border: "1px solid rgba(99,102,241,0.4)",
                            borderRadius: 6,
                            padding: "4px 10px",
                            fontSize: 12,
                            cursor: "pointer",
                          }}
                        >
                          📂 View Files
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      {viewingFiles && (
        <FilesViewerModal
          files={viewingFiles}
          onClose={() => setViewingFiles(null)}
        />
      )}
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
  "Processing/Printing",
  "Ready for Pickup",
  "Ready for Delivery",
  "Completed",
  "Cancelled",
];

const CSC_ORDER_STATUSES = [
  "Pending",
  "Docs Received",
  "Processing Application",
  "Hold/Missing Info",
  "Submitted to Portal",
  "Completed",
  "Cancelled",
];
const ACTIVE_STATUSES = [
  "Pending",
  "Processing/Printing",
  "Ready for Pickup",
  "Ready for Delivery",
];

function ShopOrderStatusBadge({ status }: { status: string }) {
  const colorMap: Record<string, { bg: string; color: string }> = {
    Pending: { bg: "rgba(234,179,8,0.2)", color: "#fbbf24" },
    "Processing/Printing": { bg: "rgba(59,130,246,0.2)", color: "#60a5fa" },
    Printing: { bg: "rgba(59,130,246,0.2)", color: "#60a5fa" },
    "Ready for Pickup": { bg: "rgba(16,185,129,0.2)", color: "#34d399" },
    "Ready for Delivery": { bg: "rgba(99,102,241,0.2)", color: "#818cf8" },
    Completed: { bg: "rgba(16,185,129,0.2)", color: "#34d399" },
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

// ─── Typesetting Quotes Table ─────────────────────────────────────────────────

function TypesettingQuotesTable({ actor }: { actor: backendInterface | null }) {
  const [quotes, setQuotes] = useState<TypesettingQuoteRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<bigint | null>(null);

  function loadQuotes() {
    if (!actor) return;
    setLoading(true);
    (actor as unknown as backendInterface)
      .getAllTypesettingQuotes()
      .then((data) => setQuotes(data))
      .catch(() => toast.error("Failed to load quotes."))
      .finally(() => setLoading(false));
  }

  // biome-ignore lint/correctness/useExhaustiveDependencies: loadQuotes is stable
  useEffect(() => {
    loadQuotes();
  }, [actor]);

  async function handleStatusUpdate(id: bigint, status: string) {
    if (!actor) return;
    setUpdatingId(id);
    try {
      await (actor as unknown as backendInterface).updateTypesettingQuoteStatus(
        id,
        { status },
      );
      toast.success(`Quote status updated to "${status}"`);
      loadQuotes();
    } catch {
      toast.error("Failed to update status.");
    } finally {
      setUpdatingId(null);
    }
  }

  if (loading) {
    return (
      <div
        style={{
          textAlign: "center",
          padding: 40,
          color: "rgba(255,255,255,0.4)",
        }}
      >
        <Loader2
          style={{
            width: 28,
            height: 28,
            margin: "0 auto",
            animation: "spin 1s linear infinite",
          }}
        />
      </div>
    );
  }

  if (quotes.length === 0) {
    return (
      <div
        data-ocid="admin.typesetting_quotes.empty_state"
        style={{
          textAlign: "center",
          padding: 40,
          color: "rgba(255,255,255,0.35)",
        }}
      >
        <p>No typesetting quote requests yet.</p>
      </div>
    );
  }

  return (
    <div style={{ overflowX: "auto" }}>
      <table
        style={{ width: "100%", borderCollapse: "collapse", minWidth: 700 }}
      >
        <thead>
          <tr>
            {[
              "ID",
              "Name",
              "Phone",
              "Subject",
              "Format",
              "Language",
              "Submitted",
              "Status",
              "Action",
            ].map((h) => (
              <th
                key={h}
                style={{
                  padding: "10px 12px",
                  textAlign: "left",
                  color: "rgba(255,255,255,0.4)",
                  fontSize: 11,
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.07em",
                  borderBottom: "1px solid rgba(255,255,255,0.08)",
                }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {quotes.map((q, idx) => (
            <tr
              key={String(q.id)}
              data-ocid={`admin.typesetting_quotes.item.${idx + 1}`}
              style={{
                backgroundColor:
                  idx % 2 === 0 ? "rgba(255,255,255,0.02)" : "transparent",
                borderBottom: "1px solid rgba(255,255,255,0.05)",
              }}
            >
              <td
                style={{
                  padding: "10px 12px",
                  color: "#a78bfa",
                  fontWeight: 600,
                  fontSize: 13,
                }}
              >
                #{String(q.id)}
              </td>
              <td
                style={{ padding: "10px 12px", color: "white", fontSize: 13 }}
              >
                {q.name}
              </td>
              <td
                style={{
                  padding: "10px 12px",
                  color: "rgba(255,255,255,0.6)",
                  fontSize: 13,
                }}
              >
                {q.phone}
              </td>
              <td
                style={{
                  padding: "10px 12px",
                  color: "rgba(255,255,255,0.8)",
                  fontSize: 13,
                }}
              >
                {q.subject}
              </td>
              <td
                style={{
                  padding: "10px 12px",
                  color: "rgba(255,255,255,0.7)",
                  fontSize: 12,
                }}
              >
                {q.format}
              </td>
              <td
                style={{
                  padding: "10px 12px",
                  color: "rgba(255,255,255,0.7)",
                  fontSize: 12,
                }}
              >
                {q.language}
              </td>
              <td
                style={{
                  padding: "10px 12px",
                  color: "rgba(255,255,255,0.4)",
                  fontSize: 12,
                }}
              >
                {new Date(Number(q.submittedAt) / 1_000_000).toLocaleDateString(
                  "en-IN",
                  { day: "numeric", month: "short" },
                )}
              </td>
              <td style={{ padding: "10px 12px" }}>
                <span
                  style={{
                    padding: "3px 10px",
                    borderRadius: 20,
                    fontSize: 11,
                    fontWeight: 600,
                    background:
                      q.status === "Completed"
                        ? "rgba(16,185,129,0.2)"
                        : q.status === "In Progress"
                          ? "rgba(59,130,246,0.2)"
                          : q.status === "Rejected"
                            ? "rgba(239,68,68,0.2)"
                            : "rgba(234,179,8,0.2)",
                    color:
                      q.status === "Completed"
                        ? "#10b981"
                        : q.status === "In Progress"
                          ? "#60a5fa"
                          : q.status === "Rejected"
                            ? "#f87171"
                            : "#fbbf24",
                  }}
                >
                  {q.status || "Pending"}
                </span>
              </td>
              <td style={{ padding: "10px 12px" }}>
                <select
                  data-ocid={`admin.typesetting_quotes.status.select.${idx + 1}`}
                  onChange={(e) => handleStatusUpdate(q.id, e.target.value)}
                  disabled={updatingId === q.id}
                  defaultValue=""
                  style={{
                    background: "rgba(255,255,255,0.07)",
                    border: "1px solid rgba(255,255,255,0.12)",
                    borderRadius: 8,
                    padding: "5px 8px",
                    color: "white",
                    fontSize: 12,
                    cursor: "pointer",
                    outline: "none",
                  }}
                >
                  <option value="" disabled>
                    Update status
                  </option>
                  <option value="In Progress">In Progress</option>
                  <option value="Completed">Completed</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ActiveOrdersSection({ actor }: { actor: backendInterface | null }) {
  const [orders, setOrders] = useState<ShopOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<bigint | null>(null);
  const [expandedOrderId, setExpandedOrderId] = useState<bigint | null>(null);
  const [viewingActiveFiles, setViewingActiveFiles] = useState<any[] | null>(
    null,
  );
  const [uploadingFinalId, setUploadingFinalId] = useState<bigint | null>(null);

  async function handleUploadFinalOutput(orderId: bigint, file: File) {
    if (!actor) return;
    setUploadingFinalId(orderId);
    try {
      const bytes = new Uint8Array(await file.arrayBuffer());
      const blob = ExternalBlob.fromBytes(bytes);
      await (actor as unknown as backendInterface).uploadCscFinalOutput(
        orderId,
        blob,
      );
      toast.success("Final output uploaded! Customer can now download it.");
      loadOrders();
    } catch {
      toast.error("Failed to upload final output.");
    } finally {
      setUploadingFinalId(null);
    }
  }

  function loadOrders() {
    if (!actor) return;
    setLoading(true);
    (actor as unknown as { getAllShopOrders: () => Promise<ShopOrder[]> })
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

  const activeOrders = orders.filter(
    (o) =>
      ACTIVE_STATUSES.includes(o.status) ||
      [
        "Docs Received",
        "Processing Application",
        "Hold/Missing Info",
        "Submitted to Portal",
      ].includes(o.status),
  );

  async function handleStatusChange(orderId: bigint, newStatus: string) {
    if (!actor) return;
    setUpdatingId(orderId);
    try {
      await (
        actor as unknown as {
          updateShopOrderStatus: (id: bigint, status: string) => Promise<void>;
        }
      ).updateShopOrderStatus(orderId, newStatus);
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
                    "Actions",
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
                {activeOrders.map((order, idx) => {
                  const isCsc =
                    order.cscDocuments && order.cscDocuments.length > 0;
                  const isExpanded = expandedOrderId === order.id;
                  return (
                    <React.Fragment key={String(order.id)}>
                      <tr
                        data-ocid={`admin.active_orders.row.${idx + 1}`}
                        tabIndex={isCsc ? 0 : undefined}
                        style={{
                          backgroundColor:
                            idx % 2 === 0 ? "#111827" : "#0f1729",
                          borderTop: "1px solid rgba(255,255,255,0.05)",
                          cursor: isCsc ? "pointer" : "default",
                        }}
                        onClick={
                          isCsc
                            ? () =>
                                setExpandedOrderId(isExpanded ? null : order.id)
                            : undefined
                        }
                        onKeyDown={
                          isCsc
                            ? (e) => {
                                if (e.key === "Enter" || e.key === " ")
                                  setExpandedOrderId(
                                    isExpanded ? null : order.id,
                                  );
                              }
                            : undefined
                        }
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
                          <ShopOrderStatusBadge status={order.status} />
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
                        <td style={{ padding: "12px 14px" }}>
                          <div
                            style={{
                              display: "flex",
                              flexDirection: "column",
                              gap: 6,
                              alignItems: "flex-start",
                              minWidth: 160,
                            }}
                          >
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
                                onClick={(e) => e.stopPropagation()}
                                onKeyDown={(e) => e.stopPropagation()}
                                onChange={(e) => {
                                  e.stopPropagation();
                                  handleStatusChange(order.id, e.target.value);
                                }}
                                style={{
                                  background: "#1e293b",
                                  color: "#e2e8f0",
                                  border: "1px solid #334155",
                                  borderRadius: 6,
                                  padding: "4px 8px",
                                  fontSize: 12,
                                  cursor: "pointer",
                                }}
                              >
                                {(isCsc
                                  ? CSC_ORDER_STATUSES
                                  : SHOP_ORDER_STATUSES
                                ).map((s) => (
                                  <option key={s} value={s}>
                                    {s}
                                  </option>
                                ))}
                              </select>
                            )}
                            {order.cscDocuments &&
                              order.cscDocuments.length > 0 && (
                                <button
                                  type="button"
                                  data-ocid={`admin.active_orders.view_docs.${idx + 1}`}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setViewingActiveFiles(order.cscDocuments);
                                  }}
                                  style={{
                                    background: "rgba(99,102,241,0.2)",
                                    color: "#818cf8",
                                    border: "1px solid rgba(99,102,241,0.4)",
                                    borderRadius: 6,
                                    padding: "4px 10px",
                                    fontSize: 12,
                                    cursor: "pointer",
                                  }}
                                >
                                  📂 View Docs
                                </button>
                              )}
                          </div>
                        </td>
                      </tr>
                      {isCsc && isExpanded && (
                        <tr
                          key={`csc-${String(order.id)}`}
                          style={{ backgroundColor: "rgba(99,102,241,0.08)" }}
                        >
                          <td colSpan={10} style={{ padding: "16px 20px" }}>
                            <div
                              style={{
                                display: "flex",
                                flexDirection: "column",
                                gap: 12,
                              }}
                            >
                              <p
                                style={{
                                  color: "#a78bfa",
                                  fontWeight: 700,
                                  fontSize: 13,
                                }}
                              >
                                📁 CSC Application Details
                              </p>
                              {order.cscSpecialDetails && (
                                <div>
                                  <p
                                    style={{
                                      color: "rgba(255,255,255,0.45)",
                                      fontSize: 11,
                                      fontWeight: 600,
                                      textTransform: "uppercase",
                                      letterSpacing: "0.05em",
                                    }}
                                  >
                                    Special Details / Login IDs
                                  </p>
                                  <p
                                    style={{
                                      color: "rgba(255,255,255,0.8)",
                                      fontSize: 13,
                                      marginTop: 4,
                                      background: "rgba(255,255,255,0.05)",
                                      padding: "8px 12px",
                                      borderRadius: 6,
                                    }}
                                  >
                                    {order.cscSpecialDetails}
                                  </p>
                                </div>
                              )}
                              {order.cscDocuments &&
                                order.cscDocuments.length > 0 && (
                                  <div>
                                    <p
                                      style={{
                                        color: "rgba(255,255,255,0.45)",
                                        fontSize: 11,
                                        fontWeight: 600,
                                        textTransform: "uppercase",
                                        letterSpacing: "0.05em",
                                        marginBottom: 8,
                                      }}
                                    >
                                      Customer Uploaded Documents
                                    </p>
                                    <div
                                      style={{
                                        display: "flex",
                                        flexWrap: "wrap",
                                        gap: 8,
                                      }}
                                    >
                                      {order.cscDocuments.map((doc, di) => (
                                        <a
                                          key={doc.getDirectURL()}
                                          href={doc.getDirectURL()}
                                          target="_blank"
                                          rel="noreferrer"
                                          data-ocid={`admin.csc_doc.button.${di + 1}`}
                                          style={{
                                            background: "rgba(99,102,241,0.2)",
                                            border:
                                              "1px solid rgba(99,102,241,0.4)",
                                            borderRadius: 8,
                                            padding: "6px 14px",
                                            color: "#a78bfa",
                                            fontSize: 12,
                                            textDecoration: "none",
                                            fontWeight: 600,
                                          }}
                                        >
                                          📄 Document {di + 1}
                                        </a>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              <div>
                                <p
                                  style={{
                                    color: "rgba(255,255,255,0.45)",
                                    fontSize: 11,
                                    fontWeight: 600,
                                    textTransform: "uppercase",
                                    letterSpacing: "0.05em",
                                    marginBottom: 8,
                                  }}
                                >
                                  Upload Final Output (Receipt / Acknowledgment)
                                </p>
                                {order.cscFinalOutput ? (
                                  <div
                                    style={{
                                      display: "flex",
                                      alignItems: "center",
                                      gap: 12,
                                    }}
                                  >
                                    <a
                                      href={order.cscFinalOutput.getDirectURL()}
                                      target="_blank"
                                      rel="noreferrer"
                                      style={{
                                        color: "#4ade80",
                                        fontSize: 13,
                                        fontWeight: 600,
                                      }}
                                    >
                                      ✅ Final Output Uploaded — View/Download
                                    </a>
                                    <label
                                      htmlFor={`final-upload-${String(order.id)}`}
                                      style={{
                                        background: "rgba(99,102,241,0.2)",
                                        border:
                                          "1px solid rgba(99,102,241,0.4)",
                                        borderRadius: 8,
                                        padding: "6px 14px",
                                        color: "#a78bfa",
                                        fontSize: 12,
                                        cursor: "pointer",
                                        fontWeight: 600,
                                      }}
                                    >
                                      Re-upload
                                    </label>
                                  </div>
                                ) : (
                                  <label
                                    htmlFor={`final-upload-${String(order.id)}`}
                                    data-ocid={
                                      "admin.csc_upload_final.upload_button"
                                    }
                                    style={{
                                      display: "inline-flex",
                                      alignItems: "center",
                                      gap: 8,
                                      background:
                                        uploadingFinalId === order.id
                                          ? "rgba(255,255,255,0.05)"
                                          : "rgba(34,197,94,0.15)",
                                      border: "1px solid rgba(34,197,94,0.4)",
                                      borderRadius: 8,
                                      padding: "8px 16px",
                                      color: "#4ade80",
                                      fontSize: 13,
                                      cursor:
                                        uploadingFinalId === order.id
                                          ? "not-allowed"
                                          : "pointer",
                                      fontWeight: 600,
                                    }}
                                  >
                                    {uploadingFinalId === order.id ? (
                                      <>
                                        <Loader2
                                          style={{
                                            width: 14,
                                            height: 14,
                                            animation:
                                              "spin 1s linear infinite",
                                          }}
                                        />{" "}
                                        Uploading...
                                      </>
                                    ) : (
                                      <>
                                        <Upload
                                          style={{ width: 14, height: 14 }}
                                        />{" "}
                                        Upload Final Output
                                      </>
                                    )}
                                  </label>
                                )}
                                <input
                                  id={`final-upload-${String(order.id)}`}
                                  type="file"
                                  accept=".pdf,image/*"
                                  style={{ display: "none" }}
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file)
                                      handleUploadFinalOutput(order.id, file);
                                    e.target.value = "";
                                  }}
                                />
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Typesetting Quote Requests */}
      <div style={{ marginTop: 40 }}>
        <h2
          style={{
            color: "white",
            fontWeight: 700,
            fontSize: 16,
            marginBottom: 16,
          }}
        >
          Custom Quote Requests (Typesetting)
        </h2>
        <TypesettingQuotesTable actor={actor} />
      </div>
      {viewingActiveFiles && (
        <FilesViewerModal
          files={viewingActiveFiles}
          onClose={() => setViewingActiveFiles(null)}
        />
      )}
    </div>
  );
}

// ─── Shop Order History Section ───────────────────────────────────────────────

function OrderHistorySection({ actor }: { actor: backendInterface | null }) {
  const [orders, setOrders] = useState<ShopOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!actor) return;
    (actor as unknown as { getAllShopOrders: () => Promise<ShopOrder[]> })
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

// ─── Customer Reviews Section ─────────────────────────────────────────────────
function ReviewsAdminSection({ actor }: { actor: backendInterface | null }) {
  const [reviews, setReviews] = React.useState<Review[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [deleteTarget, setDeleteTarget] = React.useState<Review | null>(null);

  function loadReviews() {
    if (!actor) return;
    setLoading(true);
    actor
      .getAllReviews()
      .then((data) => setReviews(data))
      .catch(() => toast.error("Failed to load reviews."))
      .finally(() => setLoading(false));
  }

  // biome-ignore lint/correctness/useExhaustiveDependencies: loadReviews is stable
  useEffect(() => {
    if (actor) loadReviews();
  }, [actor]);

  async function handleToggle(review: Review) {
    if (!actor) return;
    try {
      await actor.toggleReviewPublished(review.id);
      toast.success(
        review.published ? "Review unpublished." : "Review published.",
      );
      loadReviews();
    } catch {
      toast.error("Failed to update review.");
    }
  }

  async function handleDelete(review: Review) {
    if (!actor) return;
    try {
      await actor.deleteReview(review.id);
      toast.success("Review deleted.");
      setDeleteTarget(null);
      loadReviews();
    } catch {
      toast.error("Failed to delete review.");
    }
  }

  const avg =
    reviews.length > 0
      ? (
          reviews.reduce((sum, r) => sum + Number(r.serviceRating), 0) /
          reviews.length
        ).toFixed(1)
      : "–";

  function StarDisplay({ rating }: { rating: number }) {
    return (
      <span className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((n) => (
          <Star
            key={n}
            style={{
              width: 12,
              height: 12,
              fill: n <= rating ? "#facc15" : "#e5e7eb",
              color: n <= rating ? "#facc15" : "#e5e7eb",
            }}
          />
        ))}
      </span>
    );
  }

  return (
    <div style={{ padding: "24px 20px" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 20,
        }}
      >
        <h2
          style={{ fontSize: 22, fontWeight: 700, color: "#1e3a5f" }}
          data-ocid="admin.reviews.section"
        >
          Customer Reviews
        </h2>
        <button
          type="button"
          data-ocid="admin.reviews.refresh.button"
          onClick={loadReviews}
          style={{
            padding: "6px 14px",
            borderRadius: 8,
            background: "#1e3a5f",
            color: "#fff",
            fontSize: 13,
            fontWeight: 600,
            border: "none",
            cursor: "pointer",
          }}
        >
          Refresh
        </button>
      </div>

      {/* Summary bar */}
      <div
        style={{
          display: "flex",
          gap: 20,
          marginBottom: 24,
          flexWrap: "wrap",
        }}
      >
        <div
          style={{
            background: "#f0f4ff",
            borderRadius: 12,
            padding: "12px 20px",
            minWidth: 140,
          }}
        >
          <div style={{ fontSize: 24, fontWeight: 700, color: "#1e3a5f" }}>
            {reviews.length}
          </div>
          <div style={{ fontSize: 12, color: "#6b7280" }}>Total Reviews</div>
        </div>
        <div
          style={{
            background: "#fffbeb",
            borderRadius: 12,
            padding: "12px 20px",
            minWidth: 140,
          }}
        >
          <div
            style={{
              fontSize: 24,
              fontWeight: 700,
              color: "#92400e",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            {avg}{" "}
            <Star
              style={{
                width: 20,
                height: 20,
                fill: "#facc15",
                color: "#facc15",
              }}
            />
          </div>
          <div style={{ fontSize: 12, color: "#6b7280" }}>Avg Rating</div>
        </div>
        <div
          style={{
            background: "#f0fdf4",
            borderRadius: 12,
            padding: "12px 20px",
            minWidth: 140,
          }}
        >
          <div style={{ fontSize: 24, fontWeight: 700, color: "#166534" }}>
            {reviews.filter((r) => r.published).length}
          </div>
          <div style={{ fontSize: 12, color: "#6b7280" }}>Published</div>
        </div>
      </div>

      {loading ? (
        <div
          data-ocid="admin.reviews.loading_state"
          style={{ textAlign: "center", padding: "48px 0", color: "#6b7280" }}
        >
          Loading reviews...
        </div>
      ) : reviews.length === 0 ? (
        <div
          data-ocid="admin.reviews.empty_state"
          style={{ textAlign: "center", padding: "48px 0", color: "#9ca3af" }}
        >
          No reviews yet.
        </div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table
            data-ocid="admin.reviews.table"
            style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}
          >
            <thead>
              <tr
                style={{
                  background: "#f9fafb",
                  borderBottom: "2px solid #e5e7eb",
                }}
              >
                {[
                  "Customer",
                  "Location",
                  "Order",
                  "Service ★",
                  "Delivery ★",
                  "Comment",
                  "Date",
                  "Status",
                  "Actions",
                ].map((h) => (
                  <th
                    key={h}
                    style={{
                      padding: "10px 12px",
                      textAlign: "left",
                      fontWeight: 600,
                      color: "#374151",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {reviews.map((review, idx) => {
                const ordLabel =
                  Number(review.orderId) === 0
                    ? "Seed"
                    : `#SO-${String(review.orderId)}`;
                const dateStr = new Date(
                  Number(review.createdAt) / 1_000_000,
                ).toLocaleDateString("en-IN");
                return (
                  <tr
                    key={String(review.id)}
                    data-ocid={`admin.reviews.row.${idx + 1}`}
                    style={{
                      borderBottom: "1px solid #f3f4f6",
                      background: idx % 2 === 0 ? "#fff" : "#fafafa",
                    }}
                  >
                    <td
                      style={{
                        padding: "10px 12px",
                        fontWeight: 600,
                        color: "#1e3a5f",
                      }}
                    >
                      {review.customerName}
                      <div
                        style={{
                          fontSize: 11,
                          color: "#9ca3af",
                          fontWeight: 400,
                        }}
                      >
                        {review.customerPhone}
                      </div>
                    </td>
                    <td style={{ padding: "10px 12px", color: "#6b7280" }}>
                      {review.location || "–"}
                    </td>
                    <td
                      style={{
                        padding: "10px 12px",
                        color: "#6b7280",
                        fontFamily: "monospace",
                      }}
                    >
                      {ordLabel}
                    </td>
                    <td style={{ padding: "10px 12px" }}>
                      <StarDisplay rating={Number(review.serviceRating)} />
                    </td>
                    <td style={{ padding: "10px 12px" }}>
                      {review.deliveryRating !== undefined &&
                      review.deliveryRating !== null ? (
                        <StarDisplay rating={Number(review.deliveryRating)} />
                      ) : (
                        <span style={{ color: "#9ca3af" }}>N/A</span>
                      )}
                    </td>
                    <td
                      style={{
                        padding: "10px 12px",
                        color: "#374151",
                        maxWidth: 200,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                      title={review.serviceComment}
                    >
                      &ldquo;{review.serviceComment.slice(0, 60)}
                      {review.serviceComment.length > 60 ? "…" : ""}&rdquo;
                    </td>
                    <td
                      style={{
                        padding: "10px 12px",
                        color: "#9ca3af",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {dateStr}
                    </td>
                    <td style={{ padding: "10px 12px" }}>
                      <button
                        type="button"
                        data-ocid={`admin.reviews.toggle.${idx + 1}`}
                        onClick={() => handleToggle(review)}
                        style={{
                          padding: "4px 10px",
                          borderRadius: 6,
                          fontSize: 12,
                          fontWeight: 600,
                          border: "none",
                          cursor: "pointer",
                          background: review.published ? "#dcfce7" : "#fee2e2",
                          color: review.published ? "#166534" : "#991b1b",
                        }}
                      >
                        {review.published ? "Published" : "Unpublished"}
                      </button>
                    </td>
                    <td style={{ padding: "10px 12px" }}>
                      <button
                        type="button"
                        data-ocid={`admin.reviews.delete_button.${idx + 1}`}
                        onClick={() => setDeleteTarget(review)}
                        style={{
                          padding: "4px 10px",
                          borderRadius: 6,
                          fontSize: 12,
                          fontWeight: 600,
                          border: "none",
                          cursor: "pointer",
                          background: "#fee2e2",
                          color: "#991b1b",
                        }}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Delete confirmation */}
      {deleteTarget && (
        <div
          data-ocid="admin.reviews.delete.dialog"
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              background: "#fff",
              borderRadius: 16,
              padding: 28,
              maxWidth: 400,
              width: "90%",
              boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
            }}
          >
            <h3 style={{ fontWeight: 700, marginBottom: 12, fontSize: 18 }}>
              Delete Review?
            </h3>
            <p style={{ color: "#6b7280", marginBottom: 24, fontSize: 14 }}>
              Are you sure you want to permanently delete the review from{" "}
              <strong>{deleteTarget.customerName}</strong>? This cannot be
              undone.
            </p>
            <div style={{ display: "flex", gap: 12 }}>
              <button
                type="button"
                data-ocid="admin.reviews.delete.cancel_button"
                onClick={() => setDeleteTarget(null)}
                style={{
                  flex: 1,
                  padding: "10px 0",
                  borderRadius: 8,
                  border: "1px solid #e5e7eb",
                  background: "#fff",
                  cursor: "pointer",
                  fontWeight: 600,
                  fontSize: 14,
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                data-ocid="admin.reviews.delete.confirm_button"
                onClick={() => handleDelete(deleteTarget)}
                style={{
                  flex: 1,
                  padding: "10px 0",
                  borderRadius: 8,
                  border: "none",
                  background: "#ef4444",
                  color: "#fff",
                  cursor: "pointer",
                  fontWeight: 600,
                  fontSize: 14,
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Settings Section ─────────────────────────────────────────────────────────

// ─── Change Password Form ─────────────────────────────────────────────────────
function ChangePasswordForm() {
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  function handleUpdate() {
    setError("");
    const stored =
      localStorage.getItem("clikmate_admin_password") || "admin123";
    if (currentPw !== stored) {
      setError("Current password is incorrect.");
      return;
    }
    if (newPw.length < 6) {
      setError("New password must be at least 6 characters.");
      return;
    }
    if (newPw !== confirmPw) {
      setError("New passwords do not match.");
      return;
    }
    setSaving(true);
    setTimeout(() => {
      localStorage.setItem("clikmate_admin_password", newPw);
      toast.success("Password updated successfully!");
      setCurrentPw("");
      setNewPw("");
      setConfirmPw("");
      setSaving(false);
    }, 300);
  }

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "10px 14px",
    borderRadius: 10,
    border: "1px solid rgba(255,255,255,0.15)",
    background: "#0f1829",
    color: "white",
    fontSize: 14,
    outline: "none",
    boxSizing: "border-box",
  };
  const labelStyle: React.CSSProperties = {
    display: "block",
    color: "rgba(255,255,255,0.6)",
    fontSize: 12,
    fontWeight: 600,
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  };

  return (
    <div style={{ maxWidth: 400 }}>
      <div style={{ marginBottom: 14 }}>
        <label htmlFor="cp-current" style={labelStyle}>
          Current Password
        </label>
        <input
          id="cp-current"
          data-ocid="admin.settings.current_password.input"
          type="password"
          placeholder="••••••••"
          value={currentPw}
          onChange={(e) => setCurrentPw(e.target.value)}
          style={inputStyle}
        />
      </div>
      <div style={{ marginBottom: 14 }}>
        <label htmlFor="cp-new" style={labelStyle}>
          New Password
        </label>
        <input
          id="cp-new"
          data-ocid="admin.settings.new_password.input"
          type="password"
          placeholder="Min 6 characters"
          value={newPw}
          onChange={(e) => setNewPw(e.target.value)}
          style={inputStyle}
        />
      </div>
      <div style={{ marginBottom: 16 }}>
        <label htmlFor="cp-confirm" style={labelStyle}>
          Confirm New Password
        </label>
        <input
          id="cp-confirm"
          data-ocid="admin.settings.confirm_password.input"
          type="password"
          placeholder="Re-enter new password"
          value={confirmPw}
          onChange={(e) => setConfirmPw(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleUpdate()}
          style={inputStyle}
        />
      </div>
      {error && (
        <p
          data-ocid="admin.settings.password.error_state"
          style={{ color: "#ef4444", fontSize: 13, marginBottom: 12 }}
        >
          {error}
        </p>
      )}
      <button
        type="button"
        data-ocid="admin.settings.password.save_button"
        onClick={handleUpdate}
        disabled={saving || !currentPw || !newPw || !confirmPw}
        style={{
          padding: "10px 24px",
          borderRadius: 10,
          border: "none",
          background:
            saving || !currentPw || !newPw || !confirmPw
              ? "#374151"
              : "#7c3aed",
          color: "white",
          fontWeight: 600,
          fontSize: 14,
          cursor:
            saving || !currentPw || !newPw || !confirmPw
              ? "not-allowed"
              : "pointer",
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        {saving ? (
          <Loader2
            style={{
              width: 14,
              height: 14,
              animation: "spin 1s linear infinite",
            }}
          />
        ) : null}
        {saving ? "Updating..." : "Update Password"}
      </button>
    </div>
  );
}

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
      {/* Change Admin Password */}
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
            <Shield style={{ width: 18, height: 18, color: "#a78bfa" }} />
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
              Change Admin Password
            </h3>
            <p
              style={{
                color: "rgba(255,255,255,0.4)",
                fontSize: 12,
                margin: 0,
              }}
            >
              Update your admin login credentials
            </p>
          </div>
        </div>
        <div style={{ padding: 20 }}>
          <ChangePasswordForm />
        </div>
      </div>
    </div>
  );
}

// ─── Admin Login Screen ──────────────────────────────────────────────────────
function AdminLoginScreen({ onSuccess }: { onSuccess: () => void }) {
  // Initialize default credentials if not set
  if (!localStorage.getItem("clikmate_admin_email")) {
    localStorage.setItem("clikmate_admin_email", "admin@clikmate.com");
  }
  if (!localStorage.getItem("clikmate_admin_password")) {
    localStorage.setItem("clikmate_admin_password", "admin123");
  }

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function handleLogin() {
    setError("");
    setLoading(true);
    setTimeout(() => {
      const storedEmail =
        localStorage.getItem("clikmate_admin_email") || "admin@clikmate.com";
      const storedPassword =
        localStorage.getItem("clikmate_admin_password") || "admin123";
      if (
        email.trim().toLowerCase() === storedEmail.toLowerCase() &&
        password === storedPassword
      ) {
        localStorage.setItem("clikmate_admin_session", "1");
        onSuccess();
      } else {
        setError("Invalid email or password.");
        setLoading(false);
      }
    }, 400);
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0a0f1e",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        overflow: "hidden",
        padding: 16,
      }}
    >
      {/* Decorative blobs */}
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
        data-ocid="admin.login.dialog"
        style={{
          maxWidth: 420,
          width: "100%",
          background: "rgba(255,255,255,0.04)",
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
            marginBottom: 8,
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
              flexShrink: 0,
            }}
          >
            <Printer style={{ width: 26, height: 26, color: "#111" }} />
          </div>
          <div style={{ textAlign: "left" }}>
            <div
              style={{
                color: "white",
                fontWeight: 800,
                fontSize: 16,
                letterSpacing: "-0.5px",
                lineHeight: 1.2,
              }}
            >
              Smart Online
            </div>
            <div
              style={{
                color: "rgba(255,255,255,0.55)",
                fontSize: 12,
                lineHeight: 1.2,
              }}
            >
              Service Center
            </div>
          </div>
        </div>

        <h1
          style={{
            color: "white",
            fontWeight: 700,
            fontSize: 20,
            marginBottom: 4,
            marginTop: 20,
          }}
        >
          Admin Dashboard Login
        </h1>
        <p
          style={{
            color: "rgba(255,255,255,0.45)",
            fontSize: 13,
            marginBottom: 28,
          }}
        >
          Enter your credentials to access the dashboard
        </p>

        {/* Email field */}
        <div style={{ textAlign: "left", marginBottom: 14 }}>
          <label
            htmlFor="admin-email"
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
            Email
          </label>
          <input
            id="admin-email"
            data-ocid="admin.login.input"
            type="email"
            placeholder="admin@clikmate.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
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

        {/* Password field */}
        <div style={{ textAlign: "left", marginBottom: 20 }}>
          <label
            htmlFor="admin-password"
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
            Password
          </label>
          <input
            id="admin-password"
            data-ocid="admin.login.input"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
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
          <p
            data-ocid="admin.login.error_state"
            style={{
              color: "#ef4444",
              fontSize: 13,
              marginBottom: 14,
              textAlign: "left",
            }}
          >
            {error}
          </p>
        )}

        <button
          type="button"
          data-ocid="admin.login.primary_button"
          onClick={handleLogin}
          disabled={loading || !email || !password}
          style={{
            width: "100%",
            padding: "13px",
            borderRadius: 12,
            border: "none",
            background: loading || !email || !password ? "#374151" : "#7c3aed",
            color: "white",
            fontWeight: 700,
            fontSize: 15,
            cursor: loading || !email || !password ? "not-allowed" : "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            transition: "all 0.2s",
          }}
        >
          {loading ? (
            <Loader2
              style={{
                width: 18,
                height: 18,
                animation: "spin 1s linear infinite",
              }}
            />
          ) : null}
          {loading ? "Signing in..." : "Login"}
        </button>

        <Link
          to="/"
          data-ocid="admin.login.link"
          style={{
            display: "block",
            marginTop: 20,
            color: "rgba(255,255,255,0.4)",
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

// ─── Team & Access Section ────────────────────────────────────────────────────

function TeamAccessSection({ actor }: { actor: backendInterface | null }) {
  const [riders, setRiders] = useState<
    Array<{ name: string; mobile: string; pin: string }>
  >([]);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [pin, setPin] = useState("");
  const [adding, setAdding] = useState(false);
  const [removing, setRemoving] = useState<string | null>(null);

  async function loadRiders() {
    if (!actor) return;
    setLoading(true);
    try {
      const list = await (actor as unknown as backendInterface).getRiders();
      setRiders(list);
    } catch {
      toast.error("Failed to load riders.");
    } finally {
      setLoading(false);
    }
  }

  // biome-ignore lint/correctness/useExhaustiveDependencies: loadRiders is stable
  useEffect(() => {
    loadRiders();
  }, [actor]);

  async function handleAddRider() {
    if (!actor) return;
    if (!name.trim() || mobile.length !== 10 || pin.length !== 4) {
      toast.error("Please fill all fields correctly.");
      return;
    }
    setAdding(true);
    try {
      await (actor as unknown as backendInterface).addRider(
        name.trim(),
        mobile,
        pin,
      );
      toast.success("Rider added successfully.");
      setName("");
      setMobile("");
      setPin("");
      await loadRiders();
    } catch {
      toast.error("Failed to add rider.");
    } finally {
      setAdding(false);
    }
  }

  async function handleRemoveRider(riderMobile: string) {
    if (!actor) return;
    setRemoving(riderMobile);
    try {
      await (actor as unknown as backendInterface).removeRider(riderMobile);
      toast.success("Rider removed.");
      await loadRiders();
    } catch {
      toast.error("Failed to remove rider.");
    } finally {
      setRemoving(null);
    }
  }

  return (
    <div style={{ padding: "24px", maxWidth: 700 }}>
      <h2
        style={{
          color: "#f1f5f9",
          fontSize: 22,
          fontWeight: 700,
          marginBottom: 6,
        }}
      >
        Team & Access
      </h2>
      <p style={{ color: "#94a3b8", fontSize: 14, marginBottom: 24 }}>
        Manage delivery rider accounts. Riders log in at /#/rider with their
        mobile + PIN.
      </p>

      {/* Add Rider Form */}
      <div
        style={{
          background: "#1e293b",
          borderRadius: 12,
          padding: 20,
          marginBottom: 24,
          border: "1px solid rgba(255,255,255,0.07)",
        }}
      >
        <h3
          style={{
            color: "#f59e0b",
            fontSize: 15,
            fontWeight: 600,
            marginBottom: 16,
          }}
        >
          Add New Rider
        </h3>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            gap: 12,
          }}
        >
          <div>
            <Label
              style={{
                color: "#cbd5e1",
                fontSize: 12,
                marginBottom: 6,
                display: "block",
              }}
            >
              Full Name
            </Label>
            <Input
              data-ocid="admin.team.name.input"
              placeholder="Rider name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={{
                background: "#0f172a",
                border: "1px solid #334155",
                color: "#f1f5f9",
              }}
            />
          </div>
          <div>
            <Label
              style={{
                color: "#cbd5e1",
                fontSize: 12,
                marginBottom: 6,
                display: "block",
              }}
            >
              Mobile Number
            </Label>
            <Input
              data-ocid="admin.team.mobile.input"
              placeholder="10-digit mobile"
              maxLength={10}
              value={mobile}
              onChange={(e) => setMobile(e.target.value.replace(/\D/g, ""))}
              style={{
                background: "#0f172a",
                border: "1px solid #334155",
                color: "#f1f5f9",
              }}
            />
          </div>
          <div>
            <Label
              style={{
                color: "#cbd5e1",
                fontSize: 12,
                marginBottom: 6,
                display: "block",
              }}
            >
              4-Digit PIN
            </Label>
            <Input
              data-ocid="admin.team.pin.input"
              type="password"
              placeholder="PIN"
              maxLength={4}
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
              style={{
                background: "#0f172a",
                border: "1px solid #334155",
                color: "#f1f5f9",
              }}
            />
          </div>
        </div>
        <Button
          data-ocid="admin.team.add.primary_button"
          onClick={handleAddRider}
          disabled={adding}
          style={{
            marginTop: 16,
            background: "#f59e0b",
            color: "#0f172a",
            fontWeight: 700,
            border: 0,
          }}
        >
          {adding ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Adding...
            </>
          ) : (
            <>
              <Users className="w-4 h-4 mr-2" />
              Add Rider
            </>
          )}
        </Button>
      </div>

      {/* Riders Table */}
      <div
        style={{
          background: "#1e293b",
          borderRadius: 12,
          overflow: "hidden",
          border: "1px solid rgba(255,255,255,0.07)",
        }}
      >
        <div
          style={{
            padding: "16px 20px",
            borderBottom: "1px solid rgba(255,255,255,0.07)",
          }}
        >
          <h3 style={{ color: "#f1f5f9", fontSize: 15, fontWeight: 600 }}>
            Current Riders ({riders.length})
          </h3>
        </div>
        {loading ? (
          <div
            data-ocid="admin.team.loading_state"
            style={{ padding: 40, textAlign: "center" }}
          >
            <Loader2
              className="w-8 h-8 animate-spin mx-auto mb-2"
              style={{ color: "#f59e0b" }}
            />
            <p style={{ color: "#64748b", fontSize: 13 }}>Loading riders...</p>
          </div>
        ) : riders.length === 0 ? (
          <div
            data-ocid="admin.team.empty_state"
            style={{ padding: 40, textAlign: "center" }}
          >
            <Users
              style={{
                width: 40,
                height: 40,
                color: "#334155",
                margin: "0 auto 12px",
              }}
            />
            <p style={{ color: "#64748b", fontSize: 14 }}>
              No riders added yet.
            </p>
          </div>
        ) : (
          <table
            style={{ width: "100%", borderCollapse: "collapse" }}
            data-ocid="admin.team.table"
          >
            <thead>
              <tr style={{ background: "rgba(255,255,255,0.03)" }}>
                {["Name", "Mobile", "PIN", "Action"].map((h) => (
                  <th
                    key={h}
                    style={{
                      padding: "10px 20px",
                      textAlign: "left",
                      color: "#64748b",
                      fontSize: 12,
                      fontWeight: 600,
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {riders.map((rider, idx) => (
                <tr
                  key={rider.mobile}
                  data-ocid={`admin.team.row.${idx + 1}`}
                  style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}
                >
                  <td
                    style={{
                      padding: "12px 20px",
                      color: "#f1f5f9",
                      fontSize: 14,
                    }}
                  >
                    {rider.name}
                  </td>
                  <td
                    style={{
                      padding: "12px 20px",
                      color: "#94a3b8",
                      fontSize: 14,
                    }}
                  >
                    {rider.mobile}
                  </td>
                  <td
                    style={{
                      padding: "12px 20px",
                      color: "#64748b",
                      fontSize: 14,
                    }}
                  >
                    ****
                  </td>
                  <td style={{ padding: "12px 20px" }}>
                    <Button
                      data-ocid={`admin.team.delete_button.${idx + 1}`}
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveRider(rider.mobile)}
                      disabled={removing === rider.mobile}
                      style={{ color: "#f87171", fontSize: 12 }}
                    >
                      {removing === rider.mobile ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        "Remove"
                      )}
                    </Button>
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

// ─── WalletSection ───────────────────────────────────────────────────────────

function WalletSection({ actor }: { actor: backendInterface | null }) {
  const [mobileInput, setMobileInput] = useState("");
  const [balance, setBalance] = useState<number | null>(null);
  const [balanceLoading, setBalanceLoading] = useState(false);
  const [amount, setAmount] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  async function handleLookup() {
    if (!actor || mobileInput.length !== 10) {
      toast.error("Enter a valid 10-digit mobile number.");
      return;
    }
    setBalanceLoading(true);
    try {
      const bal = await (actor as unknown as backendInterface).getWalletBalance(
        mobileInput,
      );
      setBalance(bal);
    } catch {
      toast.error("Failed to fetch balance.");
    } finally {
      setBalanceLoading(false);
    }
  }

  async function handleRecharge() {
    if (!actor || mobileInput.length !== 10) {
      toast.error("Enter a valid 10-digit mobile number first.");
      return;
    }
    const amt = Number(amount);
    if (!amt || amt <= 0) {
      toast.error("Enter a valid amount.");
      return;
    }
    setActionLoading(true);
    try {
      const newBal = await (
        actor as unknown as backendInterface
      ).rechargeWallet(mobileInput, amt);
      setBalance(newBal);
      setAmount("");
      toast.success(`Wallet recharged! New balance: ₹${newBal.toFixed(2)}`);
    } catch {
      toast.error("Failed to recharge wallet.");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleDeduct() {
    if (!actor || mobileInput.length !== 10) {
      toast.error("Enter a valid 10-digit mobile number first.");
      return;
    }
    const amt = Number(amount);
    if (!amt || amt <= 0) {
      toast.error("Enter a valid amount.");
      return;
    }
    setActionLoading(true);
    try {
      const newBal = await (actor as unknown as backendInterface).deductWallet(
        mobileInput,
        amt,
      );
      setBalance(newBal);
      setAmount("");
      toast.success(`Amount deducted! New balance: ₹${newBal.toFixed(2)}`);
    } catch {
      toast.error("Failed to deduct from wallet.");
    } finally {
      setActionLoading(false);
    }
  }

  return (
    <div style={{ padding: 24 }}>
      <h2
        style={{
          color: "white",
          fontWeight: 700,
          fontSize: 18,
          marginBottom: 20,
        }}
      >
        Customer Wallet Management
      </h2>

      <div
        style={{
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 16,
          padding: 24,
          maxWidth: 540,
        }}
      >
        {/* Mobile Lookup */}
        <div style={{ marginBottom: 20 }}>
          <label
            htmlFor="wallet-mobile"
            style={{
              color: "rgba(255,255,255,0.5)",
              fontSize: 12,
              fontWeight: 600,
              display: "block",
              marginBottom: 6,
            }}
          >
            CUSTOMER MOBILE NUMBER
          </label>
          <div style={{ display: "flex", gap: 10 }}>
            <input
              type="tel"
              id="wallet-mobile"
              data-ocid="admin.wallet.mobile.input"
              value={mobileInput}
              onChange={(e) =>
                setMobileInput(e.target.value.replace(/\D/g, "").slice(0, 10))
              }
              placeholder="10-digit mobile number"
              style={{
                flex: 1,
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.12)",
                borderRadius: 10,
                padding: "10px 14px",
                color: "white",
                fontSize: 14,
                outline: "none",
              }}
            />
            <button
              type="button"
              data-ocid="admin.wallet.lookup.button"
              onClick={handleLookup}
              disabled={balanceLoading}
              style={{
                background: "#3b82f6",
                border: "none",
                borderRadius: 10,
                padding: "10px 18px",
                color: "white",
                fontWeight: 600,
                fontSize: 13,
                cursor: "pointer",
                whiteSpace: "nowrap",
                opacity: balanceLoading ? 0.7 : 1,
              }}
            >
              {balanceLoading ? "..." : "Lookup Balance"}
            </button>
          </div>

          {balance !== null && (
            <div
              data-ocid="admin.wallet.balance.card"
              style={{
                marginTop: 14,
                padding: "14px 18px",
                borderRadius: 12,
                background:
                  "linear-gradient(135deg, rgba(99,102,241,0.2), rgba(59,130,246,0.15))",
                border: "1px solid rgba(99,102,241,0.3)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div>
                <div
                  style={{
                    color: "rgba(255,255,255,0.5)",
                    fontSize: 11,
                    marginBottom: 2,
                  }}
                >
                  Current Balance
                </div>
                <div style={{ color: "white", fontWeight: 800, fontSize: 22 }}>
                  ₹{balance.toFixed(2)}
                </div>
              </div>
              <Wallet style={{ width: 28, height: 28, color: "#a78bfa" }} />
            </div>
          )}
        </div>

        {/* Amount + Actions */}
        <div>
          <label
            htmlFor="wallet-amount"
            style={{
              color: "rgba(255,255,255,0.5)",
              fontSize: 12,
              fontWeight: 600,
              display: "block",
              marginBottom: 6,
            }}
          >
            AMOUNT (₹)
          </label>
          <input
            id="wallet-amount"
            type="number"
            data-ocid="admin.wallet.amount.input"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Enter amount"
            min={1}
            style={{
              width: "100%",
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: 10,
              padding: "10px 14px",
              color: "white",
              fontSize: 14,
              outline: "none",
              marginBottom: 14,
              boxSizing: "border-box",
            }}
          />
          <div style={{ display: "flex", gap: 10 }}>
            <button
              type="button"
              data-ocid="admin.wallet.recharge.button"
              onClick={handleRecharge}
              disabled={actionLoading}
              style={{
                flex: 1,
                background: "#10b981",
                border: "none",
                borderRadius: 10,
                padding: "11px",
                color: "white",
                fontWeight: 700,
                fontSize: 14,
                cursor: "pointer",
                opacity: actionLoading ? 0.7 : 1,
              }}
            >
              ＋ Recharge Wallet
            </button>
            <button
              type="button"
              data-ocid="admin.wallet.deduct.button"
              onClick={handleDeduct}
              disabled={actionLoading}
              style={{
                flex: 1,
                background: "#ef4444",
                border: "none",
                borderRadius: 10,
                padding: "11px",
                color: "white",
                fontWeight: 700,
                fontSize: 14,
                cursor: "pointer",
                opacity: actionLoading ? 0.7 : 1,
              }}
            >
              − Deduct from Wallet
            </button>
          </div>
          <p
            style={{
              color: "rgba(255,255,255,0.3)",
              fontSize: 11,
              marginTop: 10,
            }}
          >
            Use this when customer pays cash at the store. Manually adjust
            wallet balance here.
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AdminDashboard() {
  const { actor, isFetching } = useActor();
  const [isAdmin, setIsAdmin] = useState<boolean>(
    () => localStorage.getItem("clikmate_admin_session") === "1",
  );
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
    team: "Team & Access",
    wallet: "Customer Wallet",
    reviews: "Customer Reviews",
  };

  // ── View: Not logged in ──────────────────────────────────────────────────────
  if (!isAdmin) {
    return <AdminLoginScreen onSuccess={() => setIsAdmin(true)} />;
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
          <NavItem
            icon={Users}
            label="Team & Access"
            active={activeSection === "team"}
            ocid="admin.team.tab"
            onClick={() => {
              setActiveSection("team");
              setSidebarOpen(false);
            }}
          />
          <NavItem
            icon={Wallet}
            label="Customer Wallet"
            active={activeSection === "wallet"}
            ocid="admin.wallet.tab"
            onClick={() => {
              setActiveSection("wallet");
              setSidebarOpen(false);
            }}
          />
          <NavItem
            icon={Star}
            label="Customer Reviews"
            active={activeSection === "reviews"}
            ocid="admin.reviews.tab"
            onClick={() => {
              setActiveSection("reviews");
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
                {localStorage.getItem("clikmate_admin_email") ||
                  "admin@clikmate.com"}
              </div>
              <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 11 }}>
                Active
              </div>
            </div>
          </div>
          <button
            type="button"
            data-ocid="admin.logout.button"
            onClick={() => {
              localStorage.removeItem("clikmate_admin_session");
              setIsAdmin(false);
            }}
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
          {activeSection === "team" && (
            <TeamAccessSection actor={actor as unknown as backendInterface} />
          )}
          {activeSection === "wallet" && (
            <WalletSection actor={actor as unknown as backendInterface} />
          )}
          {activeSection === "reviews" && (
            <ReviewsAdminSection actor={actor as unknown as backendInterface} />
          )}
        </main>
      </div>
    </div>
  );
}

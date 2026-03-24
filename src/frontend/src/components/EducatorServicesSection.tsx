import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CheckCircle, ChevronDown, FileText, Loader2 } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { ExternalBlob } from "../backend";
import { useActor } from "../hooks/useActor";

export default function EducatorServicesSection() {
  const { actor } = useActor();
  const [expanded, setExpanded] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [subject, setSubject] = useState("");
  const [format, setFormat] = useState("");
  const [language, setLanguage] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Please enter your full name.");
      return;
    }
    if (phone.length !== 10) {
      toast.error("Please enter a valid 10-digit WhatsApp number.");
      return;
    }
    if (!subject) {
      toast.error("Please select a subject.");
      return;
    }
    if (!format) {
      toast.error("Please select a format.");
      return;
    }
    if (!language) {
      toast.error("Please select a language.");
      return;
    }
    if (!file) {
      toast.error("Please upload your document or notes.");
      return;
    }
    if (!actor) {
      toast.error("Service unavailable. Please try again.");
      return;
    }

    setSubmitting(true);
    setUploadProgress(0);
    try {
      const bytes = new Uint8Array(await file.arrayBuffer());
      const blob = ExternalBlob.fromBytes(bytes).withUploadProgress((pct) =>
        setUploadProgress(pct),
      );
      // Upload and get URL
      const fileUrl = blob.getDirectURL();
      // We need to trigger upload by getting bytes through blob
      await blob.getBytes();
      await actor.submitTypesettingQuoteRequest({
        name,
        phone,
        subject,
        format,
        language,
        fileUrl,
      });
      setSubmitted(true);
      toast.success("Quote request sent!");
    } catch (err) {
      console.error(err);
      toast.error(
        "Submission failed. Please try again or contact us on WhatsApp.",
      );
    } finally {
      setSubmitting(false);
      setUploadProgress(0);
    }
  }

  return (
    <section className="py-20 bg-gradient-to-br from-indigo-50 via-purple-50 to-blue-50 relative overflow-hidden">
      {/* Decorative blobs */}
      <div
        className="absolute top-0 right-0 w-96 h-96 rounded-full pointer-events-none"
        style={{
          background: "oklch(0.7 0.15 280)",
          opacity: 0.06,
          transform: "translate(40%, -40%)",
        }}
      />
      <div
        className="absolute bottom-0 left-0 w-72 h-72 rounded-full pointer-events-none"
        style={{
          background: "oklch(0.65 0.2 260)",
          opacity: 0.05,
          transform: "translate(-30%, 30%)",
        }}
      />

      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-12">
          <span className="inline-block blue-bg text-white text-xs font-semibold px-3 py-1 rounded-full mb-4">
            For Educators
          </span>
          <h2 className="text-3xl md:text-4xl font-bold blue-text">
            Premium Educator Services
          </h2>
          <p className="text-gray-500 mt-3 text-base max-w-xl mx-auto">
            Specialized academic services for teachers &amp; coaching
            institutes. Professional quality, bilingual support.
          </p>
        </div>

        {/* Feature Card */}
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-purple-100">
          {/* Card Header */}
          <div
            className="px-8 py-6 flex items-start gap-5"
            style={{
              background:
                "linear-gradient(135deg, oklch(0.2 0.08 260), oklch(0.25 0.12 280))",
            }}
          >
            <div className="w-14 h-14 rounded-2xl yellow-bg flex items-center justify-center shrink-0">
              <FileText className="w-7 h-7 text-gray-900" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span
                  className="text-xs font-semibold px-2.5 py-0.5 rounded-full"
                  style={{
                    background: "rgba(234,179,8,0.2)",
                    color: "#fbbf24",
                  }}
                >
                  Premium Service
                </span>
              </div>
              <h3 className="text-xl font-bold text-white">
                Professional Question Paper Typesetting
              </h3>
              <p className="text-blue-200 text-sm mt-1">
                Bilingual / LaTeX • Exam-Ready Quality • Delivered in 24–48 hrs
              </p>
            </div>
            <div className="flex flex-wrap gap-2 shrink-0 items-start">
              {["Physics", "Math", "Bio", "Chem"].map((sub) => (
                <span
                  key={sub}
                  className="text-xs px-2 py-0.5 rounded-full"
                  style={{
                    background: "rgba(255,255,255,0.1)",
                    color: "rgba(255,255,255,0.7)",
                  }}
                >
                  {sub}
                </span>
              ))}
            </div>
          </div>

          {/* Features List */}
          <div className="px-8 py-5 flex flex-wrap gap-4 border-b border-gray-100">
            {[
              "Hindi & English bilingual support",
              "LaTeX & Word doc input accepted",
              "Two-column / single-column format",
              "Handwritten notes accepted",
              "Custom header / institute branding",
              "Quick 24-48hr turnaround",
            ].map((feat) => (
              <div
                key={feat}
                className="flex items-center gap-2 text-sm text-gray-600"
              >
                <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
                {feat}
              </div>
            ))}
          </div>

          {/* Expand Toggle */}
          <button
            type="button"
            data-ocid="educator.form.toggle"
            onClick={() => setExpanded((v) => !v)}
            className="w-full flex items-center justify-between px-8 py-4 hover:bg-gray-50 transition-colors text-left"
          >
            <span className="font-semibold blue-text text-sm">
              {expanded
                ? "Hide Order Form"
                : "📋 Request Custom Quote — Fill Form"}
            </span>
            <ChevronDown
              className={`w-5 h-5 blue-text transition-transform ${
                expanded ? "rotate-180" : ""
              }`}
            />
          </button>

          {/* Expandable Form */}
          {expanded && (
            <div className="px-8 pb-8">
              {submitted ? (
                <div
                  data-ocid="educator.form.success_state"
                  className="flex flex-col items-center justify-center py-10 text-center"
                >
                  <CheckCircle className="w-14 h-14 text-green-500 mb-4" />
                  <h3 className="text-xl font-bold blue-text mb-2">
                    Quote Request Sent!
                  </h3>
                  <p className="text-gray-500 max-w-sm">
                    Your quote request has been sent! We&apos;ll contact you on
                    WhatsApp within <strong>2 hours</strong>.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setSubmitted(false);
                      setName("");
                      setPhone("");
                      setSubject("");
                      setFormat("");
                      setLanguage("");
                      setFile(null);
                    }}
                    className="mt-6 text-sm blue-text underline"
                  >
                    Submit another request
                  </button>
                </div>
              ) : (
                <form
                  onSubmit={handleSubmit}
                  className="flex flex-col gap-5 pt-2"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    {/* Full Name */}
                    <div>
                      <Label
                        htmlFor="edu-name"
                        className="text-sm font-semibold blue-text mb-1.5 block"
                      >
                        Teacher / Institute Name *
                      </Label>
                      <Input
                        id="edu-name"
                        data-ocid="educator.name.input"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. Shri Ram Coaching, Raipur"
                        className="rounded-xl border-gray-200"
                      />
                    </div>
                    {/* Phone */}
                    <div>
                      <Label
                        htmlFor="edu-phone"
                        className="text-sm font-semibold blue-text mb-1.5 block"
                      >
                        WhatsApp Number *
                      </Label>
                      <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-blue-500">
                        <span className="px-3 py-2.5 bg-gray-50 text-gray-500 text-sm border-r border-gray-200">
                          +91
                        </span>
                        <input
                          id="edu-phone"
                          data-ocid="educator.phone.input"
                          type="tel"
                          value={phone}
                          onChange={(e) =>
                            setPhone(
                              e.target.value.replace(/\D/g, "").slice(0, 10),
                            )
                          }
                          placeholder="9876543210"
                          className="flex-1 px-3 py-2.5 text-sm outline-none bg-white"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                    {/* Subject */}
                    <div>
                      <Label className="text-sm font-semibold blue-text mb-1.5 block">
                        Subject *
                      </Label>
                      <Select value={subject} onValueChange={setSubject}>
                        <SelectTrigger
                          data-ocid="educator.subject.select"
                          className="rounded-xl border-gray-200"
                        >
                          <SelectValue placeholder="Select subject" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Physics">Physics</SelectItem>
                          <SelectItem value="Mathematics">
                            Mathematics
                          </SelectItem>
                          <SelectItem value="Biology">Biology</SelectItem>
                          <SelectItem value="Chemistry">Chemistry</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Format */}
                    <div>
                      <Label className="text-sm font-semibold blue-text mb-1.5 block">
                        Format *
                      </Label>
                      <Select value={format} onValueChange={setFormat}>
                        <SelectTrigger
                          data-ocid="educator.format.select"
                          className="rounded-xl border-gray-200"
                        >
                          <SelectValue placeholder="Select format" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Two-Column">Two-Column</SelectItem>
                          <SelectItem value="Single-Column">
                            Single-Column
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Language */}
                    <div>
                      <Label className="text-sm font-semibold blue-text mb-1.5 block">
                        Language *
                      </Label>
                      <Select value={language} onValueChange={setLanguage}>
                        <SelectTrigger
                          data-ocid="educator.language.select"
                          className="rounded-xl border-gray-200"
                        >
                          <SelectValue placeholder="Select language" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="English">English</SelectItem>
                          <SelectItem value="Hindi (Noto Serif)">
                            Hindi (Noto Serif)
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* File Upload */}
                  <div>
                    <Label className="text-sm font-semibold blue-text mb-1.5 block">
                      Upload Notes / Document *
                    </Label>
                    <button
                      type="button"
                      className={`w-full border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
                        file
                          ? "border-green-400 bg-green-50"
                          : "border-gray-200 hover:border-blue-300 hover:bg-blue-50/30"
                      }`}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) setFile(f);
                        }}
                        className="hidden"
                        data-ocid="educator.file.upload_button"
                      />
                      {file ? (
                        <div className="flex items-center justify-center gap-3">
                          <FileText className="w-6 h-6 text-green-500" />
                          <span className="text-sm font-medium text-gray-700">
                            {file.name}
                          </span>
                          <button
                            type="button"
                            onClick={(ev) => {
                              ev.stopPropagation();
                              setFile(null);
                            }}
                            className="text-gray-400 hover:text-red-500 transition-colors"
                          >
                            ✕
                          </button>
                        </div>
                      ) : (
                        <div>
                          <p className="text-sm font-medium text-gray-500">
                            📎 Click to upload — PDF, DOC, DOCX, JPG accepted
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            Handwritten notes, Word docs, or scanned images
                          </p>
                        </div>
                      )}
                    </button>
                  </div>

                  {/* Upload progress */}
                  {submitting && uploadProgress > 0 && (
                    <div>
                      <div className="flex justify-between text-xs text-gray-500 mb-1">
                        <span>Uploading...</span>
                        <span>{uploadProgress}%</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2">
                        <div
                          className="blue-bg h-2 rounded-full transition-all"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                    </div>
                  )}

                  <Button
                    type="submit"
                    data-ocid="educator.form.submit_button"
                    disabled={submitting}
                    className="yellow-bg text-gray-900 font-bold rounded-xl py-4 hover:opacity-90 border-0 text-base shadow-lg"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Sending Request...
                      </>
                    ) : (
                      "📩 Request Custom Quote"
                    )}
                  </Button>

                  <p className="text-xs text-center text-gray-400">
                    We&apos;ll analyze your requirements and send a detailed
                    quote on WhatsApp within 2 hours.
                  </p>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

import { useState } from "react";
import {
  Upload, FileText, Eye, Save, Download, Copy, Clock, X, Plus,
  CheckCircle2, History, Edit3, Trash2, CheckSquare
} from "lucide-react";
import { toast } from "sonner";

interface Template {
  id: string;
  name: string;
  desc: string;
  category: "placement" | "evaluation" | "admin";
  hasLetterhead: boolean;
  hasSignature: boolean;
  lastModified: string;
  version: string;
  placeholders: string[];
  status: "Active" | "Draft";
  visibleTo: string[];
  body?: string;
}

export function Templates() {
  const [allowOverride, setAllowOverride] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [showPreview, setShowPreview] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState<string | null>(null);
  const [showNewTemplate, setShowNewTemplate] = useState(false);

  const defaultRoles = {
    placement: ["CLO", "DLO", "Student"],
    evaluation: ["Academic Supervisor", "Industry Supervisor", "DLO"],
    admin: ["CLO", "DLO"],
  };

  const [newTemplate, setNewTemplate] = useState<Partial<Template>>({
    name: "",
    desc: "",
    category: "placement",
    hasLetterhead: true,
    hasSignature: true,
    placeholders: [],
    visibleTo: defaultRoles["placement"],
    body: "",
  });
  const [newPlaceholder, setNewPlaceholder] = useState("");

  const [templates, setTemplates] = useState<Template[]>([
    {
      id: "t1", name: "Placement Letter Template", desc: "Official university placement letter with letterhead and authorized signatures",
      category: "placement", hasLetterhead: true, hasSignature: true,
      lastModified: "2026-04-10", version: "3.2", status: "Active",
      placeholders: ["[Student Name]", "[Student ID]", "[Company Name]", "[Start Date]", "[End Date]", "[Department]", "[Supervisor Name]"],
      visibleTo: ["CLO", "DLO", "Student"],
      body: "To: The Manager,\n[Company Name]\n\nDear Sir/Madam,\n\nWe write to introduce [Student Name] (ID: [Student ID]), a student of the Department of [Department], Ho Technical University, who has been assigned to your esteemed organization for Industrial Attachment from [Start Date] to [End Date].\n\nWe kindly request that you provide the necessary support and supervision for the student during this period. An Industry Supervisor ([Supervisor Name]) will be designated to oversee the student's progress.\n\nThank you for your cooperation.",
    },
    {
      id: "t2", name: "Company Acceptance Form", desc: "PDF form for company signature, supervisor designation, and workplace details",
      category: "placement", hasLetterhead: false, hasSignature: false,
      lastModified: "2026-03-28", version: "2.1", status: "Active",
      placeholders: ["[Student Name]", "[Company Name]", "[Supervisor Name]", "[Supervisor Email]", "[Department]", "[Position]"],
      visibleTo: ["CLO", "DLO", "Student"],
    },
    {
      id: "t3", name: "Mid-Term Evaluation Form", desc: "Digital evaluation form for industry supervisors to assess student progress at midpoint",
      category: "evaluation", hasLetterhead: false, hasSignature: false,
      lastModified: "2026-03-15", version: "2.0", status: "Active",
      placeholders: ["[Student Name]", "[Company Name]", "[Evaluation Period]", "[Supervisor Name]"],
      visibleTo: ["Academic Supervisor", "Industry Supervisor", "DLO"],
    },
    {
      id: "t4", name: "Final Evaluation Form", desc: "Comprehensive final assessment with rating scales, competency evaluation, and supervisor recommendations",
      category: "evaluation", hasLetterhead: false, hasSignature: false,
      lastModified: "2026-03-15", version: "2.3", status: "Active",
      placeholders: ["[Student Name]", "[Company Name]", "[Overall Grade]", "[Supervisor Name]", "[Completion Date]"],
      visibleTo: ["Academic Supervisor", "Industry Supervisor", "DLO"],
    },
    {
      id: "t5", name: "Logbook Template", desc: "Daily logbook entry template with structured fields for activities, skills, and challenges",
      category: "admin", hasLetterhead: false, hasSignature: false,
      lastModified: "2026-02-20", version: "1.5", status: "Active",
      placeholders: ["[Student Name]", "[Date]", "[Company Name]", "[Activities]", "[Skills Learned]", "[Challenges]"],
      visibleTo: ["CLO", "DLO"],
    },
    {
      id: "t6", name: "Completion Certificate", desc: "Certificate of successful completion of the industrial attachment program",
      category: "placement", hasLetterhead: true, hasSignature: true,
      lastModified: "2026-01-10", version: "1.0", status: "Draft",
      placeholders: ["[Student Name]", "[Student ID]", "[Company Name]", "[Start Date]", "[End Date]", "[Grade]", "[Department]"],
      visibleTo: ["CLO", "DLO", "Student"],
    },
    {
      id: "t7", name: "Site Visit Report", desc: "Academic supervisor site visit report template with observation and recommendation fields",
      category: "evaluation", hasLetterhead: false, hasSignature: true,
      lastModified: "2026-03-20", version: "1.2", status: "Active",
      placeholders: ["[Student Name]", "[Company Name]", "[Visit Date]", "[Supervisor Name]", "[Observations]"],
      visibleTo: ["Academic Supervisor", "Industry Supervisor", "DLO"],
    },
    {
      id: "t8", name: "Introduction Letter", desc: "Letter of introduction for students to present at their placement company",
      category: "placement", hasLetterhead: true, hasSignature: true,
      lastModified: "2026-04-01", version: "2.0", status: "Active",
      placeholders: ["[Student Name]", "[Student ID]", "[Company Name]", "[Department]", "[Level]", "[Contact Person]"],
      visibleTo: ["CLO", "DLO", "Student"],
    },
  ]);

  const versionHistory = [
    { version: "3.2", date: "2026-04-10", author: "Dr. Asante", changes: "Updated letterhead format and added QR verification code" },
    { version: "3.1", date: "2026-03-01", author: "Dr. Asante", changes: "Added supervisor name placeholder" },
    { version: "3.0", date: "2026-01-15", author: "System", changes: "Major redesign with new university branding" },
    { version: "2.5", date: "2025-09-10", author: "Dr. Asante", changes: "Updated signature block layout" },
    { version: "2.0", date: "2025-06-01", author: "System", changes: "Initial digital template version" },
  ];

  const displayPlaceholders = Array.from(new Set([
    ...(newTemplate.placeholders || []),
    ...(newTemplate.body?.match(/\[.*?\]/g) || [])
  ]));

  const handleSaveNewTemplate = () => {
    if (!newTemplate.name) {
      toast.error("Template name is required");
      return;
    }
    
    if (templates.some(t => t.name.toLowerCase() === newTemplate.name!.toLowerCase())) {
      toast.error("A template with this name already exists");
      return;
    }
    
    const newTpl: Template = {
      id: `t${templates.length + 1}`,
      name: newTemplate.name!,
      desc: newTemplate.desc || "",
      category: newTemplate.category as "placement" | "evaluation" | "admin",
      hasLetterhead: !!newTemplate.hasLetterhead,
      hasSignature: !!newTemplate.hasSignature,
      lastModified: new Date().toISOString().split("T")[0],
      version: "1.0",
      status: "Draft",
      placeholders: displayPlaceholders,
      visibleTo: newTemplate.visibleTo || [],
      body: newTemplate.body || "",
    };
    
    setTemplates([newTpl, ...templates]);
    setShowNewTemplate(false);
    setNewTemplate({
      name: "",
      desc: "",
      category: "placement",
      hasLetterhead: true,
      hasSignature: true,
      placeholders: [],
      visibleTo: defaultRoles["placement"],
      body: "",
    });
    toast.success("Template created successfully.");
  };

  const handleAddPlaceholder = () => {
    if (!newPlaceholder.trim()) return;
    const formatted = `[${newPlaceholder.trim()}]`;
    if (!newTemplate.placeholders?.includes(formatted)) {
      setNewTemplate(prev => ({
        ...prev,
        placeholders: [...(prev.placeholders || []), formatted]
      }));
    }
    setNewPlaceholder("");
  };
  
  const handleRemovePlaceholder = (ph: string) => {
    setNewTemplate(prev => {
      const next = { ...prev };
      if (next.placeholders) {
        next.placeholders = next.placeholders.filter(p => p !== ph);
      }
      if (next.body && next.body.includes(ph)) {
        const unwrapped = ph.slice(1, -1);
        next.body = next.body.split(ph).join(unwrapped);
      }
      return next;
    });
  };

  const toggleRole = (role: string) => {
    setNewTemplate(prev => {
      const current = prev.visibleTo || [];
      if (current.includes(role)) {
        return { ...prev, visibleTo: current.filter(r => r !== role) };
      }
      return { ...prev, visibleTo: [...current, role] };
    });
  };

  const filtered = categoryFilter === "all" ? templates : templates.filter((t) => t.category === categoryFilter);
  const selected = selectedTemplate ? templates.find((t) => t.id === selectedTemplate) : null;

  const categoryColors: Record<string, string> = {
    placement: "bg-blue-100 text-blue-700",
    evaluation: "bg-violet-100 text-violet-700",
    admin: "bg-emerald-100 text-emerald-700",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1>Document Templates</h1>
          <p className="text-muted-foreground" style={{ fontSize: "0.85rem" }}>
            Manage placement letters, evaluation forms, and document templates · {templates.length} templates
          </p>
        </div>
        <button
          onClick={() => setShowNewTemplate(true)}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 flex items-center gap-2"
          style={{ fontSize: "0.85rem" }}
        >
          <Plus className="w-4 h-4" /> New Template
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Total Templates", value: templates.length, color: "text-blue-600 bg-blue-50", icon: FileText },
          { label: "Active", value: templates.filter((t) => t.status === "Active").length, color: "text-emerald-600 bg-emerald-50", icon: CheckCircle2 },
          { label: "Drafts", value: templates.filter((t) => t.status === "Draft").length, color: "text-amber-600 bg-amber-50", icon: Edit3 },
          { label: "With Letterhead", value: templates.filter((t) => t.hasLetterhead).length, color: "text-violet-600 bg-violet-50", icon: FileText },
        ].map((s) => (
          <div key={s.label} className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
            <div className={`w-9 h-9 rounded-lg ${s.color} flex items-center justify-center`}>
              <s.icon className="w-4 h-4" />
            </div>
            <div>
              <p className="text-muted-foreground" style={{ fontSize: "0.75rem" }}>{s.label}</p>
              <p style={{ fontSize: "1.25rem" }}>{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {["all", "placement", "evaluation", "admin"].map((cat) => (
          <button
            key={cat}
            onClick={() => setCategoryFilter(cat)}
            className={`px-3 py-1.5 rounded-lg border capitalize transition-colors ${
              categoryFilter === cat ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-accent"
            }`}
            style={{ fontSize: "0.8rem" }}
          >
            {cat === "all" ? "All Templates" : cat}
          </button>
        ))}
      </div>

      {/* Template Grid & Detail */}
      <div className="grid grid-cols-1 gap-4">
        <div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filtered.map((t) => (
              <div
                key={t.id}
                onClick={() => setSelectedTemplate(t.id)}
                className={`bg-card border rounded-xl p-5 space-y-3 cursor-pointer hover:shadow-[0_2px_12px_rgba(11,94,215,0.08)] transition-shadow ${
                  selectedTemplate === t.id ? "border-primary ring-1 ring-primary" : "border-border"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                      <FileText className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p style={{ fontSize: "0.9rem" }}>{t.name}</p>
                      <p style={{ fontSize: "0.75rem" }} className="text-muted-foreground mt-0.5 truncate max-w-[200px]">{t.desc}</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`px-2 py-0.5 rounded-full capitalize ${categoryColors[t.category]}`} style={{ fontSize: "0.65rem" }}>{t.category}</span>
                  <span className={`px-2 py-0.5 rounded-full ${t.status === "Active" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`} style={{ fontSize: "0.65rem" }}>{t.status}</span>
                  <span className="text-muted-foreground" style={{ fontSize: "0.65rem" }}>v{t.version}</span>
                  {t.hasLetterhead && <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-700" style={{ fontSize: "0.6rem" }}>Letterhead</span>}
                  {t.hasSignature && <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-700" style={{ fontSize: "0.6rem" }}>Signature</span>}
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-border">
                  <span className="text-muted-foreground flex items-center gap-1" style={{ fontSize: "0.7rem" }}>
                    <Clock className="w-3 h-3" /> Modified {t.lastModified}
                  </span>
                  <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                    <button onClick={() => setShowPreview(t.id)} className="p-1.5 rounded-md hover:bg-accent text-muted-foreground" title="Preview">
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => toast.success(`${t.name} downloaded.`)} className="p-1.5 rounded-md hover:bg-accent text-muted-foreground" title="Download">
                      <Download className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => toast.success(`${t.name} duplicated.`)} className="p-1.5 rounded-md hover:bg-accent text-muted-foreground" title="Duplicate">
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Detail Modal */}
        {selected && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setSelectedTemplate(null)}>
            <div className="bg-card border border-border rounded-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <div className="p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h3>Template Details</h3>
                  <button onClick={() => setSelectedTemplate(null)} className="p-1 rounded-md hover:bg-accent">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex items-center gap-3 pb-3 border-b border-border">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <FileText className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p style={{ fontSize: "0.9rem" }}>{selected.name}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className={`px-2 py-0.5 rounded-full capitalize ${categoryColors[selected.category]}`} style={{ fontSize: "0.6rem" }}>{selected.category}</span>
                      <span className={`px-2 py-0.5 rounded-full ${selected.status === "Active" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`} style={{ fontSize: "0.6rem" }}>{selected.status}</span>
                    </div>
                  </div>
                </div>

                {[
                  ["Version", `v${selected.version}`],
                  ["Last Modified", selected.lastModified],
                  ["Category", selected.category],
                  ["Has Letterhead", selected.hasLetterhead ? "Yes" : "No"],
                  ["Has Signature", selected.hasSignature ? "Yes" : "No"],
                ].map(([l, v]) => (
                  <div key={l as string}>
                    <p className="text-muted-foreground" style={{ fontSize: "0.7rem" }}>{l as string}</p>
                    <p style={{ fontSize: "0.85rem" }} className="capitalize">{v as string}</p>
                  </div>
                ))}

                {/* Placeholders */}
                <div>
                  <p className="text-muted-foreground mb-2" style={{ fontSize: "0.7rem" }}>PLACEHOLDER FIELDS</p>
                  <div className="flex flex-wrap gap-1.5">
                    {selected.placeholders.map((p) => (
                      <span key={p} className="px-2 py-0.5 bg-secondary rounded text-secondary-foreground" style={{ fontSize: "0.7rem" }}>{p}</span>
                    ))}
                  </div>
                </div>
                
                {/* Visibility */}
                <div>
                  <p className="text-muted-foreground mb-2" style={{ fontSize: "0.7rem" }}>VISIBLE TO</p>
                  <div className="flex flex-wrap gap-1.5">
                    {selected.visibleTo && selected.visibleTo.map((role) => (
                      <span key={role} className="px-2 py-0.5 border border-border rounded text-foreground" style={{ fontSize: "0.7rem" }}>{role}</span>
                    ))}
                  </div>
                </div>

                {/* Letterhead/Signature Upload */}
                {selected.hasLetterhead && (
                  <div className="pt-3 border-t border-border space-y-2">
                    <div className="border-2 border-dashed border-border rounded-lg p-4 text-center hover:border-primary/40 transition-colors cursor-pointer">
                      <Upload className="w-5 h-5 mx-auto text-muted-foreground mb-1" />
                      <p style={{ fontSize: "0.75rem" }} className="text-muted-foreground">Upload letterhead</p>
                      <p style={{ fontSize: "0.65rem" }} className="text-muted-foreground mt-0.5">Current: htu_letterhead_2026.png</p>
                    </div>
                    {selected.hasSignature && (
                      <>
                        <div className="border-2 border-dashed border-border rounded-lg p-3 text-center hover:border-primary/40 transition-colors cursor-pointer">
                          <p style={{ fontSize: "0.75rem" }} className="text-muted-foreground">Upload signature image</p>
                          <p style={{ fontSize: "0.65rem" }} className="text-muted-foreground mt-0.5">Current: vc_signature.png</p>
                        </div>
                        <div className="flex items-center justify-between p-2 bg-muted/30 rounded-lg">
                          <span style={{ fontSize: "0.8rem" }}>Allow dept. override</span>
                          <button
                            onClick={() => setAllowOverride(!allowOverride)}
                            className={`w-9 h-5 rounded-full transition-colors relative shrink-0 ${allowOverride ? "bg-primary" : "bg-gray-300"}`}
                          >
                            <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${allowOverride ? "translate-x-4" : "translate-x-0.5"}`} style={{ left: 0 }} />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                )}

                <div className="pt-3 border-t border-border space-y-2">
                  <div className="flex gap-2">
                    <button onClick={() => setShowPreview(selected.id)} className="flex-1 py-2 border border-border rounded-lg hover:bg-accent flex items-center justify-center gap-1.5 text-muted-foreground" style={{ fontSize: "0.8rem" }}>
                      <Eye className="w-3.5 h-3.5" /> Preview
                    </button>
                    <button onClick={() => setShowHistory(selected.id)} className="flex-1 py-2 border border-border rounded-lg hover:bg-accent flex items-center justify-center gap-1.5 text-muted-foreground" style={{ fontSize: "0.8rem" }}>
                      <History className="w-3.5 h-3.5" /> History
                    </button>
                  </div>
                  <button onClick={() => toast.success("Template saved.")} className="w-full py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 flex items-center justify-center gap-1.5" style={{ fontSize: "0.8rem" }}>
                    <Save className="w-3.5 h-3.5" /> Save Changes
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* New Template Modal */}
      {showNewTemplate && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowNewTemplate(false)}>
          <div className="bg-card border border-border rounded-xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-border flex items-center justify-between shrink-0">
              <h2 className="flex items-center gap-2"><Plus className="w-5 h-5 text-primary" /> Create New Template</h2>
              <button onClick={() => setShowNewTemplate(false)} className="p-1 rounded-md hover:bg-accent"><X className="w-5 h-5" /></button>
            </div>
            
            <div className="p-6 space-y-6 overflow-y-auto">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Template Name</label>
                  <input 
                    type="text" 
                    value={newTemplate.name}
                    onChange={(e) => setNewTemplate({...newTemplate, name: e.target.value})}
                    className="w-full px-3 py-2 border border-border rounded-lg bg-background"
                    placeholder="e.g. Mid-Term Evaluation Form"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Description</label>
                  <textarea 
                    value={newTemplate.desc}
                    onChange={(e) => setNewTemplate({...newTemplate, desc: e.target.value})}
                    className="w-full px-3 py-2 border border-border rounded-lg bg-background resize-none h-16"
                    placeholder="Brief description of the template's purpose..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Category</label>
                    <select 
                      value={newTemplate.category}
                      onChange={(e) => {
                        const cat = e.target.value as "placement" | "evaluation" | "admin";
                        setNewTemplate(prev => ({
                          ...prev, 
                          category: cat,
                          visibleTo: defaultRoles[cat]
                        }));
                      }}
                      className="w-full px-3 py-2 border border-border rounded-lg bg-background"
                    >
                      <option value="placement">Placement</option>
                      <option value="evaluation">Evaluation</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2 pt-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-sm font-medium">Template Content (Body)</label>
                  </div>
                  <textarea
                    value={newTemplate.body || ""}
                    onChange={(e) => setNewTemplate({...newTemplate, body: e.target.value})}
                    className="w-full px-4 py-3 border border-border rounded-lg bg-background resize-y h-48 font-mono text-sm leading-relaxed"
                    placeholder="Type the body of the letter or document here...&#10;&#10;e.g. Dear [Student Name],&#10;We are pleased to inform you that you have been placed at [Company Name]."
                  />
                  <p className="text-xs text-muted-foreground">
                    Tip: Any text wrapped in brackets like <span className="text-primary font-medium">[Student Name]</span> will be automatically detected as a placeholder below.
                  </p>
                </div>

                <div className="space-y-2 pt-2">
                  <label className="block text-sm font-medium">Dynamic Placeholders</label>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      value={newPlaceholder}
                      onChange={(e) => setNewPlaceholder(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddPlaceholder())}
                      className="flex-1 px-3 py-2 border border-border rounded-lg bg-background"
                      placeholder="e.g. Student Name"
                    />
                    <button 
                      onClick={handleAddPlaceholder}
                      className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:opacity-90"
                    >
                      Add
                    </button>
                  </div>
                  {displayPlaceholders.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3 p-3 bg-muted/30 rounded-lg border border-border">
                      {displayPlaceholders.map((ph) => (
                        <span key={ph} className="flex items-center gap-1.5 px-2.5 py-1 bg-background border border-border rounded-full text-sm shadow-sm">
                          <span className="text-primary font-medium">{ph}</span>
                          <button onClick={() => handleRemovePlaceholder(ph)} className="text-muted-foreground hover:text-foreground">
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-3 pt-2">
                  <label className="block text-sm font-medium">Branding Options</label>
                  <div className="flex items-center justify-between p-3 border border-border rounded-lg">
                    <div>
                      <p className="font-medium text-sm">Include Letterhead</p>
                      <p className="text-muted-foreground text-xs">University logo and address header</p>
                    </div>
                    <button
                      onClick={() => setNewTemplate(prev => ({...prev, hasLetterhead: !prev.hasLetterhead}))}
                      className={`w-10 h-6 rounded-full transition-colors relative ${newTemplate.hasLetterhead ? "bg-primary" : "bg-gray-300"}`}
                    >
                      <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${newTemplate.hasLetterhead ? "translate-x-5" : "translate-x-1"}`} style={{ left: 0 }} />
                    </button>
                  </div>
                  <div className="flex items-center justify-between p-3 border border-border rounded-lg">
                    <div>
                      <p className="font-medium text-sm">Include Official Signature</p>
                      <p className="text-muted-foreground text-xs">Authorized stamp and digital signature</p>
                    </div>
                    <button
                      onClick={() => setNewTemplate(prev => ({...prev, hasSignature: !prev.hasSignature}))}
                      className={`w-10 h-6 rounded-full transition-colors relative ${newTemplate.hasSignature ? "bg-primary" : "bg-gray-300"}`}
                    >
                      <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${newTemplate.hasSignature ? "translate-x-5" : "translate-x-1"}`} style={{ left: 0 }} />
                    </button>
                  </div>
                </div>

                <div className="space-y-2 pt-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-sm font-medium">Visible To (Role Access)</label>
                    <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">Smart defaults applied</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {["CLO", "DLO", "Academic Supervisor", "Industry Supervisor", "Student"].map((role) => {
                      const isSelected = newTemplate.visibleTo?.includes(role);
                      return (
                        <button
                          key={role}
                          onClick={() => toggleRole(role)}
                          className={`px-3 py-1.5 rounded-lg border text-sm transition-colors ${
                            isSelected 
                              ? "bg-primary text-primary-foreground border-primary" 
                              : "border-border bg-background hover:bg-accent"
                          }`}
                        >
                          {role}
                        </button>
                      );
                    })}
                  </div>
                </div>

              </div>
            </div>

            <div className="p-6 border-t border-border flex justify-end gap-3 shrink-0 bg-muted/30">
              <button 
                onClick={() => setShowNewTemplate(false)}
                className="px-4 py-2 border border-border rounded-lg hover:bg-accent text-sm"
              >
                Cancel
              </button>
              <button 
                onClick={handleSaveNewTemplate}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 flex items-center gap-2 text-sm"
              >
                <Save className="w-4 h-4" /> Save Template
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {showPreview && (() => {
        const tpl = templates.find((t) => t.id === showPreview);
        if (!tpl) return null;
        return (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowPreview(null)}>
            <div className="bg-white rounded-xl w-full max-w-2xl max-h-[85vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Eye className="w-5 h-5 text-primary" />
                  <h2>Preview: {tpl.name}</h2>
                </div>
                <button onClick={() => setShowPreview(null)} className="p-1 rounded-md hover:bg-gray-100"><X className="w-5 h-5" /></button>
              </div>
              <div className="p-8">
                {tpl.hasLetterhead && (
                  <div className="border-b-2 border-blue-800 pb-4 mb-6 text-center">
                    <p className="text-blue-900" style={{ fontSize: "1.1rem" }}>HO TECHNICAL UNIVERSITY</p>
                    <p className="text-gray-600" style={{ fontSize: "0.8rem" }}>P.O. Box HP 217, Ho, Volta Region, Ghana</p>
                    <p className="text-gray-500" style={{ fontSize: "0.75rem" }}>Tel: +233 362 194 410 · Email: liaison@htu.edu.gh</p>
                  </div>
                )}
                <div className="text-right mb-6">
                  <p className="text-gray-500" style={{ fontSize: "0.85rem" }}>Date: <span className="text-gray-400">[Current Date]</span></p>
                  <p className="text-gray-500" style={{ fontSize: "0.85rem" }}>Ref: HTU/IA/2026/<span className="text-gray-400">[Ref No]</span></p>
                </div>
                
                {tpl.body ? (
                  <div className="space-y-4" style={{ fontSize: "0.95rem", lineHeight: "1.8" }}>
                    {tpl.body.split('\n').map((paragraph, i) => (
                      <p key={i} className="min-h-[1.5em]">
                        {paragraph.split(/(\[.*?\])/g).map((part, j) =>
                          part.startsWith('[') && part.endsWith(']') ? (
                            <span key={j} className="text-primary font-medium">{part}</span>
                          ) : (
                            <span key={j}>{part}</span>
                          )
                        )}
                      </p>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4" style={{ fontSize: "0.95rem", lineHeight: "1.8" }}>
                    <p className="text-muted-foreground italic">No custom body text provided. This is a generic or interactive document template.</p>
                  </div>
                )}
                
                {tpl.hasSignature && (
                  <div className="mt-8 pt-4 border-t border-gray-200">
                    <div className="w-32 h-12 border-b-2 border-gray-400 mb-1" />
                    <p style={{ fontSize: "0.85rem" }}>Central Liaison Officer</p>
                    <p className="text-gray-500" style={{ fontSize: "0.75rem" }}>Ho Technical University</p>
                  </div>
                )}
              </div>
              <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-between items-center">
                <span className="text-gray-500" style={{ fontSize: "0.75rem" }}>
                  {tpl.placeholders.length} placeholder fields · Version {tpl.version}
                </span>
                <div className="flex gap-2">
                  <button onClick={() => { toast.success("Template downloaded."); setShowPreview(null); }} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 flex items-center gap-2" style={{ fontSize: "0.85rem" }}>
                    <Download className="w-4 h-4" /> Download
                  </button>
                  <button onClick={() => setShowPreview(null)} className="px-4 py-2 bg-primary text-white rounded-lg hover:opacity-90" style={{ fontSize: "0.85rem" }}>
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Version History Modal */}
      {showHistory && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowHistory(null)}>
          <div className="bg-card border border-border rounded-xl w-full max-w-md shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-border flex items-center justify-between">
              <h2 className="flex items-center gap-2"><History className="w-5 h-5 text-primary" /> Version History</h2>
              <button onClick={() => setShowHistory(null)} className="p-1 rounded-md hover:bg-accent"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-4 space-y-0">
              {versionHistory.map((v, i) => (
                <div key={v.version} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className={`w-3 h-3 rounded-full shrink-0 ${i === 0 ? "bg-primary" : "bg-border"}`} />
                    {i < versionHistory.length - 1 && <div className="w-0.5 flex-1 bg-border" />}
                  </div>
                  <div className="pb-4">
                    <div className="flex items-center gap-2">
                      <span style={{ fontSize: "0.85rem" }}>v{v.version}</span>
                      <span className="text-muted-foreground" style={{ fontSize: "0.7rem" }}>{v.date}</span>
                      {i === 0 && <span className="px-2 py-0.5 bg-primary/10 text-primary rounded-full" style={{ fontSize: "0.6rem" }}>Current</span>}
                    </div>
                    <p className="text-muted-foreground mt-0.5" style={{ fontSize: "0.8rem" }}>{v.changes}</p>
                    <p className="text-muted-foreground" style={{ fontSize: "0.7rem" }}>By {v.author}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-4 border-t border-border">
              <button onClick={() => setShowHistory(null)} className="w-full py-2 border border-border rounded-lg hover:bg-accent" style={{ fontSize: "0.85rem" }}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

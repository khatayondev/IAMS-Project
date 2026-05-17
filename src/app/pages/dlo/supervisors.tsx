import { useState } from "react";
import { useAppContext } from "../../lib/context";
import { supervisors } from "../../lib/mock-data";
import {
  UserPlus, Users, CheckCircle2, Search, X, Mail, Eye,
  BarChart3, AlertTriangle
} from "lucide-react";
import { toast } from "sonner";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

export function SupervisorsPage() {
  const { user, store } = useAppContext();
  const [showAddSupervisor, setShowAddSupervisor] = useState(false);
  const [addForm, setAddForm] = useState({ name: "", email: "", maxLoad: "6" });

  const department = user?.department || "";

  const deptSupervisors = supervisors.filter((s) => s.department === department);

  const activeAssignments = store.applications.filter(
    (a) => a.status === "Active" && a.department === department && a.supervisorAssigned
  );

  const handleAddSupervisor = () => {
    if (!addForm.name || !addForm.email) {
      toast.error("Name and email are required.");
      return;
    }
    toast.success(`${addForm.name} added to supervisor pool.`);
    setShowAddSupervisor(false);
    setAddForm({ name: "", email: "", maxLoad: "6" });
  };

  const totalCapacity = deptSupervisors.reduce((sum, s) => sum + s.maxLoad, 0);
  const totalLoad = deptSupervisors.reduce((sum, s) => sum + s.currentLoad, 0);
  const utilizationRate = totalCapacity > 0 ? Math.round((totalLoad / totalCapacity) * 100) : 0;

  const workloadData = deptSupervisors.map((s) => ({
    id: s.id,
    name: s.name.split(" ").pop() || s.name,
    value: s.currentLoad,
    color: s.currentLoad >= s.maxLoad ? "#EF4444" : s.currentLoad >= s.maxLoad * 0.75 ? "#F59E0B" : "#10B981",
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1>Supervisor Directory</h1>
          <p className="text-muted-foreground" style={{ fontSize: "0.85rem" }}>
            Manage the academic supervisor pool and view workload distribution
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowAddSupervisor(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90"
            style={{ fontSize: "0.85rem" }}
          >
            <UserPlus className="w-4 h-4" /> Add Supervisor
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
            <Users className="w-4 h-4" />
          </div>
          <div>
            <p className="text-muted-foreground" style={{ fontSize: "0.75rem" }}>Pool Size</p>
            <p style={{ fontSize: "1.25rem" }}>{deptSupervisors.length}</p>
          </div>
        </div>
        <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div>
            <p className="text-muted-foreground" style={{ fontSize: "0.75rem" }}>Active Load</p>
            <p style={{ fontSize: "1.25rem" }}>{totalLoad}</p>
          </div>
        </div>
        <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div>
            <p className="text-muted-foreground" style={{ fontSize: "0.75rem" }}>Available Slots</p>
            <p style={{ fontSize: "1.25rem" }}>{Math.max(0, totalCapacity - totalLoad)}</p>
          </div>
        </div>
        <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-violet-50 text-violet-600 flex items-center justify-center">
            <BarChart3 className="w-4 h-4" />
          </div>
          <div>
            <p className="text-muted-foreground" style={{ fontSize: "0.75rem" }}>Pool Utilization</p>
            <p style={{ fontSize: "1.25rem" }}>{utilizationRate}%</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Supervisor List */}
        <div className="lg:col-span-2 space-y-3">
          {deptSupervisors.map((sup) => (
            <div key={sup.id} className="bg-card border border-border rounded-xl p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-full bg-primary flex items-center justify-center text-primary-foreground" style={{ fontSize: "0.8rem" }}>
                    {sup.name.split(" ").map((w) => w[0]).join("")}
                  </div>
                  <div>
                    <p style={{ fontSize: "0.9rem" }}>{sup.name}</p>
                    <p className="text-muted-foreground" style={{ fontSize: "0.75rem" }}>{sup.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2.5 py-0.5 rounded-full ${
                      sup.currentLoad >= sup.maxLoad
                        ? "bg-red-100 text-red-700"
                        : sup.currentLoad >= sup.maxLoad * 0.75
                        ? "bg-amber-100 text-amber-700"
                        : "bg-emerald-100 text-emerald-700"
                    }`}
                    style={{ fontSize: "0.75rem" }}
                  >
                    {sup.currentLoad >= sup.maxLoad ? "Full" : sup.currentLoad >= sup.maxLoad * 0.75 ? "Near Capacity" : "Available"}
                  </span>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-4">
                <div>
                  <p className="text-muted-foreground" style={{ fontSize: "0.7rem" }}>Current Load</p>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex-1 h-2.5 bg-secondary rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          sup.currentLoad >= sup.maxLoad ? "bg-red-500" : sup.currentLoad >= sup.maxLoad * 0.75 ? "bg-amber-500" : "bg-emerald-500"
                        }`}
                        style={{ width: `${(sup.currentLoad / sup.maxLoad) * 100}%` }}
                      />
                    </div>
                    <span className="text-muted-foreground shrink-0" style={{ fontSize: "0.75rem" }}>
                      {sup.currentLoad}/{sup.maxLoad}
                    </span>
                  </div>
                </div>
                <div>
                  <p className="text-muted-foreground" style={{ fontSize: "0.7rem" }}>Assigned Students</p>
                  <p style={{ fontSize: "0.9rem" }} className="mt-1">
                    {activeAssignments.filter((a) => a.supervisorAssigned === sup.name).length}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground" style={{ fontSize: "0.7rem" }}>Availability</p>
                  <p style={{ fontSize: "0.9rem" }} className="mt-1">
                    {Math.max(0, sup.maxLoad - sup.currentLoad)} slots
                  </p>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-border flex gap-2">
                <button
                  className="px-3 py-1.5 border border-border rounded-lg hover:bg-accent flex items-center gap-1 text-muted-foreground"
                  style={{ fontSize: "0.8rem" }}
                >
                  <Eye className="w-3.5 h-3.5" /> View Assignments
                </button>
                <button
                  onClick={() => toast.success("Email sent to " + sup.name)}
                  className="px-3 py-1.5 border border-border rounded-lg hover:bg-accent flex items-center gap-1 text-muted-foreground"
                  style={{ fontSize: "0.8rem" }}
                >
                  <Mail className="w-3.5 h-3.5" /> Contact
                </button>
              </div>
            </div>
          ))}
          {deptSupervisors.length === 0 && (
            <div className="bg-card border border-border rounded-xl p-8 text-center">
              <Users className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground" style={{ fontSize: "0.85rem" }}>No supervisors in this department's pool.</p>
              <button
                onClick={() => setShowAddSupervisor(true)}
                className="mt-3 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90"
                style={{ fontSize: "0.85rem" }}
              >
                Add Supervisor
              </button>
            </div>
          )}
        </div>

        {/* Workload Chart */}
        <div className="bg-card border border-border rounded-xl p-5 h-fit sticky top-6">
          <h3 className="mb-4">Workload Distribution</h3>
          {workloadData.length > 0 ? (
            <>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={workloadData} cx="50%" cy="50%" innerRadius={35} outerRadius={65} dataKey="value" nameKey="name">
                      {workloadData.map((entry) => (
                        <Cell key={`wl-${entry.id}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-2 mt-4">
                {deptSupervisors.map((s) => (
                  <div key={s.id} className="flex items-center justify-between">
                    <span style={{ fontSize: "0.8rem" }}>{s.name}</span>
                    <span className="text-muted-foreground" style={{ fontSize: "0.75rem" }}>
                      {s.currentLoad}/{s.maxLoad}
                    </span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="text-muted-foreground text-center py-8" style={{ fontSize: "0.85rem" }}>No data</p>
          )}
          <div className="mt-4 pt-3 border-t border-border">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground" style={{ fontSize: "0.75rem" }}>Total Utilization</span>
              <span style={{ fontSize: "0.85rem" }}>{totalLoad}/{totalCapacity} ({utilizationRate}%)</span>
            </div>
            <div className="mt-2 h-2.5 bg-secondary rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${utilizationRate >= 90 ? "bg-red-500" : utilizationRate >= 70 ? "bg-amber-500" : "bg-emerald-500"}`}
                style={{ width: `${utilizationRate}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Add Supervisor Modal */}
      {showAddSupervisor && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowAddSupervisor(false)}>
          <div className="bg-card border border-border rounded-xl w-full max-w-md p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2>Add Supervisor to Pool</h2>
              <button onClick={() => setShowAddSupervisor(false)} className="p-1 rounded-md hover:bg-accent">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-muted-foreground" style={{ fontSize: "0.85rem" }}>
              Add a new academic supervisor to the {department} pool.
            </p>
            <div className="space-y-3">
              <div>
                <label style={{ fontSize: "0.8rem" }}>Full Name</label>
                <input
                  type="text"
                  value={addForm.name}
                  onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                  placeholder="e.g., Dr. Kofi Asante"
                  className="w-full mt-1 px-3 py-2 border border-border rounded-lg bg-background"
                  style={{ fontSize: "0.85rem" }}
                />
              </div>
              <div>
                <label style={{ fontSize: "0.8rem" }}>Email</label>
                <input
                  type="email"
                  value={addForm.email}
                  onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
                  placeholder="e.g., k.asante@htu.edu.gh"
                  className="w-full mt-1 px-3 py-2 border border-border rounded-lg bg-background"
                  style={{ fontSize: "0.85rem" }}
                />
              </div>
              <div>
                <label style={{ fontSize: "0.8rem" }}>Max Student Load</label>
                <input
                  type="number"
                  value={addForm.maxLoad}
                  onChange={(e) => setAddForm({ ...addForm, maxLoad: e.target.value })}
                  className="w-full mt-1 px-3 py-2 border border-border rounded-lg bg-background"
                  style={{ fontSize: "0.85rem" }}
                />
              </div>
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <button onClick={() => setShowAddSupervisor(false)} className="px-4 py-2 border border-border rounded-lg hover:bg-accent" style={{ fontSize: "0.85rem" }}>
                Cancel
              </button>
              <button onClick={handleAddSupervisor} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 flex items-center gap-2" style={{ fontSize: "0.85rem" }}>
                <UserPlus className="w-4 h-4" /> Add to Pool
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
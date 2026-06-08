import { useState } from "react";
import { ChevronDown, Mail, MessageSquare, AlertCircle, BookOpen, Zap, Users, FileText, CheckCircle2, Clock } from "lucide-react";
import { useAppContext } from "../../lib/context";

interface HelpSection {
  title: string;
  content: React.ReactNode;
}

interface HelpCategory {
  id: string;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  sections: HelpSection[];
}

export function HelpPage() {
  const { user } = useAppContext();
  const [expandedCategory, setExpandedCategory] = useState<string | null>("getting-started");
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  const commonCategories: HelpCategory[] = [
    {
      id: "getting-started",
      title: "Getting Started",
      icon: Zap,
      sections: [
        {
          title: "Welcome to IAMS",
          content: (
            <div className="space-y-3 text-sm text-foreground">
              <p>
                The Internship Application Management System (IAMS) streamlines the entire internship process from application through completion.
              </p>
              <p>
                Select your role below to see specific guidance for your workflow.
              </p>
            </div>
          ),
        },
      ],
    },
    {
      id: "account",
      title: "Account & Profile",
      icon: Users,
      sections: [
        {
          title: "How do I update my profile?",
          content: (
            <div className="space-y-2 text-sm">
              <p>Navigate to <strong>My Profile</strong> (or <strong>Settings</strong>) from the sidebar to:</p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>Update your contact information</li>
                <li>Change your profile picture</li>
                <li>Enable/disable notifications</li>
                <li>Adjust notification preferences</li>
              </ul>
            </div>
          ),
        },
        {
          title: "How do I reset my password?",
          content: (
            <div className="space-y-2 text-sm">
              <p>Click "Forgot Password" on the login page. You'll receive a password reset link via email. If you don't see it, check your spam folder.</p>
            </div>
          ),
        },
        {
          title: "How do I enable notifications?",
          content: (
            <div className="space-y-3 text-sm">
              <p>Go to <strong>Settings → Notifications</strong> and:</p>
              <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                <li>Click "Enable Notifications"</li>
                <li>Grant browser permission when prompted</li>
                <li>You'll receive updates about logbooks, grades, and announcements</li>
              </ol>
              <p className="text-xs text-muted-foreground mt-2">Note: Permissions are managed per browser and device.</p>
            </div>
          ),
        },
      ],
    },
  ];

  const studentCategories: HelpCategory[] = [
    {
      id: "applications",
      title: "Applications",
      icon: FileText,
      sections: [
        {
          title: "How do I search for internship positions?",
          content: (
            <div className="space-y-2 text-sm">
              <p>Go to <strong>Applications → Windows</strong> to browse available positions. You can:</p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>Filter by company and department</li>
                <li>View position details and requirements</li>
                <li>Save positions for later review</li>
              </ul>
            </div>
          ),
        },
        {
          title: "How do I apply for a position?",
          content: (
            <div className="space-y-2 text-sm">
              <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                <li>In <strong>Applications → Windows</strong>, find a position</li>
                <li>Click the position to view details</li>
                <li>Click "Apply" and fill in the application form</li>
                <li>Upload supporting documents (CV, cover letter, etc.)</li>
                <li>Review and submit your application</li>
              </ol>
            </div>
          ),
        },
        {
          title: "How do I track my applications?",
          content: (
            <div className="space-y-2 text-sm">
              <p>Go to <strong>Applications → Track</strong> to see all your submitted applications with statuses:</p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li><span className="text-amber-600">Pending</span> - Waiting for company review</li>
                <li><span className="text-blue-600">Accepted</span> - Company approved your application</li>
                <li><span className="text-red-600">Rejected</span> - Company declined your application</li>
              </ul>
            </div>
          ),
        },
        {
          title: "What happens when I'm accepted?",
          content: (
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>Once accepted, your internship status changes to "Active" and you'll be able to:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Submit daily logbook entries</li>
                <li>Check in daily for attendance</li>
                <li>View your grades and evaluations</li>
                <li>Track your internship history</li>
              </ul>
              <p className="text-xs text-muted-foreground mt-2">During an active internship, you can still view previous applications but cannot submit new ones.</p>
            </div>
          ),
        },
      ],
    },
    {
      id: "logbook",
      title: "Daily Logbook",
      icon: BookOpen,
      sections: [
        {
          title: "How do I submit a logbook entry?",
          content: (
            <div className="space-y-2 text-sm">
              <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                <li>Go to <strong>Daily Logbook</strong></li>
                <li>Click on the date or "New Entry"</li>
                <li>Describe your activities for that day</li>
                <li>Add any challenges and lessons learned</li>
                <li>Click "Save Draft" to save without submitting</li>
                <li>Click "Submit" when ready (cannot edit after submission)</li>
              </ol>
              <p className="text-xs text-muted-foreground mt-2">Tip: Save frequently as drafts while writing.</p>
            </div>
          ),
        },
        {
          title: "Can I edit my logbook entry?",
          content: (
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>You can only edit draft entries. Once submitted:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Your academic supervisor can approve or reject it</li>
                <li>Rejected entries return to draft for revision</li>
                <li>You can then resubmit after making changes</li>
              </ul>
            </div>
          ),
        },
        {
          title: "What's the logbook status workflow?",
          content: (
            <div className="space-y-2 text-sm">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-gray-400" />
                  <span className="text-muted-foreground"><strong>Draft</strong> - You're still writing</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-500" />
                  <span className="text-muted-foreground"><strong>Submitted</strong> - Waiting for supervisor review</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="text-muted-foreground"><strong>Approved</strong> - Supervisor accepted</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-red-500" />
                  <span className="text-muted-foreground"><strong>Rejected</strong> - Needs revision</span>
                </div>
              </div>
            </div>
          ),
        },
      ],
    },
    {
      id: "attendance",
      title: "Attendance & Check-in",
      icon: CheckCircle2,
      sections: [
        {
          title: "How do I check in daily?",
          content: (
            <div className="space-y-2 text-sm">
              <p>Click the <strong>"Check In"</strong> button in the top right of your dashboard each day you're at your internship.</p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>You can check in once per day</li>
                <li>Your location may be recorded for attendance verification</li>
                <li>You'll see "Checked In" confirmation once successful</li>
              </ul>
            </div>
          ),
        },
        {
          title: "How do I view my attendance record?",
          content: (
            <div className="space-y-2 text-sm">
              <p>Go to <strong>Attendance</strong> to see:</p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>All check-in records with dates and times</li>
                <li>Your attendance summary and statistics</li>
                <li>Any issues or concerns flagged by your supervisor</li>
              </ul>
            </div>
          ),
        },
      ],
    },
    {
      id: "documents",
      title: "Documents & Files",
      icon: FileText,
      sections: [
        {
          title: "Where do I upload required documents?",
          content: (
            <div className="space-y-2 text-sm">
              <p>Go to <strong>Documents</strong> to upload and manage:</p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>Placement letter / Offer letter</li>
                <li>Insurance documents</li>
                <li>Medical clearance</li>
                <li>Other required certificates</li>
              </ul>
              <p className="text-xs text-muted-foreground mt-2">Ensure documents are clear, readable, and in supported formats (PDF, DOC, DOCX, JPG, PNG).</p>
            </div>
          ),
        },
      ],
    },
  ];

  const supervisorCategories: HelpCategory[] = [
    {
      id: "supervision",
      title: "Student Supervision",
      icon: Users,
      sections: [
        {
          title: "How do I view my assigned students?",
          content: (
            <div className="space-y-2 text-sm">
              <p>Go to <strong>Dashboard</strong> to see all your assigned students. You can:</p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>View student contact information</li>
                <li>Check their internship status</li>
                <li>Access their logbooks and attendance records</li>
              </ul>
            </div>
          ),
        },
        {
          title: "How do I review student logbooks?",
          content: (
            <div className="space-y-2 text-sm">
              <p>Go to <strong>Student Logbooks</strong> to:</p>
              <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                <li>See all submitted logbook entries from your students</li>
                <li>Click to view full entry details</li>
                <li>Approve quality entries</li>
                <li>Reject entries that need improvement with feedback</li>
              </ol>
            </div>
          ),
        },
        {
          title: "How do I assess students?",
          content: (
            <div className="space-y-2 text-sm">
              <p>Go to <strong>Assessments</strong> to complete evaluations:</p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li><strong>Weekly Rubric</strong> - Submit weekly performance assessments</li>
                <li><strong>Final Assessment</strong> - Submit comprehensive end-of-internship evaluation</li>
                <li>Include specific feedback to help students improve</li>
              </ul>
            </div>
          ),
        },
        {
          title: "How do I manage attendance?",
          content: (
            <div className="space-y-2 text-sm">
              <p>Go to <strong>Attendance</strong> to:</p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>View student check-in records</li>
                <li>Identify attendance patterns or issues</li>
                <li>Flag concerns with students or academic supervisors</li>
              </ul>
            </div>
          ),
        },
      ],
    },
    {
      id: "communication",
      title: "Communication",
      icon: MessageSquare,
      sections: [
        {
          title: "How do I message students?",
          content: (
            <div className="space-y-2 text-sm">
              <p>Go to <strong>Messages</strong> to send direct messages to your students. Use this for:</p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>Quick feedback on logbook submissions</li>
                <li>Attendance reminders</li>
                <li>Urgent communications</li>
              </ul>
            </div>
          ),
        },
      ],
    },
  ];

  const academicCategories: HelpCategory[] = [
    {
      id: "student-oversight",
      title: "Student Oversight",
      icon: Users,
      sections: [
        {
          title: "How do I view my students?",
          content: (
            <div className="space-y-2 text-sm">
              <p>Go to <strong>My Students</strong> to see all students you're academically supervising.</p>
            </div>
          ),
        },
        {
          title: "How do I evaluate students?",
          content: (
            <div className="space-y-2 text-sm">
              <p>Go to <strong>Evaluations</strong> to:</p>
              <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                <li>Review student logbook entries</li>
                <li>Approve or provide feedback on submissions</li>
                <li>Provide academic feedback and grades</li>
              </ol>
            </div>
          ),
        },
        {
          title: "How do I schedule site visits?",
          content: (
            <div className="space-y-2 text-sm">
              <p>Go to <strong>Site Visits</strong> to:</p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>Schedule visits to student work sites</li>
                <li>View visit history and notes</li>
                <li>Document observations and feedback</li>
              </ul>
            </div>
          ),
        },
      ],
    },
  ];

  const cloCategories: HelpCategory[] = [
    {
      id: "management",
      title: "System Management",
      icon: FileText,
      sections: [
        {
          title: "How do I manage companies?",
          content: (
            <div className="space-y-2 text-sm">
              <p>Go to <strong>Companies</strong> to:</p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>Add new partner companies</li>
                <li>Manage company information</li>
                <li>View company contact persons</li>
                <li>Track company partnerships</li>
              </ul>
            </div>
          ),
        },
        {
          title: "How do I manage internship terms?",
          content: (
            <div className="space-y-2 text-sm">
              <p>Go to <strong>Terms</strong> to:</p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>Create new application windows</li>
                <li>Set term dates and deadlines</li>
                <li>Manage application availability</li>
              </ul>
            </div>
          ),
        },
        {
          title: "How do I view student applications?",
          content: (
            <div className="space-y-2 text-sm">
              <p>Go to <strong>Applications</strong> to:</p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>Review all student applications</li>
                <li>Filter by term, company, or status</li>
                <li>See application details and attached documents</li>
              </ul>
            </div>
          ),
        },
      ],
    },
  ];

  const dloCategories: HelpCategory[] = [
    {
      id: "coordination",
      title: "Internship Coordination",
      icon: Users,
      sections: [
        {
          title: "How do I manage supervisors?",
          content: (
            <div className="space-y-2 text-sm">
              <p>Go to <strong>Supervisors</strong> to:</p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>Add external industry supervisors</li>
                <li>Manage supervisor information</li>
                <li>Track supervisor assignments</li>
              </ul>
            </div>
          ),
        },
        {
          title: "How do I assign students to supervisors?",
          content: (
            <div className="space-y-2 text-sm">
              <p>Go to <strong>Assignments</strong> to:</p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>Match students with approved companies</li>
                <li>Assign industry supervisors</li>
                <li>Assign academic supervisors</li>
                <li>View assignment history</li>
              </ul>
            </div>
          ),
        },
        {
          title: "How do I view grades?",
          content: (
            <div className="space-y-2 text-sm">
              <p>Go to <strong>Grades</strong> to:</p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>View supervisor assessments</li>
                <li>View academic evaluations</li>
                <li>See final grades and comments</li>
              </ul>
            </div>
          ),
        },
      ],
    },
  ];

  let roleCategories: HelpCategory[] = [];
  if (user?.role === "student") roleCategories = studentCategories;
  else if (user?.role === "supervisor") roleCategories = supervisorCategories;
  else if (user?.role === "academic") roleCategories = academicCategories;
  else if (user?.role === "clo") roleCategories = cloCategories;
  else if (user?.role === "dlo") roleCategories = dloCategories;

  const allCategories = [...commonCategories, ...roleCategories];

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Help & Support</h1>
          <p className="text-muted-foreground text-lg">
            Find answers to common questions about using IAMS
          </p>
        </div>

        {/* Quick Links */}
        <div className="grid md:grid-cols-2 gap-4 mb-12">
          <a
            href="mailto:support@htu.edu.gh"
            className="p-4 border border-border rounded-xl hover:bg-accent transition-colors"
          >
            <div className="flex items-start gap-3">
              <Mail className="w-5 h-5 text-primary mt-1 shrink-0" />
              <div>
                <h3 className="font-semibold mb-1">Email Support</h3>
                <p className="text-sm text-muted-foreground">support@htu.edu.gh</p>
              </div>
            </div>
          </a>

          <div className="p-4 border border-border rounded-xl">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-primary mt-1 shrink-0" />
              <div>
                <h3 className="font-semibold mb-1">Report an Issue</h3>
                <p className="text-sm text-muted-foreground">Click "Report Issue" in the sidebar</p>
              </div>
            </div>
          </div>
        </div>

        {/* FAQ Accordion */}
        <div className="space-y-2">
          {allCategories.map((category) => {
            const Icon = category.icon;
            const isExpanded = expandedCategory === category.id;

            return (
              <div key={category.id} className="border border-border rounded-xl overflow-hidden">
                {/* Category Header */}
                <button
                  onClick={() => setExpandedCategory(isExpanded ? null : category.id)}
                  className="w-full flex items-center justify-between p-4 hover:bg-accent transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-5 h-5 text-primary" />
                    <h2 className="text-lg font-semibold">{category.title}</h2>
                  </div>
                  <ChevronDown
                    className={`w-5 h-5 text-muted-foreground transition-transform duration-300 ${
                      isExpanded ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {/* Category Content */}
                {isExpanded && (
                  <div className="border-t border-border divide-y divide-border bg-card/50">
                    {category.sections.map((section, idx) => {
                      const sectionKey = `${category.id}-${idx}`;
                      const isSectionExpanded = expandedSection === sectionKey;

                      return (
                        <div key={sectionKey}>
                          <button
                            onClick={() =>
                              setExpandedSection(isSectionExpanded ? null : sectionKey)
                            }
                            className="w-full flex items-center justify-between p-4 hover:bg-accent transition-colors text-left"
                          >
                            <h3 className="font-medium">{section.title}</h3>
                            <ChevronDown
                              className={`w-4 h-4 text-muted-foreground transition-transform duration-300 shrink-0 ml-2 ${
                                isSectionExpanded ? "rotate-180" : ""
                              }`}
                            />
                          </button>

                          {isSectionExpanded && (
                            <div className="px-4 pb-4 text-foreground">{section.content}</div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="mt-12 p-6 bg-card border border-border rounded-xl text-center">
          <p className="text-muted-foreground mb-3">Can't find what you're looking for?</p>
          <p className="text-sm">
            Contact us at <a href="mailto:support@htu.edu.gh" className="text-primary hover:underline">support@htu.edu.gh</a> or click "Report Issue" in the sidebar to get help.
          </p>
        </div>
      </div>
    </div>
  );
}

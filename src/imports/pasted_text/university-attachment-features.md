
UNIVERSITY INDUSTRIAL ATTACHMENT
MANAGEMENT SYSTEM
Complete Feature List — All User Roles



How to Read This Document
This feature list is structured for direct use by an AI agent or development team. Each section covers one user role. Every feature row contains a unique ID, a concise feature name, and a plain-language acceptance criterion describing exactly what the system must do.

Scope note: This list contains only what is described in the project documents. No features have been added. Where the source documents mention the same behaviour from different role perspectives, it appears once under the primary actor. Overlaps are noted inline.


User Roles at a Glance
● CLO — Central Liaison Office (super admin)
● DLO — Departmental Liaison (per department)
● STU — Student
● ACS — Academic Supervisor (Lecturer)
● IDS — Industry Supervisor
● HOD — Head of Department

Authentication: CLO, DLO, STU, ACS, HOD all use Google SSO with @htu.edu.gh domain. Industry Supervisors use magic-link email — no Google account required.





Section 1 — Authentication & User Management
Covers login, account creation, role assignment, and user lifecycle for every stakeholder type.

1.1 Google SSO (University Users)
ID
Feature
Description / Acceptance Criteria
AUTH-01
Google SSO Login
Users with a @htu.edu.gh Google account can click 'Sign in with Google' and are authenticated via OAuth. No separate username/password is created. On first login the system creates a local account record linked to the Google UID.
AUTH-02
Domain Restriction
The OAuth flow rejects any Google account not belonging to the @htu.edu.gh domain and shows a clear error message.
AUTH-03
Role-Based Redirect on Login
After login, the system detects the user's role (CLO, DLO, STU, ACS, HOD) and redirects to the correct role dashboard.
AUTH-04
Session Management
Sessions expire after a configurable idle timeout. The user is redirected to the login page and shown a 'Session expired' message.


1.2 Magic Link (Industry Supervisors)
ID
Feature
Description / Acceptance Criteria
AUTH-05
Magic Link Generation
When a student enters an industry supervisor's email and submits it, the system generates a unique, time-limited token and emails a magic link to that address.
AUTH-06
Magic Link Login
Clicking the link in the email authenticates the industry supervisor and opens their limited dashboard without requiring a Google account or password.
AUTH-07
Token Expiry & Resend
Magic link tokens expire after a configurable period. The student or DLO can trigger a resend from the system, which invalidates the old token and issues a new one.
AUTH-08
Optional Password Setup
After first magic-link login, the industry supervisor may optionally set a password to enable future direct login without a new link.


1.3 Account Lifecycle — University Users
ID
Feature
Description / Acceptance Criteria
AUTH-09
DLO Account Creation by CLO
CLO navigates to Users → Add Departmental Liaison. The system displays importable staff (name, email, department from HR import). CLO selects one or more staff and assigns the DLO role. The system emails each with a login invitation link.
AUTH-10
Account Activation on First Login
DLO accounts become active the moment the invited staff member completes their first Google SSO login. No manual activation step is required.
AUTH-11
User Deactivation
CLO can deactivate any user account (student, DLO, ACS, HOD). A deactivated user cannot log in. Their historical data is preserved for audit.
AUTH-12
User Reactivation
CLO can reactivate a previously deactivated account. The user regains access on next login.
AUTH-13
No Account Deletion
Accounts cannot be permanently deleted to preserve the audit trail. The UI must not expose a delete action.
AUTH-14
View All Users
CLO can view a searchable, filterable list of all users across all roles. DLOs can view users in their department only.





Section 2 — Central Liaison Office (CLO)
CLO is the super admin. All features below are exclusive to CLO unless marked as shared.

2.1 System Configuration
ID
Feature
Description / Acceptance Criteria
CLO-01
Basic Settings
CLO can set and update: university name, logo (image upload), and default contact information. These values appear on generated documents and email footers.
CLO-02
Academic Calendar Setup
CLO can define academic years, semesters, and vacation periods. These feed into term eligibility rules.
CLO-03
Role & Permission Configuration
CLO can define what actions DLOs are permitted to perform (e.g., whether DLOs may override evaluation forms, whether DLOs may use their own signature on placement letters).


2.2 Document Template Management
ID
Feature
Description / Acceptance Criteria
CLO-04
Upload Placement Letter Letterhead
CLO uploads a university letterhead (PNG, JPEG, or PDF background). The system overlays dynamic content on this letterhead when generating placement letters.
CLO-05
Define Placement Letter Fields
CLO configures which placeholder fields appear in the letter: [Student Name], [Company Name], [Start Date], [End Date], and any others. These are auto-filled at generation time.
CLO-06
Upload Default Signature
CLO uploads a signature image (Central Liaison or Vice Chancellor) that is embedded in generated placement letters.
CLO-07
Allow DLO Signature Override
CLO can toggle a setting that permits DLOs to upload their own department signature to replace the default signature on letters issued for their department.
CLO-08
Preview Placement Letter Template
CLO can generate a sample placement letter with dummy data to verify the layout before it goes live.
CLO-09
Company Acceptance Form Template
CLO creates a PDF template with fields for: company name, contact person, industry supervisor details (name, title, email, phone), acceptance confirmation, and signature/date lines. This template is downloaded by students for physical signing.
CLO-10
Evaluation Form Builder
CLO can create and configure mid-term and final evaluation forms: rating scales, comment sections, and conditional questions. Different forms can be set per department or a single standard form applied institution-wide.
CLO-11
Save & Version Templates
When a template is updated, the previous version is retained so that documents already generated reference the correct template version.


2.3 Term Management
ID
Feature
Description / Acceptance Criteria
CLO-12
Create Internship Term
CLO creates a term with: name (e.g., '2026 L300 Semestrial Internship'), type (Vacation or Semestrial), application open/close dates, internship start/end dates, eligible student levels (e.g., L300 only), and eligible departments (all or selected).
CLO-13
Publish Term
CLO publishes a term, making it visible to students for application. Unpublished terms are draft only.
CLO-14
Delegate Department Requirements
CLO can optionally allow DLOs to add department-specific requirements or deadlines within the central term dates.
CLO-15
Institution-Wide Term Dashboard
CLO's dashboard shows: total applications per department and status, students placed/active/completed, companies engaged (approved vs pending), pending company approvals per department.
CLO-16
Drill-Down Navigation
From the dashboard CLO can drill into any department, any student, or any company record.


2.4 Company Management
ID
Feature
Description / Acceptance Criteria
CLO-17
View All Companies
CLO can view the master company list filtered by status: Approved, Pending, Deactivated.
CLO-18
Override DLO Company Decision
CLO can approve a company that a DLO rejected, or reject a company that a DLO approved, with a mandatory reason note.
CLO-19
Edit Company Details
CLO can correct or update any field on a company record (name, address, contact info).
CLO-20
Deactivate Company
CLO can deactivate a company, removing it from the student-facing dropdown. Existing internship records linked to the company are unaffected.


2.5 Oversight & Intervention
ID
Feature
Description / Acceptance Criteria
CLO-21
View All Applications
CLO can see every student's application across all departments, with full status history.
CLO-22
Intervene on Application
If a DLO is unresponsive, CLO can approve or reject an application directly, with a note logged.
CLO-23
Handle Escalated Issues
Escalated issues (from students or supervisors that DLO cannot resolve) appear in CLO's issue queue. CLO can add resolution notes, contact companies externally, and mark issues resolved. All actions are logged.
CLO-24
Bulk Announcements
CLO can compose and send an announcement to: all students, all DLOs, all academic supervisors, or any combination. Delivery via email and in-app notification.
CLO-25
Resend Industry Supervisor Magic Link
CLO can trigger a new magic link for any industry supervisor (also triggerable by student or DLO — see respective sections).
CLO-26
Audit Log View
CLO can view a full audit log of all administrative actions (approvals, template changes, user modifications) with actor, timestamp, and description.
CLO-27A
View All Attendance Records
CLO can view attendance records across all departments, filterable by department, student, and date range. Each record shows: date, check-in time, location (GPS or manual), verification status, and absent days.


2.6 Archiving & Reporting
ID
Feature
Description / Acceptance Criteria
CLO-27
Initiate Term Archive
After all grades are submitted and approved, CLO triggers archiving for a term. System displays a summary and requires confirmation.
CLO-28
Export Archive Data
Before or during archiving, CLO can export the full term dataset in CSV, JSON, or PDF formats (student profiles, logbooks, reports, evaluations).
CLO-29
Read-Only Archive
Once archived, the term is locked. No further edits are possible by any user. All data remains viewable for audit purposes.
CLO-30
Pre-Built Reports
CLO can generate: placement rate per department, average grades, company satisfaction ratings. Reports can be exported.
CLO-31
Custom Report Builder
CLO can select any combination of fields and date ranges to build a custom report for accreditation or institutional review.





Section 3 — Departmental Liaison (DLO)
DLOs manage the attachment process for their department only. They are created by CLO and log in via Google SSO.

3.1 Department Configuration
ID
Feature
Description / Acceptance Criteria
DLO-01
Modify Evaluation Forms (if permitted)
If CLO has enabled it, the DLO can add department-specific questions to the standard evaluation form or create a separate evaluation form for their department.
DLO-02
Set Department-Specific Deadlines
If CLO has enabled it, DLO can set internal deadlines for their department (e.g., logbook submission) that fall within the central term dates.
DLO-03
Upload Own Signature
If CLO has enabled the signature override setting, the DLO can upload their own signature image to be used on placement letters generated for their students.
DLO-04
Supervisor Pool Management
DLO maintains a list of academic supervisors (lecturers) eligible to be assigned to students. DLO can set the maximum number of students per supervisor for workload management.


3.2 Company Approval
ID
Feature
Description / Acceptance Criteria
DLO-05
Company Approval Queue
DLO's dashboard has a dedicated 'Pending Company Approvals' section listing: company name, address, contact person, the student who entered it, and entry date.
DLO-06
Review Company Details
DLO clicks a pending company to view all fields entered by the student before making a decision.
DLO-07
Approve Company
DLO approves the company. Status changes to Approved. The company is now available in the dropdown for all students system-wide. The student's application becomes eligible for review.
DLO-08
Reject Company with Reason
DLO rejects the company and must provide a reason. The student is notified and may correct details or choose another company.
DLO-09
Company Approval is Independent
Company approval and application approval are separate actions. An application cannot advance until both: the associated company is Approved AND the DLO has approved the application.


3.3 Application Review & Approval
ID
Feature
Description / Acceptance Criteria
DLO-10
Pending Applications List
Dashboard shows all pending applications from students in the DLO's department: student name, company, date applied, application status, company approval status (highlighted if still pending).
DLO-11
Review Application Detail
DLO opens an application to see full student details, company details, uploaded documents, and the company's approval status.
DLO-12
Internal Messaging on Application
DLO can send a message to the student from the application detail view to request clarification. The message is logged in the system.
DLO-13
Approve Application
DLO approves the application. The system generates: a Placement Letter (PDF, using the configured template) and a Company Acceptance Form (PDF). The student is notified to download the form, get it physically signed, and upload it back.
DLO-14
Reject Application with Reason
DLO rejects the application with a mandatory reason. The student is notified and may reapply if eligible.
DLO-15
Bulk Approval
DLO can select multiple applications and approve them in a single action when all are straightforward.


3.4 Academic Supervisor Assignment
ID
Feature
Description / Acceptance Criteria
DLO-16
Company Acceptance Notification
When a student uploads the signed company acceptance form and enters supervisor details, the DLO receives a notification that the student is ready for supervisor assignment.
DLO-17
Supervisor Assignment View
DLO sees a list of students waiting for supervisor assignment. For each, DLO can see available academic supervisors and their current student load count.
DLO-18
Manual Supervisor Assignment
DLO selects an academic supervisor from the pool and confirms the assignment. The supervisor receives a notification with access instructions.
DLO-19
Auto-Assignment Option
System can optionally auto-assign based on a configurable rule (e.g., round-robin or least-loaded) if the DLO triggers it.
DLO-20
Internship Profile Activation
Once a supervisor is assigned, the student's Internship Profile status changes to Active and the digital logbook is enabled.


3.5 Monitoring Student Progress
ID
Feature
Description / Acceptance Criteria
DLO-21
Active Students Dashboard
Shows all active students with: last logbook entry date, days since last entry, pending approvals, evaluations, color-coded flags (green = active; yellow = no logs for 3 days; red = no logs for 7 days).
DLO-22
Student Detail View
DLO can click any student to see their full logbook, reports, evaluations, and communication history.
DLO-23
Send Reminder to Student
DLO can send a reminder message to a flagged student directly from the dashboard.
DLO-24
Contact Academic Supervisor
DLO can message the assigned academic supervisor about a specific student from within the student's detail view.
DLO-25
Mediate or Escalate Issues
DLO can log a mediation note on an issue. If unresolvable, DLO escalates to CLO via the system's issue queue.
DLO-35
View Department Attendance Records
DLO can view attendance records for all active students in their department. Records are filterable by student and date range and show: check-in time, location (GPS or manual), verification status, and absent days.
DLO-36
Missed Check-In Alert
DLO receives an in-app and email alert when any student in their department fails to check in by the configured daily cutoff time.


3.6 Evaluation Oversight
ID
Feature
Description / Acceptance Criteria
DLO-26
Mid-Term Evaluation Tracking
DLO can see which students have completed mid-term evaluations and which have not. DLO can send a system reminder to the industry supervisor or academic supervisor for any missing evaluation.
DLO-27
Final Evaluation Notification
DLO is notified when the industry supervisor submits a student's final evaluation. DLO then follows up to ensure the academic supervisor submits the final grade.


3.7 Grade Approval
ID
Feature
Description / Acceptance Criteria
DLO-28
Grade Review
When an academic supervisor submits a grade, DLO receives a notification. DLO reviews the grade alongside the final report and industry evaluation.
DLO-29
Request Grade Revision
DLO can request the academic supervisor revise a grade, with a note explaining the reason.
DLO-30
Approve Grade
DLO approves the final grade. The grade is marked as final and queued for export to academic records.
DLO-31
Departmental Analytics
DLO can view statistics for their department: placement rate, average grades, company distribution. Exportable as a report.


3.8 Communication & Notifications
ID
Feature
Description / Acceptance Criteria
DLO-32
Department-Wide Announcement
DLO can compose and send an announcement to all students in their department (e.g., deadline reminders). Delivery via email and in-app.
DLO-33
Receive System Notifications
DLO receives in-app and email notifications for: new applications pending review, new companies pending approval, company acceptances ready for supervisor assignment, students with no logbook activity, grades ready for approval.
DLO-34
Notification Centre
DLO has a notification centre view listing all past and current notifications with read/unread status.





Section 4 — Student

4.1 Application
ID
Feature
Description / Acceptance Criteria
STU-01
View Open Internship Window
Students can see active internship windows with: name, type, application open/close dates, internship start/end dates, and eligibility criteria.
STU-02
Eligibility Check
On opening an application, the system validates that the student meets the eligibility criteria (correct level, no unresolved previous internship actions). Ineligible students see a clear message explaining why they cannot apply.
STU-03
Select Existing Company
If the student's target company is already approved in the system, they can find and select it from a searchable dropdown.
STU-04
Enter New Company
If the company is not in the system, the student manually enters: company name, address, contact person, phone, email. A company record is created with status Pending Approval.
STU-05
Upload Optional Documents
Student can optionally upload supporting documents (CV, motivation letter) with their application.
STU-06
Submit Application
Student submits the application. Status is set to 'Pending Departmental Review'. The DLO is notified.
STU-07
Track Application Status
Student can view their application's current status and a history of status changes with timestamps.


4.2 Company Acceptance
ID
Feature
Description / Acceptance Criteria
STU-08
Download Company Acceptance Form
After application approval, student can download the generated Company Acceptance Form PDF from their dashboard.
STU-09
Upload Signed Acceptance Form
Student scans or photographs the physically signed form and uploads it as a PDF/image through 'Upload Company Acceptance'. The system stores the file.
STU-10
Enter Industry Supervisor Details
Alongside uploading the signed form, student manually enters the industry supervisor's: full name, job title, email address, phone number. These fields are used to send the magic link.
STU-11
Application Status Update
On successful upload and supervisor entry, the application status changes to 'Company Accepted'. The DLO and student are notified. The system emails the magic link to the industry supervisor.
STU-12
Request Magic Link Resend
Student can request that the system resend the magic link to the industry supervisor if the supervisor reports not receiving it.


4.3 Digital Logbook
ID
Feature
Description / Acceptance Criteria
STU-13
Create Daily Log Entry
Student logs an entry with: date, tasks performed, challenges encountered, learning outcomes, hours worked. All entries are timestamped automatically.
STU-14
Attach Media to Log Entry
Student can attach photos or documents as evidence to any log entry.
STU-15
Set Reminders
Student can set personal reminders to log activities (e.g., daily at 5 PM). Reminders are delivered via in-app notification.
STU-16
View Log History
Student can view all their past entries in chronological order with supervisor comments and approval status per entry.


4.4 Attendance
ID
Feature
Description / Acceptance Criteria
STU-ATT-01
Daily GPS Check-In
At the start of each workday, the student must perform a check-in via the mobile app or web. The system captures GPS coordinates and resolves them to an address. Check-in is compulsory — it must be completed before the student can access or create any logbook entries for that day.
STU-ATT-02
Manual Check-In Fallback
If GPS is unavailable, the student manually enters their location (address or description). The entry is flagged as 'Pending Verification' and is not counted as valid attendance until the industry supervisor approves it. If rejected, the day is marked absent. While pending, the student is still granted access to the day's logbook entries.
STU-ATT-03
Check-In Timestamp
Every check-in (GPS or manual) is automatically timestamped at the moment of submission. The student cannot backdate a check-in.
STU-ATT-04
Auto Check-Out
The system automatically closes the attendance record at the end of the configured workday. No manual check-out is required from the student.


4.5 Communication & Issues
ID
Feature
Description / Acceptance Criteria
STU-18
In-System Messaging
Student can send and receive messages with their DLO, academic supervisor, and industry supervisor within the system.
STU-19
Report an Issue
Student can click 'Report Issue' to raise a concern. The issue is routed to the DLO. If company-related, it can be escalated to CLO. All communication is logged.
STU-20
Request Company Change
Student can submit a request to switch companies during attachment, providing a reason. DLO reviews and, if approved, the current internship profile is closed and a new application process begins.


4.6 Post-Attachment
ID
Feature
Description / Acceptance Criteria
STU-21
Submit Final Report
Student uploads their final report as a PDF following departmental guidelines. Status changes to 'Submitted'. Academic supervisor is notified.
STU-22
Upload Completion Certificate
Student can optionally upload a certificate of completion or other supporting documents alongside the final report.
STU-23
View Final Grade
After grade approval, student can view their final grade within the system.
STU-24
Receive Notifications
Student receives in-app and email notifications for: application status changes, approval, form download availability, logbook feedback, evaluation submissions, grade posting.





Section 5 — Academic Supervisor (Lecturer)
Assigned by DLO after the company acceptance stage. Authenticates via Google SSO.

ID
Feature
Description / Acceptance Criteria
ACS-01
Assignment Notification
Academic supervisor receives a notification (in-app and email) when assigned to a student, with a link to access the student's internship profile.
ACS-02
View Student Logbook
Supervisor can view all log entries, attached media, and the AI-generated summary (if enabled) in real time.
ACS-03
Comment on Log Entry
Supervisor can add comments or feedback on individual log entries. The student is notified.
ACS-04
Approve Log Entry
Supervisor can mark a log entry as approved or flag it for revision.
ACS-05
Receive Inactivity Alert
Supervisor receives an alert if the student has not logged any activity for a configurable number of days.
ACS-06
Log Virtual Site Visit
Supervisor can record a virtual site visit (video call or in-person) with notes in the system.
ACS-07
Review Mid-Term Evaluation
Supervisor can view the industry supervisor's mid-term evaluation and discuss it with the student through the system.
ACS-08
Review Final Report
Supervisor receives notification when the student submits the final report and can view it within the system.
ACS-09
Review Industry Final Evaluation
Supervisor can view the industry supervisor's final evaluation alongside the student's final report.
ACS-10
Enter Final Grade
Supervisor enters the final grade using the configurable grading rubric (e.g., industry eval 40%, report 40%, supervisor assessment 20%). The system optionally auto-calculates the composite grade.
ACS-11
Grade Notification to DLO
After the supervisor submits a grade, the DLO is automatically notified for approval.
ACS-12
In-System Messaging
Supervisor can send and receive messages with the student, industry supervisor, and DLO within the system.
ACS-13
View Student Attendance
Academic supervisor can view the full attendance record for each of their assigned students — date, check-in time, location (GPS or manual), verification status, and any absent days.
ACS-14
Missed Check-In Alert
Academic supervisor receives an in-app and email alert when an assigned student fails to check in by the configured daily cutoff time.





Section 6 — Industry Supervisor
Accessed via magic link. No Google account required. Limited dashboard scoped to assigned students only.

ID
Feature
Description / Acceptance Criteria
IDS-01
Receive Magic Link Email
Industry supervisor receives an email containing a time-limited magic link, explaining their role and how to access the system.
IDS-02
Onboard via Magic Link
Clicking the link opens the system and prompts the supervisor to confirm/set their profile (name, optional password).
IDS-03
View Assigned Students
Industry supervisor's dashboard shows only the students assigned to them, with internship status summary.
IDS-04
View Student Logbook
Supervisor can view all log entries, attachments, and timestamps for each assigned student.
IDS-05
Comment on Log Entry
Supervisor can add comments or feedback on individual log entries. The student is notified.
IDS-06
Approve Tasks
Supervisor can approve tasks/entries logged by the student.
IDS-07
Send Message to Student
Supervisor can send internal messages to the student.
IDS-08
Complete Mid-Term Evaluation
Supervisor fills in the mid-term evaluation form (rating scale, open-ended comments) and submits it. Relevant parties are notified.
IDS-09
Complete Final Evaluation
Supervisor fills in and submits the final evaluation form (structured ratings, comments, recommendation). The academic supervisor and DLO are notified.
IDS-10
Digital Sign Evaluation (Optional)
Supervisor can digitally indicate they are the submitter on the evaluation form. Alternatively, they may upload a signed PDF version if preferred.
IDS-11
Verify Manual Check-In
Industry supervisor receives a notification when an assigned student submits a manual check-in (GPS unavailable). They review the location entered and either approve (day counts as present) or reject (day is marked absent). The student is notified of the decision.





Section 7 — Head of Department (HOD)
Read-only analytics access for their department. Authenticates via Google SSO.

ID
Feature
Description / Acceptance Criteria
HOD-01
Department Analytics Dashboard
HOD can view a summary dashboard for their department showing: number of students placed, active, and completed; placement rate; average grades; company distribution.
HOD-02
View Departmental Performance Reports
HOD can view and export pre-built performance reports for their department.





Section 8 — System-Wide & Cross-Cutting Features
These features are not owned by one role but underpin the whole system.

8.1 Document Generation
ID
Feature
Description / Acceptance Criteria
SYS-01
Generate Placement Letter PDF
On application approval, the system dynamically generates a PDF placement letter using the CLO-configured letterhead, placeholder values, and signature. The letter is available for the student to download.
SYS-02
Generate Company Acceptance Form PDF
On application approval, the system generates a blank Company Acceptance Form PDF using the CLO-configured template. Available for the student to download and take to the company.
SYS-03
Template Version Pinning
Each generated document is linked to the exact template version active at the time of generation, so future template changes do not alter already-issued documents.


8.2 Notification System
ID
Feature
Description / Acceptance Criteria
SYS-04
In-App Notifications
Every key event triggers an in-app notification for the relevant user(s). Notifications appear in a notification centre with read/unread state.
SYS-05
Email Notifications
All in-app notifications are also sent as emails using the university's configured SMTP/SendGrid setup.
SYS-06
Configurable Reminders
Automated reminders are sent for: logbook inactivity (configurable threshold), upcoming evaluation deadlines, application/report submission deadlines.
SYS-07
Escalating Inactivity Alerts
No logbook entries for X days → reminder to student. No resolution after Y days → alert to academic supervisor and DLO.


8.3 Digital Logbook Infrastructure
ID
Feature
Description / Acceptance Criteria
SYS-08
Real-Time Visibility
Log entries are visible to industry supervisor and academic supervisor in real time as soon as they are saved.
SYS-09
AI Summary (Optional)
The system can optionally use AI to generate a brief summary of each log entry. This is displayed alongside the entry for supervisors.
SYS-10
Mobile-Optimized Interface
The logbook is accessible and fully functional on mobile browsers (PWA-ready). All core actions (log entry, check-in, messaging) work on mobile.
SYS-11
Offline Mode (Mobile)
The mobile app can store log entries locally if connectivity is lost and syncs them automatically when the connection is restored.


8.4 GPS Attendance Tracking (Optional)
ID
Feature
Description / Acceptance Criteria
SYS-12
Daily Check-In
Student performs a daily check-in through the mobile app. GPS coordinates are captured and optionally resolved to an address via a third-party geocoding API.
SYS-13
Attendance Irregularity Flag
If a student misses check-in for a configurable number of consecutive days, an alert is sent to supervisors.


8.5 Grading Rubric Engine
ID
Feature
Description / Acceptance Criteria
SYS-14
Configurable Rubric
DLO or CLO can configure the grading rubric per department: assign weightings to industry evaluation, final report, and supervisor assessment (must total 100%).
SYS-15
Auto-Calculate Grade
When all rubric components are submitted, the system calculates the composite grade automatically and presents it to the academic supervisor for confirmation.


8.6 Issue & Escalation Tracking
ID
Feature
Description / Acceptance Criteria
SYS-16
Raise Issue
Any user can raise an issue via a 'Report Issue' button. Issues are routed based on type: academic/student → DLO; company-related → CLO.
SYS-17
Issue Log
All issues, responses, and resolutions are stored and viewable by CLO. DLOs can view issues raised within their department.


8.7 Data Export & Integration
ID
Feature
Description / Acceptance Criteria
SYS-18
Grade Export to Academic Records
Final approved grades are exported to the university academic records system via API or a manual batch file (configurable). Format is agreed with the records system.
SYS-19
General Data Export
CLO and DLOs can export department/institution data as CSV or JSON at any time (not only at archiving).


8.8 Audit & Compliance
ID
Feature
Description / Acceptance Criteria
SYS-20
Audit Trail
Every administrative action (approval, rejection, assignment, template change, user modification) is logged with: actor, role, timestamp, affected entity, and action description.
SYS-21
Read-Only Archived Terms
Archived terms remain fully viewable for audit but cannot be modified by any user, including CLO.





Section 9 — Known Overlaps & Points Needing Clarification
The following items appear in the source documents in slightly different or ambiguous ways. No changes have been made; these are flagged for your decision before implementation.

#
Topic
Ambiguity / Question
O-1
Company approval scope
Doc 1 says: approved company becomes available 'for all students (system-wide)'. Doc 2 says 'for all students (or at least for the department)'. Which is correct — system-wide or department-only?
O-2
Magic link resend actors
Doc 1 says CLO can resend magic links. Doc 2 says student triggers the resend. Both are included (STU-12, CLO-25, DLO — via DLO-33 notification). Confirm all three actors should be able to trigger a resend.
O-3
DLO signature override granularity
CLO can allow DLOs to use their own signature. Is this a global toggle (on/off for all DLOs at once) or a per-DLO toggle? Clarify before implementing CLO-07.
O-4
Auto-assign supervisor rule
DLO-19 mentions auto-assign by round-robin or least-loaded. The source doc says 'or system can auto-assign based on rules'. Confirm which rule(s) should be supported at launch.
O-5
HOD access level
HOD is listed in the stakeholder table but no specific features beyond analytics are described. Confirm HOD cannot perform any actions (approve, assign, etc.) — read-only analytics only.
O-6
AI logbook summary
SYS-09 is listed as optional. Confirm whether it should be built at launch or deferred to a later phase.
O-7
Offline logbook mode
SYS-11 (offline mobile sync) is mentioned as a possible edge case. Confirm whether this is in scope for the initial build.
O-8
Grading rubric ownership
SYS-14 says 'DLO or CLO' can configure the rubric. Clarify: does CLO set a default and DLO can override per department, or does CLO set it globally and DLO cannot change it?





Feature Count Summary

Role / Section
Feature Count
Authentication & User Mgmt
14
Central Liaison Office (CLO)
32
Departmental Liaison (DLO)
32
Student (STU)
27
Academic Supervisor (ACS)
14
Industry Supervisor (IDS)
11
Head of Department (HOD)
2
System / Cross-Cutting (SYS)
21
Total
153


Each feature ID is unique and stable. Use these IDs in your implementation tickets, pull requests, and test cases to trace every line of code back to this specification.

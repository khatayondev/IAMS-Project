Detailed System Flow: Central & Departmental Liaison Perspective
This document focuses on the responsibilities and detailed workflows of the Central Liaison Office (CLO) and Departmental Liaisons (DLOs) within the fully digital Industrial Attachment Management System. It covers every action they take, from system configuration to term archiving, including specific tasks like uploading letterheads and managing company approvals.

1. Central Liaison Office (CLO) – Role & Responsibilities
The Central Liaison Office is the overarching administrative body responsible for the entire system's configuration, oversight, and reporting. They have access to all departments and can perform actions that affect the whole institution.
1.1 System Configuration & Setup
Initial Setup
CLO logs in as super admin using Google SSO (@htu.edu.gh).
Configures basic system settings:
University name, logo, default contact information.
Sets up academic years, semesters, and vacation periods.
Defines user roles and permissions (e.g., what departmental liaisons can do).
Document Template Management
Placement Letter Template:
CLO uploads the university's official letterhead (image or PDF background).
Defines placeholder fields that will be auto-filled: [Student Name], [Company Name], [Start Date], [End Date], etc.
Sets the default signature of the Central Liaison (or Vice Chancellor) – can upload a signature image.
Optionally, allows departmental liaisons to override the signature with their own (if departments issue their own letters).
Preview and save template.
Company Acceptance Form Template:
Creates a PDF template with fields for:
Company name, contact person
Industry supervisor details (name, title, email, phone)
Acceptance confirmation
Signature and date lines
This template will be downloaded by students, printed, signed physically, and uploaded back.
Evaluation Forms (mid-term and final):
Creates rating scales and comment sections.
Can have different forms per department or a standard one.
These are digital forms completed online by supervisors.
User Management
Creating Departmental Liaison Accounts:
CLO navigates to "Users" → "Add Departmental Liaison".
System displays a list of academic staff (imported from university HR system) with name, email, department.
CLO selects staff members and assigns them the "Departmental Liaison" role for their respective departments.
System sends an email invitation to each selected staff member with:
Instructions to log in using Google SSO (@htu.edu.gh).
Link to access the system.
No manual account creation is needed – accounts are activated upon first login.
Managing Users:
Can view all users (students, academic supervisors, liaisons, HODs).
Can deactivate/reactivate users.
Cannot delete users for audit trail purposes.
1.2 Term Management
Creating a New Internship Term
CLO defines:
Term name (e.g., "2026 L300 Semestrial Internship").
Type: Vacation or Semestrial.
Application start and end dates.
Internship start and end dates (the period students must be at companies).
Eligibility: which levels (e.g., L300 only), which departments (all or selected).
Optionally, allows departmental liaisons to set additional requirements per department.
Publishes the term – students can now apply.
Monitoring Active Term
Dashboard shows:
Total applications per department, per status.
Number of students placed, active, completed.
Companies engaged (approved vs pending approval).
Pending company approvals per department.
Can drill down into any department or student.
1.3 Company Management
Company Approval Workflow
Note: Companies do not register themselves. All company entries are created by students during application.
CLO can view all companies in the system:
Approved companies (available in dropdown for all students).
Pending companies (awaiting departmental liaison approval).
CLO can override departmental liaison decisions if needed (e.g., approve a company that a DLO rejected, or reject a company that was approved).
Company Database
Maintains a master list of all companies that have ever been involved.
Can edit company details (e.g., correct address, update contact info).
Can deactivate a company (remove from dropdown) if reported as problematic.
1.4 Oversight & Intervention
View All Applications
Can see every student's application status across all departments.
Can intervene if a departmental liaison is unresponsive or if there's a dispute.
Handle Escalated Issues
If a student or supervisor reports an issue that the departmental liaison cannot resolve, it escalates to CLO.
CLO mediates, contacts company if needed, and updates resolution in system.
All escalations are logged for audit.
Bulk Operations
Can send announcements to all students, all liaisons, or all academic supervisors.
Can export data for institutional reporting.
1.5 Archiving & Reporting
Closing a Term
After all grades are submitted and approved, CLO initiates archiving.
System prompts for confirmation and shows summary statistics.
CLO can preview archive data (list of students, reports, evaluations) and choose export formats (CSV, JSON, PDF).
Upon archiving, term becomes read-only; no further edits allowed.
Generating Reports
Pre-built reports: placement rate per department, average grades, company satisfaction ratings, etc.
Custom report builder: select fields and date ranges.
Reports can be exported for accreditation and institutional review.

2. Departmental Liaison (DLO) – Role & Responsibilities
Each academic department has one or more liaisons who manage the attachment process for their students. They have access only to their department's data. DLOs are created by CLO and authenticate via Google SSO.
2.1 Department Configuration (Optional)
Customizing Forms
If allowed by CLO, departmental liaisons can modify evaluation forms or add department-specific questions.
Can set department-specific deadlines (within the central term dates).
Supervisor Pool
Maintains a list of academic supervisors (lecturers) in the department who can be assigned to students.
Sets maximum number of students per supervisor (workload management).
2.2 Company Approval
Pending Company Approvals
Dashboard shows a section for "Pending Company Approvals" – companies that students in their department have entered manually.
Each entry shows: company name, address, contact person, student who entered it, date entered.
Reviewing Companies
Clicks on a company to see full details.
Can verify if the company is legitimate (e.g., check online, consult department knowledge).
If approved, the company becomes available in the dropdown for all students (system-wide).
If rejected, provides a reason. The student is notified and may need to correct details or choose another company.
Important
Company approval is independent of the student's application. A student's application remains pending until both:
The company is approved (or was already approved).
The DLO approves the application itself.
2.3 Application Review & Approval
Viewing Pending Applications
Dashboard shows all students from their department who have applied.
Each application shows: student name, company details, date applied, status, and company approval status (if the company is new and pending, this is highlighted).
Reviewing Applications
Clicks on an application to see full details.
Checks if company details are complete and appropriate (and if company is already approved).
May communicate with student via internal messaging if clarification needed.
Approval Action
Approves: moves application to next stage (document generation). System generates Placement Letter and Company Acceptance Form PDF.
Rejects: provides reason (e.g., student not eligible, company inappropriate). Student is notified and can reapply if possible.
Bulk Approval
Can select multiple applications and approve with a single action (if all are straightforward).
2.4 Academic Supervisor Assignment
After Company Acceptance
System notifies departmental liaison that a student has uploaded the signed PDF and entered industry supervisor details (status: "Company Accepted").
Liaison must now assign an academic supervisor.
Can view list of available supervisors with current load.
Assigns manually, or system can auto-assign based on rules (e.g., round-robin, least loaded).
Once assigned, supervisor gets notification and access to student's logbook.
2.5 Monitoring Student Progress
Dashboard
Shows all active students with:
Last logbook entry date.
Days since last check-in (if attendance tracking).
Any pending approvals or evaluations.
Flags for students who haven't logged in X days (color-coded).
Can click into any student to view their full logbook, reports, and communications.
Intervention
If a student is not logging activities, liaison can send a reminder or contact academic supervisor.
If there's a dispute with the company, liaison can mediate or escalate to CLO.
2.6 Mid-Term & Final Evaluations Oversight
Mid-Term
Liaison can see which students have had mid-term evaluations completed.
If missing, can remind industry supervisor (via system notification) or academic supervisor.
Final Evaluation
After industry supervisor submits final evaluation, liaison is notified.
Liaison ensures academic supervisor has submitted the final grade.
2.7 Grade Approval & Departmental Review
Grade Submission
Academic supervisor enters grade.
Liaison reviews the grade along with the final report and industry evaluation.
Can request revision if something is amiss.
Approves the grade, which then becomes final and can be sent to academic records.
Departmental Analytics
Liaison can view statistics for their department: placement rate, average grades, company distribution, etc.
Can export department-specific reports.
2.8 Communication & Notifications
Liaison can send announcements to all students in the department (e.g., "Reminder: final report deadline approaching").
Receives system notifications for key events:
New applications pending review.
New companies pending approval.
Company acceptances ready for supervisor assignment.
Students with no logbook activity.
Grades ready for approval.

3. Detailed Step-by-Step: Liaison Actions with System Responses
3.1 Central Liaison: Setting Up a New Term
Action: CLO logs in and navigates to "Terms" → "Create New Term".
System: Displays form with fields: name, type, dates, eligibility.
Action: CLO fills in details, e.g., "2026 L300 Semestrial Internship", type "Semestrial", application dates: 01-Mar-2026 to 15-Mar-2026, internship dates: 01-Jun-2026 to 31-Jul-2026, eligible levels: L300, departments: All.
System: Saves term with status "Upcoming". Notifies all departmental liaisons and students (if configured).
3.2 Central Liaison: Uploading/Updating Placement Letter Template
Action: CLO goes to "Settings" → "Document Templates" → "Placement Letter".
System: Shows current template preview, fields, and options.
Action: CLO clicks "Upload New Letterhead", selects image file (PNG/JPEG/PDF). Then clicks "Set Default Signature", uploads signature image. Optionally, checks "Allow departments to override signature".
System: Saves template, generates a preview with placeholder data. CLO can test by generating a sample letter.
3.3 Central Liaison: Creating Departmental Liaison Accounts
Action: CLO navigates to "Users" → "Departmental Liaisons" → "Add from Staff List".
System: Displays a searchable list of academic staff (name, email, department) imported from university system.
Action: CLO selects multiple staff members and assigns "Departmental Liaison" role.
System: Sends email invitations to selected staff with instructions to log in via Google SSO. Accounts become active upon first login.
3.4 Departmental Liaison: First Login
Action: DLO receives email, clicks link, logs in with Google SSO (@htu.edu.gh).
System: Recognizes user as departmental liaison, activates account, displays department-specific dashboard.
3.5 Departmental Liaison: Approving a New Company
Action: DLO sees notification "2 new companies pending approval".
System: Shows list of companies entered by students in their department.
Action: DLO clicks on a company, reviews details, clicks "Approve".
System: Company status changes to "Approved" and becomes available in dropdown for all students. Student's application is now eligible for review (company requirement satisfied).
3.6 Departmental Liaison: Reviewing and Approving Applications
Action: DLO sees dashboard with pending applications count.
System: Lists applications with student names, companies, submission dates, and company approval status.
Action: DLO clicks on a student's application, reviews details, clicks "Approve".
System: Updates application status to "Approved". Generates Placement Letter (using template) and Company Acceptance Form PDF. Notifies student: "Your application is approved. Please download the Company Acceptance Form, get it signed, upload the PDF, and enter supervisor details."
3.7 Departmental Liaison: Assigning Academic Supervisor
Action: DLO sees notification "Student John Doe has submitted company acceptance".
System: Shows list of students needing supervisor assignment.
Action: DLO clicks "Assign Supervisor" next to student. System shows list of available lecturers with current student count.
Action: DLO selects a lecturer (e.g., Dr. Smith) and confirms.
System: Assigns supervisor, sends notification to Dr. Smith with login instructions. Updates Internship Profile status to "Active".
3.8 Departmental Liaison: Monitoring Student Progress
Action: DLO visits "Active Students" dashboard.
System: Shows list with color-coded status: green (active, logging), yellow (no logs for 3 days), red (no logs for 7 days).
Action: DLO clicks on a red-flagged student. Sees last log entry date, can message the student or academic supervisor.
System: Sends message and logs interaction.
3.9 Departmental Liaison: Approving Final Grade
Action: DLO sees notification "Final grade ready for approval" for student Jane.
System: Shows grade submitted by academic supervisor, along with industry evaluation and final report.
Action: DLO reviews and clicks "Approve Grade".
System: Marks grade as approved, triggers export to academic records (or batch file). Notifies student.
3.10 Central Liaison: Archiving a Term
Action: After term end, CLO goes to "Terms" → selects the term → "Archive".
System: Shows summary: total students placed, average grade, etc. Asks for confirmation and export options.
Action: CLO chooses to export data as CSV and clicks "Confirm Archive".
System: Compiles all data, generates archive package, downloads CSV, and marks term as "Archived" (read-only).
4. Key Features for Liaisons/Admins
Feature
Description
Role-Based Dashboards
CLO sees institution-wide data; DLO sees only their department's data.
Notification Center
All important events trigger notifications (email + in-app).
Audit Logs
All actions (approvals, assignments, template changes) are logged and viewable by CLO.
Company Approval Queue
DLOs have dedicated section for approving new companies entered by students.
Application-Company Link
System clearly shows if a company is approved or pending, so DLO knows what action is needed.
Magic Link Management
CLO can resend magic links to industry supervisors if needed (triggered by student or DLO request).
Signature Management
DLOs can upload their own signature for placement letters if allowed by CLO.



5. Summary of Liaison/Admin System Interactions
Task
Central Liaison (CLO)
Departmental Liaison (DLO)
System configuration (templates, terms)
Yes
No (except department-specific forms if allowed)
Creating DLO accounts
Yes (select from staff list, send invites)
No
User management (deactivate, view)
Yes (all users)
Can view only department users
Company approval
Can override DLO decisions, view all companies
Primary responsibility for approving new companies from their students
Application review
Can view all, intervene
Reviews and approves for own department
Academic supervisor assignment
Can override
Primary responsibility
Student monitoring
Institution-wide
Department-wide
Issue escalation
Final resolver
First responder
Grade approval
Oversees
Approves departmental grades
Archiving & reporting
Initiates and manages
Can view department archives



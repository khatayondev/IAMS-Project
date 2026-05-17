ACADEMIC VISITATION SCORE SHEET
Feature & Data Specification
Industrial Attachment Management System
Ho Technical University  —  Directorate of Career Placement & Counselling  —  Industrial Liaison Office
This document provides a detailed specification of the Academic Visitation Score Sheet used during semestrial industrial attachments. It describes the purpose of the form, the fields it contains, the criteria the visiting supervisor assesses, how scores are calculated, and how the form integrates into the broader grading system.
It is intended for use by the development team when building the system, and by the academic office when reviewing or updating the assessment framework.

1.  Purpose of the Form
The Academic Visitation Score Sheet is completed by one or more Visiting (Departmental) Supervisors during a scheduled site visit to the student's place of attachment. It serves three purposes:

•	To provide a structured, standardised basis for evaluating a student's professional performance and attitude as observed at the workplace.
•	To record the visiting supervisor's formal assessment of the student across ten defined competency areas.
•	To contribute a scored component — worth 30% — to the student's final industrial attachment grade.

Scope
This form applies exclusively to semestrial (semester-long) industrial attachments. It is not used for shorter attachment types.

2.  Form Header Fields
The top of the form captures identifying information about the assessment context. All header fields must be completed before the form is submitted. The system will pre-populate fields where data is already available (e.g. Programme, Academic Year, Level) and allow the supervisor to enter the date manually.

Field	Type	Description
Programme	Text — pre-filled	The student's programme of study (e.g. HND Computer Science, B.Tech Electrical Engineering). Pulled from the student's enrolment record.
Academic Year	Text — pre-filled	The academic year in which the attachment is taking place (e.g. 2024/2025). Pulled from the active term record.
Level	Text — pre-filled	The student's current level of study (e.g. Level 200, Level 300). Pulled from the student's enrolment record.
Date	Date — entered by supervisor	The date on which the site visit took place. Entered by the visiting supervisor at the time of the visit.

3.  Assessment Criteria
The visiting supervisor assesses each student against ten competency criteria. Each criterion is scored on a scale of 0 to 3 marks. The ten criteria and their full descriptions are as follows:

TR	Time of Reporting
Assesses whether the student reports to the workplace on time and adheres to the organisation's reporting schedule. Reflects the student's understanding of professional time management.
Max score: 3 marks

D	Discipline
Evaluates the student's obedience to workplace rules, regularity of attendance, active participation in assigned duties, and submissiveness to authority. Encompasses overall professional conduct.
Max score: 3 marks

NP	Neatness / Appearance
Assesses the student's physical presentation, personal hygiene, and compliance with any dress code or uniform requirements of the organisation.
Max score: 3 marks

IS	Interpersonal Skills
Measures the student's ability to build positive relationships with colleagues, communicate respectfully, and navigate workplace social dynamics effectively.
Max score: 3 marks

TW	Teamwork
Evaluates how well the student collaborates with others, contributes to group tasks, and supports team goals within the organisation.
Max score: 3 marks

CS	Communication Skills
Assesses the student's ability to express ideas clearly — both verbally and in writing — and to listen actively and respond appropriately in a professional setting.
Max score: 3 marks

IO	Information on Organisation
Measures the student's level of knowledge and understanding of the host organisation — its structure, mandate, operations, and the relevance of their placement to their field of study.
Max score: 3 marks

ATW	Attitude towards Work
Evaluates the student's overall disposition towards their duties — including motivation, enthusiasm, willingness to go beyond minimum requirements, and general work ethic.
Max score: 3 marks

PA	Place of Attachment
Assesses the relevance of the student's placement organisation to their programme of study — i.e. whether the organisation provides meaningful, field-related training opportunities.
Max score: 3 marks

ULB	Use of Log-book
Evaluates whether the student maintains their log-book accurately, consistently, and in sufficient detail, and whether it reflects genuine engagement with their daily activities.
Max score: 3 marks

4.  Scoring System
4.1  Per-Criterion Scoring
Each of the ten criteria is scored individually by the visiting supervisor on a scale of 0 to 3:

Score	Descriptor
3	Outstanding — the student consistently exceeds expectations for this criterion.
2	Satisfactory — the student meets expectations for this criterion with no notable concerns.
1	Weak — the student partially meets expectations; improvement is required.
0	Unsatisfactory — the student does not meet expectations for this criterion.

⚠  Decision needed (D-2): Should the system provide descriptors for each score level per criterion (structured rubric), or should the supervisor simply enter a free numeric value between 0 and 3 for each criterion?

4.2  Total Score Calculation
The total visitation score is the sum of the scores across all ten criteria. Since each criterion carries a maximum of 3 marks, the maximum total score is 30.

Number of criteria	10
Max score per criterion	3 marks
Max raw total	10 × 3 = 30 marks
Contribution to final grade	30% of the student's final industrial attachment grade (default — customisable per department)
Normalisation	(Sum of all criterion scores ÷ 30) × 100  →  Visitation Score out of 100

4.3  Multiple Visiting Supervisors
The form supports up to three visiting supervisors per visit, each of whom must provide their name, signature, and the date of the visit. When multiple supervisors complete assessments for the same student:

•	Each supervisor submits their own set of criterion scores.
•	The system averages the scores across all supervisors to produce a single Visitation Score out of 100 for the student.

⚠  Decision needed: If multiple supervisors score the same student, should their scores be averaged equally, or should one supervisor's score take precedence?

5.  Student Rows
The score sheet is designed to capture assessments for multiple students in a single form — one row per student. The original paper form accommodates up to 12 students per sheet. In the system, this will be dynamic:

•	Each student assigned to the visiting supervisor's group will appear as a row.
•	The supervisor fills in criterion scores (0–3) for each student in the corresponding columns.
•	The system auto-calculates the total row score as the supervisor enters individual criterion scores.
•	Students are identified by name and student ID, pre-populated by the system from the enrolment records.

Column	Source	Notes
S/N	Auto-generated	Sequential row number. Pre-filled by the system.
Student Name	Pre-filled	Pulled from the student's enrolment record. The supervisor does not type this.
TR — ULB	Entered by supervisor	One column per criterion. Supervisor enters a score of 0, 1, 2, or 3.
Total Score	Auto-calculated	System sums the 10 criterion scores and displays the total out of 30. The supervisor cannot edit this field directly.

6.  Supervisor Sign-Off
At the bottom of the form, up to three visiting supervisors provide their formal sign-off. Each supervisor's sign-off block contains the following fields:

•	Name of Visiting Supervisor — full name of the supervisor who conducted the visit.
•	Signature — captured as a digital signature or acknowledged in the system with a confirmation action.
•	Date — the date on which the visit took place and the form was signed.

⚠  Decision needed: Should the system support a digital signature capture on the form, or should supervisor sign-off be handled through a system-level action (e.g. a 'Submit & Confirm' button that logs the user's identity and timestamp)?

7.  Integration with the Grading System
The Academic Visitation Score Sheet feeds directly into the department's configured grading structure. Once the visiting supervisor submits the form, the system processes the scores as follows:

Step	Action	Detail
1	Raw scores collected	Supervisor enters criterion scores (0–3) for each student. System validates all entries are within range.
2	Total calculated	System sums the 10 criterion scores per student → raw total out of 30.
3	Normalised to 100	(Raw total ÷ 30) × 100 → Visitation Score out of 100. This is the score passed to the DLO.
4	Weight applied	The DLO's department grading configuration determines what percentage (W2%) this score contributes to the final grade. Default is 30%.
5	Final grade contribution	Visitation Score × W2% → added to the other weighted components to produce the student's final percentage out of 100.

Grading Structure Compatibility
The Visitation Score is the W2 component in all four grading structures (A, B, C, and D). It is always present regardless of which structure the department selects. Its weight (W2%) is set by the DLO or CLO during the department's grading configuration.

8.  System Behaviour & Validation Rules
The following rules govern how the system handles the Academic Visitation Score Sheet:

1.	Only users with the Departmental Supervisor (Visiting Supervisor) role may submit this form.
2.	All ten criterion scores must be entered before the form can be submitted. Partial submissions are not allowed.
3.	Each criterion score must be a whole number between 0 and 3 inclusive. The system rejects values outside this range.
4.	The Total Score column is read-only and auto-calculated by the system — it cannot be manually entered or overridden.
5.	Once submitted, the form is locked. Amendments require a CLO or DLO override action, which is logged in the audit trail.
6.	The system timestamps the submission and records the identity of the submitting supervisor.
7.	A student must have an active semestrial attachment record for the current term before they can appear on the score sheet.
8.	If multiple supervisors visit and score the same student, all submissions are retained and the system averages the normalised scores.

9.  Open Decisions — Sign-Off Required
The following decisions relate specifically to this form and must be confirmed before implementation.

#	Decision	Options / Notes
V-1	Scoring rubric per criterion	Should the system show descriptors (Outstanding / Satisfactory / Weak / Unsatisfactory) alongside each score, or should the supervisor enter a free number (0–3)?
V-2	Multiple supervisor score aggregation	When more than one supervisor scores the same student, should scores be averaged equally, or should a lead supervisor's score take precedence?
V-3	Supervisor sign-off method	Digital signature capture on the form, or a system-level 'Submit & Confirm' action that logs the user's identity and timestamp?
V-4	Score amendment process	If a submitted score needs to be corrected, who can authorise the amendment — DLO only, or CLO and DLO?
V-5	Visibility of scores	Once submitted, can the student view their visitation scores, or are they visible only to the DLO and supervisors?

Once all 5 decisions above are signed off, this specification will be finalised and the Academic Visitation form features will be added to the main Feature List document.


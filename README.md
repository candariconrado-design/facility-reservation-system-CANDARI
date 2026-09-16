
# Facility Reservation and Service Request Management System

## Roles & Permissions Matrix
| Role            | Manage Facilities | Approve/Reject | Submit Request | View Own History | Update Status (In Use/Completed) | View Audit Logs |
|-----------------|-------------------|----------------|----------------|------------------|----------------------------------|-----------------|
| Administrator   | Yes               | Yes            | No             | Yes              | Yes                              | Yes             |
| Facility Staff  | No                | No             | No             | Yes              | Yes                              | No              |
| Requester       | No                | No             | Yes            | Yes (own only)   | No                               | No              |

## Reservation Workflow
Submitted → Pending → Administrator Review → Approved (→ Scheduled) / Rejected  
Approved → Scheduled → In Use → Completed  
Also supports: Cancelled

## Business Rules Implemented
- BR-B4-01: Only Active facilities may be reserved
- BR-B4-02: Start time must be before end time
- BR-B4-03: No overlapping approved schedules
- BR-B4-04: Only Administrator can approve
- BR-B4-05: Rejected cannot become Scheduled
- BR-B4-06: Approved locks the time slot
- BR-B4-07: Completed cannot be edited
- BR-B4-08: Facilities under Maintenance cannot be reserved
- BR-B4-09: Requesters can modify only their own Pending requests
- BR-B4-10: Approval and status changes are logged

## Audit Trail
All submissions, approvals, rejections, cancellations, and status changes are recorded in `audit_logs`.

Live Demo

https://candariconrado-design.github.io/facility-reservation-system-CANDARI/

dungagi ni og katong mga facility staff, requester og administrator

adminitrator: pacheco+test@gmail.com pass: tj2006
requester: jb@gmail.com pass: jb12345
facility staff: staff12345

database password: EEEdTgyNFLMNgowu    
Project URL:

https://rzhekchxyvdjznurwydm.supabase.co

Anon Key:

eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ6aGVrY2h4eXZkanpudXJ3eWRtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk0OTQ0NTcsImV4cCI6MjEwNTA3MDQ1N30.caSpf48XzjSjXTa-cW1ArMQk3zDQNTp81xLo9r7F-UM


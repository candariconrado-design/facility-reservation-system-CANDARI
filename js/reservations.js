let currentUser = null;
let currentRole = null;

async function initReservationsPage() {
  const { data: { user } } = await supabaseClient.auth.getUser();
  if (!user) {
    window.location.href = 'login.html';
    return;
  }
  currentUser = user;

  const { data: profile } = await supabaseClient
    .from('profiles')
    .select('full_name, role')
    .eq('id', user.id)
    .single();

  if (profile) {
    currentRole = profile.role;
    document.getElementById('userName').textContent = profile.full_name || user.email;
    document.getElementById('userRole').textContent = profile.role;

    // Show request form only for Requester
    if (profile.role === 'Requester') {
      document.getElementById('requestSection').style.display = 'block';
      loadFacilitiesDropdown();
    }
  }

  loadReservations();
}

async function loadFacilitiesDropdown() {
  // Only Active facilities
  const { data: facilities } = await supabaseClient
    .from('facilities')
    .select('id, name, status')
    .eq('status', 'Active')
    .order('name');

  const select = document.getElementById('facilitySelect');
  select.innerHTML = '<option value="">Select Facility</option>';

  if (facilities && facilities.length > 0) {
    facilities.forEach(f => {
      select.innerHTML += `<option value="${f.id}">${f.name}</option>`;
    });
  } else {
    select.innerHTML = '<option value="">No active facilities available</option>';
  }
}

async function loadReservations() {
  let query = supabaseClient
    .from('reservations')
    .select(`
      *,
      facilities (name, status),
      profiles (full_name)
    `)
    .order('created_at', { ascending: false });

  // Requester only sees their own
  if (currentRole === 'Requester') {
    query = query.eq('requester_id', currentUser.id);
  }

  const { data: reservations, error } = await query;

  const listDiv = document.getElementById('reservationsList');

  if (error) {
    listDiv.innerHTML = `<p style="color:red;">Error: ${error.message}</p>`;
    return;
  }

  if (!reservations || reservations.length === 0) {
    listDiv.innerHTML = '<p>No reservations found.</p>';
    return;
  }

  let html = `
    <table>
      <thead>
        <tr>
          <th>Facility</th>
          <th>Requester</th>
          <th>Start</th>
          <th>End</th>
          <th>Purpose</th>
          <th>Status</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
  `;

  reservations.forEach(r => {
    const start = new Date(r.start_time).toLocaleString();
    const end = new Date(r.end_time).toLocaleString();

    let actions = '-';

    // Admin can Approve / Reject
    if (currentRole === 'Administrator' && r.status === 'Pending') {
      actions = `
        <button class="btn btn-approve" onclick="updateStatus('${r.id}', 'Approved')">Approve</button>
        <button class="btn btn-reject" onclick="updateStatus('${r.id}', 'Rejected')">Reject</button>
      `;
    }

    // Requester can Cancel own Pending
    if (currentRole === 'Requester' && r.status === 'Pending' && r.requester_id === currentUser.id) {
      actions = `<button class="btn btn-cancel" onclick="updateStatus('${r.id}', 'Cancelled')">Cancel</button>`;
    }

    // Staff actions
    if (currentRole === 'Facility Staff') {
      if (r.status === 'Approved' || r.status === 'Scheduled') {
        actions = `<button class="btn btn-approve" onclick="updateStatus('${r.id}', 'In Use')">Mark In Use</button>`;
      }
      if (r.status === 'In Use') {
        actions = `<button class="btn btn-approve" onclick="updateStatus('${r.id}', 'Completed')">Mark Completed</button>`;
      }
    }

    html += `
      <tr>
        <td>${r.facilities?.name || '-'}</td>
        <td>${r.profiles?.full_name || '-'}</td>
        <td>${start}</td>
        <td>${end}</td>
        <td>${r.purpose || '-'}</td>
        <td class="status-${r.status}">${r.status}</td>
        <td>${actions}</td>
      </tr>
    `;
  });

  html += `</tbody></table>`;
  listDiv.innerHTML = html;
}

// Submit Reservation
const reservationForm = document.getElementById('reservationForm');
if (reservationForm) {
  reservationForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const facility_id = document.getElementById('facilitySelect').value;
    const start_time = document.getElementById('startTime').value;
    const end_time = document.getElementById('endTime').value;
    const purpose = document.getElementById('purpose').value;

    // Start must be before End
    if (new Date(start_time) >= new Date(end_time)) {
      alert('Start time must be before End time');
      return;
    }

    // Check facility is Active
    const { data: facility } = await supabaseClient
      .from('facilities')
      .select('status')
      .eq('id', facility_id)
      .single();

    if (!facility || facility.status !== 'Active') {
      alert('This facility is under Maintenance or not available');
      return;
    }

    // Conflict checking
    const { data: conflicts } = await supabaseClient
      .from('reservations')
      .select('id')
      .eq('facility_id', facility_id)
      .in('status', ['Approved', 'Scheduled', 'In Use'])
      .lt('start_time', end_time)
      .gt('end_time', start_time);

    if (conflicts && conflicts.length > 0) {
      alert('Schedule conflict! This time slot is already reserved.');
      return;
    }

    // Insert reservation
    const { data: newRes, error } = await supabaseClient
      .from('reservations')
      .insert([{
        facility_id,
        requester_id: currentUser.id,
        start_time,
        end_time,
        purpose,
        status: 'Pending'
      }])
      .select()
      .single();

    if (error) {
      alert('Error: ' + error.message);
      return;
    }

    // Audit log
    await supabaseClient.from('audit_logs').insert([{
      user_id: currentUser.id,
      action: 'Reservation Submitted',
      table_name: 'reservations',
      record_id: newRes.id,
      new_data: { status: 'Pending', purpose }
    }]);

    alert('Reservation submitted successfully!');
    reservationForm.reset();
    loadReservations();
  });
}

// Update Status
async function updateStatus(id, newStatus) {
  const { data: current } = await supabaseClient
    .from('reservations')
    .select('*')
    .eq('id', id)
    .single();

  if (!current) {
    alert('Reservation not found');
    return;
  }

  // Rejected cannot be approved
  if (current.status === 'Rejected' && (newStatus === 'Approved' || newStatus === 'Scheduled')) {
    alert('Rejected reservations cannot be approved');
    return;
  }

  // Completed cannot be edited
  if (current.status === 'Completed') {
    alert('Completed reservations cannot be edited');
    return;
  }

  // Only Admin can approve/reject
  if ((newStatus === 'Approved' || newStatus === 'Rejected') && currentRole !== 'Administrator') {
    alert('Only Administrator can approve or reject');
    return;
  }

  // When Approved → set to Scheduled
  let finalStatus = newStatus;
  if (newStatus === 'Approved') {
    finalStatus = 'Scheduled';
  }

  const { error } = await supabaseClient
    .from('reservations')
    .update({
      status: finalStatus,
      updated_at: new Date().toISOString()
    })
    .eq('id', id);

  if (error) {
    alert('Error: ' + error.message);
    return;
  }

  // Audit log
  await supabaseClient.from('audit_logs').insert([{
    user_id: currentUser.id,
    action: `Status changed from ${current.status} to ${finalStatus}`,
    table_name: 'reservations',
    record_id: id,
    old_data: { status: current.status },
    new_data: { status: finalStatus }
  }]);

  alert(`Status updated to ${finalStatus}`);
  loadReservations();
}

initReservationsPage();
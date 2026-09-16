async function loadFacilities() {
  const { data: facilities, error } = await supabaseClient
    .from('facilities')
    .select('*')
    .order('name');

  const listDiv = document.getElementById('facilitiesList');

  if (error) {
    listDiv.innerHTML = '<p style="color:red;">Error loading facilities</p>';
    return;
  }

  if (!facilities || facilities.length === 0) {
    listDiv.innerHTML = '<p>No facilities yet.</p>';
    return;
  }

  let html = `
    <table>
      <thead>
        <tr>
          <th>Name</th>
          <th>Description</th>
          <th>Capacity</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
  `;

  facilities.forEach(f => {
    html += `
      <tr>
        <td>${f.name}</td>
        <td>${f.description || '-'}</td>
        <td>${f.capacity || '-'}</td>
        <td class="status-${f.status}">${f.status}</td>
      </tr>
    `;
  });

  html += `</tbody></table>`;
  listDiv.innerHTML = html;
}

// Add Facility (Admin only)
const addForm = document.getElementById('addFacilityForm');
if (addForm) {
  addForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = document.getElementById('facilityName').value;
    const description = document.getElementById('facilityDesc').value;
    const capacity = document.getElementById('facilityCapacity').value;
    const status = document.getElementById('facilityStatus').value;

    const { error } = await supabaseClient
      .from('facilities')
      .insert([{ name, description, capacity, status }]);

    if (error) {
      alert('Error: ' + error.message);
    } else {
      alert('Facility added successfully!');
      addForm.reset();
      loadFacilities();
    }
  });
}

// Check role and show admin section
async function initFacilitiesPage() {
  const { data: { user } } = await supabaseClient.auth.getUser();
  if (!user) {
    window.location.href = 'login.html';
    return;
  }

  const { data: profile } = await supabaseClient
    .from('profiles')
    .select('full_name, role')
    .eq('id', user.id)
    .single();

  if (profile) {
    document.getElementById('userName').textContent = profile.full_name;
    document.getElementById('userRole').textContent = profile.role;

    if (profile.role === 'Administrator') {
      document.getElementById('adminSection').style.display = 'block';
    }
  }

  loadFacilities();
}

initFacilitiesPage();
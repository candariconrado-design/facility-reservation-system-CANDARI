async function initAuditPage() {
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

  if (!profile || profile.role !== 'Administrator') {
    alert('Only Administrator can view Audit Logs');
    window.location.href = 'index.html';
    return;
  }

  document.getElementById('userName').textContent = profile.full_name;
  document.getElementById('userRole').textContent = profile.role;

  loadAuditLogs();
}

async function loadAuditLogs() {
  const { data: logs, error } = await supabaseClient
    .from('audit_logs')
    .select(`
      *,
      profiles (full_name)
    `)
    .order('created_at', { ascending: false })
    .limit(50);

  const listDiv = document.getElementById('logsList');

  if (error) {
    listDiv.innerHTML = `<p style="color:red;">Error: ${error.message}</p>`;
    return;
  }

  if (!logs || logs.length === 0) {
    listDiv.innerHTML = '<p>No audit logs yet.</p>';
    return;
  }

  let html = `
    <table>
      <thead>
        <tr>
          <th>Date/Time</th>
          <th>User</th>
          <th>Action</th>
          <th>Table</th>
          <th>Record ID</th>
        </tr>
      </thead>
      <tbody>
  `;

  logs.forEach(log => {
    const date = new Date(log.created_at).toLocaleString();
    html += `
      <tr>
        <td>${date}</td>
        <td>${log.profiles?.full_name || log.user_id || '-'}</td>
        <td>${log.action}</td>
        <td>${log.table_name || '-'}</td>
        <td>${log.record_id ? log.record_id.substring(0, 8) + '...' : '-'}</td>
      </tr>
    `;
  });

  html += `</tbody></table>`;
  listDiv.innerHTML = html;
}

initAuditPage();
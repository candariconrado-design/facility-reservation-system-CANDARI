// Register
const registerForm = document.getElementById('registerForm');
if (registerForm) {
  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const fullName = document.getElementById('fullName').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const message = document.getElementById('message');

    const { data, error } = await supabaseClient.auth.signUp({
      email: email,
      password: password,
      options: {
        data: {
          full_name: fullName
        }
      }
    });

    if (error) {
      message.style.color = 'red';
      message.textContent = error.message;
    } else {
      message.style.color = 'green';
      message.textContent = 'Registration successful! Please check your email or go to Login.';
      registerForm.reset();
    }
  });
}

// Login
const loginForm = document.getElementById('loginForm');
if (loginForm) {
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const message = document.getElementById('message');

    const { data, error } = await supabaseClient.auth.signInWithPassword({
      email: email,
      password: password
    });

    if (error) {
      message.style.color = 'red';
      message.textContent = error.message;
    } else {
      window.location.href = 'index.html';
    }
  });
}

// Check current user (for index.html)
async function checkUser() {
  const { data: { user } } = await supabaseClient.auth.getUser();

  if (!user) {
    window.location.href = 'login.html';
    return;
  }

  // Get profile + role
  const { data: profile } = await supabaseClient
    .from('profiles')
    .select('full_name, role')
    .eq('id', user.id)
    .single();

  if (profile) {
    document.getElementById('userName').textContent = profile.full_name || user.email;
    document.getElementById('userRole').textContent = profile.role;
  }
}

// Logout
async function logout() {
  await supabaseClient.auth.signOut();
  window.location.href = 'login.html';
}
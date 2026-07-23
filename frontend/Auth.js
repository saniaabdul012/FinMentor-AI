/* auth.js — mock login/signup for the FinMentor AI prototype
   NOTE: This uses localStorage to simulate an account system.
   It is NOT secure and is for demo/prototype purposes only —
   swap in a real backend (e.g. Supabase/Firebase auth) for production. */

function switchAuthTab(tab){
  document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active'));
  document.getElementById('tab-' + tab).classList.add('active');
  document.getElementById('form-' + tab).classList.add('active');
  hideAlert();
}

function showFieldError(fieldId, message){
  const field = document.getElementById(fieldId).closest('.auth-field');
  field.classList.add('invalid');
  field.querySelector('.err').innerText = message;
}
function clearFieldError(fieldId){
  const field = document.getElementById(fieldId).closest('.auth-field');
  field.classList.remove('invalid');
}
function clearAllErrors(formId){
  document.querySelectorAll('#' + formId + ' .auth-field').forEach(f => f.classList.remove('invalid'));
}

function showAlert(msg){
  const el = document.getElementById('authAlert');
  el.innerText = msg;
  el.classList.add('show');
}
function hideAlert(){
  document.getElementById('authAlert').classList.remove('show');
}

function isValidEmail(email){
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function getUsers(){
  return JSON.parse(localStorage.getItem('finmentor_users') || '{}');
}
function saveUsers(users){
  localStorage.setItem('finmentor_users', JSON.stringify(users));
}

/* ---------- SIGN UP ---------- */
function handleSignup(e){
  e.preventDefault();
  clearAllErrors('form-signup');

  const name = document.getElementById('suName').value.trim();
  const email = document.getElementById('suEmail').value.trim().toLowerCase();
  const pass = document.getElementById('suPass').value;
  const confirm = document.getElementById('suConfirm').value;

  let valid = true;
  if(name.length < 2){ showFieldError('suName', 'Enter your full name.'); valid = false; }
  if(!isValidEmail(email)){ showFieldError('suEmail', 'Enter a valid email address.'); valid = false; }
  if(pass.length < 6){ showFieldError('suPass', 'Password must be at least 6 characters.'); valid = false; }
  if(confirm !== pass){ showFieldError('suConfirm', 'Passwords do not match.'); valid = false; }

  const users = getUsers();
  if(valid && users[email]){
    showFieldError('suEmail', 'An account with this email already exists.');
    valid = false;
  }
  if(!valid) return;

  users[email] = { name, password: pass };
  saveUsers(users);
  localStorage.setItem('finmentor_session', email);

  showAlert(`Account created — welcome, ${name}! Redirecting...`);
  setTimeout(() => { window.location.href = 'index.html'; }, 900);
}

/* ---------- LOGIN ---------- */
function handleLogin(e){
  e.preventDefault();
  clearAllErrors('form-login');

  const email = document.getElementById('liEmail').value.trim().toLowerCase();
  const pass = document.getElementById('liPass').value;

  let valid = true;
  if(!isValidEmail(email)){ showFieldError('liEmail', 'Enter a valid email address.'); valid = false; }
  if(pass.length === 0){ showFieldError('liPass', 'Enter your password.'); valid = false; }
  if(!valid) return;

  const users = getUsers();
  const user = users[email];
  if(!user || user.password !== pass){
    showFieldError('liPass', 'Incorrect email or password.');
    return;
  }

  localStorage.setItem('finmentor_session', email);
  showAlert(`Welcome back, ${user.name}! Redirecting...`);
  setTimeout(() => { window.location.href = 'index.html'; }, 700);
}

/* Clear individual field errors as the person types */
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.auth-field input').forEach(input => {
    input.addEventListener('input', () => clearFieldError(input.id));
  });
});
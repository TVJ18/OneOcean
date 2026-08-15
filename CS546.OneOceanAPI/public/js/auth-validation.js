// OOD-18 — client-side validation for signup & login views.
// Mirrors the server-side rules in utils/user_utils.js so users get instant
// feedback; the server (routes/auth.js + data/users.js) remains the source of truth.

(function () {
  const NAME_RE = /^[A-Za-z-]+$/;
  const CITY_RE = /^[A-Za-z-' ]+$/;
  const STATE_RE = /^[A-Za-z]{2}$/;
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const PASSWORD_RE = /^[A-Za-z0-9!@#$%^&*]{8,35}$/;

  const val = (id) => {
    const el = document.getElementById(id);
    return el ? el.value.trim() : '';
  };

  function setError(name, msg) {
    const slot = document.querySelector('[data-error-for="' + name + '"]');
    const input = document.getElementById(name);
    if (slot) slot.textContent = msg || '';
    if (input) input.classList.toggle('input-invalid', Boolean(msg));
    return !msg;
  }

  // restore gender selection when the server re-renders the form with userInputs
  const gender = document.getElementById('gender');
  if (gender && gender.dataset.selected) gender.value = gender.dataset.selected;

  const signupForm = document.getElementById('signup-form');
  if (signupForm) {
    signupForm.addEventListener('submit', (e) => {
      let ok = true;

      const nameMsg = 'Must be 2–50 characters, letters and hyphens only.';
      const first = val('firstName');
      ok = setError('firstName', first.length >= 2 && first.length <= 50 && NAME_RE.test(first) ? '' : nameMsg) && ok;
      const last = val('lastName');
      ok = setError('lastName', last.length >= 2 && last.length <= 50 && NAME_RE.test(last) ? '' : nameMsg) && ok;

      ok = setError('email', EMAIL_RE.test(val('email')) ? '' : 'Enter a valid email address.') && ok;

      ok = setError('gender', ['M', 'F', 'NB'].includes(val('gender')) ? '' : 'Select an option.') && ok;

      const age = Number(val('age'));
      ok = setError('age', Number.isFinite(age) && age > 0 ? '' : 'Enter a valid age.') && ok;

      const city = val('city');
      ok = setError('city', city.length >= 2 && city.length <= 50 && CITY_RE.test(city) ? '' : 'Must be 2–50 characters, letters only.') && ok;

      ok = setError('state', STATE_RE.test(val('state')) ? '' : 'Use a 2-letter state code, e.g. CA.') && ok;

      const pwEl = document.getElementById('password');
      const pw = pwEl ? pwEl.value.trim() : '';
      ok = setError('password', PASSWORD_RE.test(pw) ? '' : '8–35 characters; letters, numbers, and ! @ # $ % ^ & * only.') && ok;

      const confirmEl = document.getElementById('confirmPassword');
      const confirm = confirmEl ? confirmEl.value.trim() : '';
      ok = setError('confirmPassword', pw === confirm ? '' : 'Passwords do not match.') && ok;

      if (!ok) e.preventDefault();
    });
  }

  const loginForm = document.getElementById('login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
      let ok = true;
      ok = setError('email', EMAIL_RE.test(val('email')) ? '' : 'Enter a valid email address.') && ok;
      ok = setError('password', val('password') ? '' : 'Enter your password.') && ok;
      if (!ok) e.preventDefault();
    });
  }
})();

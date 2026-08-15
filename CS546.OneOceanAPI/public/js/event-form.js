(function () {
  const NAME_RE = /^[A-Za-z-,' ]+$/;
  const LOCATION_RE = /^[A-Za-z-'. ]+$/;

  const val = (id) => {
    const el = document.getElementById(id);
    return el ? el.value.trim() : '';
  };

  function setError(id, msg) {
    const slot = document.querySelector('[data-error-for="' + id + '"]');
    const input = document.getElementById(id);
    if (slot) slot.textContent = msg || '';
    if (input) input.classList.toggle('input-invalid', Boolean(msg));
    return !msg;
  }

  function toBackendDate(value) {
    const parts = value.split('-');
    return parts[1] + '/' + parts[2] + '/' + parts[0];
  }

  function toInputDate(value) {
    const parts = value.split('/');
    return parts.length === 3 ? parts[2] + '-' + parts[0] + '-' + parts[1] : '';
  }

  function toBackendTime(value) {
    let hour = parseInt(value.split(':')[0], 10);
    const minutes = value.split(':')[1];
    const suffix = hour >= 12 ? 'PM' : 'AM';
    hour = hour % 12;
    if (hour === 0) hour = 12;
    return hour + ':' + minutes + suffix;
  }

  function toInputTime(value) {
    const match = value.trim().match(/^(1[0-2]|0?[1-9]):([0-5][0-9])(AM|PM)$/);
    if (!match) return '';
    let hour = parseInt(match[1], 10);
    if (match[3] === 'PM' && hour !== 12) hour += 12;
    if (match[3] === 'AM' && hour === 12) hour = 0;
    return String(hour).padStart(2, '0') + ':' + match[2];
  }

  function restore(prefix) {
    ['eventType', 'beachId'].forEach(function (name) {
      const el = document.getElementById(prefix + name);
      if (el && el.dataset.selected) el.value = el.dataset.selected;
    });
    const dateEl = document.getElementById(prefix + 'eventDate');
    if (dateEl && dateEl.dataset.current) dateEl.value = toInputDate(dateEl.dataset.current);
    ['startTime', 'endTime'].forEach(function (name) {
      const el = document.getElementById(prefix + name);
      if (el && el.dataset.current) el.value = toInputTime(el.dataset.current);
    });
  }

  function validate(prefix, requireBeach) {
    let ok = true;

    const name = val(prefix + 'eventName');
    ok = setError(prefix + 'eventName', name.length >= 5 && name.length <= 80 && NAME_RE.test(name) ? '' : '5-80 characters; letters, hyphens, commas, apostrophes, and spaces only.') && ok;

    if (requireBeach) {
      ok = setError(prefix + 'beachId', val(prefix + 'beachId') ? '' : 'Choose a beach.') && ok;
    }
    ok = setError(prefix + 'eventType', val(prefix + 'eventType') ? '' : 'Choose a type.') && ok;
    ok = setError(prefix + 'eventDate', val(prefix + 'eventDate') ? '' : 'Pick a date.') && ok;

    const start = val(prefix + 'startTime');
    const end = val(prefix + 'endTime');
    ok = setError(prefix + 'startTime', start ? '' : 'Set a start time.') && ok;
    ok = setError(prefix + 'endTime', end && (!start || end > start) ? '' : 'End must be after start.') && ok;

    const loc = val(prefix + 'meetingLocation');
    ok = setError(prefix + 'meetingLocation', loc.length >= 5 && loc.length <= 100 && LOCATION_RE.test(loc) ? '' : '5-100 characters; letters, hyphens, apostrophes, periods, and spaces only.') && ok;

    ok = setError(prefix + 'additionalDetails', val(prefix + 'additionalDetails') ? '' : 'Add a few details for attendees.') && ok;

    return ok;
  }

  const createForm = document.getElementById('event-create-form');
  if (createForm) {
    restore('');
    createForm.addEventListener('submit', function (e) {
      if (!validate('', true)) {
        e.preventDefault();
        return;
      }
      const dateEl = document.getElementById('eventDate');
      if (dateEl.value.includes('-')) {
        const converted = toBackendDate(dateEl.value);
        dateEl.type = 'text';
        dateEl.value = converted;
      }
      ['startTime', 'endTime'].forEach(function (name) {
        const el = document.getElementById(name);
        const converted = toBackendTime(el.value);
        el.type = 'text';
        el.value = converted;
      });
    });
  }

  const editToggle = document.getElementById('edit-event-toggle');
  const editForm = document.getElementById('event-edit-form');
  if (editToggle && editForm) {
    restore('edit-');
    editToggle.addEventListener('click', function () {
      editForm.hidden = !editForm.hidden;
      if (!editForm.hidden) editForm.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });
    const closeBtn = document.getElementById('edit-event-close');
    if (closeBtn) closeBtn.addEventListener('click', function () { editForm.hidden = true; });

    editForm.addEventListener('submit', async function (e) {
      e.preventDefault();
      if (!validate('edit-', false)) return;

      const errorBanner = document.getElementById('edit-error');
      errorBanner.hidden = true;

      const body = {
        eventName: val('edit-eventName'),
        eventType: val('edit-eventType'),
        eventDate: toBackendDate(val('edit-eventDate')),
        startTime: toBackendTime(val('edit-startTime')),
        endTime: toBackendTime(val('edit-endTime')),
        meetingLocation: val('edit-meetingLocation'),
        additionalDetails: val('edit-additionalDetails')
      };

      try {
        const response = await fetch('/community/' + editForm.dataset.eventId, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        });
        if (!response.ok) {
          const data = await response.json().catch(function () { return {}; });
          errorBanner.textContent = data.error || 'Could not update event.';
          errorBanner.hidden = false;
          return;
        }
        window.location.reload();
      } catch (err) {
        errorBanner.textContent = 'Could not update event.';
        errorBanner.hidden = false;
      }
    });
  }

  const cancelBtn = document.getElementById('cancel-event-btn');
  if (cancelBtn) {
    cancelBtn.addEventListener('click', async function () {
      if (!window.confirm('Cancel this event for everyone? This cannot be undone.')) return;
      try {
        const response = await fetch('/community/' + cancelBtn.dataset.eventId, { method: 'DELETE' });
        if (!response.ok) {
          const data = await response.json().catch(function () { return {}; });
          window.alert(data.error || 'Could not cancel event.');
          return;
        }
        window.location.href = '/community';
      } catch (err) {
        window.alert('Could not cancel event.');
      }
    });
  }
})();

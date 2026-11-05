"use strict";

export function updateSubmitLabel(formIsCompleteEl, submitShelfEl) {
  if (submitShelfEl) {
    submitShelfEl.textContent = formIsCompleteEl.checked
      ? "Selesai dibaca"
      : "Belum selesai dibaca";
  }
}

export function clearBookForm(formEl, formIsCompleteEl, submitShelfEl) {
  formEl.reset();
  updateSubmitLabel(formIsCompleteEl, submitShelfEl);
}

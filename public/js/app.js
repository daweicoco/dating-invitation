import { activities, copy, timeSlots } from "./copy.js?v=20260528-english";
import { getDodgingPosition, shouldDodgePointer } from "./evasion-core.js";

const state = {
  step: "intro",
  date: "",
  timeSlot: "",
  activity: "",
  activityLabel: "",
  customActivity: "",
  personHint: "",
  note: "",
  lastSubmission: null
};

const screens = Object.fromEntries(
  [...document.querySelectorAll("[data-screen]")].map((screen) => [screen.dataset.screen, screen])
);

const elements = {
  app: document.querySelector("#invite-app"),
  stage: document.querySelector("[data-button-stage]"),
  yesButton: document.querySelector("[data-yes-button]"),
  noButton: document.querySelector("[data-no-button]"),
  noHint: document.querySelector("[data-no-hint]"),
  dateInput: document.querySelector("[data-date-input]"),
  dateNext: document.querySelector("[data-date-next]"),
  timeSlots: document.querySelector("[data-time-slots]"),
  activities: document.querySelector("[data-activities]"),
  customField: document.querySelector("[data-custom-field]"),
  customActivity: document.querySelector("[data-custom-activity]"),
  personHint: document.querySelector("[data-person-hint]"),
  note: document.querySelector("[data-note-input]"),
  submit: document.querySelector("[data-submit]"),
  status: document.querySelector("[data-status]"),
  backDate: document.querySelector("[data-back-date]"),
  receipt: document.querySelector("[data-receipt]"),
  again: document.querySelector("[data-again]")
};

function setCopy() {
  document.querySelectorAll("[data-copy]").forEach((node) => {
    const [section, key] = node.dataset.copy.split(".");
    node.textContent = copy[section][key];
  });
  elements.yesButton.textContent = copy.intro.yes;
  elements.noButton.textContent = copy.intro.no;
  elements.dateNext.textContent = copy.date.next;
  elements.customActivity.placeholder = copy.activity.customPlaceholder;
  elements.personHint.placeholder = copy.activity.identityPlaceholder;
  elements.note.placeholder = copy.activity.notePlaceholder;
  elements.backDate.textContent = copy.activity.back;
  elements.submit.textContent = copy.activity.submit;
  elements.again.textContent = copy.result.again;
}

function showScreen(name) {
  state.step = name;
  Object.entries(screens).forEach(([screenName, screen]) => {
    screen.classList.toggle("hidden", screenName !== name);
  });
}

function renderTimeSlots() {
  elements.timeSlots.innerHTML = timeSlots.map((slot) => `
    <button class="choice-card" type="button" data-time-slot="${slot.id}">
      <strong>${slot.label}</strong>
      <span>${slot.detail}</span>
    </button>
  `).join("");
}

function renderActivities() {
  elements.activities.innerHTML = activities.map((activity) => `
    <button class="choice-card" type="button" data-activity="${activity.id}" data-label="${activity.label}">
      <div class="choice-icon" aria-hidden="true">${activity.icon}</div>
      <strong>${activity.label}</strong>
      <span>${activity.detail}</span>
    </button>
  `).join("");
}

function updateDateNext() {
  elements.dateNext.disabled = !(state.date && state.timeSlot);
}

function updateSubmit() {
  const customReady = state.activity !== "custom" || elements.customActivity.value.trim();
  const hintReady = elements.personHint.value.trim();
  elements.submit.disabled = !(state.activity && customReady && hintReady);
}

function randomHint() {
  return copy.intro.noHints[Math.floor(Math.random() * copy.intro.noHints.length)];
}

function dodgeNoButton(pointer) {
  const stageRect = elements.stage.getBoundingClientRect();
  const noRect = elements.noButton.getBoundingClientRect();
  const yesRect = elements.yesButton.getBoundingClientRect();
  const current = {
    x: noRect.left - stageRect.left,
    y: noRect.top - stageRect.top
  };

  const next = getDodgingPosition({
    area: { width: stageRect.width, height: stageRect.height },
    button: { width: noRect.width, height: noRect.height },
    current,
    pointer: {
      x: pointer.clientX - stageRect.left,
      y: pointer.clientY - stageRect.top
    },
    avoidRects: [{
      x: yesRect.left - stageRect.left,
      y: yesRect.top - stageRect.top,
      width: yesRect.width,
      height: yesRect.height
    }],
    margin: 12
  });

  elements.noButton.style.left = `${next.x}px`;
  elements.noButton.style.top = `${next.y}px`;
  elements.noButton.classList.add("is-dodging");
  elements.noHint.textContent = randomHint();
  window.setTimeout(() => elements.noButton.classList.remove("is-dodging"), 180);
}

function wireNoButton() {
  elements.stage.addEventListener("pointermove", (event) => {
    const stageRect = elements.stage.getBoundingClientRect();
    const noRect = elements.noButton.getBoundingClientRect();
    const pointer = {
      x: event.clientX - stageRect.left,
      y: event.clientY - stageRect.top
    };
    const buttonRect = {
      x: noRect.left - stageRect.left,
      y: noRect.top - stageRect.top,
      width: noRect.width,
      height: noRect.height
    };

    if (shouldDodgePointer(pointer, buttonRect, 86)) {
      dodgeNoButton(event);
    }
  });

  elements.noButton.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    dodgeNoButton(event);
  });

  elements.noButton.addEventListener("click", (event) => {
    event.preventDefault();
  });
}

function renderReceipt() {
  const slot = timeSlots.find((item) => item.id === state.timeSlot);
  const activity = state.activity === "custom"
    ? elements.customActivity.value.trim()
    : state.activityLabel;

  elements.receipt.innerHTML = `
    <div><span>Date</span><strong>${state.date}</strong></div>
    <div><span>Time</span><strong>${slot?.label || state.timeSlot}</strong></div>
    <div><span>Activity</span><strong>${activity}</strong></div>
    <div><span>user</span><strong>${state.personHint}</strong></div>
    ${state.note ? `<div><span>Note</span><strong>${state.note}</strong></div>` : ""}
  `;
}

async function submitResponse() {
  elements.status.textContent = copy.submit.sending;
  elements.submit.disabled = true;
  state.customActivity = elements.customActivity.value.trim();
  state.personHint = elements.personHint.value.trim();
  state.note = elements.note.value.trim();

  const response = await fetch("/api/submit", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      date: state.date,
      timeSlot: state.timeSlot,
      activity: state.activity,
      activityLabel: state.activityLabel,
      customActivity: state.customActivity,
      personHint: state.personHint,
      note: state.note
    })
  });

  if (!response.ok) {
    throw new Error("Submit failed");
  }

  elements.status.textContent = copy.submit.success;
  renderReceipt();
  showScreen("result");
}

function wireFlow() {
  elements.yesButton.addEventListener("click", () => showScreen("date"));

  elements.dateInput.addEventListener("input", () => {
    state.date = elements.dateInput.value;
    updateDateNext();
  });

  elements.timeSlots.addEventListener("click", (event) => {
    const button = event.target.closest("[data-time-slot]");
    if (!button) return;
    state.timeSlot = button.dataset.timeSlot;
    elements.timeSlots.querySelectorAll(".choice-card").forEach((card) => {
      card.classList.toggle("is-selected", card === button);
    });
    updateDateNext();
  });

  elements.dateNext.addEventListener("click", () => showScreen("activity"));
  elements.backDate.addEventListener("click", () => showScreen("date"));

  elements.activities.addEventListener("click", (event) => {
    const button = event.target.closest("[data-activity]");
    if (!button) return;
    state.activity = button.dataset.activity;
    state.activityLabel = button.dataset.label;
    elements.activities.querySelectorAll(".choice-card").forEach((card) => {
      card.classList.toggle("is-selected", card === button);
    });
    elements.customField.classList.toggle("hidden", state.activity !== "custom");
    updateSubmit();
  });

  elements.customActivity.addEventListener("input", updateSubmit);
  elements.personHint.addEventListener("input", updateSubmit);

  elements.submit.addEventListener("click", async () => {
    try {
      await submitResponse();
    } catch {
      elements.status.textContent = copy.submit.error;
      updateSubmit();
    }
  });

  elements.again.addEventListener("click", () => showScreen("date"));
}

setCopy();
renderTimeSlots();
renderActivities();
wireNoButton();
wireFlow();

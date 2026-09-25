const titles = {
  update: "Pending update",
  explain: "Why it scored",
  audit: "History",
  data: "Recordings",
};

// Integrity probes the gate scores against itself, never a real update. They
// each game one metric by abandoning the other, so a gate that promotes one is
// broken. They belong in History, not in front of an engineer.
const CONTROLS = new Set(["Always alarm", "Never alarm"]);

let state = null;
let page = "update";

function pct(value) {
  if (value === null || value === undefined) return "n/a";
  return `${(Number(value) * 100).toFixed(1)}%`;
}

function verdictLabel(name) {
  if (name === "promote") return "Ready to promote";
  if (name === "reject") return "Rejected";
  return "Not enough evidence";
}

async function load() {
  let response = await fetch("api/state");
  if (!response.ok) response = await fetch("demo.json");
  state = await response.json();
  render();
}

function render() {
  document.querySelector("#page-title").textContent = titles[page];
  document.querySelector("#fleet-name").textContent = state.profile?.name || "ABB IRB 6660";
  document.querySelector("#incumbent").textContent = `In production: ${state.incumbent.name}`;
  document.querySelectorAll("nav button").forEach((button) => {
    button.classList.toggle("active", button.dataset.page === page);
  });
  const views = { update, data, explain, audit };
  document.querySelector("#app").innerHTML = views[page]();
  document.querySelectorAll("[data-go]").forEach((button) => {
    button.addEventListener("click", () => {
      page = button.dataset.go;
      render();
    });
  });
  document.querySelectorAll("[data-promote]").forEach((button) => {
    button.addEventListener("click", () => promote(button.dataset.promote));
  });
}

function pending() {
  const real = state.evaluations.filter((item) => !CONTROLS.has(item.candidate_name));
  return real.find((item) => item.decision.verdict === "promote") || real[0];
}

function data() {
  const profile = state.profile;
  if (!profile) return `<p class="quiet">No recordings loaded.</p>`;
  return `<section class="panel">
    <h2>${profile.name}</h2>
    <p class="quiet">Each row is one recorded pass: current, force, torque, and vibration, plus the cut settings. The label is the folder the recording came from: healthy tool, damaged tool, or a drifted axis.</p>
    <div class="stats" style="margin-top:0.8rem">
      <div class="stat"><strong>${profile.rows}</strong><span>Recordings</span></div>
      <div class="stat"><strong>${profile.failed_assets}</strong><span>Labeled faults</span></div>
      <div class="stat"><strong>${profile.held_out_failures}</strong><span>Held out for the gate</span></div>
    </div>
    <div class="stack">${(profile.issues || []).filter((issue) => issue.severity === "warn").slice(0, 4).map((issue) => `<p>${issue.message}</p>`).join("") || `<p class="quiet">No data-quality warnings on this fleet.</p>`}</div>
  </section>`;
}

function leadText(metrics) {
  if (metrics.lead_applicable === false) return "Not in this data";
  if (metrics.median_lead_hours === null || metrics.median_lead_hours === undefined) return "None";
  return `${Number(metrics.median_lead_hours).toFixed(1)}h`;
}

function statusLabel(item) {
  if (item.promoted) return "Live in production";
  if (item.decision.verdict === "promote") return "Cleared to ship";
  if (item.decision.verdict === "reject") return "Blocked by the gate";
  return "Not enough evidence";
}

function impact(label, now, next, better) {
  const body = now === next
    ? `<strong class="flat">${next}</strong>`
    : `<span class="was">${now}</span><span class="arrow">&rarr;</span><strong class="${better ? "good" : ""}">${next}</strong>`;
  return `<div class="impact-card"><span>${label}</span><div class="delta">${body}</div></div>`;
}

function update() {
  const item = pending();
  if (!item) return `<p class="quiet">No update is waiting.</p>`;
  const today = item.incumbent_metrics;
  const after = item.candidate_metrics;
  const ready = item.decision.verdict === "promote" && !item.promoted;
  const checks = item.decision.checks.map((check) => `<div class="check"><span class="tag ${check.passed ? "pass" : "fail"}">${check.passed ? "Pass" : "Fail"}</span><span>${check.detail}</span></div>`).join("");

  return `<section class="deploy">
    <div class="deploy-head">
      <div>
        <p class="verdict ${item.decision.verdict}">${statusLabel(item)}</p>
        <h2>Switch the failure alarm to ${item.candidate_name}</h2>
        <p class="quiet">${item.promoted ? `Replaced ${item.incumbent_name} on the line.` : `Replaces ${item.incumbent_name}, which is what runs on the line right now.`} Both were scored on the same ${after.failures} held-out faults, on equipment neither had seen.</p>
      </div>
      <button class="primary big" type="button" data-promote="${item.id}" ${ready ? "" : "disabled"}>${item.promoted ? "Shipped" : ready ? "Ship this update" : "Cannot ship"}</button>
    </div>
    <div class="impact">
      ${impact("Faults missed", `${today.missed_failures}/${today.failures}`, `${after.missed_failures}/${after.failures}`, after.missed_failures < today.missed_failures)}
      ${impact("False alarms", pct(today.false_alarm_rate), pct(after.false_alarm_rate), after.false_alarm_rate < today.false_alarm_rate)}
      ${impact("Warning time", leadText(today), leadText(after), false)}
    </div>
    <div class="checks">
      <h3>Gate checks, pinned before the run</h3>
      ${checks}
      <p class="note">${item.decision.summary} Shipping is refused unless every check above passes.</p>
    </div>
  </section>`;
}

function explain() {
  const item = pending();
  const explanation = item && state.explanations[item.candidate_id];
  if (!explanation) return `<p class="quiet">No explanation yet.</p>`;
  const confidence = state.confidence[item.candidate_id];
  const max = Math.max(...explanation.features.map((feature) => feature.mean_abs_shap), 0.0001);
  const bars = explanation.features.slice(0, 5).map((feature) => {
    const width = Math.max(3, (feature.mean_abs_shap / max) * 100);
    return `<div class="bar-row"><span>${feature.name.replaceAll("_", " ")}</span><div class="track"><span style="width:${width}%"></span></div><span>${feature.mean_abs_shap.toFixed(2)}</span></div>`;
  }).join("");
  const gap = confidence ? `<p class="note">Average score on fault passes: ${Number(confidence.pre_failure_mean_score).toFixed(2)}. On healthy passes: ${Number(confidence.healthy_mean_score).toFixed(2)}.</p>` : "";
  return `<section class="panel">
    <h2>What the update is reacting to</h2>
    <p class="note">${explanation.note}</p>${gap}
    <div class="bars">${bars}</div>
  </section>`;
}

function audit() {
  if (!state.audit.length) return `<p class="quiet">No verdicts yet.</p>`;
  return `<section class="panel">${state.audit.map((item) => `<article class="audit-item">
    <div class="when">${item.created_at}</div>
    <strong>${item.candidate_name}</strong>
    <span class="verdict ${item.decision.verdict}">${verdictLabel(item.decision.verdict)}</span>
    ${item.promoted ? "<span>Promoted.</span>" : ""}
    <p class="note">${item.decision.summary}</p>
  </article>`).join("")}</section>`;
}

async function promote(id) {
  try {
    const response = await fetch("/api/promote", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ evaluation_id: id }),
    });
    if (response.ok) {
      state = await response.json();
      page = "update";
      render();
      return;
    }
  } catch {
    // The public demo has no API. Promotion still updates this screen.
  }
  const item = state.evaluations.find((entry) => entry.id === id);
  if (!item || item.decision.verdict !== "promote" || item.promoted) return;
  item.promoted = true;
  state.incumbent = { ...state.incumbent, name: item.candidate_name, model_id: item.candidate_id };
  state.audit = [{ ...item, created_at: new Date().toISOString(), promoted: true }, ...state.audit];
  page = "update";
  render();
}

document.querySelectorAll("nav button").forEach((button) => {
  button.addEventListener("click", () => {
    page = button.dataset.page;
    render();
  });
});

load();

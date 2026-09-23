const rulesForm = document.querySelector("#rules-form");
const rulesNote = document.querySelector("#rules-note");
const runButton = document.querySelector("#run");

const fields = {
  min_held_out_failures: (rules) => rules.min_held_out_failures,
  max_false_alarm_rate: (rules) => (rules.max_false_alarm_rate * 100).toFixed(1),
  false_alarm_allowance: (rules) => (rules.false_alarm_allowance * 100).toFixed(1),
  min_median_lead_hours: (rules) => rules.min_median_lead_hours,
  max_lead_regression_hours: (rules) => rules.max_lead_regression_hours,
  min_lead_improvement_hours: (rules) => rules.min_lead_improvement_hours,
};

function pct(value) {
  if (value === null || value === undefined) return "n/a";
  return `${(value * 100).toFixed(1)}%`;
}
function hours(value) {
  if (value === null || value === undefined) return "n/a";
  return `${Number(value).toFixed(1)}h`;
}

function fillRules(rules) {
  for (const [name, read] of Object.entries(fields)) {
    rulesForm.elements[name].value = read(rules);
  }
}

function rulesPayload() {
  const data = new FormData(rulesForm);
  return {
    min_held_out_failures: Number(data.get("min_held_out_failures")),
    max_false_alarm_rate: Number(data.get("max_false_alarm_rate")) / 100,
    false_alarm_allowance: Number(data.get("false_alarm_allowance")) / 100,
    min_median_lead_hours: Number(data.get("min_median_lead_hours")),
    max_lead_regression_hours: Number(data.get("max_lead_regression_hours")),
    min_lead_improvement_hours: Number(data.get("min_lead_improvement_hours")),
  };
}

function render(state) {
  fillRules(state.rules);
  document.querySelector("#incumbent").textContent = `In production: ${state.incumbent.name}`;

  const transcript = document.querySelector("#transcript");
  const transcriptPanel = document.querySelector("#transcript-panel");
  transcriptPanel.hidden = state.transcript.length === 0;
  transcript.innerHTML = state.transcript.map((line) => `<li>${line}</li>`).join("");

  const profilePanel = document.querySelector("#profile-panel");
  profilePanel.hidden = !state.profile;
  if (state.profile) {
    const profile = state.profile;
    document.querySelector("#stats").innerHTML = [
      ["Compressors", profile.assets],
      ["Hours", profile.rows],
      ["Failures", profile.failed_assets],
      ["Held-out failures", profile.held_out_failures],
    ].map(([label, value]) => `<div><strong>${value}</strong><span>${label}</span></div>`).join("");
    document.querySelector("#issues").innerHTML = profile.issues
      .map((issue) => `<li class="${issue.severity}">${issue.message}</li>`)
      .join("");
  }

  const results = document.querySelector("#results-panel");
  results.hidden = state.evaluations.length === 0;
  document.querySelector("#cards").innerHTML = state.evaluations.map(card).join("");

  const explainPanel = document.querySelector("#explain-panel");
  const explainable = state.evaluations.filter((item) => state.explanations[item.candidate_id]);
  explainPanel.hidden = explainable.length === 0;
  document.querySelector("#explain").innerHTML = `<div class="explain-grid">${explainable.map((item) => explainBlock(item, state)).join("")}</div>`;

  const audit = state.audit;
  document.querySelector("#audit").innerHTML = audit.length
    ? audit.map(auditItem).join("")
    : `<p class="quiet">No verdicts yet.</p>`;

  document.querySelectorAll("[data-promote]").forEach((button) => {
    button.addEventListener("click", () => promote(button.dataset.promote));
  });
}

function card(record) {
  const verdict = record.decision.verdict;
  const candidate = record.candidate_metrics;
  const incumbent = record.incumbent_metrics;
  const rows = [
    ["Missed failures", `${candidate.missed_failures}/${candidate.failures} (${pct(candidate.missed_failure_rate)})`, `${incumbent.missed_failures}/${incumbent.failures} (${pct(incumbent.missed_failure_rate)})`],
    ["False alarms", pct(candidate.false_alarm_rate), pct(incumbent.false_alarm_rate)],
    ["Median lead", hours(candidate.median_lead_hours), hours(incumbent.median_lead_hours)],
  ];
  const canPromote = verdict === "promote" && !record.promoted;
  const label = record.promoted ? "In production" : verdict === "promote" ? "Promote into production" : "Not promoted";
  return `<article class="card">
    <header>
      <h3>${record.candidate_name}</h3>
      <span class="verdict ${verdict}">${verdict}</span>
    </header>
    <p class="summary">${record.decision.summary}</p>
    <table>
      <thead><tr><th></th><th>Candidate</th><th>Production</th></tr></thead>
      <tbody>${rows.map((row) => `<tr><th>${row[0]}</th><td>${row[1]}</td><td>${row[2]}</td></tr>`).join("")}</tbody>
    </table>
    ${record.decision.checks.map((check) => `<p class="check ${check.passed ? "pass" : "fail"}">${check.passed ? "Pass" : "Fail"}. ${check.detail}</p>`).join("")}
    <button type="button" data-promote="${record.id}" class="${verdict}" ${canPromote ? "" : "disabled"}>${label}</button>
  </article>`;
}

function explainBlock(record, state) {
  const explanation = state.explanations[record.candidate_id];
  const confidence = state.confidence[record.candidate_id];
  const max = Math.max(...explanation.features.map((feature) => feature.mean_abs_shap), 0.0001);
  const bars = explanation.features.slice(0, 5).map((feature) => {
    const width = Math.max(2, (feature.mean_abs_shap / max) * 100);
    return `<div class="bar-row"><span>${feature.name}</span><div class="bar"><span style="width:${width}%"></span></div><span>${feature.mean_abs_shap.toFixed(3)}</span></div>`;
  }).join("");
  const gap = confidence
    ? `<p class="score-gap">Mean score in the ${state.profile.horizon_hours}h before a held-out failure: ${Number(confidence.pre_failure_mean_score).toFixed(3)}. On healthy hours: ${Number(confidence.healthy_mean_score).toFixed(3)}.</p>`
    : "";
  return `<div><h3>${record.candidate_name}</h3><p class="score-gap">${explanation.note}</p>${gap}${bars}</div>`;
}

function auditItem(record) {
  const promoted = record.promoted ? " Promoted." : "";
  return `<article class="audit-item">
    <div class="when">${record.created_at} · ${record.id}</div>
    <strong>${record.candidate_name}</strong> vs ${record.incumbent_name}:
    <span class="verdict ${record.decision.verdict}">${record.decision.verdict}</span>.${promoted}
    <div>${record.decision.summary}</div>
  </article>`;
}

async function promote(id) {
  const response = await fetch("/api/promote", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ evaluation_id: id }),
  });
  const body = await response.json();
  if (!response.ok) {
    rulesNote.textContent = body.detail || "Promotion was refused.";
    return;
  }
  rulesNote.textContent = "";
  render(body);
}

rulesForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const response = await fetch("/api/rules", {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(rulesPayload()),
  });
  const body = await response.json();
  if (!response.ok) {
    rulesNote.textContent = body.detail || "Those rules are not valid.";
    return;
  }
  rulesNote.textContent = "Rules saved. Past verdicts were not changed.";
  render(body);
});

runButton.addEventListener("click", async () => {
  runButton.disabled = true;
  runButton.textContent = "Running";
  rulesNote.textContent = "";
  try {
    const saved = await fetch("/api/rules", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(rulesPayload()),
    });
    if (!saved.ok) {
      const body = await saved.json();
      rulesNote.textContent = body.detail || "Save the rules before running.";
      return;
    }
    const response = await fetch("/api/run", { method: "POST" });
    const body = await response.json();
    if (!response.ok) {
      rulesNote.textContent = body.detail || "The run failed.";
      return;
    }
    render(body);
  } finally {
    runButton.disabled = false;
    runButton.textContent = "Run the agent";
  }
});

fetch("/api/state").then((response) => response.json()).then(render);

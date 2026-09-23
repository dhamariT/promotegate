const titles = {
  overview: "Overview",
  data: "Recordings",
  models: "Models",
  gate: "Decision",
  explain: "Why it scored",
  audit: "Audit",
};

let state = null;
let page = "overview";

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
  const response = await fetch("/api/state");
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
  const views = { overview, data, models, gate, explain, audit };
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

function winner() {
  return state.evaluations.find((item) => item.decision.verdict === "promote");
}

function overview() {
  const best = winner();
  const production = best?.incumbent_metrics;
  const model = best?.candidate_metrics;
  if (!best) {
    return `<section class="hero"><div><h2>No model has earned promotion.</h2><p class="quiet">Run is loaded from the ABB recordings. Open Models to see why each one was rejected.</p></div></section>`;
  }
  return `<section class="hero">
    <div>
      <p class="verdict promote">${best.promoted ? "In production" : "Ready for production"}</p>
      <h2>${best.candidate_name} beats the vibration limit</h2>
      <p>On recordings this model had not seen, it missed ${model.missed_failures} of ${model.failures} faults. The limit already in production missed ${production.missed_failures}. False alarms were ${pct(model.false_alarm_rate)} against ${pct(production.false_alarm_rate)}.</p>
      <div class="actions">
        <button class="primary" type="button" data-promote="${best.id}" ${best.promoted ? "disabled" : ""}>${best.promoted ? "In production" : "Promote into production"}</button>
        <button class="ghost" type="button" data-go="models">Compare all models</button>
      </div>
    </div>
    <div class="stats">
      <div class="stat"><strong>${model.missed_failures}/${model.failures}</strong><span>Faults missed</span></div>
      <div class="stat"><strong>${pct(model.false_alarm_rate)}</strong><span>False alarms</span></div>
      <div class="stat"><strong>${production.missed_failures}/${production.failures}</strong><span>Missed by production</span></div>
    </div>
  </section>
  <p class="note">These are held-out passes from a real ABB IRB 6660. More passes from the line make the next comparison stricter, not looser.</p>`;
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

function models() {
  const rows = state.evaluations.map((item) => {
    const metrics = item.candidate_metrics;
    const ready = item.decision.verdict === "promote" && !item.promoted;
    return `<tr class="${item.decision.verdict === "promote" ? "winner" : ""}">
      <td>${item.candidate_name}</td>
      <td>${metrics.missed_failures}/${metrics.failures}</td>
      <td>${pct(metrics.false_alarm_rate)}</td>
      <td class="verdict ${item.decision.verdict}">${verdictLabel(item.decision.verdict)}</td>
      <td>${ready ? `<button class="primary" type="button" data-promote="${item.id}">Promote</button>` : item.promoted ? "In production" : "—"}</td>
    </tr>`;
  }).join("");
  return `<section class="panel"><table>
    <thead><tr><th>Model</th><th>Missed faults</th><th>False alarms</th><th>Gate</th><th></th></tr></thead>
    <tbody>${rows}</tbody>
  </table>
  <p class="note">Production on this comparison missed ${state.evaluations[0]?.incumbent_metrics.missed_failures ?? "—"} of ${state.evaluations[0]?.incumbent_metrics.failures ?? "—"} and false-alarmed at ${pct(state.evaluations[0]?.incumbent_metrics.false_alarm_rate)}.</p>
  </section>`;
}

function gate() {
  const best = winner() || state.evaluations[0];
  if (!best) return `<p class="quiet">No decision yet.</p>`;
  const checks = best.decision.checks.map((check) => `<div class="check"><span class="tag ${check.passed ? "pass" : "fail"}">${check.passed ? "Pass" : "Fail"}</span><span>${check.detail}</span></div>`).join("");
  const ready = best.decision.verdict === "promote" && !best.promoted;
  return `<section class="panel">
    <p class="verdict ${best.decision.verdict}">${verdictLabel(best.decision.verdict)}</p>
    <h2 style="margin-top:0.3rem">${best.candidate_name}</h2>
    <p class="quiet" style="margin:0.4rem 0 0.6rem">${best.decision.summary}</p>
    ${checks}
    <div class="actions"><button class="primary" type="button" data-promote="${best.id}" ${ready ? "" : "disabled"}>${best.promoted ? "In production" : ready ? "Promote into production" : "Not promoted"}</button></div>
  </section>`;
}

function explain() {
  const blocks = state.evaluations.filter((item) => state.explanations[item.candidate_id]).map((item) => {
    const explanation = state.explanations[item.candidate_id];
    const confidence = state.confidence[item.candidate_id];
    const max = Math.max(...explanation.features.map((feature) => feature.mean_abs_shap), 0.0001);
    const bars = explanation.features.slice(0, 5).map((feature) => {
      const width = Math.max(3, (feature.mean_abs_shap / max) * 100);
      return `<div class="bar-row"><span>${feature.name.replaceAll("_", " ")}</span><div class="track"><span style="width:${width}%"></span></div><span>${feature.mean_abs_shap.toFixed(2)}</span></div>`;
    }).join("");
    const gap = confidence ? `<p class="note">Average score on fault passes: ${Number(confidence.pre_failure_mean_score).toFixed(2)}. On healthy passes: ${Number(confidence.healthy_mean_score).toFixed(2)}.</p>` : "";
    return `<section class="panel"><h2>${item.candidate_name}</h2><p class="note">${explanation.note}</p>${gap}<div class="bars">${bars}</div></section>`;
  }).join("");
  return `<div class="stack">${blocks || `<p class="quiet">No explanation yet.</p>`}</div>`;
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
  const response = await fetch("/api/promote", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ evaluation_id: id }),
  });
  const body = await response.json();
  if (!response.ok) return;
  state = body;
  page = "overview";
  render();
}

document.querySelectorAll("nav button").forEach((button) => {
  button.addEventListener("click", () => {
    page = button.dataset.page;
    render();
  });
});

load();

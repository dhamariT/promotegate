const titles = {
  overview: "Overview",
  data: "Recordings",
  models: "The change",
  gate: "Decision",
  explain: "Why it scored",
  audit: "Audit",
};

// Controls, not candidates. They exist to prove the gate refuses a model that
// wins one metric by abandoning the other. Nobody would ever ship these.
const CONTROLS = new Set(["Always alarm", "Never alarm"]);

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
    return `<section class="hero"><div><h2>No change has earned production.</h2><p class="quiet">Run is loaded from the ABB recordings. Open The change to see why every proposal was refused.</p></div></section>`;
  }
  return `<section class="hero">
    <div>
      <p class="verdict promote">${best.promoted ? "Shipped" : "Safe to ship"}</p>
      <h2>Swapping ${best.incumbent_name} for ${best.candidate_name} is the safer alarm</h2>
      <p>On recordings neither one had seen, the change misses ${model.missed_failures} of ${model.failures} faults where production misses ${production.missed_failures}, and false-alarms at ${pct(model.false_alarm_rate)} against ${pct(production.false_alarm_rate)}. That is what earned it promotion, not its training score.</p>
      <div class="actions">
        <button class="primary" type="button" data-promote="${best.id}" ${best.promoted ? "disabled" : ""}>${best.promoted ? "In production" : "Ship this change"}</button>
        <button class="ghost" type="button" data-go="models">See the change</button>
      </div>
    </div>
    <div class="stats">
      <div class="stat"><strong>${production.missed_failures}/${production.failures}</strong><span>Faults missed today</span></div>
      <div class="stat"><strong>${model.missed_failures}/${model.failures}</strong><span>Missed after the change</span></div>
      <div class="stat"><strong>${pct(model.false_alarm_rate)}</strong><span>False alarms after</span></div>
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

function leadText(metrics) {
  if (metrics.lead_applicable === false) return "Not in this data";
  if (metrics.median_lead_hours === null || metrics.median_lead_hours === undefined) return "None";
  return `${Number(metrics.median_lead_hours).toFixed(1)}h`;
}

function models() {
  const proposal = winner() || state.evaluations.find((item) => !CONTROLS.has(item.candidate_name));
  if (!proposal) return `<p class="quiet">No change has been proposed.</p>`;
  const today = proposal.incumbent_metrics;
  const after = proposal.candidate_metrics;
  const ready = proposal.decision.verdict === "promote" && !proposal.promoted;

  const row = (label, now, next) =>
    `<tr><td>${label}</td><td class="quiet">${now}</td><td>${next}</td></tr>`;

  const rest = state.evaluations.filter((item) => item.id !== proposal.id).map((item) => {
    const metrics = item.candidate_metrics;
    const control = CONTROLS.has(item.candidate_name);
    return `<tr>
      <td>${item.candidate_name}${control ? ` <span class="control-tag">control</span>` : ""}</td>
      <td>${metrics.missed_failures}/${metrics.failures}</td>
      <td>${pct(metrics.false_alarm_rate)}</td>
      <td class="verdict ${item.decision.verdict}">${verdictLabel(item.decision.verdict)}</td>
    </tr>`;
  }).join("");

  return `<section class="panel">
    <p class="verdict ${proposal.decision.verdict}">${verdictLabel(proposal.decision.verdict)}</p>
    <h2 style="margin-top:0.3rem">Replace ${proposal.incumbent_name} with ${proposal.candidate_name}</h2>
    <p class="quiet" style="margin:0.4rem 0 0.9rem">This is the change being judged, not a ranking. Both were scored on the same ${after.failures} held-out faults. Production stays exactly where it is unless the change clears every pinned rule.</p>
    <table>
      <thead><tr><th>On held-out faults</th><th>Production today</th><th>After this change</th></tr></thead>
      <tbody>
        ${row("Faults missed", `${today.missed_failures}/${today.failures}`, `${after.missed_failures}/${after.failures}`)}
        ${row("False alarms", pct(today.false_alarm_rate), pct(after.false_alarm_rate))}
        ${row("Warning time", leadText(today), leadText(after))}
      </tbody>
    </table>
    <div class="actions">
      <button class="primary" type="button" data-promote="${proposal.id}" ${ready ? "" : "disabled"}>${proposal.promoted ? "Shipped" : ready ? "Ship this change" : "Not promoted"}</button>
      <button class="ghost" type="button" data-go="gate">Why the gate allowed it</button>
    </div>
  </section>
  <section class="panel">
    <h2>Also evaluated, not shipped</h2>
    <p class="quiet" style="margin:0.4rem 0 0.9rem">None of these earned the change. The two marked as controls exist to attack the gate: each games one metric by abandoning the other, and a gate worth trusting has to refuse them.</p>
    <table>
      <thead><tr><th>Model</th><th>Faults missed</th><th>False alarms</th><th>Gate</th></tr></thead>
      <tbody>${rest}</tbody>
    </table>
  </section>`;
}

function gate() {
  const best = winner() || state.evaluations[0];
  if (!best) return `<p class="quiet">No decision yet.</p>`;
  const checks = best.decision.checks.map((check) => `<div class="check"><span class="tag ${check.passed ? "pass" : "fail"}">${check.passed ? "Pass" : "Fail"}</span><span>${check.detail}</span></div>`).join("");
  const ready = best.decision.verdict === "promote" && !best.promoted;
  return `<section class="panel">
    <p class="verdict ${best.decision.verdict}">${verdictLabel(best.decision.verdict)}</p>
    <h2 style="margin-top:0.3rem">Replace ${best.incumbent_name} with ${best.candidate_name}</h2>
    <p class="quiet" style="margin:0.4rem 0 0.6rem">Every rule below was pinned before the run. ${best.decision.summary}</p>
    ${checks}
    <div class="actions"><button class="primary" type="button" data-promote="${best.id}" ${ready ? "" : "disabled"}>${best.promoted ? "In production" : ready ? "Ship this change" : "Not promoted"}</button></div>
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
  try {
    const response = await fetch("/api/promote", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ evaluation_id: id }),
    });
    if (response.ok) {
      state = await response.json();
      page = "overview";
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

const pptxgen = require("pptxgenjs");
const pres = new pptxgen();
pres.defineLayout({ name: "WIDE", width: 13.333, height: 7.5 });
pres.layout = "WIDE";
pres.author = "Dhamari Trice-Hanson";
pres.title = "PromoteGate";
pres.subject = "ABB Accelerator 2026 — where this is used";

const ink = "1A1916";
const cream = "F6F4F0";
const white = "FFFCF8";
const oxide = "9A3B16";
const green = "1B6B43";
const red = "8D2E2E";
const muted = "5C564E";
const dark = "211E1A";
const line = "E4DDD2";
const head = "Georgia";
const body = "Trebuchet MS";

function addFooter(slide, n, onDark) {
  const color = onDark ? "8A8178" : "8A8178";
  slide.addText("PromoteGate   ·   ABB Accelerator 2026", {
    x: 0.55, y: 7.12, w: 9.2, h: 0.24,
    fontFace: body, fontSize: 12, color, margin: 0,
  });
  slide.addText(String(n), {
    x: 11.5, y: 7.12, w: 1.25, h: 0.24,
    fontFace: body, fontSize: 12, color, align: "right", margin: 0,
  });
}

function card(slide, x, y, w, h, fill) {
  slide.addShape(pres.shapes.ROUNDED_RECTANGLE, {
    x, y, w, h,
    fill: { color: fill },
    line: { color: fill === white ? line : fill, width: 1 },
    rectRadius: 0.08,
  });
}

// 1. What it is, and who it is for
{
  const s = pres.addSlide();
  s.background = { color: dark };
  s.addText("ABB ACCELERATOR 2026", {
    x: 0.7, y: 1.35, w: 11, h: 0.3,
    fontFace: body, fontSize: 13, color: "E7B59A", charSpacing: 1.6, margin: 0,
  });
  s.addText("PromoteGate", {
    x: 0.7, y: 1.8, w: 11.5, h: 0.95,
    fontFace: head, fontSize: 60, color: "F6F4F0", margin: 0,
  });
  s.addText("Before a new failure model is allowed to watch\nthe robot, it has to beat the one already there.", {
    x: 0.7, y: 3.0, w: 11, h: 1.25,
    fontFace: head, fontSize: 26, color: "E7E1D8", margin: 0,
  });
  s.addText("For the maintenance lead on an ABB cell.\nTheme 1  ·  Agentic predictive maintenance", {
    x: 0.7, y: 5.85, w: 10, h: 0.7,
    fontFace: body, fontSize: 16, color: "B7AEA3", margin: 0,
  });
}

// 2. Where it applies — one Monday
{
  const s = pres.addSlide();
  s.background = { color: cream };
  s.addText("Monday, before the shift starts.", {
    x: 0.55, y: 0.38, w: 12.2, h: 0.58,
    fontFace: head, fontSize: 34, color: ink, margin: 0,
  });
  s.addText("An IRB has been cutting the same job. A new model trained on those logs overnight. The lead has one question: is it safer than the rule already watching the arm?", {
    x: 0.55, y: 1.08, w: 12.2, h: 0.78,
    fontFace: body, fontSize: 18, color: muted, margin: 0,
  });

  const steps = [
    ["1", "The robot already\nlogged the shift", "Current, force, torque, and vibration, saved with the job the arm just ran."],
    ["2", "PromoteGate scores\nboth models", "The new model, and the rule already in production, on passes the new model has not seen."],
    ["3", "The lead makes\none call", "Promote it for the next shift, or leave production where it is. The reason is saved."],
  ];
  steps.forEach((step, i) => {
    const x = 0.55 + i * 4.19;
    card(s, x, 2.15, 3.85, 4.4, white);
    s.addText(step[0], {
      x: x + 0.28, y: 2.38, w: 3.4, h: 0.5,
      fontFace: head, fontSize: 26, color: oxide, margin: 0,
    });
    s.addText(step[1], {
      x: x + 0.28, y: 3.05, w: 3.4, h: 1.15,
      fontFace: head, fontSize: 20, color: ink, margin: 0,
    });
    s.addText(step[2], {
      x: x + 0.28, y: 4.4, w: 3.4, h: 1.7,
      fontFace: body, fontSize: 16, color: muted, margin: 0,
    });
  });
  addFooter(s, 2, false);
}

// 3. Why a trained model can still be the wrong one
{
  const s = pres.addSlide();
  s.background = { color: cream };
  s.addText("A finished training run can still be the wrong model to ship.", {
    x: 0.55, y: 0.4, w: 12.2, h: 1.15,
    fontFace: head, fontSize: 32, color: ink, margin: 0,
  });

  card(s, 0.55, 1.85, 5.9, 4.55, white);
  s.addText("IT MISSES THE FAULT", {
    x: 0.9, y: 2.15, w: 5.3, h: 0.32,
    fontFace: body, fontSize: 13, color: red, bold: true, charSpacing: 1.1, margin: 0,
  });
  s.addText("A damaged tool or a drifting axis stays quiet. The cell finds out when the part, or the arm, does.", {
    x: 0.9, y: 2.7, w: 5.25, h: 1.7,
    fontFace: head, fontSize: 22, color: ink, margin: 0,
  });
  s.addText("That is a line-down event in the middle of the shift.", {
    x: 0.9, y: 5.35, w: 5.25, h: 0.6,
    fontFace: body, fontSize: 16, color: muted, margin: 0,
  });

  card(s, 6.85, 1.85, 5.9, 4.55, white);
  s.addText("IT ALARMS ALL DAY", {
    x: 7.2, y: 2.15, w: 5.2, h: 0.32,
    fontFace: body, fontSize: 13, color: oxide, bold: true, charSpacing: 1.1, margin: 0,
  });
  s.addText("Healthy passes get flagged. The crew clears the alarm and keeps cutting.", {
    x: 7.2, y: 2.7, w: 5.2, h: 1.7,
    fontFace: head, fontSize: 22, color: ink, margin: 0,
  });
  s.addText("The next real fault is easy to ignore.", {
    x: 7.2, y: 5.35, w: 5.2, h: 0.6,
    fontFace: body, fontSize: 16, color: muted, margin: 0,
  });
  addFooter(s, 3, false);
}

// 4. What the person does
{
  const s = pres.addSlide();
  s.background = { color: cream };
  s.addText("What the lead does with it.", {
    x: 0.55, y: 0.38, w: 12.2, h: 0.58,
    fontFace: head, fontSize: 34, color: ink, margin: 0,
  });
  s.addText("The studio does the machine-learning work. The lead makes the call.", {
    x: 0.55, y: 1.05, w: 12, h: 0.38,
    fontFace: body, fontSize: 18, color: muted, margin: 0,
  });

  const rows = [
    ["1", "The studio prepares the decision", "It checks the recordings, trains two models, LightGBM and XGBoost, and shows which sensors drove each warning."],
    ["2", "The lead reads two comparisons", "Faults missed, and false alarms, against the model already in production. Warning time is shown only when the recordings have a failure clock."],
    ["3", "The button turns on only when it is safer", "The rules are set before the test. A person clicks Promote. The decision is written down either way."],
  ];
  rows.forEach((row, i) => {
    const y = 1.58 + i * 1.82;
    card(s, 0.55, y, 12.2, 1.5, white);
    s.addShape(pres.shapes.OVAL, {
      x: 0.82, y: y + 0.4, w: 0.7, h: 0.7,
      fill: { color: oxide },
    });
    s.addText(row[0], {
      x: 0.82, y: y + 0.52, w: 0.7, h: 0.46,
      fontFace: head, fontSize: 20, color: white, align: "center", valign: "middle", margin: 0,
    });
    s.addText(row[1], {
      x: 1.8, y: y + 0.22, w: 10.5, h: 0.42,
      fontFace: head, fontSize: 22, color: ink, margin: 0,
    });
    s.addText(row[2], {
      x: 1.8, y: y + 0.72, w: 10.5, h: 0.58,
      fontFace: body, fontSize: 16, color: muted, margin: 0,
    });
  });
  addFooter(s, 4, false);
}

// 5. The real robot
{
  const s = pres.addSlide();
  s.background = { color: cream };
  s.addText("Already run on a real ABB IRB 6660.", {
    x: 0.55, y: 0.36, w: 12.2, h: 0.55,
    fontFace: head, fontSize: 32, color: ink, margin: 0,
  });
  s.addText("272 recorded cutting passes from a machining cell. Healthy tool, damaged tool, or a drifted axis. 55 faults were held back and never used for training.", {
    x: 0.55, y: 1.02, w: 12.2, h: 0.62,
    fontFace: body, fontSize: 16, color: muted, margin: 0,
  });

  const stats = [
    { fill: white, num: red, label: ink, value: "43", unit: "of 55", text: "Faults missed by the vibration limit already in production." },
    { fill: green, num: "FFFFFF", label: "F3F7F4", value: "4", unit: "of 55", text: "Faults missed by LightGBM, the model the check will allow." },
    { fill: white, num: green, label: ink, value: "None", unit: "false alarms", text: "Healthy passes LightGBM had not seen, and did not flag." },
  ];
  stats.forEach((stat, i) => {
    const x = 0.55 + i * 4.19;
    card(s, x, 1.82, 3.85, 3.55, stat.fill);
    s.addText(stat.value, {
      x: x + 0.28, y: 2.12, w: 3.4, h: 0.9,
      fontFace: head, fontSize: stat.value.length > 2 ? 40 : 54, color: stat.num, margin: 0,
    });
    s.addText(stat.unit, {
      x: x + 0.28, y: 3.05, w: 3.4, h: 0.38,
      fontFace: body, fontSize: 16, color: stat.label, bold: true, margin: 0,
    });
    s.addText(stat.text, {
      x: x + 0.28, y: 3.55, w: 3.4, h: 1.7,
      fontFace: body, fontSize: 16, color: stat.label, margin: 0,
    });
  });
  s.addText("XGBoost missed 41 of 55. An always-alarm rule and a never-alarm rule were refused. LightGBM may be promoted. It goes live when the lead clicks.", {
    x: 0.55, y: 5.72, w: 12.2, h: 0.85,
    fontFace: body, fontSize: 16, color: muted, margin: 0,
  });
  addFooter(s, 5, false);
}

// 6. Where it sits in the plant
{
  const s = pres.addSlide();
  s.background = { color: cream };
  s.addText("It reads the log. The controller keeps the arm.", {
    x: 0.55, y: 0.38, w: 12.2, h: 0.58,
    fontFace: head, fontSize: 32, color: ink, margin: 0,
  });
  const rows = [
    ["Same cell, same controller", "Torque, current, force, and vibration are already on the robot. PromoteGate starts from that file."],
    ["Same job the arm is doing", "The demo is cutting passes on an IRB 6660. A weld or assembly cell uses the same check on its own logs."],
    ["The controller keeps the path", "Joint commands stay with the controller. The arm keeps the program it was given."],
    ["A person still presses Promote", "The check can allow a model. Putting it into production is a separate click, and the click is audited."],
  ];
  rows.forEach((row, i) => {
    const y = 1.18 + i * 1.45;
    s.addShape(pres.shapes.RECTANGLE, {
      x: 0.55, y, w: 12.2, h: 1.14,
      fill: { color: white },
      line: { color: line, width: 1 },
    });
    s.addShape(pres.shapes.RECTANGLE, {
      x: 0.55, y, w: 0.08, h: 1.14,
      fill: { color: oxide },
    });
    s.addText(row[0], {
      x: 0.95, y: y + 0.14, w: 11.4, h: 0.38,
      fontFace: head, fontSize: 20, color: ink, margin: 0,
    });
    s.addText(row[1], {
      x: 0.95, y: y + 0.62, w: 11.4, h: 0.42,
      fontFace: body, fontSize: 16, color: muted, margin: 0,
    });
  });
  addFooter(s, 6, false);
}

// 7. Scale
{
  const s = pres.addSlide();
  s.background = { color: cream };
  s.addText("More shifts make the next model work harder.", {
    x: 0.55, y: 0.4, w: 12.2, h: 0.6,
    fontFace: head, fontSize: 32, color: ink, margin: 0,
  });
  s.addText("A busier plant is a harder test. Whatever is in production becomes the model the next one has to beat.", {
    x: 0.55, y: 1.12, w: 12.2, h: 0.7,
    fontFace: body, fontSize: 18, color: muted, margin: 0,
  });

  card(s, 0.55, 2.1, 5.95, 4.35, white);
  s.addText("THIS DEMO", {
    x: 0.9, y: 2.38, w: 5.2, h: 0.32,
    fontFace: body, fontSize: 13, color: oxide, bold: true, charSpacing: 1.2, margin: 0,
  });
  s.addText("272 passes.\nOne IRB 6660.\nLightGBM has to beat\na vibration limit.", {
    x: 0.9, y: 2.95, w: 5.2, h: 2.8,
    fontFace: head, fontSize: 26, color: ink, margin: 0,
  });

  card(s, 6.85, 2.1, 5.95, 4.35, dark);
  s.addText("ON THE LINE", {
    x: 7.2, y: 2.38, w: 5.2, h: 0.32,
    fontFace: body, fontSize: 13, color: "E7B59A", bold: true, charSpacing: 1.2, margin: 0,
  });
  s.addText("Every new shift is\nanother test.\nThe next model has\nto beat LightGBM.", {
    x: 7.2, y: 2.95, w: 5.2, h: 2.8,
    fontFace: head, fontSize: 26, color: "F6F4F0", margin: 0,
  });
  addFooter(s, 7, false);
}

// 8. Where to look
{
  const s = pres.addSlide();
  s.background = { color: dark };
  s.addText("See the decision.", {
    x: 0.7, y: 1.45, w: 11.5, h: 0.7,
    fontFace: head, fontSize: 40, color: "F6F4F0", margin: 0,
  });
  s.addText("The demo opens on the IRB 6660 result. Promote turns on for LightGBM, and only for LightGBM.", {
    x: 0.7, y: 2.35, w: 11.2, h: 0.95,
    fontFace: body, fontSize: 18, color: "E7E1D8", margin: 0,
  });
  s.addText("Demo", {
    x: 0.7, y: 3.7, w: 2, h: 0.3,
    fontFace: body, fontSize: 13, color: "8A8178", margin: 0,
  });
  s.addText("dhamarit.github.io/promotegate-demo", {
    x: 0.7, y: 4.02, w: 11, h: 0.42,
    fontFace: body, fontSize: 22, color: "E7B59A", margin: 0,
    hyperlink: { url: "https://dhamarit.github.io/promotegate-demo/" },
  });
  s.addText("Code", {
    x: 0.7, y: 4.65, w: 2, h: 0.3,
    fontFace: body, fontSize: 13, color: "8A8178", margin: 0,
  });
  s.addText("github.com/dhamariT/promotegate", {
    x: 0.7, y: 4.97, w: 11, h: 0.4,
    fontFace: body, fontSize: 20, color: "D9D1C7", margin: 0,
    hyperlink: { url: "https://github.com/dhamariT/promotegate" },
  });
  s.addText("PromoteGate   ·   ABB Accelerator 2026", {
    x: 0.7, y: 6.55, w: 10, h: 0.3,
    fontFace: body, fontSize: 14, color: "8A8178", margin: 0,
  });
}

pres.writeFile({ fileName: "/Users/dhamari/promotegate/pitch/PromoteGate-ABB-Accelerator.pptx" })
  .then(() => console.log("wrote deck"))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });

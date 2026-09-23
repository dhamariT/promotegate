const pptxgen = require("pptxgenjs");
const pres = new pptxgen();
pres.defineLayout({ name: "WIDE", width: 13.333, height: 7.5 });
pres.layout = "WIDE";
pres.author = "Dhamari Trice-Hanson";
pres.title = "PromoteGate";
pres.subject = "ABB Accelerator 2026";

const cream = "F4F0E8";
const ink = "12171F";
const navy = "0E1726";
const orange = "C4501A";
const slate = "5C6573";
const rule = "D5CBBC";
const white = "F7F4EE";
const peach = "E7C4AE";
const mist = "A8B0BC";
const font = "Arial";

const OUT = "/Users/dhamari/promotegate/pitch/PromoteGate-ABB-Accelerator.pptx";

function header(slide, num, section) {
  slide.addText(num, {
    x: 0.5, y: 0.28, w: 0.7, h: 0.28,
    fontFace: font, fontSize: 12, color: slate, margin: 0, bold: true,
  });
  slide.addText(section, {
    x: 1.15, y: 0.28, w: 6.5, h: 0.28,
    fontFace: font, fontSize: 12, color: orange, margin: 0, bold: true, charSpacing: 1.4,
  });
  slide.addText("PROMOTEGATE", {
    x: 8.3, y: 0.28, w: 4.5, h: 0.28,
    fontFace: font, fontSize: 12, color: slate, align: "right", margin: 0, charSpacing: 1.2,
  });
  slide.addShape(pres.shapes.RECTANGLE, {
    x: 0.5, y: 0.68, w: 12.33, h: 0.015,
    fill: { color: rule }, line: { color: rule },
  });
}

function footer(slide) {
  slide.addText("ABB Accelerator 2026", {
    x: 0.5, y: 7.12, w: 6, h: 0.22,
    fontFace: font, fontSize: 11, color: slate, margin: 0,
  });
  slide.addText("Theme 1  ·  Predictive maintenance", {
    x: 6.8, y: 7.12, w: 6.03, h: 0.22,
    fontFace: font, fontSize: 11, color: slate, align: "right", margin: 0,
  });
}

function vrule(slide, x, y, h, color) {
  slide.addShape(pres.shapes.RECTANGLE, {
    x, y, w: 0.015, h,
    fill: { color }, line: { color },
  });
}

// 1 — Cover
{
  const s = pres.addSlide();
  s.background = { color: cream };
  s.addText("PROMOTEGATE", {
    x: 0.5, y: 0.36, w: 6, h: 0.28,
    fontFace: font, fontSize: 13, color: ink, bold: true, margin: 0, charSpacing: 1.6,
  });
  s.addText("ABB ACCELERATOR 2026", {
    x: 6.8, y: 0.36, w: 6.03, h: 0.28,
    fontFace: font, fontSize: 13, color: slate, align: "right", margin: 0, charSpacing: 1.2,
  });
  s.addShape(pres.shapes.RECTANGLE, {
    x: 0.5, y: 0.78, w: 12.33, h: 0.015,
    fill: { color: rule }, line: { color: rule },
  });
  s.addText("FOR THE MAINTENANCE LEAD", {
    x: 0.5, y: 1.15, w: 12, h: 0.28,
    fontFace: font, fontSize: 13, color: orange, bold: true, margin: 0, charSpacing: 1.6,
  });
  s.addText("Beat the model", {
    x: 0.5, y: 1.6, w: 12.3, h: 1.05,
    fontFace: font, fontSize: 60, color: ink, bold: true, margin: 0,
  });
  s.addText("already running.", {
    x: 0.5, y: 2.6, w: 12.3, h: 1.05,
    fontFace: font, fontSize: 60, color: orange, italic: true, margin: 0,
  });
  s.addText("A new failure model watches the robot only after it misses fewer faults\nthan the one already in production, without crying wolf.", {
    x: 0.5, y: 3.85, w: 11.2, h: 0.75,
    fontFace: font, fontSize: 18, color: ink, margin: 0,
  });

  s.addShape(pres.shapes.RECTANGLE, {
    x: 0, y: 5.05, w: 13.333, h: 2.45,
    fill: { color: navy }, line: { color: navy },
  });
  const facts = [
    ["01", "An ABB cell", "Machining, welding, or assembly.\nThe demo is an IRB 6660."],
    ["02", "The log it already writes", "Current, force, torque, vibration,\nsaved with the job just run."],
    ["03", "One human click", "Promote turns on only when\nthe new model is safer."],
  ];
  facts.forEach((fact, i) => {
    const x = 0.5 + i * 4.2;
    s.addText(fact[0], {
      x, y: 5.28, w: 3.6, h: 0.28,
      fontFace: font, fontSize: 12, color: orange, bold: true, margin: 0, charSpacing: 1.2,
    });
    s.addText(fact[1], {
      x, y: 5.6, w: 3.7, h: 0.4,
      fontFace: font, fontSize: 20, color: white, bold: true, margin: 0,
    });
    s.addText(fact[2], {
      x, y: 6.1, w: 3.7, h: 0.85,
      fontFace: font, fontSize: 14, color: mist, margin: 0,
    });
  });
}

// 2 — Monday
{
  const s = pres.addSlide();
  s.background = { color: cream };
  header(s, "02", "THE SHIFT");
  s.addText("Monday, before the shift starts.", {
    x: 0.5, y: 0.9, w: 12.3, h: 0.55,
    fontFace: font, fontSize: 32, color: ink, bold: true, margin: 0,
  });
  s.addText("The arm cut the same job. A new model trained overnight. One question: is it safer than the rule already watching the robot?", {
    x: 0.5, y: 1.52, w: 12.2, h: 0.55,
    fontFace: font, fontSize: 16, color: slate, margin: 0,
  });

  const cols = [
    ["01", "The robot logged the shift", "Current, force, torque, and vibration, saved with the cutting job the arm just finished.", "THE LOG"],
    ["02", "Both models get the same test", "The new model and the rule in production, scored on passes the new model has not seen.", "THE SCORE"],
    ["03", "The lead makes one call", "Promote it for the next shift, or leave production where it is. The reason is saved.", "THE CALL"],
  ];
  cols.forEach((col, i) => {
    const x = 0.5 + i * 4.2;
    if (i > 0) vrule(s, x - 0.22, 2.3, 3.55, rule);
    s.addText(col[0], {
      x, y: 2.35, w: 3.7, h: 0.4,
      fontFace: font, fontSize: 18, color: orange, bold: true, margin: 0,
    });
    s.addText(col[1], {
      x, y: 2.9, w: 3.75, h: 1.15,
      fontFace: font, fontSize: 24, color: ink, bold: true, margin: 0,
    });
    s.addText(col[2], {
      x, y: 4.2, w: 3.75, h: 1.35,
      fontFace: font, fontSize: 16, color: slate, margin: 0,
    });
    s.addText(col[3], {
      x, y: 5.72, w: 3.7, h: 0.28,
      fontFace: font, fontSize: 12, color: orange, bold: true, margin: 0, charSpacing: 1.4,
    });
  });
  footer(s);
}

// 3 — Two ways it hurts, full bleed
{
  const s = pres.addSlide();
  s.background = { color: cream };
  s.addShape(pres.shapes.RECTANGLE, {
    x: 0, y: 0, w: 6.666, h: 7.5,
    fill: { color: navy }, line: { color: navy },
  });
  s.addText("01   MISSES THE FAULT", {
    x: 0.48, y: 0.48, w: 5.6, h: 0.3,
    fontFace: font, fontSize: 13, color: orange, bold: true, margin: 0, charSpacing: 1.2,
  });
  s.addText("The cell\nfinds out\nmid-shift.", {
    x: 0.48, y: 1.7, w: 5.7, h: 2.7,
    fontFace: font, fontSize: 40, color: white, bold: true, margin: 0,
  });
  s.addText("A damaged tool or a drifting axis stays quiet. The line stops when the part, or the arm, does.", {
    x: 0.48, y: 5.15, w: 5.6, h: 1.15,
    fontFace: font, fontSize: 16, color: mist, margin: 0,
  });
  s.addText("A missed fault is a line-down.", {
    x: 0.48, y: 6.7, w: 5.6, h: 0.35,
    fontFace: font, fontSize: 14, color: peach, italic: true, margin: 0,
  });

  s.addText("02   ALARMS ALL DAY", {
    x: 7.15, y: 0.48, w: 5.6, h: 0.3,
    fontFace: font, fontSize: 13, color: orange, bold: true, margin: 0, charSpacing: 1.2,
  });
  s.addText("The crew\nstops\nlistening.", {
    x: 7.15, y: 1.7, w: 5.6, h: 2.7,
    fontFace: font, fontSize: 40, color: ink, bold: true, margin: 0,
  });
  s.addText("Healthy passes get flagged. People clear the alarm and keep cutting.", {
    x: 7.15, y: 5.15, w: 5.6, h: 1.15,
    fontFace: font, fontSize: 16, color: slate, margin: 0,
  });
  s.addText("The next real fault is easy to ignore.", {
    x: 7.15, y: 6.7, w: 5.6, h: 0.35,
    fontFace: font, fontSize: 14, color: orange, italic: true, margin: 0,
  });
}

// 4 — What the lead does
{
  const s = pres.addSlide();
  s.background = { color: cream };
  header(s, "04", "THE LEAD");
  s.addText("Three steps. One screen.", {
    x: 0.5, y: 0.9, w: 12, h: 0.5,
    fontFace: font, fontSize: 32, color: ink, bold: true, margin: 0,
  });

  const rows = [
    ["01", "The studio prepares the decision", "It checks the recordings, trains LightGBM and XGBoost, and shows which sensors drove each warning."],
    ["02", "The lead reads two comparisons", "Faults missed, and false alarms, against the model already in production. Warning time appears only when the recordings have a failure clock."],
    ["03", "A person clicks Promote", "The rules are set before the test. The button turns on only when the new model is safer. The decision is written down either way."],
  ];
  rows.forEach((row, i) => {
    const y = 1.7 + i * 1.7;
    s.addShape(pres.shapes.RECTANGLE, {
      x: 0.5, y, w: 12.33, h: 0.015,
      fill: { color: rule }, line: { color: rule },
    });
    s.addText(row[0], {
      x: 0.5, y: y + 0.28, w: 1.15, h: 0.5,
      fontFace: font, fontSize: 22, color: orange, bold: true, margin: 0,
    });
    s.addText(row[1], {
      x: 1.9, y: y + 0.22, w: 10.6, h: 0.42,
      fontFace: font, fontSize: 22, color: ink, bold: true, margin: 0,
    });
    s.addText(row[2], {
      x: 1.9, y: y + 0.72, w: 10.6, h: 0.7,
      fontFace: font, fontSize: 16, color: slate, margin: 0,
    });
  });
  footer(s);
}

// 5 — Proof
{
  const s = pres.addSlide();
  s.background = { color: cream };
  header(s, "05", "THE PROOF");
  s.addText("A real ABB IRB 6660. 55 faults held back.", {
    x: 0.5, y: 0.86, w: 12.3, h: 0.42,
    fontFace: font, fontSize: 26, color: ink, bold: true, margin: 0,
  });
  s.addText("272 cutting passes. Healthy tool, damaged tool, or a drifted axis. These 55 faults were never used for training.", {
    x: 0.5, y: 1.32, w: 12.2, h: 0.36,
    fontFace: font, fontSize: 14, color: slate, margin: 0,
  });

  // Production
  s.addText("43", {
    x: 0.45, y: 1.9, w: 2.3, h: 0.95,
    fontFace: font, fontSize: 60, color: ink, bold: true, margin: 0,
  });
  s.addText("of 55 missed", {
    x: 2.7, y: 2.05, w: 3.2, h: 0.3,
    fontFace: font, fontSize: 14, color: slate, bold: true, margin: 0,
  });
  s.addText("Vibration limit already in production", {
    x: 2.7, y: 2.38, w: 4.2, h: 0.32,
    fontFace: font, fontSize: 15, color: ink, margin: 0,
  });
  s.addShape(pres.shapes.RECTANGLE, {
    x: 7.3, y: 2.22, w: 5.5, h: 0.28,
    fill: { color: "E6DDD0" }, line: { color: "E6DDD0" },
  });
  s.addShape(pres.shapes.RECTANGLE, {
    x: 7.3, y: 2.22, w: 5.5 * (43 / 55), h: 0.28,
    fill: { color: orange }, line: { color: orange },
  });

  // LightGBM
  s.addText("4", {
    x: 0.45, y: 3.2, w: 2.3, h: 0.95,
    fontFace: font, fontSize: 60, color: orange, bold: true, margin: 0,
  });
  s.addText("of 55 missed", {
    x: 2.7, y: 3.35, w: 3.2, h: 0.3,
    fontFace: font, fontSize: 14, color: slate, bold: true, margin: 0,
  });
  s.addText("LightGBM. The lead may promote this one.", {
    x: 2.7, y: 3.68, w: 4.4, h: 0.32,
    fontFace: font, fontSize: 15, color: ink, margin: 0,
  });
  s.addShape(pres.shapes.RECTANGLE, {
    x: 7.3, y: 3.52, w: 5.5, h: 0.28,
    fill: { color: "E6DDD0" }, line: { color: "E6DDD0" },
  });
  s.addShape(pres.shapes.RECTANGLE, {
    x: 7.3, y: 3.52, w: Math.max(0.18, 5.5 * (4 / 55)), h: 0.28,
    fill: { color: navy }, line: { color: navy },
  });

  s.addShape(pres.shapes.RECTANGLE, {
    x: 0.5, y: 4.55, w: 12.33, h: 0.015,
    fill: { color: rule }, line: { color: rule },
  });

  // False alarm callout + verdicts
  s.addShape(pres.shapes.RECTANGLE, {
    x: 0.5, y: 4.8, w: 3.55, h: 2.05,
    fill: { color: navy }, line: { color: navy },
  });
  s.addText("0%", {
    x: 0.7, y: 4.95, w: 3.15, h: 0.75,
    fontFace: font, fontSize: 40, color: white, bold: true, margin: 0,
  });
  s.addText("False alarms on healthy\npasses LightGBM had not seen.", {
    x: 0.7, y: 5.75, w: 3.15, h: 0.85,
    fontFace: font, fontSize: 14, color: mist, margin: 0,
  });

  const verdicts = [
    ["XGBOOST", "41 of 55 missed", "Refused"],
    ["ALWAYS ALARM", "Flags every pass", "Refused"],
    ["NEVER ALARM", "Misses every fault", "Refused"],
  ];
  verdicts.forEach((v, i) => {
    const x = 4.3 + i * 2.9;
    s.addText(v[0], {
      x, y: 4.9, w: 2.7, h: 0.28,
      fontFace: font, fontSize: 12, color: orange, bold: true, margin: 0, charSpacing: 0.8,
    });
    s.addText(v[1], {
      x, y: 5.3, w: 2.7, h: 0.55,
      fontFace: font, fontSize: 16, color: ink, bold: true, margin: 0,
    });
    s.addText(v[2], {
      x, y: 6.0, w: 2.7, h: 0.3,
      fontFace: font, fontSize: 14, color: slate, margin: 0,
    });
  });
  footer(s);
}

// 6 — Where it sits
{
  const s = pres.addSlide();
  s.background = { color: cream };
  s.addShape(pres.shapes.RECTANGLE, {
    x: 0, y: 0, w: 5.15, h: 7.5,
    fill: { color: navy }, line: { color: navy },
  });
  s.addText("06    ON THE FLOOR", {
    x: 0.42, y: 0.42, w: 4.4, h: 0.3,
    fontFace: font, fontSize: 13, color: orange, bold: true, margin: 0, charSpacing: 1.1,
  });
  s.addText("It reads\nthe log.", {
    x: 0.42, y: 1.2, w: 4.4, h: 1.55,
    fontFace: font, fontSize: 40, color: white, bold: true, margin: 0,
  });
  s.addText("The controller\nkeeps the arm.", {
    x: 0.42, y: 2.85, w: 4.4, h: 1.25,
    fontFace: font, fontSize: 26, color: peach, italic: true, margin: 0,
  });
  s.addText("The file the robot already writes is the input. A new model has to beat the one in production before it can watch the next shift.", {
    x: 0.42, y: 4.35, w: 4.3, h: 1.5,
    fontFace: font, fontSize: 16, color: mist, margin: 0,
  });
  s.addText("ABB Accelerator 2026", {
    x: 0.42, y: 6.55, w: 4.4, h: 0.4,
    fontFace: font, fontSize: 14, color: mist, margin: 0,
  });

  const items = [
    ["Same cell", "Torque, current, force, and vibration are already on the robot. PromoteGate starts from that file."],
    ["Same job", "The demo is cutting passes on an IRB 6660. A weld cell uses the same check on its own logs."],
    ["Same controller", "Joint commands stay with the controller. The arm keeps the program it was given."],
    ["A separate click", "The check can allow a model. Putting it into production is a person’s click, and the click is audited."],
  ];
  items.forEach((item, i) => {
    const y = 0.4 + i * 1.7;
    s.addText(item[0], {
      x: 5.55, y, w: 7.2, h: 0.4,
      fontFace: font, fontSize: 22, color: ink, bold: true, margin: 0,
    });
    s.addText(item[1], {
      x: 5.55, y: y + 0.48, w: 7.2, h: 0.75,
      fontFace: font, fontSize: 15, color: slate, margin: 0,
    });
  });
}

// 7 — Scale, full split
{
  const s = pres.addSlide();
  s.background = { color: cream };
  s.addShape(pres.shapes.RECTANGLE, {
    x: 6.666, y: 0, w: 6.667, h: 7.5,
    fill: { color: navy }, line: { color: navy },
  });

  s.addText("07    THIS DEMO", {
    x: 0.48, y: 0.45, w: 5.6, h: 0.3,
    fontFace: font, fontSize: 13, color: orange, bold: true, margin: 0, charSpacing: 1.2,
  });
  s.addText("272", {
    x: 0.48, y: 1.7, w: 5.6, h: 1.15,
    fontFace: font, fontSize: 72, color: ink, bold: true, margin: 0,
  });
  s.addText("passes on one IRB 6660.", {
    x: 0.48, y: 2.95, w: 5.6, h: 0.45,
    fontFace: font, fontSize: 22, color: ink, bold: true, margin: 0,
  });
  s.addText("LightGBM has to beat a vibration limit. It missed 4 faults. Production missed 43.", {
    x: 0.48, y: 3.6, w: 5.6, h: 1.1,
    fontFace: font, fontSize: 18, color: slate, margin: 0,
  });
  s.addText("That result is already in the demo.", {
    x: 0.48, y: 6.55, w: 5.6, h: 0.4,
    fontFace: font, fontSize: 15, color: orange, italic: true, margin: 0,
  });

  s.addText("ON THE LINE", {
    x: 7.15, y: 0.45, w: 5.6, h: 0.3,
    fontFace: font, fontSize: 13, color: orange, bold: true, margin: 0, charSpacing: 1.2,
  });
  s.addText("Next", {
    x: 7.15, y: 1.7, w: 5.6, h: 1.15,
    fontFace: font, fontSize: 72, color: white, bold: true, margin: 0,
  });
  s.addText("model has to beat this one.", {
    x: 7.15, y: 2.95, w: 5.6, h: 0.45,
    fontFace: font, fontSize: 22, color: white, bold: true, margin: 0,
  });
  s.addText("Every new shift is another test. A busier plant is a harder bar. Production is whatever just earned the click.", {
    x: 7.15, y: 3.6, w: 5.6, h: 1.3,
    fontFace: font, fontSize: 18, color: mist, margin: 0,
  });
  s.addText("More data makes promotion harder.", {
    x: 7.15, y: 6.55, w: 5.6, h: 0.4,
    fontFace: font, fontSize: 15, color: peach, italic: true, margin: 0,
  });
}

// 8 — Close
{
  const s = pres.addSlide();
  s.background = { color: navy };
  s.addText("ABB ACCELERATOR 2026", {
    x: 0.55, y: 0.42, w: 8, h: 0.28,
    fontFace: font, fontSize: 13, color: orange, bold: true, margin: 0, charSpacing: 1.4,
  });
  s.addText("See the decision.", {
    x: 0.55, y: 1.35, w: 12, h: 0.85,
    fontFace: font, fontSize: 48, color: white, bold: true, margin: 0,
  });
  s.addText("The demo opens on the IRB 6660 result. Promote turns on for LightGBM, and only for LightGBM.", {
    x: 0.55, y: 2.3, w: 11.5, h: 0.6,
    fontFace: font, fontSize: 18, color: mist, margin: 0,
  });

  s.addShape(pres.shapes.RECTANGLE, {
    x: 0.55, y: 3.25, w: 12.23, h: 0.015,
    fill: { color: "2A3342" }, line: { color: "2A3342" },
  });

  s.addText("DEMO", {
    x: 0.55, y: 3.55, w: 2, h: 0.28,
    fontFace: font, fontSize: 12, color: orange, bold: true, margin: 0, charSpacing: 1.3,
  });
  s.addText("dhamarit.github.io/promotegate-demo", {
    x: 0.55, y: 3.9, w: 12, h: 0.45,
    fontFace: font, fontSize: 22, color: white, margin: 0,
    hyperlink: { url: "https://dhamarit.github.io/promotegate-demo/" },
  });
  s.addText("CODE", {
    x: 0.55, y: 4.6, w: 2, h: 0.28,
    fontFace: font, fontSize: 12, color: orange, bold: true, margin: 0, charSpacing: 1.3,
  });
  s.addText("github.com/dhamariT/promotegate", {
    x: 0.55, y: 4.95, w: 12, h: 0.42,
    fontFace: font, fontSize: 22, color: white, margin: 0,
    hyperlink: { url: "https://github.com/dhamariT/promotegate" },
  });
  s.addText("PromoteGate  ·  A person still clicks.", {
    x: 0.55, y: 6.7, w: 12, h: 0.3,
    fontFace: font, fontSize: 14, color: mist, margin: 0,
  });
}

pres.writeFile({ fileName: OUT })
  .then(() => console.log("wrote deck"))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });

const path = require("path");
const pptxgen = require("pptxgenjs");
const pres = new pptxgen();
pres.defineLayout({ name: "WIDE", width: 13.333, height: 7.5 });
pres.layout = "WIDE";
pres.author = "Dhamari Trice-Hanson";
pres.title = "PromoteGate";
pres.subject = "ABB Accelerator 2026";

const cream = "F4F0E8";
const ink = "12171F";
const void_ = "0C0F14";
const orange = "E07A3D";
const slate = "5C6573";
const mist = "A8B0BC";
const white = "F7F4EE";
const line = "2A3342";
const rule = "D5CBBC";
const font = "Arial";
const assets = path.join(__dirname, "assets");

const OUT = path.join(__dirname, "PromoteGate-ABB-Accelerator.pptx");

function photo(slide, file, x, y, w, h) {
  slide.addImage({
    path: path.join(assets, file),
    x, y, w, h,
    sizing: { type: "cover", w, h },
  });
}

function credit(slide, text, x, y, w, color) {
  slide.addText(text, {
    x, y, w, h: 0.26,
    fontFace: font, fontSize: 11, color, margin: 0,
  });
}

// 1 — Cover. The claim.
{
  const s = pres.addSlide();
  s.background = { color: void_ };
  photo(s, "abb-welding-cell.jpg", 0, 0, 13.333, 7.5);
  s.addShape(pres.shapes.RECTANGLE, {
    x: 0, y: 4.35, w: 13.333, h: 3.15,
    fill: { color: void_, transparency: 12 }, line: { color: void_ },
  });
  s.addText("PROMOTEGATE", {
    x: 0.55, y: 4.5, w: 6, h: 0.28,
    fontFace: font, fontSize: 13, color: orange, bold: true, margin: 0, charSpacing: 1.6,
  });
  s.addText("ABB ACCELERATOR 2026", {
    x: 7.2, y: 4.5, w: 5.55, h: 0.28,
    fontFace: font, fontSize: 13, color: mist, align: "right", margin: 0, charSpacing: 1.2,
  });
  s.addText("Proven safe on this machine.", {
    x: 0.55, y: 4.95, w: 12.2, h: 0.85,
    fontFace: font, fontSize: 40, color: white, bold: true, margin: 0,
  });
  s.addText("A new update ships only after it is safer than what is already running,\nin the environment it will actually run in.", {
    x: 0.55, y: 5.9, w: 11.5, h: 0.7,
    fontFace: font, fontSize: 18, color: white, margin: 0,
  });
  credit(s, "Ana 2016, Wikimedia Commons, CC BY-SA 4.0. An ABB robot welding. The scored cell is an IRB 6660.", 0.55, 6.85, 12.2, mist);
}

// 2 — The test is the machine
{
  const s = pres.addSlide();
  s.background = { color: void_ };
  photo(s, "abb-irb-wordmark.jpg", 0, 0, 6.15, 7.5);
  s.addShape(pres.shapes.RECTANGLE, {
    x: 0, y: 6.95, w: 6.15, h: 0.55,
    fill: { color: void_, transparency: 25 }, line: { color: void_ },
  });
  credit(s, "© Peter Potrowl, CC BY 2.5", 0.28, 7.08, 5.6, white);
  s.addText("THE MACHINE", {
    x: 6.6, y: 1.35, w: 6.2, h: 0.3,
    fontFace: font, fontSize: 13, color: orange, bold: true, margin: 0, charSpacing: 1.4,
  });
  s.addText("The proof is taken\non the machine.", {
    x: 6.6, y: 1.8, w: 6.2, h: 1.7,
    fontFace: font, fontSize: 32, color: white, bold: true, margin: 0,
  });
  s.addText("Held-out passes from this cell decide it. The baseline is the model already watching it.", {
    x: 6.6, y: 3.7, w: 6.1, h: 1.3,
    fontFace: font, fontSize: 18, color: mist, margin: 0,
  });
  s.addText("Current, force, torque, vibration. The log the robot already writes.", {
    x: 6.6, y: 5.3, w: 6.1, h: 0.8,
    fontFace: font, fontSize: 16, color: white, margin: 0,
  });
}

// 3 — What safe means here
{
  const s = pres.addSlide();
  s.background = { color: cream };
  s.addText("03", {
    x: 0.55, y: 0.4, w: 0.7, h: 0.3,
    fontFace: font, fontSize: 13, color: slate, bold: true, margin: 0,
  });
  s.addText("SAFE, HERE", {
    x: 1.2, y: 0.4, w: 6, h: 0.3,
    fontFace: font, fontSize: 13, color: orange, bold: true, margin: 0, charSpacing: 1.4,
  });
  s.addText("Safer than what is running on this machine.", {
    x: 0.55, y: 0.9, w: 12.2, h: 0.6,
    fontFace: font, fontSize: 30, color: ink, bold: true, margin: 0,
  });

  const rows = [
    ["01", "Missed faults", "The update must not miss more faults than the model already in production, on passes neither has seen."],
    ["02", "False alarms", "Under a cap fixed in advance, and no worse than production. A quiet fault and a crew that stops listening are both failures."],
    ["03", "Warning time", "Scored only when this environment records a clock to the failure. These recordings do not, so it is left unscored."],
  ];
  rows.forEach((row, i) => {
    const y = 1.85 + i * 1.65;
    s.addShape(pres.shapes.RECTANGLE, {
      x: 0.55, y, w: 12.25, h: 0.012,
      fill: { color: rule }, line: { color: rule },
    });
    s.addText(row[0], {
      x: 0.55, y: y + 0.28, w: 1.1, h: 0.45,
      fontFace: font, fontSize: 20, color: orange, bold: true, margin: 0,
    });
    s.addText(row[1], {
      x: 1.9, y: y + 0.25, w: 3.6, h: 0.5,
      fontFace: font, fontSize: 22, color: ink, bold: true, margin: 0,
    });
    s.addText(row[2], {
      x: 5.7, y: y + 0.22, w: 7.0, h: 0.95,
      fontFace: font, fontSize: 16, color: slate, margin: 0,
    });
  });
}

// 4 — The result on the IRB 6660
{
  const s = pres.addSlide();
  s.background = { color: cream };
  s.addText("04", {
    x: 0.55, y: 0.38, w: 0.7, h: 0.28,
    fontFace: font, fontSize: 13, color: slate, bold: true, margin: 0,
  });
  s.addText("THIS MACHINE", {
    x: 1.2, y: 0.38, w: 6, h: 0.28,
    fontFace: font, fontSize: 13, color: orange, bold: true, margin: 0, charSpacing: 1.4,
  });
  s.addText("An ABB IRB 6660. 55 faults held back.", {
    x: 0.55, y: 0.8, w: 12, h: 0.5,
    fontFace: font, fontSize: 28, color: ink, bold: true, margin: 0,
  });
  s.addText("272 cutting passes. Healthy tool, damaged tool, or a drifted axis. These 55 were never used for training.", {
    x: 0.55, y: 1.38, w: 12, h: 0.4,
    fontFace: font, fontSize: 16, color: slate, margin: 0,
  });

  // Production
  s.addText("43", {
    x: 0.55, y: 2.05, w: 2.4, h: 1.05,
    fontFace: font, fontSize: 72, color: ink, bold: true, margin: 0,
  });
  s.addText("of 55 missed", {
    x: 3.05, y: 2.25, w: 4, h: 0.35,
    fontFace: font, fontSize: 16, color: slate, bold: true, margin: 0,
  });
  s.addText("Vibration limit already running on the cell", {
    x: 3.05, y: 2.62, w: 5.5, h: 0.35,
    fontFace: font, fontSize: 16, color: ink, margin: 0,
  });

  // Update
  s.addText("4", {
    x: 0.55, y: 3.35, w: 2.4, h: 1.05,
    fontFace: font, fontSize: 72, color: orange, bold: true, margin: 0,
  });
  s.addText("of 55 missed", {
    x: 3.05, y: 3.55, w: 4, h: 0.35,
    fontFace: font, fontSize: 16, color: slate, bold: true, margin: 0,
  });
  s.addText("LightGBM. Clear to ship on this machine.", {
    x: 3.05, y: 3.92, w: 6, h: 0.35,
    fontFace: font, fontSize: 16, color: ink, margin: 0,
  });

  s.addShape(pres.shapes.RECTANGLE, {
    x: 0.55, y: 4.7, w: 12.25, h: 0.012,
    fill: { color: rule }, line: { color: rule },
  });

  const facts = [
    ["0%", "False alarms, down from 15.4% on healthy passes this update had not seen."],
    ["Not scored", "Warning time. The recordings are health snapshots, so the gate refuses to invent one."],
    ["Refused", "XGBoost. An always-alarm. A never-alarm. Each wins one metric by abandoning the other."],
  ];
  facts.forEach((f, i) => {
    const x = 0.55 + i * 4.2;
    s.addText(f[0], {
      x, y: 4.95, w: 3.9, h: 0.55,
      fontFace: font, fontSize: 26, color: ink, bold: true, margin: 0,
    });
    s.addText(f[1], {
      x, y: 5.55, w: 3.9, h: 1.15,
      fontFace: font, fontSize: 15, color: slate, margin: 0,
    });
  });
}

// 5 — The gate, pinned to this environment
{
  const s = pres.addSlide();
  s.background = { color: cream };
  s.addText("05", {
    x: 0.55, y: 0.38, w: 0.7, h: 0.28,
    fontFace: font, fontSize: 13, color: slate, bold: true, margin: 0,
  });
  s.addText("THE GATE", {
    x: 1.2, y: 0.38, w: 6, h: 0.28,
    fontFace: font, fontSize: 13, color: orange, bold: true, margin: 0, charSpacing: 1.4,
  });
  s.addText("Pinned before anything is trained.", {
    x: 0.55, y: 0.82, w: 12, h: 0.5,
    fontFace: font, fontSize: 30, color: ink, bold: true, margin: 0,
  });
  s.addText("The same five rules score every update on this machine. They are not moved afterward to let a favourite through.", {
    x: 0.55, y: 1.42, w: 12.2, h: 0.45,
    fontFace: font, fontSize: 16, color: slate, margin: 0,
  });

  const rules = [
    ["01", "Enough evidence", "At least 8 held-out faults, or there is no verdict. This cell had 55."],
    ["02", "Misses no more", "Missed faults must not rise above what is running. 4 against 43."],
    ["03", "Cries wolf less", "False alarms under 5%, and at most one point above production. 0% against 15.4%."],
    ["04", "Warns in time", "Only when the environment has a failure clock. This one does not, so the rule is passed as not scored."],
    ["05", "Genuinely better", "Ahead on at least one metric. A tie does not ship."],
  ];
  rules.forEach((r, i) => {
    const y = 2.05 + i * 0.82;
    s.addText(r[0], {
      x: 0.55, y, w: 0.8, h: 0.4,
      fontFace: font, fontSize: 16, color: orange, bold: true, margin: 0,
    });
    s.addText(r[1], {
      x: 1.5, y, w: 3.3, h: 0.4,
      fontFace: font, fontSize: 18, color: ink, bold: true, margin: 0,
    });
    s.addText(r[2], {
      x: 4.9, y, w: 7.8, h: 0.6,
      fontFace: font, fontSize: 15, color: slate, margin: 0,
    });
  });
  s.addText("Go around the screen and call the API on an update this gate refused, and it still answers 409.", {
    x: 0.55, y: 6.35, w: 12.2, h: 0.4,
    fontFace: font, fontSize: 16, color: ink, italic: true, margin: 0,
  });
}

// 6 — An update that was not safe here
{
  const s = pres.addSlide();
  s.background = { color: void_ };
  s.addText("06    THE REFUSAL", {
    x: 0.55, y: 0.42, w: 12, h: 0.3,
    fontFace: font, fontSize: 13, color: orange, bold: true, margin: 0, charSpacing: 1.3,
  });
  s.addText("It refused an update that was\nnot safe on this machine.", {
    x: 0.55, y: 0.95, w: 12, h: 1.5,
    fontFace: font, fontSize: 34, color: white, bold: true, margin: 0,
  });

  s.addText("0", {
    x: 0.55, y: 2.8, w: 3.2, h: 1.15,
    fontFace: font, fontSize: 72, color: white, bold: true, margin: 0,
  });
  s.addText("of 53 faults missed.\nLooks like a win.", {
    x: 3.8, y: 3.05, w: 4, h: 0.8,
    fontFace: font, fontSize: 18, color: mist, margin: 0,
  });
  s.addText("92.9%", {
    x: 0.55, y: 4.15, w: 3.6, h: 1.05,
    fontFace: font, fontSize: 54, color: orange, bold: true, margin: 0,
  });
  s.addText("false alarms on healthy\npasses. It flagged nearly all of them.", {
    x: 4.3, y: 4.3, w: 5.2, h: 0.8,
    fontFace: font, fontSize: 18, color: mist, margin: 0,
  });
  s.addText("The model had memorised the setups on this robot. Healthy and faulty recordings scored the same. The gate refused it, and refused XGBoost the same way. The rules did not move. The cut recipe went in as an input, and the next LightGBM cleared the same gate: 4 of 55 missed, no false alarms.", {
    x: 0.55, y: 5.5, w: 12.2, h: 1.2,
    fontFace: font, fontSize: 16, color: white, margin: 0,
  });
}

// 7 — A person ships it
{
  const s = pres.addSlide();
  s.background = { color: cream };
  s.addText("07", {
    x: 0.5, y: 0.32, w: 0.6, h: 0.26,
    fontFace: font, fontSize: 13, color: slate, bold: true, margin: 0,
  });
  s.addText("THE CLICK", {
    x: 1.15, y: 0.32, w: 5, h: 0.26,
    fontFace: font, fontSize: 13, color: orange, bold: true, margin: 0, charSpacing: 1.4,
  });
  s.addText("The proof does not press Ship.", {
    x: 0.45, y: 0.68, w: 4.2, h: 1.15,
    fontFace: font, fontSize: 26, color: ink, bold: true, margin: 0,
  });
  s.addText("The agent profiles, trains, explains and judges. A person ships the update, and the button lights up only when this machine gets safer.", {
    x: 0.45, y: 2.05, w: 4.15, h: 2.3,
    fontFace: font, fontSize: 16, color: slate, margin: 0,
  });
  s.addText("Ship stays dark until every pinned rule passes.", {
    x: 0.45, y: 4.55, w: 4.15, h: 1.2,
    fontFace: font, fontSize: 16, color: ink, italic: true, margin: 0,
  });
  s.addImage({
    path: path.join(assets, "app-pending.png"),
    x: 4.75, y: 0.85, w: 8.15, h: 5.3,
    sizing: { type: "contain", w: 8.15, h: 5.3 },
    shadow: { type: "outer", color: "000000", blur: 16, opacity: 0.16, offset: 5 },
  });
}

// 8 — The next environment
{
  const s = pres.addSlide();
  s.background = { color: void_ };
  photo(s, "abb-irb-arm.jpg", 0, 0, 5.5, 7.5);
  s.addShape(pres.shapes.RECTANGLE, {
    x: 0, y: 6.9, w: 5.5, h: 0.6,
    fill: { color: void_, transparency: 20 }, line: { color: void_ },
  });
  credit(s, "Projekt ANA, CC BY-SA 3.0", 0.25, 7.08, 5, white);
  s.addText("08    WITH ABB", {
    x: 5.95, y: 0.4, w: 6.8, h: 0.28,
    fontFace: font, fontSize: 13, color: orange, bold: true, margin: 0, charSpacing: 1.3,
  });
  s.addText("Prove it on\nthe next machine.", {
    x: 5.95, y: 0.85, w: 6.9, h: 1.35,
    fontFace: font, fontSize: 32, color: white, bold: true, margin: 0,
  });
  const asks = [
    ["01", "A second cell", "Logs from a weld or assembly cell, so the same rules are tested in a different environment."],
    ["02", "A failure clock", "Recordings that run up to a real breakdown, so warning time is scored instead of left blank."],
    ["03", "A maintenance lead", "One person, one live cell, the Ship click. The log of what they shipped, and what the gate refused, is the deliverable."],
  ];
  asks.forEach((a, i) => {
    const y = 2.45 + i * 1.45;
    s.addText(a[0], {
      x: 5.95, y, w: 0.7, h: 0.32,
      fontFace: font, fontSize: 14, color: orange, bold: true, margin: 0,
    });
    s.addText(a[1], {
      x: 6.7, y, w: 6, h: 0.32,
      fontFace: font, fontSize: 18, color: white, bold: true, margin: 0,
    });
    s.addText(a[2], {
      x: 6.7, y: y + 0.38, w: 6, h: 0.85,
      fontFace: font, fontSize: 14, color: mist, margin: 0,
    });
  });
}

// 9 — Close
{
  const s = pres.addSlide();
  s.background = { color: void_ };
  s.addText("ABB ACCELERATOR 2026", {
    x: 0.6, y: 0.5, w: 8, h: 0.3,
    fontFace: font, fontSize: 13, color: orange, bold: true, margin: 0, charSpacing: 1.4,
  });
  s.addText("See it judged\non the machine.", {
    x: 0.6, y: 1.5, w: 12, h: 1.8,
    fontFace: font, fontSize: 48, color: white, bold: true, margin: 0,
  });
  s.addText("The demo opens on the IRB 6660 result. Ship turns on for LightGBM, and only for LightGBM.", {
    x: 0.6, y: 3.5, w: 11.5, h: 0.55,
    fontFace: font, fontSize: 18, color: mist, margin: 0,
  });
  s.addShape(pres.shapes.RECTANGLE, {
    x: 0.6, y: 4.3, w: 12.1, h: 0.012,
    fill: { color: line }, line: { color: line },
  });
  s.addText("DEMO", {
    x: 0.6, y: 4.55, w: 2, h: 0.26,
    fontFace: font, fontSize: 12, color: orange, bold: true, margin: 0, charSpacing: 1.3,
  });
  s.addText("dhamarit.github.io/promotegate-demo", {
    x: 0.6, y: 4.85, w: 12, h: 0.4,
    fontFace: font, fontSize: 22, color: white, margin: 0,
    hyperlink: { url: "https://dhamarit.github.io/promotegate-demo/" },
  });
  s.addText("CODE", {
    x: 0.6, y: 5.4, w: 2, h: 0.26,
    fontFace: font, fontSize: 12, color: orange, bold: true, margin: 0, charSpacing: 1.3,
  });
  s.addText("github.com/dhamariT/promotegate", {
    x: 0.6, y: 5.7, w: 12, h: 0.4,
    fontFace: font, fontSize: 22, color: white, margin: 0,
    hyperlink: { url: "https://github.com/dhamariT/promotegate" },
  });
  credit(s, "Photographs: Ana 2016, CC BY-SA 4.0 · © Peter Potrowl, CC BY 2.5 · Projekt ANA, CC BY-SA 3.0. Wikimedia Commons.", 0.6, 6.85, 12, mist);
}

pres.writeFile({ fileName: OUT })
  .then(() => console.log("wrote deck"))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });

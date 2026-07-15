import React, { useState, useRef } from "react";

export default function KP3toKP3plus() {
  const [kp3, setKp3] = useState(null); // KP3 firmware v2.0 file
  const [kp3plus, setKp3plus] = useState(null); // KP3+ firmware 1.04 file
  const [combined, setCombined] = useState(null); // output blob after combine
  const [busy, setBusy] = useState(false); // combining in progress
  const [popup, setPopup] = useState(null); // error popup message, null when closed
  const [done, setDone] = useState(false); // combining complete popup

  const canCombine = kp3 && kp3plus && !busy; // both loaded, enable button
  const canDownload = !!combined; // output ready

  // patch table, applicable only to kp3+ 1.04
  // [offset, [expected from bytes], [to bytes]]
  const PATCHES = [
    // tap-range & mute leds
    [0x5ead, [0x26], [0x3b]],
    [0x709f, [0x3b], [0x2c]],
    [0x70db, [0x26], [0x3b]],
    [0xaf73, [0x3b], [0x2c]],
    [0xe037, [0x3b], [0x2c]],
    [0xf0f3, [0x3b], [0x2c]],
    [0xf275, [0x3b], [0x2c]],
    [0x27f72, [0x3b], [0x2c]],
    [0x27f7a, [0x26], [0x3b]],
    [0x3eb9d, [0x3b], [0x2c]],
    // model_sel
    [0x232d, [0x50], [0x10]],
    // power_sw
    [0x0ed2, [0x7e, 0xb6, 0x77, 0x00], [0x04, 0x01, 0x00, 0x00]],
    [0x0ef8, [0x7e, 0xb6, 0x77, 0x00], [0x04, 0x01, 0x00, 0x00]],
    [0x23f0, [0x7e, 0xb6, 0x77, 0x00], [0x04, 0x01, 0x00, 0x00]],
    [0x3546, [0x7e, 0xb6, 0x77, 0x00], [0x04, 0x01, 0x00, 0x00]],
    // power_sw test (power_sw -> tap-range)
    [0x27f5f, [0x15], [0x12]],
    [0x27f5e, [0x2d], [0x2c]],
    // checksum update
    [0x030e, [0x6f, 0x3e], [0x31, 0x85]],
  ];

  // combine: kp3+ base, first 256 bytes from kp3, then patch
  const handleCombine = async () => {
    setBusy(true);
    try {
      const base = new Uint8Array(await kp3plus.arrayBuffer()); // kp3+ copy
      const head = new Uint8Array(await kp3.arrayBuffer()); // kp3 source
      base.set(head.subarray(0, 256), 0); // swap first 256 bytes
      // apply patches, verify from bytes first
      for (const [off, from, to] of PATCHES) {
        for (let i = 0; i < from.length; i++) {
          if (base[off + i] !== from[i]) {
            setPopup("Patch mismatch at 0x" + off.toString(16).toUpperCase());
            setBusy(false);
            return;
          }
        }
        for (let i = 0; i < to.length; i++) base[off + i] = to[i]; // write patch
      }
      setCombined({ data: base, name: "KP3_to_KP3plus.vsb" });
      setDone(true); // combining complete popup
    } catch (e) {
      setPopup("Combine failed");
    }
    setBusy(false);
  };

  // accept only *.vsb with matching version bytes
  // expect: two bytes at offset 42 and 772, per slot
  const validate = async (f, set, expect) => {
    if (!/\.vsb$/i.test(f.name)) {
      setPopup("Invalid extension, must be *.VSB");
      return;
    }
    const buf = new Uint8Array(await f.arrayBuffer());
    // version bytes at both offsets must match
    const ok =
      buf[42] === expect[0] &&
      buf[43] === expect[1] &&
      buf[772] === expect[0] &&
      buf[773] === expect[1];
    if (!ok) {
      setPopup("Invalid firmware version");
      return;
    }
    set(f);
  };

  const download = async () => {
    const blob = new Blob([combined.data], { type: "application/octet-stream" });
    // detect cross-origin iframe, picker is blocked there
    let sandboxed = false;
    try {
      sandboxed = window.self !== window.top;
    } catch (e) {
      sandboxed = true; // access denied means cross-origin frame
    }
    // ask user for destination only when actually usable
    if (window.showSaveFilePicker && !sandboxed) {
      try {
        const handle = await window.showSaveFilePicker({
          suggestedName: combined.name,
          types: [
            { description: "VSB firmware", accept: { "application/octet-stream": [".vsb"] } },
          ],
        });
        const w = await handle.createWritable();
        await w.write(blob);
        await w.close();
        return;
      } catch (e) {
        if (e.name === "AbortError") return; // user cancelled
        // otherwise fall through to classic download
      }
    }
    // fallback, browser without picker or inside sandboxed iframe
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = combined.name;
    a.rel = "noopener";
    document.body.appendChild(a); // must be in dom for some sandboxes
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1500); // revoke after click settles
  };

  return (
    <div style={S.root}>
      <div style={S.card}>
        <header style={S.head}>
          <div style={S.tag}>FIRMWARE UTILITY</div>
          <h1 style={S.title}>
            KP3 <span style={S.arrow}>→</span> KP3+
          </h1>
          <p style={S.sub}>convert your KP3 in to a KP3+</p>
        </header>

        <FileSlot
          index="01"
          label="KP3 Firmware"
          version="V2.0"
          file={kp3}
          onFile={(f) => validate(f, setKp3, [0x02, 0x00])}
        />
        <FileSlot
          index="02"
          label="KP3+ Firmware"
          version="V1.04"
          file={kp3plus}
          onFile={(f) => validate(f, setKp3plus, [0x01, 0x04])}
        />

        <div style={S.actionRow}>
          <button
            style={{ ...S.combine, ...(canCombine ? {} : S.disabled) }}
            disabled={!canCombine}
            onClick={handleCombine}
          >
            {busy ? "Combining…" : "Combine"}
          </button>
        </div>

        <DownloadSlot
          index="03"
          enabled={canDownload}
          file={combined}
          onDownload={download}
        />
      </div>

      {popup && (
        <div style={S.overlay} onClick={() => setPopup(null)}>
          <div style={S.modal} onClick={(e) => e.stopPropagation()}>
            <div style={S.modalMsg}>{popup}</div>
            <button style={S.modalOk} onClick={() => setPopup(null)}>
              Ok
            </button>
          </div>
        </div>
      )}

      {done && (
        <div style={S.overlay} onClick={() => setDone(false)}>
          <div style={S.modalWide} onClick={(e) => e.stopPropagation()}>
            <div style={S.doneTitle}>Combining complete</div>
            <p style={S.doneBody}>
              After flashing the ROM, you must reset the EEPROM for correct
              operation. To do it, power off the KP3, hold [1] + [2] + [SAMPLING]
              and turn on the device. The display will show a blinking{" "}
              <b>"PrLd"</b>. Release the buttons and proceed by pressing{" "}
              [SAMPLE BANK D]. Wait 10 seconds while the display shows{" "}
              <b>"Wrt"</b>, and at the end of the process it will show{" "}
              <b>"PoFF"</b>. Turn the device off and on again, and enjoy your new
              KP3+.
            </p>
            <button style={S.modalOk} onClick={() => setDone(false)}>
              Ok
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// file picker slot
function FileSlot({ index, label, version, file, onFile }) {
  const ref = useRef(null);
  const pick = (e) => {
    const f = e.target.files?.[0];
    if (f) onFile(f);
  };
  return (
    <div style={{ ...S.slot, ...(file ? S.slotFilled : {}) }}>
      <div style={S.slotIdx}>{index}</div>
      <div style={S.slotBody}>
        <div style={S.slotLabel}>
          {label} <span style={S.ver}>{version}</span>
        </div>
        <div style={S.slotFile}>{file ? file.name : "no file selected"}</div>
      </div>
      <button style={S.pick} onClick={() => ref.current?.click()}>
        {file ? "Replace" : "Select"}
      </button>
      <input
        ref={ref}
        type="file"
        accept=".vsb,.VSB"
        style={{ display: "none" }}
        onChange={pick}
      />
    </div>
  );
}

// output slot, disabled until combine done
function DownloadSlot({ index, enabled, file, onDownload }) {
  return (
    <div style={{ ...S.slot, ...(enabled ? S.slotFilled : S.slotOff) }}>
      <div style={{ ...S.slotIdx, ...(enabled ? {} : S.idxOff) }}>{index}</div>
      <div style={S.slotBody}>
        <div style={S.slotLabel}>Combined image</div>
        <div style={S.slotFile}>
          {enabled ? file.name : "available after combining"}
        </div>
      </div>
      <button
        style={{ ...S.pick, ...S.dl, ...(enabled ? {} : S.disabled) }}
        disabled={!enabled}
        onClick={onDownload}
      >
        Download
      </button>
    </div>
  );
}

const ink = "#e8e6df";
const muted = "#7d7a70";
const line = "#2a2925";
const accent = "#e01e1e";

const S = {
  root: {
    minHeight: "100vh",
    background: "#131210",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    fontFamily: "'DM Mono', ui-monospace, 'SF Mono', Menlo, monospace",
    color: ink,
  },
  card: {
    width: "100%",
    maxWidth: 520,
    background: "#1a1916",
    border: `1px solid ${line}`,
    borderRadius: 4,
    padding: 28,
  },
  head: { marginBottom: 26 },
  tag: {
    fontSize: 10,
    letterSpacing: 3,
    color: accent,
    marginBottom: 12,
  },
  title: {
    margin: 0,
    fontSize: 34,
    fontWeight: 500,
    letterSpacing: -1,
    display: "flex",
    alignItems: "center",
    gap: 12,
  },
  arrow: { color: accent, fontWeight: 400 },
  sub: { margin: "8px 0 0", fontSize: 12, color: muted, letterSpacing: 0.5 },
  slot: {
    display: "flex",
    alignItems: "center",
    gap: 14,
    padding: "16px 14px",
    border: `1px solid ${line}`,
    borderRadius: 3,
    marginBottom: 12,
    transition: "border-color .2s, opacity .2s",
  },
  slotFilled: { borderColor: "#3d3b35" },
  slotOff: { opacity: 0.45 },
  slotIdx: {
    fontSize: 11,
    color: accent,
    letterSpacing: 1,
    width: 22,
    flexShrink: 0,
  },
  idxOff: { color: muted },
  slotBody: { flex: 1, minWidth: 0 },
  slotLabel: { fontSize: 13, marginBottom: 4 },
  ver: { color: muted, fontSize: 11, marginLeft: 4 },
  slotFile: {
    fontSize: 11,
    color: muted,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  pick: {
    background: "transparent",
    color: ink,
    border: `1px solid ${line}`,
    borderRadius: 3,
    padding: "8px 14px",
    fontSize: 11,
    letterSpacing: 1,
    cursor: "pointer",
    fontFamily: "inherit",
    flexShrink: 0,
  },
  dl: { borderColor: accent, color: accent },
  actionRow: { margin: "20px 0" },
  combine: {
    width: "100%",
    background: accent,
    color: "#131210",
    border: "none",
    borderRadius: 3,
    padding: "14px 0",
    fontSize: 13,
    letterSpacing: 2,
    fontWeight: 500,
    cursor: "pointer",
    fontFamily: "inherit",
    transition: "opacity .2s",
  },
  disabled: { opacity: 0.3, cursor: "not-allowed" },
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,.6)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  modal: {
    background: "#1a1916",
    border: `1px solid ${accent}`,
    borderRadius: 4,
    padding: "24px 22px",
    maxWidth: 360,
    width: "100%",
    textAlign: "center",
  },
  modalMsg: { fontSize: 13, marginBottom: 20, letterSpacing: 0.5 },
  modalWide: {
    background: "#1a1916",
    border: `1px solid ${accent}`,
    borderRadius: 4,
    padding: "26px 24px",
    maxWidth: 440,
    width: "100%",
    textAlign: "center",
  },
  doneTitle: {
    fontSize: 15,
    letterSpacing: 1,
    color: accent,
    marginBottom: 14,
    textTransform: "uppercase",
  },
  doneBody: {
    fontSize: 12.5,
    lineHeight: 1.7,
    color: ink,
    textAlign: "left",
    margin: "0 0 22px",
  },
  modalOk: {
    background: accent,
    color: "#131210",
    border: "none",
    borderRadius: 3,
    padding: "9px 28px",
    fontSize: 12,
    letterSpacing: 2,
    fontWeight: 500,
    cursor: "pointer",
    fontFamily: "inherit",
  },
};

import { useState } from "react";
import { DrugInteractionPanel } from "./components/DrugInteractionPanel";
import type { ProposedMedication } from "./types";

const scenarios: {
  label: string;
  patientId: string;
  proposedMedication: ProposedMedication;
}[] = [
  {
    label: "No interactions (patient-001 + lisinopril)",
    patientId: "patient-001",
    proposedMedication: { rxNormCode: "29046", name: "lisinopril" },
  },
  {
    label: "Moderate interaction (patient-002 + warfarin)",
    patientId: "patient-002",
    proposedMedication: { rxNormCode: "11289", name: "warfarin" },
  },
  {
    label: "Major interaction (patient-003 + tramadol)",
    patientId: "patient-003",
    proposedMedication: { rxNormCode: "41493", name: "tramadol" },
  },
  {
    label: "Error state (unknown patient)",
    patientId: "patient-error",
    proposedMedication: { rxNormCode: "00000", name: "unknown" },
  },
];

function App() {
  const [scenarioIndex, setScenarioIndex] = useState(0);
  const scenario = scenarios[scenarioIndex];

  return (
    <div
      style={{
        fontFamily: "sans-serif",
        maxWidth: 700,
        margin: "2rem auto",
        padding: "0 1rem",
      }}
    >
      <h1>DrugInteractionPanel — Dev Harness</h1>

      <div
        style={{
          display: "flex",
          gap: "0.5rem",
          flexWrap: "wrap",
          marginBottom: "1.5rem",
        }}
      >
        {scenarios.map((s, i) => (
          <button
            key={i}
            onClick={() => setScenarioIndex(i)}
            style={{
              fontWeight: i === scenarioIndex ? "bold" : "normal",
              cursor: "pointer",
            }}
          >
            {s.label}
          </button>
        ))}
      </div>

      <DrugInteractionPanel
        key={scenarioIndex}
        patientId={scenario.patientId}
        proposedMedication={scenario.proposedMedication}
        onAcknowledge={() => alert("Acknowledged!")}
      />
    </div>
  );
}

export default App;

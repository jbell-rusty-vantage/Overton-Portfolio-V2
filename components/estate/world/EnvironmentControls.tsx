"use client";
import { useState } from "react";
import type { Engine } from "./engine/engine";
import type { EnvironmentState } from "./engine/environment";

export default function EnvironmentControls({ engine }: { engine: Engine }) {
  const [state, setState] = useState(() => engine.getEnvironment());
  const [notice, setNotice] = useState("");
  async function change(value: Partial<EnvironmentState>) {
    await engine.setEnvironment(value);
    const next = engine.getEnvironment();
    setState(next);
    setNotice(value.sound && !next.sound ? "Sound could not start here. You can continue in silence." : "");
  }
  return <fieldset className="tw-environment"><legend>Light and seasons</legend>
    <p>An artistic view of the house through the day and year.</p>
    <label>Daylight<select aria-label="Daylight" value={state.daylight} onChange={event => void change({ daylight: event.target.value as EnvironmentState["daylight"] })}>
      <option value="morning">Morning</option><option value="afternoon">Afternoon</option><option value="dusk">Dusk</option>
    </select></label>
    <label>Season<select aria-label="Season" value={state.season} onChange={event => void change({ season: event.target.value as EnvironmentState["season"] })}>
      <option value="summer">Summer</option><option value="autumn">Autumn</option><option value="winter">Winter</option>
    </select></label>
    <button className="tw-pill" aria-pressed={state.sound} onClick={() => void change({ sound: !state.sound })}>{state.sound ? "Turn off" : "Turn on"} wind and footsteps</button>
    {notice && <p role="status">{notice}</p>}
  </fieldset>;
}

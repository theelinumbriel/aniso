(() => {
  "use strict";

  const ORIGIN_MS = Date.parse("2026-10-14T00:00:00Z");
  const ERA_MS = 24 * 60 * 60 * 1000;
  const TICK_MS = 2500;
  const WORLD = { width: 1000, height: 700 };
  const POPULATION = 36;
  const CALLS = ["A", "NI", "SO"];
  const THREATS = [
    { code: "T–01", name: "SWEEP", response: "SCATTER", color: "#ff3d00" },
    { code: "T–02", name: "PULSE", response: "ANCHOR", color: "#3f68ff" },
    { code: "T–03", name: "SINK", response: "CLUSTER", color: "#11110f" },
  ];

  const elements = {
    canvas: document.querySelector("#world-canvas"),
    stage: document.querySelector("#world-stage"),
    callLayer: document.querySelector("#call-layer"),
    syncStatus: document.querySelector("#sync-status"),
    utcClock: document.querySelector("#utc-clock"),
    eraValue: document.querySelector("#era-value"),
    tickValue: document.querySelector("#tick-value"),
    globalView: document.querySelector("#global-view"),
    agentView: document.querySelector("#agent-view"),
    closeAgent: document.querySelector("#close-agent"),
    eventRows: document.querySelector("#event-rows"),
    matrix: document.querySelector("#signal-matrix"),
    footerSeed: document.querySelector("#footer-seed"),
  };

  const ctx = elements.canvas.getContext("2d");
  let world = null;
  let selectedAgentId = null;
  let canvasSize = { width: 1, height: 1, dpr: 1 };
  let lastUiUpdate = 0;

  function hashString(input) {
    let hash = 2166136261;
    for (let index = 0; index < input.length; index += 1) {
      hash ^= input.charCodeAt(index);
      hash = Math.imul(hash, 16777619);
    }
    return hash >>> 0;
  }

  function mulberry32(seed) {
    let value = seed >>> 0;
    return () => {
      value += 0x6d2b79f5;
      let result = value;
      result = Math.imul(result ^ (result >>> 15), result | 1);
      result ^= result + Math.imul(result ^ (result >>> 7), result | 61);
      return ((result ^ (result >>> 14)) >>> 0) / 4294967296;
    };
  }

  function clamp(value, minimum, maximum) {
    return Math.min(maximum, Math.max(minimum, value));
  }

  function pad(value, length = 2) {
    return String(Math.max(0, Math.floor(value))).padStart(length, "0");
  }

  function normalize(values) {
    const max = Math.max(...values);
    const exponents = values.map((value) => Math.exp((value - max) * 1.7));
    const total = exponents.reduce((sum, value) => sum + value, 0);
    return exponents.map((value) => value / total);
  }

  function weightedChoice(values, rng) {
    const probabilities = normalize(values);
    const roll = rng();
    let cursor = 0;
    for (let index = 0; index < probabilities.length; index += 1) {
      cursor += probabilities[index];
      if (roll <= cursor) return index;
    }
    return probabilities.length - 1;
  }

  function createMatrix(rows, columns, factory) {
    return Array.from({ length: rows }, (_, row) =>
      Array.from({ length: columns }, (_, column) => factory(row, column)),
    );
  }

  function currentUniverseTime(now = Date.now()) {
    const elapsed = Math.max(0, now - ORIGIN_MS);
    const eraIndex = Math.floor(elapsed / ERA_MS);
    const eraStart = ORIGIN_MS + eraIndex * ERA_MS;
    const eraTick = Math.floor((now - eraStart) / TICK_MS);
    const ticksPerEra = Math.floor(ERA_MS / TICK_MS);
    return {
      eraIndex,
      eraNumber: eraIndex + 1,
      eraStart,
      eraTick,
      globalTick: eraIndex * ticksPerEra + eraTick,
      tickProgress: ((now - eraStart) % TICK_MS) / TICK_MS,
    };
  }

  function blankPolicy(rng) {
    return createMatrix(3, 3, () => (rng() - 0.5) * 0.08);
  }

  function createAgent(index, rng, tick, generation = 0, parent = null) {
    const angle = rng() * Math.PI * 2;
    const speed = 1.2 + rng() * 1.8;
    const inheritedProduction = parent
      ? parent.production.map((row) => row.map((value) => value + (rng() - 0.5) * 0.09))
      : blankPolicy(rng);
    const inheritedInterpretation = parent
      ? parent.interpretation.map((row) => row.map((value) => value + (rng() - 0.5) * 0.09))
      : blankPolicy(rng);

    const x = parent ? clamp(parent.x + (rng() - 0.5) * 70, 26, WORLD.width - 26) : 35 + rng() * (WORLD.width - 70);
    const y = parent ? clamp(parent.y + (rng() - 0.5) * 70, 26, WORLD.height - 26) : 35 + rng() * (WORLD.height - 70);

    return {
      id: `A–${pad(index, 3)}`,
      x,
      y,
      previousX: x,
      previousY: y,
      velocityX: Math.cos(angle) * speed,
      velocityY: Math.sin(angle) * speed,
      energy: parent ? 74 + rng() * 12 : 72 + rng() * 27,
      bornTick: parent ? tick : tick - Math.floor(rng() * 1500),
      generation,
      production: inheritedProduction,
      interpretation: inheritedInterpretation,
      state: "OBSERVING",
      stateUntil: tick,
      sent: 0,
      heard: 0,
      interactions: 0,
      successes: 0,
      history: [],
    };
  }

  function initializeWorld(eraIndex) {
    const seed = hashString(`ANISO:PUBLIC:ERA:${eraIndex}:V1`);
    const rng = mulberry32(seed);
    const agents = Array.from({ length: POPULATION }, (_, index) => createAgent(index + 1, rng, 0));

    return {
      eraIndex,
      seed,
      rng,
      tick: 0,
      agents,
      nextAgentNumber: POPULATION + 1,
      threats: [],
      events: [],
      recentCalls: [],
      births: 0,
      deaths: 0,
      calls: 0,
      callCounts: [0, 0, 0],
      association: createMatrix(3, 3, () => 0),
      interactions: 0,
      successfulInteractions: 0,
      lastLiveThreatTick: -1,
    };
  }

  function distance(first, second) {
    return Math.hypot(first.x - second.x, first.y - second.y);
  }

  function recordHistory(agent, entry) {
    agent.history.unshift(entry);
    if (agent.history.length > 36) agent.history.length = 36;
  }

  function setAgentState(agent, state, tick, duration = 6) {
    agent.state = state;
    agent.stateUntil = tick + duration;
  }

  function spawnThreat(state, live) {
    const type = Math.floor(state.rng() * THREATS.length);
    const threat = {
      id: `${state.tick}-${Math.floor(state.rng() * 9999)}`,
      type,
      x: 90 + state.rng() * (WORLD.width - 180),
      y: 85 + state.rng() * (WORLD.height - 170),
      bornTick: state.tick,
      lifespan: 9 + Math.floor(state.rng() * 5),
      intensity: 0.75 + state.rng() * 0.55,
    };
    state.threats.push(threat);

    const candidates = [...state.agents]
      .sort((first, second) => distance(first, threat) - distance(second, threat))
      .slice(0, 2 + (state.rng() > 0.64 ? 1 : 0));

    candidates.forEach((witness) => communicateThreat(state, threat, witness, live));
  }

  function communicateThreat(state, threat, witness, live) {
    if (state.rng() < 0.08) {
      setAgentState(witness, "MISSED THREAT", state.tick, 5);
      return;
    }

    const callIndex = weightedChoice(witness.production[threat.type], state.rng);
    const call = CALLS[callIndex];
    witness.sent += 1;
    witness.interactions += 1;
    state.calls += 1;
    state.callCounts[callIndex] += 1;
    state.association[callIndex][threat.type] += 1;
    state.recentCalls.push({ tick: state.tick, callIndex });
    setAgentState(witness, `CALLING / ${call}`, state.tick, 5);

    const listeners = state.agents
      .filter((agent) => agent.id !== witness.id && distance(agent, witness) < 280)
      .sort((first, second) => distance(first, witness) - distance(second, witness))
      .slice(0, 2 + Math.floor(state.rng() * 4));

    if (live) showCallBubble(witness, call);

    let witnessSuccesses = 0;
    listeners.forEach((listener) => {
      const predictedThreat = weightedChoice(listener.interpretation[callIndex], state.rng);
      const successful = predictedThreat === threat.type;
      const learningRate = successful ? 0.026 : 0.012;

      listener.heard += 1;
      listener.interactions += 1;
      witness.interactions += 1;
      state.interactions += 1;

      if (successful) {
        witnessSuccesses += 1;
        listener.successes += 1;
        witness.successes += 1;
        state.successfulInteractions += 1;
        listener.energy = clamp(listener.energy + 0.52, 0, 120);
        witness.energy = clamp(witness.energy + 0.22, 0, 120);
        listener.interpretation[callIndex][threat.type] += learningRate;
        witness.production[threat.type][callIndex] += learningRate * 0.75;
        setAgentState(listener, THREATS[threat.type].response, state.tick, 7);
      } else {
        listener.energy = clamp(listener.energy - 1.45 * threat.intensity, 0, 120);
        witness.energy = clamp(witness.energy - 0.28, 0, 120);
        listener.interpretation[callIndex][predictedThreat] -= learningRate;
        listener.interpretation[callIndex][threat.type] += learningRate * 0.42;
        witness.production[threat.type][callIndex] -= learningRate * 0.22;
        setAgentState(listener, `WRONG / ${THREATS[predictedThreat].response}`, state.tick, 7);
      }

      const event = {
        tick: state.tick,
        senderId: witness.id,
        receiverId: listener.id,
        call,
        callIndex,
        threatType: threat.type,
        predictedThreat,
        response: THREATS[predictedThreat].response,
        successful,
      };
      state.events.unshift(event);
      if (state.events.length > 90) state.events.length = 90;

      recordHistory(listener, {
        ...event,
        role: "HEARD",
        otherId: witness.id,
      });
      recordHistory(witness, {
        ...event,
        role: "SENT",
        otherId: listener.id,
      });
    });

    if (listeners.length === 0) {
      recordHistory(witness, {
        tick: state.tick,
        role: "SENT",
        call,
        threatType: threat.type,
        successful: false,
        otherId: "—",
        response: "UNHEARD",
      });
    } else if (witnessSuccesses === 0) {
      witness.production[threat.type][callIndex] -= 0.008;
    }
  }

  function replaceAgent(state, agent) {
    const parent = [...state.agents]
      .filter((candidate) => candidate.id !== agent.id)
      .sort((first, second) => second.energy - first.energy)[Math.floor(state.rng() * 5)];
    const replacement = createAgent(
      state.nextAgentNumber,
      state.rng,
      state.tick,
      (parent?.generation ?? 0) + 1,
      parent,
    );
    const index = state.agents.findIndex((candidate) => candidate.id === agent.id);
    state.agents[index] = replacement;
    state.nextAgentNumber += 1;
    state.births += 1;
    state.deaths += 1;
    if (selectedAgentId === agent.id) closeAgentView();
  }

  function moveAgents(state) {
    state.agents.forEach((agent) => {
      agent.previousX = agent.x;
      agent.previousY = agent.y;

      agent.velocityX += (state.rng() - 0.5) * 0.7;
      agent.velocityY += (state.rng() - 0.5) * 0.7;
      const speed = Math.hypot(agent.velocityX, agent.velocityY) || 1;
      const maxSpeed = agent.state.startsWith("WRONG") ? 4.8 : agent.state === "OBSERVING" ? 2.8 : 3.9;
      if (speed > maxSpeed) {
        agent.velocityX = (agent.velocityX / speed) * maxSpeed;
        agent.velocityY = (agent.velocityY / speed) * maxSpeed;
      }

      if (agent.state === "CLUSTER") {
        const centerX = state.agents.reduce((sum, member) => sum + member.x, 0) / state.agents.length;
        const centerY = state.agents.reduce((sum, member) => sum + member.y, 0) / state.agents.length;
        agent.velocityX += (centerX - agent.x) * 0.004;
        agent.velocityY += (centerY - agent.y) * 0.004;
      } else if (agent.state === "SCATTER") {
        const closestThreat = state.threats[0];
        if (closestThreat) {
          agent.velocityX += Math.sign(agent.x - closestThreat.x) * 0.8;
          agent.velocityY += Math.sign(agent.y - closestThreat.y) * 0.8;
        }
      } else if (agent.state === "ANCHOR") {
        agent.velocityX *= 0.54;
        agent.velocityY *= 0.54;
      }

      agent.x += agent.velocityX;
      agent.y += agent.velocityY;

      if (agent.x < 20 || agent.x > WORLD.width - 20) {
        agent.velocityX *= -1;
        agent.x = clamp(agent.x, 20, WORLD.width - 20);
      }
      if (agent.y < 20 || agent.y > WORLD.height - 20) {
        agent.velocityY *= -1;
        agent.y = clamp(agent.y, 20, WORLD.height - 20);
      }

      agent.energy = clamp(agent.energy - 0.0025, 0, 120);
      if (agent.stateUntil <= state.tick) agent.state = "OBSERVING";
    });
  }

  function stepWorld(state, live = false) {
    state.tick += 1;
    moveAgents(state);

    if (state.rng() < 0.12 && state.tick - state.lastLiveThreatTick > 3) {
      spawnThreat(state, live);
      state.lastLiveThreatTick = state.tick;
    }

    state.threats = state.threats.filter((threat) => state.tick - threat.bornTick <= threat.lifespan);
    state.recentCalls = state.recentCalls.filter((entry) => state.tick - entry.tick <= 240);

    if (state.tick % 250 === 0) {
      const vulnerable = state.agents.filter((agent) => agent.energy < 14);
      if (vulnerable.length && state.rng() < 0.18) replaceAgent(state, vulnerable[0]);
    }
    if (state.rng() < 0.000003) {
      replaceAgent(state, state.agents[Math.floor(state.rng() * state.agents.length)]);
    }
  }

  function synchronize(universeTime) {
    elements.syncStatus.textContent = "SYNCHRONIZING";
    world = initializeWorld(universeTime.eraIndex);
    for (let tick = 0; tick < universeTime.eraTick; tick += 1) stepWorld(world, false);
    elements.syncStatus.textContent = "SYNCHRONIZED";
    elements.footerSeed.textContent = `SEED / ${world.seed.toString(16).toUpperCase().padStart(8, "0")}`;
    updateDashboard();
  }

  function updateUniverse() {
    const universeTime = currentUniverseTime();
    if (!world || world.eraIndex !== universeTime.eraIndex) synchronize(universeTime);
    while (world.tick < universeTime.eraTick) stepWorld(world, true);
  }

  function showCallBubble(agent, call) {
    const bubble = document.createElement("span");
    bubble.className = "call-bubble";
    bubble.textContent = call;
    bubble.style.left = `${(agent.x / WORLD.width) * 100}%`;
    bubble.style.top = `${(agent.y / WORLD.height) * 100}%`;
    elements.callLayer.appendChild(bubble);
    window.setTimeout(() => bubble.remove(), 1500);
  }

  function stateColor(agent) {
    if (agent.id === selectedAgentId) return "#dfff00";
    if (agent.state.startsWith("CALLING")) return "#ff3d00";
    if (agent.state.startsWith("WRONG")) return "#ff8b66";
    if (["SCATTER", "ANCHOR", "CLUSTER"].includes(agent.state)) return "#3f68ff";
    return "#11110f";
  }

  function drawThreat(threat, progress) {
    const scaleX = canvasSize.width / WORLD.width;
    const scaleY = canvasSize.height / WORLD.height;
    const x = threat.x * scaleX;
    const y = threat.y * scaleY;
    const age = world.tick - threat.bornTick + progress;
    const life = clamp(age / threat.lifespan, 0, 1);
    ctx.save();
    ctx.globalAlpha = 0.92 - life * 0.45;
    ctx.lineWidth = 2;

    if (threat.type === 0) {
      const width = 18 + life * 75;
      ctx.fillStyle = "rgba(255, 61, 0, 0.14)";
      ctx.fillRect(x - width / 2, 0, width, canvasSize.height);
      ctx.strokeStyle = "#ff3d00";
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvasSize.height);
      ctx.stroke();
    } else if (threat.type === 1) {
      const radius = (20 + life * 110) * ((scaleX + scaleY) / 2);
      ctx.strokeStyle = "#3f68ff";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(x, y, Math.max(5, radius * 0.52), 0, Math.PI * 2);
      ctx.stroke();
    } else {
      const radius = 12 + life * 26;
      ctx.translate(x, y);
      ctx.rotate(Math.PI / 4 + life * 0.8);
      ctx.fillStyle = "#11110f";
      ctx.fillRect(-radius, -radius, radius * 2, radius * 2);
      ctx.strokeStyle = "#f0ede4";
      ctx.strokeRect(-radius * 0.55, -radius * 0.55, radius * 1.1, radius * 1.1);
    }
    ctx.restore();
  }

  function drawAgent(agent, progress) {
    const scaleX = canvasSize.width / WORLD.width;
    const scaleY = canvasSize.height / WORLD.height;
    const x = (agent.previousX + (agent.x - agent.previousX) * progress) * scaleX;
    const y = (agent.previousY + (agent.y - agent.previousY) * progress) * scaleY;
    const radius = agent.id === selectedAgentId ? 7 : 4.7;

    ctx.save();
    if (agent.id === selectedAgentId) {
      ctx.strokeStyle = "#11110f";
      ctx.lineWidth = 2;
      ctx.strokeRect(x - 12, y - 12, 24, 24);
      ctx.fillStyle = "#11110f";
      ctx.font = "bold 9px monospace";
      ctx.fillText(agent.id, x + 15, y - 8);
    }
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fillStyle = stateColor(agent);
    ctx.fill();
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = "#11110f";
    ctx.stroke();
    ctx.restore();
  }

  function renderCanvas(now) {
    if (!world) return;
    const universeTime = currentUniverseTime(now);
    ctx.clearRect(0, 0, canvasSize.width, canvasSize.height);

    world.threats.forEach((threat) => drawThreat(threat, universeTime.tickProgress));
    world.agents.forEach((agent) => drawAgent(agent, universeTime.tickProgress));
  }

  function resizeCanvas() {
    const rect = elements.stage.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvasSize = { width: rect.width, height: rect.height, dpr };
    elements.canvas.width = Math.round(rect.width * dpr);
    elements.canvas.height = Math.round(rect.height * dpr);
    elements.canvas.style.width = `${rect.width}px`;
    elements.canvas.style.height = `${rect.height}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function agreementScore() {
    if (!world) return 0;
    let score = 0;
    THREATS.forEach((_, threatIndex) => {
      const choices = [0, 0, 0];
      world.agents.forEach((agent) => {
        const preference = agent.production[threatIndex];
        const selected = preference.indexOf(Math.max(...preference));
        choices[selected] += 1;
      });
      score += Math.max(...choices) / world.agents.length;
    });
    return score / THREATS.length;
  }

  function callFrequency() {
    const counts = [0, 0, 0];
    world.recentCalls.forEach((entry) => { counts[entry.callIndex] += 1; });
    return counts;
  }

  function formatTickTime(tick) {
    const time = new Date(ORIGIN_MS + world.eraIndex * ERA_MS + tick * TICK_MS);
    return `${pad(time.getUTCHours())}:${pad(time.getUTCMinutes())}:${pad(time.getUTCSeconds())}`;
  }

  function setText(selector, value) {
    const element = document.querySelector(selector);
    if (element) element.textContent = value;
  }

  function renderMatrix() {
    const cells = elements.matrix.querySelectorAll("i");
    let cellIndex = 0;
    CALLS.forEach((_, callIndex) => {
      const rowTotal = world.association[callIndex].reduce((sum, value) => sum + value, 0);
      THREATS.forEach((__, threatIndex) => {
        const percentage = rowTotal ? Math.round((world.association[callIndex][threatIndex] / rowTotal) * 100) : 0;
        const cell = cells[cellIndex];
        cell.textContent = rowTotal ? `${percentage}%` : "–";
        cell.style.setProperty("--heat", String(Math.min(82, percentage * 1.25)));
        cellIndex += 1;
      });
    });
  }

  function renderEvents() {
    const fragment = document.createDocumentFragment();
    const events = world.events.slice(0, 12);
    events.forEach((event) => {
      const row = document.createElement("tr");
      const values = [
        formatTickTime(event.tick),
        event.senderId,
        `<span class="call-chip">${event.call}</span>`,
        event.receiverId,
        `${THREATS[event.threatType].code} / ${THREATS[event.threatType].name}`,
        event.response,
        event.successful ? "USEFUL" : "FAILED",
      ];
      values.forEach((value, index) => {
        const cell = document.createElement("td");
        if (index === 2) cell.innerHTML = value;
        else cell.textContent = value;
        if (index === 6) {
          cell.className = `event-outcome event-outcome--${event.successful ? "good" : "bad"}`;
        }
        row.appendChild(cell);
      });
      fragment.appendChild(row);
    });

    if (!events.length) {
      const row = document.createElement("tr");
      const cell = document.createElement("td");
      cell.colSpan = 7;
      cell.textContent = "THE WORLD IS QUIET. WAITING FOR THE FIRST ENCOUNTER.";
      row.appendChild(cell);
      fragment.appendChild(row);
    }
    elements.eventRows.replaceChildren(fragment);
  }

  function updateDashboard() {
    if (!world) return;
    const usefulRate = world.interactions ? world.successfulInteractions / world.interactions : 0;
    const agreement = agreementScore();
    const recent = callFrequency();
    const recentTotal = recent.reduce((sum, value) => sum + value, 0);
    const survival = world.births + POPULATION
      ? 1 - world.deaths / (world.births + POPULATION)
      : 1;
    const lift = Math.max(0, usefulRate - 1 / 3);

    setText("#stat-population", world.agents.length);
    setText("#stat-births", `+${pad(world.births)} births this era`);
    setText("#stat-survival", `${(survival * 100).toFixed(1)}%`);
    setText("#stat-call-rate", Math.round((recentTotal / 240) * 100));
    setText("#stat-agreement", `${Math.round(agreement * 100)}%`);
    setText("#stat-useful", `${Math.round(usefulRate * 100)}%`);
    setText("#call-total", `${pad(recentTotal, 3)} TOTAL`);
    setText("#count-a", recent[0]);
    setText("#count-ni", recent[1]);
    setText("#count-so", recent[2]);
    setText("#lift-value", `+${(lift * 100).toFixed(1)}%`);

    ["a", "ni", "so"].forEach((call, index) => {
      const bar = document.querySelector(`#bar-${call}`);
      bar.style.width = `${recentTotal ? (recent[index] / recentTotal) * 100 : 0}%`;
    });
    document.querySelector("#lift-marker").style.left = `${Math.min(98, lift * 130)}%`;

    renderMatrix();
    renderEvents();
    if (selectedAgentId) renderAgentView();
  }

  function renderAgentView() {
    const agent = world.agents.find((candidate) => candidate.id === selectedAgentId);
    if (!agent) {
      closeAgentView();
      return;
    }

    const success = agent.interactions ? agent.successes / agent.interactions : 0;
    setText("#agent-title", `AGENT ${agent.id}`);
    setText("#agent-state", agent.state);
    setText("#agent-lineage", `G${pad(agent.generation)}`);
    setText("#agent-age", `${pad(world.tick - agent.bornTick, 4)}T`);
    setText("#agent-energy", Math.round(agent.energy));
    setText("#agent-interactions", pad(agent.interactions, 3));
    setText("#agent-success", `${Math.round(success * 100)}%`);
    setText("#agent-sent", pad(agent.sent, 3));
    setText("#agent-heard", pad(agent.heard, 3));
    document.querySelector("#agent-state-dot").style.background = stateColor(agent);

    const biasContainer = document.querySelector("#agent-biases");
    const biasFragment = document.createDocumentFragment();
    agent.production.forEach((policy, threatIndex) => {
      const group = document.createElement("div");
      group.className = "bias-group";
      const label = document.createElement("b");
      label.textContent = THREATS[threatIndex].code;
      const bars = document.createElement("div");
      bars.className = "bias-bars";
      normalize(policy).forEach((probability, callIndex) => {
        const bar = document.createElement("i");
        bar.style.setProperty("--value", `${Math.round(probability * 100)}%`);
        bar.textContent = `${CALLS[callIndex]} ${Math.round(probability * 100)}`;
        bars.appendChild(bar);
      });
      group.append(label, bars);
      biasFragment.appendChild(group);
    });
    biasContainer.replaceChildren(biasFragment);

    const historyContainer = document.querySelector("#agent-history");
    const historyFragment = document.createDocumentFragment();
    agent.history.slice(0, 14).forEach((entry) => {
      const item = document.createElement("li");
      const time = document.createElement("time");
      time.textContent = formatTickTime(entry.tick);
      const description = document.createElement("span");
      const outcome = entry.successful ? "useful" : "failed";
      description.innerHTML = `${entry.role} <em>${entry.call}</em> ${entry.role === "SENT" ? "to" : "from"} ${entry.otherId} during ${THREATS[entry.threatType].code}. ${entry.response} / ${outcome}.`;
      item.append(time, description);
      historyFragment.appendChild(item);
    });
    if (!agent.history.length) {
      const item = document.createElement("li");
      item.className = "history-empty";
      item.textContent = "NO RECORDED INTERACTIONS YET.";
      historyFragment.appendChild(item);
    }
    historyContainer.replaceChildren(historyFragment);
  }

  function openAgentView(agentId) {
    selectedAgentId = agentId;
    elements.globalView.hidden = true;
    elements.agentView.hidden = false;
    renderAgentView();
  }

  function closeAgentView() {
    selectedAgentId = null;
    elements.agentView.hidden = true;
    elements.globalView.hidden = false;
  }

  function selectNearestAgent(clientX, clientY) {
    const rect = elements.canvas.getBoundingClientRect();
    const pointerX = clientX - rect.left;
    const pointerY = clientY - rect.top;
    let nearest = null;
    let nearestDistance = 18;
    world.agents.forEach((agent) => {
      const x = (agent.x / WORLD.width) * rect.width;
      const y = (agent.y / WORLD.height) * rect.height;
      const delta = Math.hypot(x - pointerX, y - pointerY);
      if (delta < nearestDistance) {
        nearest = agent;
        nearestDistance = delta;
      }
    });
    if (nearest) openAgentView(nearest.id);
  }

  function updateClock(now) {
    const date = new Date(now);
    const universeTime = currentUniverseTime(now);
    elements.utcClock.textContent = `${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}:${pad(date.getUTCSeconds())}`;
    elements.eraValue.textContent = pad(universeTime.eraNumber, 3);
    elements.tickValue.textContent = pad(universeTime.globalTick, 6);
  }

  function frame(now) {
    updateUniverse();
    updateClock(Date.now());
    renderCanvas(Date.now());
    if (now - lastUiUpdate > 900) {
      updateDashboard();
      lastUiUpdate = now;
    }
    window.requestAnimationFrame(frame);
  }

  elements.canvas.addEventListener("click", (event) => selectNearestAgent(event.clientX, event.clientY));
  elements.canvas.tabIndex = 0;
  elements.canvas.addEventListener("keydown", (event) => {
    if (!["ArrowLeft", "ArrowRight", "Enter"].includes(event.key) || !world) return;
    event.preventDefault();
    const currentIndex = world.agents.findIndex((agent) => agent.id === selectedAgentId);
    const direction = event.key === "ArrowLeft" ? -1 : 1;
    const nextIndex = currentIndex < 0 ? 0 : (currentIndex + direction + world.agents.length) % world.agents.length;
    openAgentView(world.agents[nextIndex].id);
  });
  elements.closeAgent.addEventListener("click", closeAgentView);

  const resizeObserver = new ResizeObserver(resizeCanvas);
  resizeObserver.observe(elements.stage);
  resizeCanvas();

  const initialTime = currentUniverseTime();
  synchronize(initialTime);
  window.requestAnimationFrame(frame);
})();

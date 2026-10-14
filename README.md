# ANISO

ANISO is a public, observer-only simulation of a population learning to communicate with three initially unassigned calls: `a`, `ni`, and `so`.

The first interface is a deterministic static observatory. Every visitor derives the same era, tick, population, events, and learned policies from UTC time and a shared seed. Visitors can inspect dots but cannot pause, restart, accelerate, or otherwise alter the world.

## Run locally

```sh
python3 -m http.server 4173
```

Then open `http://localhost:4173`.

## Model status

This is an interface and model prototype, not a claim about the historical evolution of human language. The three threat labels describe visual geometry, while call–threat associations emerge from agent reinforcement and begin without a built-in dictionary.

See [BRIEFING.md](./BRIEFING.md) for the research framing and future experiment plan.

# aniso

## Project briefing

**Working idea:** a public artificial-life simulation in which a population of small, visibly embodied agents begins with only three possible vocal units—`a`, `ni`, and `so`—and must survive, coordinate, learn, reproduce, and transmit conventions. Visitors watch whether the population develops stable call meanings, sequences, local dialects, or something that deserves to be called compositional communication.

**Short verdict:** this is a strong simulation concept. It connects animal communication, signaling games, iterated learning, cultural evolution, and artificial life in a way that can be both scientifically interesting and immediately legible to the public. The important qualification is that it would not simulate *how human language actually evolved*. It would test narrower questions about the conditions under which a small signal repertoire can acquire shared, productive structure.

The name contains the experiment: `a` + `ni` + `so` = `aniso`.

### Locked direction for version one

- Agents are abstract dots, not depicted as literal vervets.
- The site is an observatory, not a game or configurable sandbox.
- Every visitor watches the same world advancing on one universal clock.
- Visitors cannot pause, restart, accelerate, intervene, or change parameters.
- The world contains three threat classes and three available calls: `a`, `ni`, and `so`.
- Calls begin with no assigned meanings or privileged links to threats.
- A universal dashboard reports population-level behavior and communication evidence.
- Clicking a dot opens its current state, lifetime statistics, and timestamped interaction history without affecting the simulation.

---

## 1. The central question

> Under what conditions do three initially limited calls become a shared and extensible communication system?

That question can be separated into observable milestones:

1. **Signal use:** agents call in non-random ways.
2. **Information:** hearing a call improves another agent's action relative to silence.
3. **Convention:** a mapping is shared across much of the population, rather than existing only inside one pair.
4. **Combination:** sequences such as `a-ni` or `so-a` acquire functions that cannot be reduced to repetition.
5. **Productivity:** agents successfully use familiar parts in a novel situation or combination.
6. **Transmission:** new agents learn the system, and it survives population turnover.
7. **Open-ended change:** conventions split, merge, drift, simplify, or form dialects as ecology and social structure change.

The simulation should not assume that the last steps will occur. A run in which three calls stabilize but never combine is a valid—and theoretically interesting—result.

## 2. Why vervets are a useful inspiration, with a caveat

Classic playback experiments found that vervet monkeys produce acoustically different alarm calls in predator contexts and that listeners respond with predator-appropriate behavior. This is the source of the familiar shorthand: leopard, eagle, and snake calls ([Seyfarth, Cheney & Marler, 1980](https://pubmed.ncbi.nlm.nih.gov/7433999/)).

But `aniso` should avoid presenting vervet calls as three literal words. Later quantitative work found that some acoustically similar calls also occur in aggressive social contexts and emphasized that it is difficult to infer human-like semantic reference or voluntary vocal production from behavioral response alone ([Price et al., 2015](https://pmc.ncbi.nlm.nih.gov/articles/PMC4541072/)). Recent playback work also shows that vervets combine a call with contextual information when deciding how strongly to respond ([Fischer et al., 2023](https://pmc.ncbi.nlm.nih.gov/articles/PMC10345060/)).

So the scientifically honest framing is:

- vervets motivate a small, behaviorally important call repertoire;
- the model is an invented evolutionary sandbox, not a digital vervet colony;
- the interesting bridge is from signals and context to learned conventions—not a claim that vervet calls are already words.

This caveat actually improves the project. Context, caller identity, trust, urgency, and ambiguity can be part of the world rather than treated as noise around fixed dictionary meanings.

## 3. The most promising model

### World

A small two-dimensional environment contains a population of agents, food, shelter, terrain, and intermittent threats. Each agent sees only a local, noisy slice of the world. This asymmetry creates a reason to communicate: one agent may see a threat that another cannot.

Threats should demand meaningfully different responses. For example:

- an aerial threat rewards cover or looking up;
- a terrestrial ambush threat rewards climbing or grouping;
- a ground-level threat rewards stopping and inspecting nearby terrain.

These are inspired by the classic vervet setup, but the public interface can give the threats fictional visual identities. This makes clear that `aniso` is a model and avoids turning a stylized setup into a zoological claim.

After the core works, add compound situations: threat type × direction × distance × urgency, or threat plus food. A larger *meaning space* is crucial. If the world contains only three recurring states, three atomic calls are already sufficient and there is little pressure for anything richer to emerge.

### Communication channel

The only vocal units are:

```text
a    ni    so
```

Initially, an agent can emit one unit or remain silent. In the combination condition, it can emit sequences up to length three. That yields 39 possible non-empty forms from only three units: 3 of length one, 9 of length two, and 27 of length three.

The simulation should not attach built-in English glosses to those forms. Each agent instead has a learned probability distribution for:

- what to emit given its private perception and internal state; and
- what action to take given a message, local context, caller identity, and memory.

The public universe begins from a **blank slate**: the three calls have no initial mapping at all. Production and interpretation begin approximately uniform, with stochastic exploration. Any later association between a call and a threat, context, or response is therefore an outcome of learning and population history rather than a built-in label.

A vervet-seeded condition may still be useful as an offline comparison experiment, but it is not the public world's starting condition.

### Agents

For the first version, small transparent agents are preferable to large language models. Each agent can have:

- an encoder: probabilities of producing each message in each perceived state;
- a decoder: probabilities of actions after each message and context;
- a short episodic memory;
- a social memory for the reliability of recent callers;
- energy, age, and reproductive success;
- learning rate, exploration rate, and memory capacity, some of which may be inherited with mutation.

Tabular policies or small neural networks are enough. Agents learn through the consequences of episodes: survival, food, wasted action, helping kin or neighbors, and signal cost. A softmax choice rule gives controlled behavioral variation without making the system opaque.

### Two evolutionary loops

The design becomes much stronger if it separates:

- **within-life cultural learning:** agents reinforce, imitate, forget, and negotiate conventions; and
- **between-generation biological change:** successful agents leave more descendants, with small mutations to learning biases or cognitive capacities.

The first loop can produce rapid dialect change. The second asks slower questions about which capacities make a communication system sustainable. The interface should show them separately so that cultural change is not mislabeled as genetic evolution.

## 4. Where stochasticity belongs

Stochasticity should be explicit, independently controllable, and reproducible from a seed. It is not merely decorative chaos. Work on historical language change treats random drift as a serious null process that must be distinguished from selection ([Newberry et al., 2017](https://www.nature.com/articles/nature24455)).

Useful sources of randomness include:

| Source | Model parameter | Question it tests |
|---|---|---|
| Sensory uncertainty | probability of misclassifying a situation | Can calls correct incomplete perception? |
| Production error | token substitution, deletion, or duplication | Do robust and redundant forms win? |
| Perception error | probability of mishearing a token | Do more distinguishable sequences stabilize? |
| Exploration | softmax temperature | Is innovation possible without destroying conventions? |
| Memory/learning noise | forgetting and imperfect copying | Does transmission simplify the system? |
| Demographic drift | finite population and random death | Can dialects arise without an adaptive advantage? |
| Network randomness | migration and changing interaction partners | When do local conventions merge or fragment? |
| Ecological variation | shifting threat frequencies | Does meaning track utility, frequency, or history? |

Only one or two of these should vary in an initial experiment. If everything is random at once, an interesting run will be hard to explain.

## 5. What could plausibly emerge

These are hypotheses, not promised features:

- **Three stable alarms.** The simplest equilibrium is one signal per broad situation or response.
- **Urgency through repetition.** `a-a` may become an intensified version of `a`.
- **A reusable modifier.** One unit may come to encode something like “near,” “left,” or “urgent” across several messages.
- **Order sensitivity.** `a-ni` and `ni-a` may produce different responses.
- **Holistic compounds.** `a-ni` may acquire an unrelated meaning. This is combination, but not compositionality.
- **Context-dependent pragmatics.** A call may mean different things depending on terrain, caller identity, or recent events.
- **Caller reputations and deception.** Receivers may discount unreliable agents; bluffing may flourish only under particular payoff structures.
- **Dialects.** Spatially separated groups may converge internally while assigning different functions to the same forms.
- **Regularization after turnover.** New learners with limited exposure may compress an inconsistent system into a more learnable one.
- **Collapse to silence.** If calls are costly, listeners cannot benefit, or interests are misaligned, communication may never stabilize.

A key distinction for the public explanation: a long message inventory is not automatically a language. `a`, `ni`, and `so` can produce many sequences through brute-force memorization. The stronger result is **systematic reuse**: the same piece contributes a related effect across messages, and agents generalize it to combinations they have not encountered.

## 6. Research directions

### A. From calls to combinations

Compare single-token and sequence-enabled populations as the number of relevant world states grows. The prediction is not simply “sequences win.” Models of animal communication suggest that stable combinatorial systems require specific evolutionary pathways and may be difficult to reach ([Scott-Phillips & Blythe, 2013](https://pmc.ncbi.nlm.nih.gov/articles/PMC3785817/)). Failed transitions are therefore valuable data.

### B. Cultural bottlenecks

Let juveniles observe only a sample of adult interactions before acting on their own. Iterated-learning experiments show that repeated cultural transmission can make systems easier to learn and more structured ([Kirby, Cornish & Smith, 2008](https://www.pnas.org/doi/full/10.1073/pnas.0707835105)).

The central tension should be between:

- **compressibility:** short, regular systems are easier to learn; and
- **expressivity:** distinct situations need distinct messages.

Laboratory and simulation work finds that combining transmission with communicative use can produce a tradeoff between these pressures ([Kirby et al., 2015](https://doi.org/10.1016/j.cognition.2015.03.016)).

### C. Social topology and dialects

Compare a well-mixed population with families, neighborhoods, migration, prestige bias, or conformist copying. Measure whether conventions become global, remain local, or repeatedly split and merge.

### D. Cooperation, conflict, and trust

Begin with aligned payoffs, where caller and listener both benefit from an accurate response. Later introduce food competition, mating competition, kin selection, or agents who benefit when others flee. This lets honesty and reputation emerge as problems rather than hard-coded moral traits.

### E. Novelty and productivity

Hold out some combinations during learning—for example, agents encounter “near aerial threat” and “far terrestrial threat,” but not “far aerial threat.” Then introduce the missing combination. Success shows generalization; analysis of the message parts asks whether that success was compositional. These must be measured separately: high task generalization does not by itself prove a compositional code ([Chaabouni et al., 2020](https://aclanthology.org/2020.acl-main.407/)).

### F. Selection versus drift

Replay the same ecology across many random seeds and compare observed changes with neutral controls where synonymous forms have equal payoffs. This guards against telling an adaptive story about a convention that became common by chance.

## 7. How to measure “they started communicating”

No single score should decide this. The dashboard should combine behavioral, informational, social, and structural measures.

| Measure | What it establishes |
|---|---|
| Reward/survival lift over a no-message control | Messages have causal utility |
| Receiver intervention test | Changing only the heard message changes behavior |
| Mutual information: message ↔ world state | Messages carry information about observed conditions |
| Mutual information: message ↔ receiver action | Messages predict coordinated responses |
| Population agreement | Different agents use and interpret forms similarly |
| Cross-partner success | Conventions work beyond familiar pairs |
| Held-out combination success | The system supports novel cases |
| Form–meaning similarity | Similar meanings tend to have systematically similar messages |
| Unit contribution analysis | A token has a stable effect across different messages |
| Learnability by newborns | The system survives transmission |
| Ablation of calls or order | Identifies whether tokens and sequence order actually matter |

All comparisons should be distributions over many seeded runs, not a single captivating trajectory. The public view can spotlight a live run while linking it to the batch result: “This happened in 18 of 100 comparable worlds.”

## 8. The public experience

The interface should make the mechanism inspectable without pretending to translate agent thought.

### Main view

- a small animated world with agents represented as dots, plus abstract threats, food, and shelter;
- visible call bubbles containing only `a`, `ni`, and `so`;
- a universal clock showing world age, tick, era, and current generation;
- a clear “LIVE” state, with no play, pause, speed, reset, or parameter controls;
- identical world state and time for every visitor.

### Agent inspector

Clicking an agent shows:

- stable agent ID and visual marker;
- age, energy, fitness, lineage, and current behavioral state;
- current perception and uncertainty;
- the message it emitted and alternatives it considered;
- how it currently reacts to recent messages;
- calls sent and heard, response success, and survival history;
- parentage and learning history;
- a timestamped ledger of encounters: observed threat, call sent or heard, interaction partner, response, and outcome.

### Population panels

- **Emergent lexicon:** empirically inferred associations such as “`ni-a` occurred mostly before upward-cover actions,” labeled as correlations rather than translations.
- **Conversation/event log:** message, context, listener response, and outcome.
- **Language map:** clusters of agents with similar encoders/decoders.
- **Timeline:** first stable convention, first novel sequence, dialect split, migration, and extinction.
- **Evidence panel:** communication lift, agreement, information, and generalization over time.
- **Universal statistics:** population, births, deaths, mean age, threat frequency, survival rate, calls per interval, call frequencies, silence rate, and communication success.

The default dashboard remains population-wide. Selecting a dot replaces or overlays the right-hand panel with that agent's record; closing it returns to the universal statistics. Selection is purely observational and never changes the agent's behavior.

Important historical moments and agents should have stable permalinks. These links open an archived read-only view of the relevant state and event history, while the main observatory always returns to the live universal clock.

## 9. A disciplined first experiment

Build the smallest experiment that can falsify the exciting story.

### Fixed setup

- 30–60 agents;
- three broad threat/action classes;
- additional variation in distance and direction;
- local, noisy perception;
- `a`, `ni`, and `so`, with silence as an option;
- messages of one to three units;
- small cost per emitted unit;
- reinforcement within a lifetime;
- death, birth, limited juvenile observation, and imperfect copying;
- deterministic seeded random-number generation.

### Four conditions

1. **No communication:** establishes the ecological baseline.
2. **Three atomic calls only:** tests convention formation.
3. **Sequences, no turnover:** tests whether interaction alone produces useful combinations.
4. **Sequences plus turnover/bottleneck:** tests whether cultural transmission changes structure and learnability.

Run at least dozens of seeds per condition. Before looking at outcomes, define thresholds for causal utility, population agreement, and held-out generalization. Record every event so any metric can be recomputed.

### Success for version one

Version one succeeds if it can reliably show all of the following, even if compositionality never appears:

- visitors can understand why a message helped or failed;
- agents form population-level conventions in at least some parameter region;
- convention formation disappears or weakens in the appropriate control;
- results are reproducible by seed;
- the data distinguish useful communication from coincidental correlation;
- different runs visibly demonstrate both selection and drift.

## 10. Suggested technical shape

For a public web simulation:

- run the core model as one authoritative deterministic process on the server;
- advance it from a monotonic universal tick rather than any visitor's browser clock;
- stream snapshots and events to read-only clients, with reconnect and catch-up behavior;
- keep simulation rules independent of rendering;
- render the world with Canvas or PixiJS;
- store events in an append-only log and derive the UI from that log;
- export run metadata and event histories as JSON/CSV;
- use a separate batch runner for offline many-seed experiments and regression tests;
- checkpoint the world so the universal simulation can recover without resetting its history;
- version the rules so archived moments remain interpretable after software changes.

The research logic should remain simple enough that a complete episode can be inspected. More complex neural agents can be an optional later track, not the foundation.

## 11. Claims to avoid

Do not say:

- “we recreated the evolution of human language”;
- “the agents invented words” solely because a message correlates with an event;
- “vervet calls are three words”;
- “a compositional language emerged” without held-out tests and unit-level analysis;
- “selection caused this change” without comparison to stochastic drift;
- “the agents wanted/understood/meant X” when the evidence supports only a policy or behavioral association.

Better language is: “In this model, under these assumptions, this population developed a stable signal convention that improved coordination.”

## 12. Recommended direction

Start `aniso` as a **transparent cultural-evolution observatory**, not as a general AI society. The hook is charming little agents calling `a`, `ni`, and `so`; the substance is the ability to watch conventions form, drift, combine, and pass between generations—and to test whether an apparent language-like pattern survives intervention and replication.

The most compelling initial research question is:

> Does the combination of communicative pressure and generational learning produce reusable structure that neither pressure produces alone?

That question is narrow enough to implement and measure, but rich enough to lead into dialects, deception, kinship, migration, ecological change, and eventually more open-ended forms of communication.

---

## Selected starting literature

- Seyfarth, R. M., Cheney, D. L., & Marler, P. (1980). [Monkey responses to three different alarm calls: evidence of predator classification and semantic communication](https://pubmed.ncbi.nlm.nih.gov/7433999/). *Science*.
- Price, T. et al. (2015). [Vervets revisited: a quantitative analysis of alarm call structure and context specificity](https://pmc.ncbi.nlm.nih.gov/articles/PMC4541072/). *Scientific Reports*.
- Nowak, M. A., & Krakauer, D. C. (1999). [The evolution of language](https://pmc.ncbi.nlm.nih.gov/articles/PMC22182/). *PNAS*. Introduces an evolutionary-game account of signal/object mappings, error limits, word formation, and simple grammar.
- Steels, L. (1995). [A self-organizing spatial vocabulary](https://pubmed.ncbi.nlm.nih.gov/8925502/). *Artificial Life*. A foundational model of distributed agents forming shared conventions.
- Kirby, S., Cornish, H., & Smith, K. (2008). [Cumulative cultural evolution in the laboratory](https://www.pnas.org/doi/full/10.1073/pnas.0707835105). *PNAS*.
- Kirby, S., Tamariz, M., Cornish, H., & Smith, K. (2015). [Compression and communication in the cultural evolution of linguistic structure](https://doi.org/10.1016/j.cognition.2015.03.016). *Cognition*.
- Scott-Phillips, T. C., & Blythe, R. A. (2013). [Why is combinatorial communication rare in the natural world, and why is language an exception to this trend?](https://pmc.ncbi.nlm.nih.gov/articles/PMC3785817/). *Journal of the Royal Society Interface*.
- Newberry, M. G., Ahern, C. A., Clark, R., & Plotkin, J. B. (2017). [Detecting evolutionary forces in language change](https://www.nature.com/articles/nature24455). *Nature*.
- Chaabouni, R. et al. (2020). [Compositionality and generalization in emergent languages](https://aclanthology.org/2020.acl-main.407/). *ACL*.

import {
  checkingComposer,
  unavailableHarnessComposer,
  unqualifiedComposer,
} from './fixtures'
import { accepted, base, readyContext, readyWithComposer } from './scenarioBase'
import type { ScenarioDefinition } from './scenarios'

const DRAFT = 'Review the delivery queue'

/** Centered composer/sidebar redraw scenarios (HarflowDesign 19365d9). */
export const CENTERED_SCENARIOS: readonly ScenarioDefinition[] = [
  base({
    id: 'composer-loading',
    label: 'Composer loading',
    description:
      'Centered-loading: qualification checking; Start gated (Design 19365d9).',
    context: readyWithComposer(checkingComposer()),
    startOutcome: accepted,
    holdStart: false,
    seed: { prompt: DRAFT },
  }),
  base({
    id: 'composer-unqualified',
    label: 'Composer unqualified',
    description:
      'Centered-unqualified: no qualified harness; Start gated (Design 19365d9).',
    context: readyWithComposer(unqualifiedComposer()),
    startOutcome: accepted,
    holdStart: false,
    seed: { prompt: DRAFT },
  }),
  base({
    id: 'composer-invalid',
    label: 'Composer invalid',
    description:
      'Centered-invalid: turns=0 with options open (Design 19365d9).',
    context: readyContext(),
    startOutcome: accepted,
    holdStart: false,
    seed: { prompt: DRAFT, turns: '0', optionsOpen: true },
  }),
  base({
    id: 'composer-starting',
    label: 'Composer starting',
    description:
      'Centered-starting: in-flight Start; no duplicate submit (Design 19365d9).',
    context: readyContext(),
    startOutcome: accepted,
    holdStart: true,
    seed: { prompt: DRAFT, autoSubmit: true },
  }),
  base({
    id: 'composer-refused',
    label: 'Composer refused',
    description:
      'Centered-refused: refuse code+reason; draft preserved (Design 19365d9).',
    context: readyContext(),
    startOutcome: {
      kind: 'refused',
      code: 'invalid_params',
      reason: 'fixture refusal',
    },
    holdStart: false,
    seed: { prompt: DRAFT, autoSubmit: true },
  }),
  base({
    id: 'composer-options-closed',
    label: 'Composer options closed',
    description:
      'Centered-options-closed: customized effort, options collapsed (Design 19365d9).',
    context: readyContext(),
    startOutcome: accepted,
    holdStart: false,
    seed: { prompt: DRAFT, effort: 'high', optionsOpen: false },
  }),
  base({
    id: 'composer-harness-open',
    label: 'Composer harness open',
    description:
      'Centered-harness-open: unavailable harness selected; hint in menu (Design 19365d9).',
    context: readyWithComposer(unavailableHarnessComposer()),
    startOutcome: accepted,
    holdStart: false,
    seed: { prompt: DRAFT, openMenu: 'harness' },
  }),
  base({
    id: 'sidebar-collapsed',
    label: 'Sidebar collapsed',
    description:
      'Centered-collapsed sidebar rail (Design 19365d9 sidebar/centered-collapsed).',
    context: readyContext(),
    startOutcome: accepted,
    holdStart: false,
    seed: { sidebarCollapsed: true },
  }),
  base({
    id: 'sidebar-minimum',
    label: 'Sidebar minimum',
    description:
      'Centered-minimum 1000×620 frame (Design 19365d9 sidebar/centered-minimum).',
    context: readyContext(),
    startOutcome: accepted,
    holdStart: false,
    seed: { frame: 'minimum' },
  }),
]

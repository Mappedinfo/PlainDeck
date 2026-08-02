import deckJson from '../../examples/starter/deck.json'
import themeJson from '../../examples/starter/theme.json'
import introJson from '../../examples/starter/slides/001-intro.json'
import threeWaysJson from '../../examples/starter/slides/002-three-ways.json'
import workflowJson from '../../examples/starter/slides/003-workflow.json'
import compareJson from '../../examples/starter/slides/004-compare.json'
import boundariesJson from '../../examples/starter/slides/005-boundaries.json'
import { assertDocument, ThemeSchema, type DeckDocument } from 'plaindeck/core'

export const defaultTheme = ThemeSchema.parse(themeJson)

export function createSampleDocument(): DeckDocument {
  return assertDocument(structuredClone({
    deck: deckJson,
    theme: themeJson,
    slides: {
      './slides/001-intro.json': introJson,
      './slides/002-three-ways.json': threeWaysJson,
      './slides/003-workflow.json': workflowJson,
      './slides/004-compare.json': compareJson,
      './slides/005-boundaries.json': boundariesJson,
    },
  }))
}

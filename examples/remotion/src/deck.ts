import { assertDocument } from 'plaindeck/core'
import deck from '../../starter/deck.json'
import theme from '../../starter/theme.json'
import intro from '../../starter/slides/001-intro.json'
import threeWays from '../../starter/slides/002-three-ways.json'
import workflow from '../../starter/slides/003-workflow.json'
import compare from '../../starter/slides/004-compare.json'
import boundaries from '../../starter/slides/005-boundaries.json'

export const document = assertDocument({
  deck,
  theme,
  slides: {
    './slides/001-intro.json': intro,
    './slides/002-three-ways.json': threeWays,
    './slides/003-workflow.json': workflow,
    './slides/004-compare.json': compare,
    './slides/005-boundaries.json': boundaries,
  },
})

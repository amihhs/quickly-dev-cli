import { startCli } from './cli'
import { handleError } from './errors'

startCli().catch(handleError)

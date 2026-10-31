import {api,json} from '../../../lib/cms';
import {publicTemples} from '../../../lib/temples';
export const dynamic='force-dynamic';
export function GET(){return api(async()=>json({temples:await publicTemples()}));}

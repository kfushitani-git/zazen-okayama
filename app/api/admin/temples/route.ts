import {api,requireEditor,json} from '../../../../lib/cms';
import {adminTemples} from '../../../../lib/temples';
export const dynamic='force-dynamic';
export function GET(){return api(async()=>{await requireEditor();return json({temples:await adminTemples()});});}

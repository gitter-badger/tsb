import * as sw from "../../utils/simpleWorker";
import * as contract from "./fileListingContract";

import {TypedEvent} from "../../../common/events";
import * as workingDir from "../../disk/workingDir";

export var filePathsUpdated = new TypedEvent<{ filePaths: string[] }>();
export var fileChangedOnDisk = new TypedEvent<{filePath:string}>();

namespace Master {
    export var increment: typeof contract.master.increment = (q) => {
        return Promise.resolve({
            num: ++q.num
        });
    }
    /** warning, this function is named differently from the event filePathsUpdated for a reason */
    export var fileListUpdated: typeof contract.master.fileListUpdated = (q) => {
        let filePaths =  q.relativeFilePaths.map(rfp => workingDir.makeAbsolute(rfp));
        filePathsUpdated.emit({ filePaths });

        return Promise.resolve({});
    }
    export var fileChanged: typeof contract.master.fileChanged = (q) => {
        fileChangedOnDisk.emit({ filePath: q.filePath });
        return Promise.resolve({});
    }
}

// Ensure that the namespace follows the contract
var _checkTypes: typeof contract.master = Master;
// launch worker
export var {worker} = sw.startWorker(__dirname + '/fileListingWorker', contract.worker, Master);

export function start() {
    worker.setupWatch({ directory: workingDir.getProjectRoot() });
}

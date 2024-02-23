import { exec, spawn } from "child_process";
import path from "path";

export function buildProject(id: string) {
    return new Promise((resolve) => {
        //execute ==exec
        const child = exec(`cd ${path.join(__dirname, `output/${id}`).replace(/\\/g,'/')} && npm install && npm run build`)
        child.stdout?.on('data', function(data) {
            console.log('stdout: ' + data);
        });
        child.stderr?.on('data', function(data) {
            console.log('stderr: ' + data);
        });

        child.on('close', function(code) {
            //when we enter here means npm install and npm run is finished
           resolve("")
        });

    })
}
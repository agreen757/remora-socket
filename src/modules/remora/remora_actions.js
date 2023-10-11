const { spawn, fork } = require("child_process");
const path = require("path");
const childProcesses = {}; // Object to store named child processes.

function runActor(name, start, stop, inputData, socket) {
  // Check if the 'start' parameter is provided and the child process is not already running.
  //console.log(start, inputData);
  if (start && !childProcesses[name]) {
    console.log("attempting to spawn process...");
    // Spawn a child process to run the 'foo' actor with input data.
    /*const actorProcess = spawn("node", [
      "start_actor.js",
      JSON.stringify(inputData),
    ]);*/
    const actorProcess = fork(path.join(__dirname, "start_actor.js"), {
      silent: false,
    });
    console.log("sending message to process");
    actorProcess.send({ input: inputData, name: name });

    // Store the child process object using the provided name.
    childProcesses[name] = actorProcess;

    //listen to child process messages
    actorProcess.on("message", async (message) => {
      console.log("message from process: ", message);
      let obj = {
        reason: "campaign_posts_data",
        campaignName: name,
        posts: message,
      };

      //send message to client
      await socket.send(JSON.stringify(obj));
    });

    // Listen for exit events to handle the 'stop' parameter.
    actorProcess.on("exit", (code, signal) => {
      if (stop) {
        // Perform cleanup and remove the child process from the object.
        delete childProcesses[name];
        actorProcess.kill(signal);
      }
    });
  }
}

// Function to stop a named child process.
function stopActor(name) {
  const actorProcess = childProcesses[name];
  if (actorProcess) {
    // Kill the child process and remove it from the object.
    actorProcess.kill("SIGTERM");
    delete childProcesses[name];
  }
}

module.exports = { runActor, stopActor };

const { spawn, fork } = require("child_process");
const path = require("path");
const childProcesses = {}; // Object to store named child processes.

function runActor(name, inputData, socket) {
  // Check if the 'start' parameter is provided and the child process is not already running.
  //console.log(start, inputData);
  if (!childProcesses[name]) {
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
    childProcesses[name].socket = socket;

    //listen to child process messages
    actorProcess.on("message", async (message) => {
      //console.log("message from process: ", message);

      //sort message by date
      message.sort((a, b) => {
        return new Date(b.time) - new Date(a.time);
      });

      let obj = {
        reason: "campaign_posts_data",
        campaignName: name,
        posts: message,
      };

      //send message to client
      await childProcesses[name].socket.send(JSON.stringify(obj));
    });

    
  }
}

// Function to stop a named child process.
function stopActor(name) {
  return new Promise(async (resolve, reject) => {
    const actorProcess = childProcesses[name];
    if (actorProcess) {
      // Kill the child process and remove it from the object.
      await actorProcess.kill(1);
      //remove from childProcesses object
      delete childProcesses[name];
      console.log('killed actor process ',name);
      console.log(childProcesses,' running child processes')
    }
    resolve(name);
  });
}

module.exports = { runActor, stopActor };

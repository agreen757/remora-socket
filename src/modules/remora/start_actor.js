// foo-actor.js
import { APIFY_TOKEN } from "./config";

async function runFooActor(inputData) {
  const { ApifyClient } = require("apify-client");
  const apifyClient = new ApifyClient({
    token: APIFY_TOKEN,
  });
  // Parse the input data from command line arguments.
  let campaign_name = inputData.name;
  //const apifyClient = new Apify.Client();
  console.log("in the spawn..");
  console.log(campaign_name);
  try {
    // Execute the actor with input data.
    const run = await apifyClient.actor("iwwlxZ8AOjOGwEDKj").call({
      input: { input: inputData.input, name: campaign_name },
    });

    // Wait for the actor run to finish.
    //const runDetails = await run.waitForFinish();

    // Push results to the named dataset.
    const dataset = apifyClient.dataset(
      "commemorative_throne~" + campaign_name,
    );
    //get the items from the dataset
    await dataset.listItems().then(async (res) => {
      console.log(res);
      //await dataset.pushItems(res.items);
      //send results to parent
      process.send(res.items);
    });

    console.log("Actor execution completed.");
    setTimeout(function () {
      //runFooActor(inputData);
    }, 1000);
  } catch (error) {
    console.error("Error executing actor:", error);
  }
}
process.on("message", (message) => {
  let inputData = message;
  runFooActor(inputData);
});

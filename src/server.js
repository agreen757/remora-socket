import http from "http";
import WebSocket from "ws";
import express from "express";
const { ApifyClient, DatasetClient } = require("apify-client");
const { runActor, stopActor } = require("./modules/remora/remora_actions");
const config = require("./config");

const apifyClient = new ApifyClient({
  token: config.APIFY_TOKEN,
});

const app = express();
app.set("view engine", "pug");
app.set("views", __dirname + "/views");
app.use("/public", express.static(__dirname + "/public"));
app.get("/", (_, res) => res.render("home"));
app.get("/*", (_, res) => res.redirect("/"));

const handleListen = () => console.log(`Listening on http://localhost:3000`);

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

let running_campaigns = [];
// Put all your backend code here.
wss.on("connection", (socket) => {
  socket.addEventListener("message", async (event) => {
    let data = event.data ? JSON.parse(event.data) : null;
    console.log(data);
    if (data.reason === "fetch_initial_batch") {
      console.log(running_campaigns.indexOf(data.id));
      let running = running_campaigns.indexOf(data.id) !== -1 ? true : false;

      let campaign_kvstore_location = await apifyClient
        .keyValueStore("commemorative_throne~" + data.id)
        .getRecord("location_url");

      let campaign_kvstore_dataset = await apifyClient
        .keyValueStore("commemorative_throne~" + data.id)
        .getRecord("dataset_id");

      let dataset = campaign_kvstore_dataset.value
        ? campaign_kvstore_dataset.value
        : campaign_kvstore_dataset;
      //console.log(campaign_kvstore_dataset, dataset);
      let dataset_items = await apifyClient.dataset(dataset).listItems();

      let obj = {
        reason: "fetch_initial_batch_response",
        posts: dataset_items.items,
        running: running,
        location: campaign_kvstore_location,
      };

      socket.send(JSON.stringify(obj));
    }
    if (data.reason === "start_campaign") {
      console.log("starting campaign");
      let input = data.input;
      let campaign_name = data.info.customData.campaignName;
      running_campaigns.push(campaign_name);
      //send this to the thing
      runActor(campaign_name, true, false, input, socket);
    }
    if (data.reason === "stop_campaign") {
      if (data.info) {
        running_campaigns = running_campaigns.filter((ele) => {
          if (ele !== data.info.campaignName) {
            return ele;
          }
        });
        let campaign_name = data.info.campaignName;
        stopActor(campaign_name);
      }
    }
    //add a data.reason for running status and

    /*if (data) {
      console.log(data);
      //contains the id (remora-test..)
      //look for apify dataset named data.id and return it.
      let campaign_items = await apifyClient
        .datasets()
        .getOrCreate(data.id)
        .then(async (dataset) => {
          //get the contents of the dataset and return it;
          let items = await apifyClient.dataset(dataset.id).listItems();
          return {
            dataset_id: dataset.id,
            campaign_name: data.id,
            items: items,
          };
        })
        .catch((err) => {
          console.log("caught error", err);
        });
      //fetch location from remora-campaigns
      let remora_campaigns = apifyClient.dataset('remora_campaigns').listItems();
      let campaign = remora_campaigns.filter((ele)=>{
        if(ele.campaign_name === data.id) {
          return ele;
        }
      })
      let location;
      if(campaign[0] && campaign[0].location) {
        location = campaign[0].location;
      }
      //get or create keyvalue store to store campaign {id:id,name:name}
      let keyvalue_get = await apifyClient
        .keyValueStores()
        .getOrCreate(data.id)
        .then(async (keyvaluestore) => {
          let keys = await apifyClient
            .keyValueStore(keyvaluestore.id)
            .listKeys();
          //console.log(keys);
          if (keys.items.length < 1) {
            //push entry to keyvalue store;
            let obj = {
              value: campaign_items.dataset_id,
              key: 'dataset_id',
            };
            let update_list = [
              {
                key: 'dataset_id',
                value: campaign_items.dataset_id
              }
            ]
            //resume hree
            await apifyClient
              .keyValueStore(keyvaluestore.id)
              .setRecord(obj)
              .then((res) => {
                console.log("updated kv store");
              })
              .catch((err) => {
                console.log("err on key value update", err);
              });
          }
        });
    }
    let obj = {
      items: campaign_items.items,
      location: campaign
    }
    socket.send(JSON.stringify(campaign_items.items));*/
  });
});

server.listen(process.env.PORT, handleListen);

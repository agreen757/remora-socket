import http from "http";
import WebSocket from "ws";
import express from "express";
var bodyParser = require("body-parser");
var cors = require('cors')
const { ApifyClient, DatasetClient } = require("apify-client");
const { runActor, stopActor, initSocket } = require("./modules/remora/remora_actions");
const config = require("./config");

const apifyClient = new ApifyClient({
  token: config.APIFY_TOKEN,
});

const app = express();
app.set("view engine", "pug");
app.set("views", __dirname + "/views");
app.use("/public", express.static(__dirname + "/public"));
app.get("/", (_, res) => res.render("home"));
//app.get("/*", (_, res) => res.redirect("/"));
app.use(cors());
app.use(bodyParser.json());

const handleListen = () => console.log(`Listening on http://localhost:3000`);

//post request will execute the stopActor function
app.post("/stop", async (req, res) => {

  //accept all headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  //accept all methods
  res.setHeader('Access-Control-Allow-Methods', '*');

  let campaign_name = req.body.campaignName;
  console.log('stopping ',campaign_name);
  await stopActor(campaign_name).then((name) => {

    running_campaigns = running_campaigns.filter((ele) => {
      if (ele !== name) {
        return ele;
      }
    });

    res.send("stopped "+campaign_name);


  }).catch((err) => {
    console.log(err);
  });
  

});
app.post('/start', async (req, res) => {

  //accept all headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  //accept all methods
  res.setHeader('Access-Control-Allow-Methods', '*');
  /*if (g_socket === null) {
    res.send("no socket");
    return;
  }*/
  let input = req.body.input;
  let campaign_name = req.body.info.customData.campaignName;
  running_campaigns.push(campaign_name);
  //send this to the thing
  runActor(campaign_name, input);
  res.send("started "+campaign_name);
});

//post request will do the same as fetch_initial_batch taking the campaign name and the page number in the body.
//check the body for the campaign name and page number and handle errors if they are not there.
app.post("/fetch", async (req, res) => {
  //accept all headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  //accept all methods
  res.setHeader('Access-Control-Allow-Methods', '*');
  //check if req.body has campaignName, pageSize and pageNumber and pageNumber is a number that could be zero 
  if (
    req.body.campaignName &&
    req.body.pageNumber &&
    req.body.pageSize &&
    !isNaN(req.body.pageNumber)
  ) {
    let campaign_name = req.body.campaignName;
    let page_number = req.body.pageNumber;
    let page_size = req.body.pageSize;
    
    console.log(running_campaigns.indexOf(campaign_name));
    let running = running_campaigns.indexOf(campaign_name) !== -1 ? true : false;

    let campaign_kvstore_location = await apifyClient
      .keyValueStore("commemorative_throne~" + campaign_name)
      .getRecord("location_url");

    let campaign_kvstore_dataset = await apifyClient
      .keyValueStore("commemorative_throne~" + campaign_name)
      .getRecord("dataset_id");

    let dataset = campaign_kvstore_dataset.value
      ? campaign_kvstore_dataset.value
      : campaign_kvstore_dataset;
    //console.log(campaign_kvstore_dataset, dataset);
    let dataset_items = await apifyClient.dataset(dataset).listItems();

    let dset_items = dataset_items;

    //order dset_items by date located at time with newest first
    dset_items.items.sort((a, b) => {
      return new Date(b.time) - new Date(a.time);
    });

    //handle the page number and page size
    let start = page_number * page_size;
    let end = start + page_size;
    let items = dset_items.items.slice(start, end);



    let obj = {
      posts: dataset_items.items,
      running: running,
      location: campaign_kvstore_location,
    };

    res.send(JSON.stringify(obj));
  } else {
    res.send("Invalid request");
  }
});
    


const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

let running_campaigns = [];
let g_socket = null;
// Put all your backend code here.
wss.on("connection", (socket) => {

  initSocket(socket);
  
});

server.listen(process.env.PORT, handleListen);

const express = require('express');
const http = require('http');
const socketio = require('socket.io');
const path = require('path');
const bodyParser = require('body-parser');
const port = process.env.PORT || 3001;
const app = express();

const server = http.createServer(app);
const io = socketio(server);

app.use(bodyParser.json());

require('./routes/tweets.js')(app, io);

server.listen(port, () => {
    console.log('server is up');
});

let twitter = new Twitter({
consumer_key: process.env.TWITTER_CONSUMER_KEY,
    consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
    access_token_key: process.env.TWITTER_ACCESS_TOKEN_KEY,
    access_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET
});



//Establishes socket connection.
io.on("connection", socket => {
    stream();
    socket.on("connection", () => console.log("Client connected"));
    socket.on("disconnect", () => console.log("Client disconnected"));
});

//Emits data with socket.io as twitter stream flows in
const stream = () => {
    twitter.stream('statuses/filter', { track: app.locals.searchTerm }, (stream) => {
        stream.on('data', (tweet) => {
            sendMessage(tweet);
        });

        stream.on('error', (error) => {
            console.log(error);
        });
    });
}
const Twitter = require('twitter');

module.exports = (app, io) => {
    let twitter = new Twitter({
        consumer_key: process.env.TWITTER_CONSUMER_KEY,
        consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
        access_token_key: process.env.TWITTER_ACCESS_TOKEN_KEY,
        access_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET
    });

    let socketConnection;
    let twitterStream;

    app.locals.searchTerm = 'JavaScript'; //Default search term for twitter stream.
    app.locals.showRetweets = false; //Default

    /**
     * Resumes twitter stream.
     */
    const stream = () => {
        console.log('Resuming for ' + app.locals.searchTerm);
        twitter.stream('statuses/filter', {track: app.locals.searchTerm}, (stream) => {
            stream.on('data', (tweet) => {

                sendMessage(tweet);
            });

            stream.on('error', (error) => {

                console.log(error);
            });

            twitterStream = stream;
        });
    }

    app.use(function (req, res, next) {
        res.header("Access-Control-Allow-Origin", "*");
        res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
        next();
    });

    /**
     * Sets search term for twitter stream.
     */
    app.post('/setSearchTerm', (req, res) => {
        let term = req.body.term;
        app.locals.searchTerm = term;
        if (twitterStream) {

            twitterStream.destroy();
            console.log("Destroyed the stream  because new stream has been requested...")
        }

        stream();
    });


    /**
     * Pauses the twitter stream.
     */
    app.post('/pause', (req, res) => {
        console.log('Pause');
        twitterStream.destroy();
    });

    /**
     * Resumes the twitter stream.
     */
    app.post('/resume', (req, res) => {
        console.log('Resume');
        stream();
    });

    //Establishes socket connection.
    io.on("connection", socket => {
        console.log("Connection request arrived and the Client is connected")
        socketConnection = socket;
        // stream();
        socket.on("connection", () => console.log("Client connected"));
        socket.on("disconnect", function () {
            console.log("Client disconnected, Stopping the stream as well");
            if (twitterStream) {

                twitterStream.destroy();
                console.log("Destroyed the stream  because the client disconnected.")
            }

        });
    });


    /**
     * Emits data from stream.
     * @param {String} msg
     */
    const sendMessage = (msg) => {
        if (msg.text.includes('RT')) {
            return;
        }
        console.log("Send message:", msg);

        socketConnection.emit("tweets", msg);
    }


    /**test start**/
    app.get('/start', (req, res) => {
        console.log("Starting the twitter");
        stream();
    });
    app.get('/stop', (req, res) => {
        console.log("stopping the twitter");
        twitterStream.destroy();
    });
};
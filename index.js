'use strict';

const express = require('express');
const fs = require('fs');
const bodyParser = require('body-parser');
const { WebClient } = require('@slack/client');
const filepath = process.env.STORE_PATH || '/tmp';
const port = process.env.PORT || 3000;
const token = process.env.SLACK_TOKEN;
const channel = process.env.SLACK_CHANNEL || 'camera';
const app = express();
const web = new WebClient(token);

app.use(bodyParser.json()); // for parsing application/json

function upload(filename) {
    return web.files.upload({
        filename,
        // You can use a ReadableStream or a Buffer for the file option
        file: fs.createReadStream(filename),
        // Or you can use the content property (but not both)
        // content: 'plain string content that will be editable in Slack'
        // Specify channel(s) to upload the file to. Optional, unless also specifying a thread_ts value.
        channels: channel
    });
}

function base64ToFile(encodedImage) {
    const filename = `${filepath}/${new Date().getTime()}.jpg`;

    return new Promise((resolve) => {
        fs.writeFile(filename, encodedImage, 'base64', (err) => {
            resolve({
                error: err,
                filename
            });
        });
    });
}

// {"image": "base64encoded_message"}
app.post('/', async (req, res) => {
    const result = await base64ToFile(req.body.image);

    console.log('File stored: ', result);
    if (result.error) {
        console.error('failed writing file');
        console.error(result.err);
        res.status(500).send('failed writing file');
    }

    upload(result.filename)
        .then((response) => {
            // `response` contains information about the uploaded file
            console.log('File uploaded: ', response.file.id);
            res.send('done');
        })
        .catch((err) => {
            console.error('failed uploading to slack');
            console.error(err);
            res.status(500).send('failed uploading to slack');
        });
});

app.listen(port, () => console.log(`listening on port ${port}`));

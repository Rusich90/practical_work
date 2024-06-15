const express = require('express');
const { WebSocketServer } = require('ws');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const app = express();
const port = 3000;

const keywords = {
    "video": [
        "https://file-examples.com/wp-content/storage/2018/04/file_example_MOV_1920_2_2MB.mov",
        "https://file-examples.com/wp-content/storage/2018/04/file_example_MOV_1280_1_4MB.mov",
    ],
    "pdf": [
        "https://file-examples.com/storage/fe3cb26995666504a8d6180/2017/10/file-example_PDF_1MB.pdf",
        "https://file-examples.com/storage/fe3cb26995666504a8d6180/2017/10/file-example_PDF_500_kB.pdf",
    ]
};

app.use(express.json());
app.use(express.static('public'))


app.get('/keywords/:keyword', (req, res) => {
    const keyword = req.params.keyword;
    if (keywords[keyword]) {
        res.json(keywords[keyword]);
    } else {
        res.status(404).json({ error: 'Keyword not found' });
    }
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '/index.html'));
});

const server = app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});

const wss = new WebSocketServer({ server });

wss.on('connection', (ws) => {
    ws.on('message', async (message) => {
        const { url } = JSON.parse(message);
        try {
            const response = await axios.get(url, { responseType: 'stream' });
            const filePath = path.join(__dirname, 'public', `${path.basename(url)}`);
            const writer = fs.createWriteStream(filePath);
            response.data.pipe(writer);

            let file_path = `http://localhost:3000/${path.basename(url)}`
            console.log(file_path)
            writer.on('finish', () => {
                ws.send(JSON.stringify({ status: 'complete', file_path}));
            });

            writer.on('error', (err) => {
                ws.send(JSON.stringify({ status: 'error', error: err.message }));
            });

            let downloaded = 0;
            response.data.on('data', chunk => {
                downloaded += chunk.length;
                ws.send(JSON.stringify({ status: 'downloading', downloaded }));
            });
        } catch (error) {
            ws.send(JSON.stringify({ status: 'error', error: error.message }));
        }
    });
});

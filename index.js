const PORT = 8000;
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const multer = require('multer');
const OpenAI = require('openai');
const app = express();
require('dotenv').config();

const openai = new OpenAI({ apiKey : process.env.OPENAI_API_KEY })

app.use(cors());
app.use(express.json());
app.use(express.static('public')); // Serve static files from 'public' directory


const storage = multer.diskStorage({
    destination: './public',
    filename: (req, file, cb) => {
        cb(null, Date.now() + "-" + file.originalname);
    }
});

const upload = multer({ storage: storage }).single('file');
let filePath;
app.post('/upload', (req, res) => {
    upload(req, res, (err) => {
        if (err) {
            return res.status(500).json({ message: 'Error uploading file', error: err });
        }
        filePath = req.file.path;
        console.log('File uploaded:', filePath);
        return res.status(200).json({ message: 'File uploaded successfully', filePath: filePath });
    });
});

app.post('/openai', async (req,res) => {
    try {
        const prompt = req.body.message 
        console.log(prompt)
        const imageAsBase64 = fs.readFileSync(filePath, 'base64')
        const response = await openai.chat.completions.create({
            model : "gpt-4o",
            messages : [
                {
                    role : 'user',
                    content : [
                        { type : 'text', text : prompt },
                        { type : 'image_url', image_url : {
                            url : `data:image/jpeg;base64,${imageAsBase64}`
                        }}
                    ]
                }
            ]
        })
        console.log(response.choices[0].message.content)
        res.send(response.choices[0].message.content)
    } catch (error) {
        console.log(error)
    }
})

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

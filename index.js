const puppeteer = require("puppeteer");
const fs = require('fs');
const path = require('path');
var bodyParser = require('body-parser')

const htmlToImage =
    async (
        jsonUrl
    ) => {
        const browser = await puppeteer.launch(
            {
                headless: true,
                args: ['--no-sandbox']
            }
        );
        const page = await browser.newPage();

        // set the viewport so we know the dimensions of the screen
        await page.setViewport({
            width: 1920,
            height: 1080,
        });

        // get the absolute path to the html file that in public folder
        const filePath = path.resolve(__dirname, 'public/index.html');

        // go to the file url
        await page.goto(`file://${filePath}`);


        await page.waitForFunction(
            () => !document.querySelector(".FIE_spinner-wrapper",
            )
        );

        const jsonData = await fetch(jsonUrl)

        console.log(jsonData);
        const designState =   await jsonData.json();

        // add a variable to the global scope of the page as designState

        // add a script tag to the page that add the variable designState to the global scope of the page

        await page.evaluate((designState) => {
            window.designState = designState;
        }
            , designState);

        // wait for 2 seconds


        // add  <script src="https://scaleflex.cloudimg.io/v7/plugins/filerobot-image-editor/latest/filerobot-image-editor.min.js"></script>

        await page.evaluate(() => {
            const script = document.createElement('script');
            script.src = "https://scaleflex.cloudimg.io/v7/plugins/filerobot-image-editor/latest/filerobot-image-editor.min.js";
            document.head.appendChild(script);
        }
        );

        // wait until the script is loaded
        
        // wait for 20 seconds

        // wait until the script is loaded
        await page.waitForFunction(
            () => window.FilerobotImageEditor,
            { timeout: 20000 }
        );



        // add the following script to the page

        await page.evaluate(() => {

            const FilerobotImageEditor  = window.FilerobotImageEditor;
            const { TABS, TOOLS } = FilerobotImageEditor;
            const config = {

                loadableDesignState: window.designState,
                source: 'https://scaleflex.airstore.io/demo/stephen-walker-unsplash.jpg',
                onSave: (editedImageObject, designState) =>
                    console.log('saved', editedImageObject, designState),
                annotationsCommon: {
                    fill: '#ff0000',
                },
                Text: { text: 'Filerobot...' },
                Rotate: { angle: 90, componentType: 'slider' },
                translations: {
                    profile: 'Profile',
                    coverPhoto: 'Cover photo',
                    facebook: 'Facebook',
                    socialMedia: 'Social Media',
                    fbProfileSize: '180x180px',
                    fbCoverPhotoSize: '820x312px',
                },
                Crop: {
                    presetsItems: [
                        {
                            titleKey: 'classicTv',
                            descriptionKey: '4:3',
                            ratio: 4 / 3,
                            // icon: CropClassicTv, // optional, CropClassicTv is a React Function component. Possible (React Function component, string or HTML Element)
                        },
                        {
                            titleKey: 'cinemascope',
                            descriptionKey: '21:9',
                            ratio: 21 / 9,
                            // icon: CropCinemaScope, // optional, CropCinemaScope is a React Function component.  Possible (React Function component, string or HTML Element)
                        },
                    ],
                    presetsFolders: [
                        {
                            titleKey: 'socialMedia', // will be translated into Social Media as backend contains this translation key
                            // icon: Social, // optional, Social is a React Function component. Possible (React Function component, string or HTML Element)
                            groups: [
                                {
                                    titleKey: 'facebook',
                                    items: [
                                        {
                                            titleKey: 'profile',
                                            width: 180,
                                            height: 180,
                                            descriptionKey: 'fbProfileSize',
                                        },
                                        {
                                            titleKey: 'coverPhoto',
                                            width: 820,
                                            height: 312,
                                            descriptionKey: 'fbCoverPhotoSize',
                                        },
                                    ],
                                },
                            ],
                        },
                    ],
                },
                tabsIds: [TABS.ADJUST, TABS.ANNOTATE, TABS.WATERMARK], // or ['Adjust', 'Annotate', 'Watermark']
                defaultTabId: TABS.ANNOTATE, // or 'Annotate'
                defaultToolId: TOOLS.TEXT, // or 'Text'
            };

            // Assuming we have a div with id="editor_container"
            const filerobotImageEditor = new FilerobotImageEditor(
                document.querySelector('#editor_container'),
                config,
            );

            filerobotImageEditor.render({
                onClose: (closingReason) => {
                    console.log('Closing reason', closingReason);
                    filerobotImageEditor.terminate();
                },
            });
        }

        );







        // wait until element with one of the classes as FIE_spinner-wrapper disappears even after

        await page.waitForFunction(
            () => !document.querySelector(".FIE_spinner-wrapper",
            )
        );

        // wait for 2 seconds





        console.log("waited for spinner");



        // get all the tags with canvas
        const canvasTags = await page.$$("canvas");

        // print html of canvas tags
        for (const canvasTag of canvasTags) {
            console.log(await page.evaluate(el => el.outerHTML, canvasTag));
        }

        const imageCanvas = canvasTags[1];

        // get the canvas as a image
        const imageBuffer = await imageCanvas.screenshot();

        await page.close();
        await browser.close();

        return imageBuffer;
    };


const express = require("express");
const { triggerAsyncId } = require("async_hooks");

const index = express();

index.use(bodyParser.json({ limit: '1024mb' }));

const port = 3000;
index.post("/graphic", async (req, res) => {
    console.log(req.body.jsonUrl);

    const imageBuffer = await htmlToImage(
        req.body.jsonUrl
    );

    res.set("Content-Type", "image/png");
    res.send(imageBuffer);
});


// start the server
index.listen(port, () => {
    console.log(`Server started at http://localhost:${port}`);
});

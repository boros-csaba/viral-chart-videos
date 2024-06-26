import '../styles/styles.scss';
import { Animation } from './animation.js';
import { Data } from './data.js'; 
import { FileUploadHandler } from './file-upload-handler.js';
import demoDataArrayBufferPath from '../assets/demo-data.xlsx';

const app = {
    uploadedRawFileData: null,
    animation: null,
    options: {
        width: 540,
        height: 960,
        maxNrOfBarsToShow: 15
    }
};

async function init() {

    document.getElementById('download-demo-link').setAttribute('href', demoDataArrayBufferPath);
    
    let demoFile = await (await fetch(demoDataArrayBufferPath)).arrayBuffer();
    let demoData = new Data(demoFile);
    app.animation = new Animation("render", demoData, app.options);

    const fileUploadHandler = new FileUploadHandler(
        (rawFileData) => (app.uploadedRawFileData = rawFileData),
        (data) => onNewDataAvailable(data)
    );

    fileUploadHandler.initFileUploadInput();
    await app.animation.startAnimation();
}

function onNewDataAvailable(data) {
    app.animation = new Animation("render", data, app.options);
}


window.onload = () => {
    document
        .getElementsByClassName('download-button')[0]
        .addEventListener('click', async () => {
            let uploadUrl = await getS3PresignedUrl();
            await uploadDataToS3(uploadUrl);
            const fileId = new URL(uploadUrl).pathname.split('/').pop();
            const paymentUrl = await getPaymentUrl(fileId);
            window.location.href = paymentUrl;
        });
};

async function getS3PresignedUrl() {
    const url = new URL(
        'https://5cf4ly6ngsvgtzjwh3xmjye6ki0hjkah.lambda-url.us-west-1.on.aws/'
    );
    let response = await fetch(url, {
        method: 'POST',
    });

    return response.text();
}

async function uploadDataToS3(s3Url) {
    const url = new URL(s3Url);
    let response = await fetch(url, {
        method: 'PUT',
        body: new File([app.uploadedRawFileData], 'file'),
    });

    return response.text();
}

async function getPaymentUrl(fileId) {
    const url = new URL(
        'https://6jizzqdpcxsrn2fe5nqo6cjvay0duknl.lambda-url.us-west-1.on.aws/'
    );

    let response = await fetch(url, {
        method: 'POST',
        body: fileId,
    });

    return response.text();
}

window.onload = init();
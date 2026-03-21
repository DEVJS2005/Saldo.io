import fs from 'fs';
import 'dotenv/config';

const apiKey = process.env.STITCH_API_KEY;

if (!apiKey) {
    console.error("ERRO: STITCH_API_KEY não foi configurada nas variáveis de ambiente.");
    process.exit(1);
}

const headers = { 'X-Goog-Api-Key': apiKey };

async function fetchScreens() {
    const projectRes = await fetch('https://stitch.googleapis.com/v1/projects/848409543146395732', { headers });
    const project = await projectRes.json();

    if (!fs.existsSync('stitch_screens')) fs.mkdirSync('stitch_screens');

    let i = 1;
    for (const instance of project.screenInstances) {
        console.log(`Fetching screen ${instance.sourceScreen}...`);
        const screenRes = await fetch(`https://stitch.googleapis.com/v1/${instance.sourceScreen}`, { headers });
        const screen = await screenRes.json();

        fs.writeFileSync(`stitch_screens/screen_${i}_meta.json`, JSON.stringify(screen, null, 2));

        if (screen.htmlCode && screen.htmlCode.downloadUrl) {
            console.log(`Downloading HTML for screen ${i}...`);
            const htmlRes = await fetch(screen.htmlCode.downloadUrl);
            const html = await htmlRes.text();
            fs.writeFileSync(`stitch_screens/screen_${i}.html`, html);
        }
        i++;
    }
    console.log('Done!');
}

fetchScreens().catch(console.error);

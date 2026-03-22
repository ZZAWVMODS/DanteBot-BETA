const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

module.exports = {
    name: "play",
    aliases: ["musica", "song", "playaudio"],
    run: async (socket, m, { args, from, prefix }) => {
        if (!args.length) {
            return socket.sendMessage(from, { 
                text: `*Uso:* \`${prefix}play\` nombre de la canción` 
            }, { quoted: m });
        }

        const query = args.join(' ');
        const tempDir = path.join(__dirname, '../../temp');
        if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

        try {
            const videoData = await searchYT(query);
            if (!videoData) return socket.sendMessage(from, { text: "*[!] No se encontraron resultados.*" });

            const ytUrl = `https://www.youtube.com/watch?v=${videoData.id}`;
            
            let infoMsg = `*\`𝙔𝙏 𝙋𝙇𝘼𝙔 𝘼𝙐𝘿𝙄𝙊\`*\n\n`;
            infoMsg += `> °•. *𝐓𝐢𝐭𝐮𝐥𝐨:* ${videoData.title}\n\n`;
            infoMsg += `> °•. *𝐂𝐚𝐧𝐚𝐥:* ${videoData.author}\n\n`;
            infoMsg += `> °•. *𝐃𝐮𝐫𝐚𝐜𝐢𝐨𝐧:* ${videoData.duration}\n\n`;
            infoMsg += `   　 　  ️ *_⛈︎_*`;

            // Se mantiene el diseño visual original con thumbnail
            await socket.sendMessage(from, {
                text: infoMsg,
                contextInfo: {
                    externalAdReply: {
                        title: "𝕯𝖆𝖓𝖙𝖊 𝕭𝖔𝖙 ｷ",
                        body: videoData.title,
                        thumbnailUrl: `https://i.ytimg.com/vi/${videoData.id}/hqdefault.jpg`,
                        mediaType: 1,
                        renderLargerThumbnail: true,
                        sourceUrl: ytUrl
                    }
                }
            }, { quoted: m });

            const apiUrl = `https://api-faa.my.id/faa/ytmp3?url=${encodeURIComponent(ytUrl)}`;
            const res = await fetch(apiUrl);
            const data = await res.json();
            
            const dlUrl = data.result?.mp3 || data.mp3 || data.url;
            if (!dlUrl) return;

            const inputPath = path.join(tempDir, `in_${Date.now()}.mp3`);
            const outputPath = path.join(tempDir, `out_${Date.now()}.opus`);

            const audioRes = await fetch(dlUrl);
            const buffer = Buffer.from(await audioRes.arrayBuffer());
            fs.writeFileSync(inputPath, buffer);

            // FFmpeg optimizado: Preset ultrafast para velocidad máxima en Termux
            const cmd = `ffmpeg -y -i "${inputPath}" -c:a libopus -b:a 128k -vbr on -compression_level 0 -preset ultrafast -vn "${outputPath}"`;

            exec(cmd, async (error) => {
                if (error) {
                    cleanup(inputPath, outputPath);
                    return;
                }

                await socket.sendMessage(from, {
                    audio: fs.readFileSync(outputPath),
                    mimetype: 'audio/ogg; codecs=opus',
                    ptt: true // Nota de voz instantánea
                }, { quoted: m });

                cleanup(inputPath, outputPath);
            });

        } catch (error) {
            console.error(error);
        }
    }
};

function cleanup(inP, outP) {
    if (fs.existsSync(inP)) fs.unlinkSync(inP);
    if (fs.existsSync(outP)) fs.unlinkSync(outP);
}

async function searchYT(query) {
    const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
    const response = await fetch(searchUrl, { 
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
    });
    const html = await response.text();
    const videoId = html.match(/"videoId":"([a-zA-Z0-9_-]{11})"/)?.[1];
    const title = html.match(/"title":\{"runs":\[\{"text":"([^"]+?)"/)?.[1];
    const author = html.match(/"ownerText":\{"runs":\[\{"text":"([^"]+?)"/)?.[1];
    const duration = html.match(/"lengthText":\{"simpleText":"([^"]+?)"/)?.[1];

    return videoId ? { id: videoId, title, author, duration } : null;
}

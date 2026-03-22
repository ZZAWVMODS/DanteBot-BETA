const fs = require('fs');
const path = require('path');

module.exports = {
    name: "video",
    aliases: ["play2"],
    run: async (socket, m, { args, from, prefix }) => {
        if (!args.length) {
            return socket.sendMessage(from, { 
                text: `*Uso:* \`${prefix}video\` nombre del video` 
            }, { quoted: m });
        }

        const query = args.join(' ');
        const tempDir = path.join(__dirname, '../../temp');
        if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

        try {
            // 1. Buscamos el video en YouTube (Misma lógica que el Play)
            const videoData = await searchYT(query);
            if (!videoData) return socket.sendMessage(from, { text: "*[!] No se encontraron resultados.*" });

            const ytUrl = `https://www.youtube.com/watch?v=${videoData.id}`;
            const apiKey = "may-051b5d3d";
            
            // 2. Mensaje informativo con Thumbnail
            let infoMsg = `*\`𝙔𝙏 𝙋𝙇𝘼𝙔 𝙑𝙄𝘿𝙀𝙊\`*\n\n`;
            infoMsg += `> °•. *𝐓𝐢𝐭𝐮𝐥𝐨:* ${videoData.title}\n\n`;
            infoMsg += `> °•. *𝐂𝐚𝐧𝐚𝐥:* ${videoData.author}\n\n`;
            infoMsg += `> °•. *𝐃𝐮𝐫𝐚𝐜𝐢𝐨𝐧:* ${videoData.duration}\n\n`;
            infoMsg += `   　 　  ️ *_⛈︎_*`;

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

            // 3. Llamada a la API MayApi para obtener el JSON de descarga
            const apiUrl = `https://mayapi.ooguy.com/ytdl?url=${encodeURIComponent(ytUrl)}&apikey=${apiKey}`;
            const res = await fetch(apiUrl);
            const data = await res.json();
            
            // Lógica de calidad: Mayor calidad, si no existe, la mínima
            const videoUrl = data.result?.video_hd || data.result?.video_360 || data.result?.url;

            if (!videoUrl) {
                return socket.sendMessage(from, { text: "*[!] Error al obtener el enlace de descarga.*" });
            }

            // 4. Descarga y envío del video
            const videoRes = await fetch(videoUrl);
            const buffer = Buffer.from(await videoRes.arrayBuffer());
            const fileName = path.join(tempDir, `${Date.now()}.mp4`);
            
            fs.writeFileSync(fileName, buffer);

            await socket.sendMessage(from, {
                video: fs.readFileSync(fileName),
                caption: `> *Aquí tienes tu video:* ${videoData.title}`,
                mimetype: 'video/mp4'
            }, { quoted: m });

            // Limpieza
            if (fs.existsSync(fileName)) fs.unlinkSync(fileName);

        } catch (error) {
            console.error("VIDEO ERROR:", error);
            await socket.sendMessage(from, { text: "*[!] Ocurrió un error al procesar el video.*" });
        }
    }
};

// Función de búsqueda (Reutilizada del Play)
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

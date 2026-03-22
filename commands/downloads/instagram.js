const axios = require('axios');

module.exports = {
    name: "instagram",
    aliases: ["ig", "igdl", "reels"],
    run: async (socket, m, { args, from, prefix }) => {
        if (!args[0]) {
            return socket.sendMessage(from, { 
                text: `*Uso:* \`${prefix}instagram\` <enlace de instagram>` 
            }, { quoted: m });
        }

        try {
            const url = args[0];
            const apiUrl = `https://api-faa.my.id/faa/igdl?url=${encodeURIComponent(url)}`;
            
            const response = await axios.get(apiUrl, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36'
                },
                timeout: 20000 
            });

            const data = response.data;

            if (!data || !data.status || !data.result) {
                return socket.sendMessage(from, { text: "*[!] Error al obtener el contenido de Instagram.*" });
            }

            const res = data.result;
            const meta = res.metadata;

            // Construcción de la metadata para el caption (Pie de video/imagen)
            let infoMsg = `*\`𝙄𝙉𝙎𝙏𝘼𝙂𝙍𝘼𝙈 𝘿𝙊𝙒𝙉𝙇𝙊𝘼𝘿\`*\n\n`;
            infoMsg += `> °•. *Usuario:* ${meta.username || 'n/a'}\n`;
            infoMsg += `> °•. *Likes:* ${meta.like?.toLocaleString() || '0'}\n`;
            infoMsg += `> °•. *Comentarios:* ${meta.comment?.toLocaleString() || '0'}\n\n`;
            infoMsg += `*Descripción:*\n${meta.caption ? meta.caption.substring(0, 300) + '...' : 'Sin descripción'}\n\n`;
            infoMsg += `   　 　  ️ *_𝘿𝙖𝙣𝙩𝙚 𝘽𝙤𝙩_*`;

            // La API devuelve un array en 'url', tomamos el primer elemento
            const downloadUrl = res.url[0];

            if (!downloadUrl) {
                return socket.sendMessage(from, { text: "*[!] No se encontró un enlace de descarga válido.*" });
            }

            if (meta.isVideo) {
                // Si es un video o Reel
                await socket.sendMessage(from, {
                    video: { url: downloadUrl },
                    caption: infoMsg,
                    mimetype: 'video/mp4',
                    fileName: `instagram_${meta.username}.mp4`
                }, { quoted: m });
            } else {
                // Si es una imagen
                await socket.sendMessage(from, {
                    image: { url: downloadUrl },
                    caption: infoMsg,
                    fileName: `instagram_${meta.username}.jpg`
                }, { quoted: m });
            }

        } catch (error) {
            console.error("Error en Instagram:", error.message);
            
            let errorMsg = "*[!] Hubo un fallo en la descarga de Instagram.*";
            if (error.code === 'ECONNABORTED') errorMsg = "*[!] El servidor tardó demasiado en responder.*";
            
            return socket.sendMessage(from, { text: errorMsg }, { quoted: m });
        }
    }
};

const axios = require('axios');

module.exports = {
    name: "tiktok",
    aliases: ["tt", "tk", "ttdl"],
    run: async (socket, m, { args, from, prefix }) => {
        if (!args[0]) {
            return socket.sendMessage(from, { 
                text: `*Uso:* \`${prefix}tiktok\` <enlace de tiktok>` 
            }, { quoted: m });
        }

        try {
            const url = args[0];
            const apiUrl = `https://api-faa.my.id/faa/tiktok?url=${encodeURIComponent(url)}`;
            
            // Añadimos configuración de axios para evitar bloqueos por parte de la API o el servidor
            const response = await axios.get(apiUrl, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36'
                },
                timeout: 15000 // Aumentamos el tiempo de espera para enlaces pesados
            });

            const data = response.data;

            if (!data || !data.status || !data.result) {
                return socket.sendMessage(from, { text: "*[!] Error al obtener el video.*" });
            }

            const res = data.result;
            const stats = res.stats;

            let infoMsg = `*\`𝙏𝙄𝙆𝙏𝙊𝙆 𝘿𝙊𝙒𝙉𝙇𝙊𝘼𝘿\`*\n\n`;
            infoMsg += `> °•. *Usuario:* ${res.author.nickname} (@${res.author.username})\n`;
            infoMsg += `> °•. *Descripción:* ${res.title || 'Sin descripción'}\n`;
            infoMsg += `> °•. *Región:* ${res.region}\n\n`;
            infoMsg += `*Estadísticas:*\n`;
            infoMsg += `> 👁️ ${stats.views}  ❤️ ${stats.likes}  💬 ${stats.comment}\n`;
            infoMsg += `> ↪️ ${stats.share}  📥 ${stats.download}\n\n`;
            infoMsg += `   　 　  ️ *_⛈︎_*`;

            // Lógica de selección de URL más robusta
            // Prioriza HD, luego la data principal y finalmente una alternativa seleccionada
            const videoUrl = res.alternatives?.hd || res.data || res.alternatives?.selected;

            if (!videoUrl) {
                return socket.sendMessage(from, { text: "*[!] No se encontró una URL de video válida.*" });
            }

            // Enviamos el video con toda la información en el caption
            await socket.sendMessage(from, {
                video: { url: videoUrl },
                caption: infoMsg,
                mimetype: 'video/mp4',
                fileName: `${res.id || 'video'}.mp4`
            }, { quoted: m });

        } catch (error) {
            // Manejo de errores detallado en consola para debug
            console.error("Error en TikTok:", error.message);
            
            let errorMsg = "*[!] Hubo un fallo en la descarga.*";
            if (error.code === 'ECONNABORTED') errorMsg = "*[!] Tiempo de espera agotado, intenta de nuevo.*";
            
            return socket.sendMessage(from, { text: errorMsg }, { quoted: m });
        }
    }
};

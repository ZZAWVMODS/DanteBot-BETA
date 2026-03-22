// commands/utils/bots.js - CORREGIDO

module.exports = {
    name: "bots",
    aliases: ["subbots", "listbots", "activos"],
    category: "utils",
    description: "Muestra la lista de Sub-Bots que están actualmente encendidos.",
    
    run: async (socket, m, { from, prefix }) => {
        try {
            // Obtener SOLO las keys (números) del Map
            const botsActivos = Array.from(global.activeSubBots.keys());

            if (botsActivos.length === 0) {
                return socket.sendMessage(from, { 
                    text: `*𝙎𝙊𝘾𝙆𝙀𝙏𝙎 𝘿𝘼𝙉𝙏𝙀*\n\nNo se registran sub-bots en línea.\n\nUsa: *${prefix}code <tu numero>*` 
                }, { quoted: m });
            }

            // --- ESTILO EFECTO CARBÓN (DANTE BOT) ---
            let texto = `• • •[ *𝐃𝐚𝐧𝐭𝐞 𝐁𝐨𝐭 𝐒𝐨𝐜𝐤𝐞𝐭'𝐬* ]• • •\n\n`;
            texto += `*sᴜʙ - ʙᴏᴛs ᴀᴄᴛɪᴠᴏs* [ ${botsActivos.length} ]\n\n`;

            for (let bot of botsActivos) {
                texto += `• @${bot}\n`;
            }

            texto += `\n> *𝕯𝖆𝖓𝖙𝖊 𝕭𝖔𝖙*`;

            await socket.sendMessage(from, { 
                text: texto, 
                mentions: botsActivos.map(num => num + '@s.whatsapp.net') 
            }, { quoted: m });

        } catch (err) {
            console.error("Error en comando bots:", err);
            await socket.sendMessage(from, { 
                text: `❌ Error al obtener lista de bots: ${err.message}` 
            }, { quoted: m });
        }
    }
};
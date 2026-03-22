const config = require('../../config');

module.exports = {
    name: "jersey",
    aliases: ["skin", "traje"],
    category: "freefire",
    description: "Muestra la imagen de jersey",

    run: async (socket, m, { args, from }) => {
        try {
            await socket.sendMessage(from, { react: { text: "🕑", key: m.key } });

            // URL de la imagen del jersey (XZ TEAM TR E-SPORTS)
            const jerseyUrl = 'https://cdn.russellxz.click/aa5ce472.jpeg';
            
            // Preparar caption
            const caption = `*[✓] Jersey Oficial*\n\n` +
                           `> *Equipo:* \`XZ TEAM TR E-SPORTS\`\n` +
                           `> *Diseño:* \`GHOST · GHOST DESIGN\`\n` +
                           `> *Versión:* \`DEMO\`\n\n` +
                           `*_Jersey exclusivo_*`;

            await socket.sendMessage(from, { react: { text: "✔️", key: m.key } });

            // Enviar la imagen del jersey
            await socket.sendMessage(from, {
                image: { url: jerseyUrl },
                caption: caption
            }, { quoted: m });

        } catch (error) {
            console.error('Error en comando jersey:', error);
            await socket.sendMessage(from, { 
                text: `*[!] Error*\n\n> No se pudo mostrar la imagen del jersey.`
            }, { quoted: m });
        }
    }
};
const fs = require('fs');
const path = require('path');
const axios = require('axios');

// --- CACHÉ EN RAM ---
let videoBuffer = null;
let cachedMenuBase = ""; 
const videoUrl = 'https://cdn.russellxz.click/e0f119e2.mp4';
const emojis = ["🗡", "🩸", "⚔️", "🪓", "🛡", "🔫", "🥷🏻", "💀"];

const preload = async () => {
    try {
        const commandsDir = path.join(__dirname, '../../commands');
        if (!fs.existsSync(commandsDir)) return;

        const categories = fs.readdirSync(commandsDir).filter(cat => 
            fs.lstatSync(path.join(commandsDir, cat)).isDirectory()
        );
        
        let menuText = `*𝕯𝖆𝖓𝖙𝖊 𝕭𝖔𝖙 ｷ*\n\n`;
        menuText += `*𝙋𝙧𝙚𝙛𝙞𝙭:* \`_P_\`\n`;
        menuText += `*𝙎𝙩𝙖𝙩𝙪𝙨:* \`Online\`\n\n`;

        for (const category of categories) {
            const files = fs.readdirSync(path.join(commandsDir, category)).filter(f => f.endsWith('.js'));
            if (files.length > 0) {
                menuText += `*# ${category.toUpperCase()}*\n`;
                menuText += files.map(file => `> _P_${file.replace('.js', '')}`).join('\n');
                menuText += `\n\n`;
            }
        }
        menuText += `_Desarrollado por ZzawX and LeoDev_\n\nTester: LeoGozuGodAdmin ✰`;
        cachedMenuBase = menuText;

        // Descarga única a la RAM
        const res = await axios.get(videoUrl, { responseType: 'arraybuffer' });
        videoBuffer = Buffer.from(res.data);
    } catch (e) {}
};

preload();

module.exports = {
    name: "menu",
    aliases: ["dante", "help"],
    run: async (socket, m, { from, prefix }) => {
        // 1. REACCIONES (En paralelo, sin esperar)
        const reactFlow = async () => {
            for (const emoji of emojis) {
                socket.sendMessage(from, { react: { text: emoji, key: m.key } }).catch(() => {});
                await new Promise(r => setTimeout(r, 550)); 
            }
        };
        reactFlow();

        // 2. TEXTO PRE-COCINADO
        const finalMenu = cachedMenuBase.replace(/_P_/g, prefix);

        // 3. ENVÍO DE VIDEO OBLIGATORIO (Peso 2KB - Calidad Original)
        // Usamos el buffer directo para que no haya delay de subida.
        if (videoBuffer) {
            await socket.sendMessage(from, { 
                video: videoBuffer,
                caption: finalMenu,
                gifPlayback: true,
                mimetype: 'video/mp4',
                fileLength: 2048, // 2 KB exactos para envío instantáneo
                headerType: 4,
                viewOnce: false
            }, { quoted: m });
        } else {
            // Si el buffer falló, lo descargamos en caliente y enviamos
            const res = await axios.get(videoUrl, { responseType: 'arraybuffer' });
            videoBuffer = Buffer.from(res.data);
            await socket.sendMessage(from, { 
                video: videoBuffer, 
                caption: finalMenu, 
                gifPlayback: true, 
                fileLength: 2048 
            }, { quoted: m });
        }
    }
};

const axios = require('axios');

// --- FUNCIÓN FKONTAK (ESTILO ZZAWX) ---
async function makeFkontak() {
    try {
        // Miniatura para el contacto citado
        const res = await axios.get('https://cdn.russellxz.click/64bba973.jpg', { responseType: 'arraybuffer' });
        const thumb2 = Buffer.from(res.data);
        return {
            key: { participants: '0@s.whatsapp.net', remoteJid: 'status@broadcast', fromMe: false, id: 'Dante' },
            message: { 
                locationMessage: { 
                    name: '𝕸𝖆Ԁ𝖊 𝖇𝖞 𝐙𝐳ﾑwﾒ', 
                    jpegThumbnail: thumb2
                } 
            },
            participant: '0@s.whatsapp.net'
        };
    } catch {
        return undefined;
    }
}

module.exports = {
    name: "ffmenu",
    aliases: ["menuff", "freemenu"],
    category: "freefire",
    run: async (socket, m, { from, sender, prefix }) => {
        
        const fkontak = await makeFkontak();

        // Configuración del Newsletter (Time ZzawX Bot)
        const newsletterConfig = {
            newsletterJid: '120363422471539761@newsletter',
            newsletterName: '𝐓𝐢𝐦𝐞 𝐙𝐳𝐚𝐰𝐗 𝕭𝖔𝖙',
            serverMessageId: 0
        };

        let menu = `\`\`\`ＤＡＮＴＥ  ＢＯＴ  ＳＹ𝐒ＴＥＭ\`\`\`\n\n` +
                   `⚎ 𝗗𝗔𝗧𝗔_𝗦𝗘𝗦𝗦𝗜𝗢𝗡: @${sender.split('@')[0]}\n` +
                   `⚎ 𝗗𝗘𝗩𝗜𝗖𝗘_𝗟𝗜𝗡𝗞: 𝗔𝘂𝘁𝗼_𝗦𝘆𝗻𝗰\n\n` +
                   `\`\`\`// 𝗜𝗡𝗝𝗘𝗖𝗧𝗢𝗥: 𝗖𝗢𝗠𝗕𝗔𝗧𝗘\`\`\`\n` +
                   `   › ${prefix}test\n` +
                   `   › ${prefix}test\n` +
                   `   › ${prefix}test\n` +
                   `   › ${prefix}sensi\n\n` +
                   `\`\`\`// 𝗜𝗡𝗝𝗘𝗖𝗧𝗢𝗥: 𝗩𝗜𝗣_𝗠𝗢𝗗𝗦\`\`\`\n` +
                   `   › ${prefix}test\n` +
                   `   › ${prefix}test\n` +
                   `   › ${prefix}test\n` +
                   `   › ${prefix}test\n\n` +
                   `\`\`\`// 𝗜𝗡𝗝𝗘𝗖𝗧𝗢𝗥: 𝗞𝗘𝗥𝗡𝗘𝗟\`\`\`\n` +
                   `   › ${prefix}ping\n` +
                   `   › ${prefix}test\n` +
                   `   › ${prefix}test\n\n` +
                   `*“Ｓｃｒｉｐｔ  ｌｏａｄｅｄ  ｉｎ  ｂａ𝗰𝗸𝗴𝗿𝗼𝘂𝗻𝗱．”*\n\n` +
                   `> 𝕸𝖆Ԁ𝖊 𝖇𝖞 𝐙𝐳ﾑwﾒ`;

        await socket.sendMessage(from, { 
            text: menu, 
            mentions: [sender],
            contextInfo: {
                isForwarded: true,
                forwardingScore: 9999999,
                forwardedNewsletterMessageInfo: newsletterConfig,
                externalAdReply: {
                    title: 'ＤＡＮＴＥ  ＢＯＴ  Ｖ３',
                    body: '𝐙𝐳𝐚𝐰𝐗 𝐁𝐲 𓆩༲࿆𝙕𝙕ДЩЖMФDS༫࿆𓆪',
                    thumbnailUrl: 'https://files.catbox.moe/yxcu1g.png',
                    mediaType: 1,
                    renderLargerThumbnail: true, // Cambia a false si prefieres miniatura pequeña
                    sourceUrl: 'https://whatsapp.com/channel/0029VaJmfYfA2pLC9S20D00G' // Tu canal
                }
            }
        }, { quoted: fkontak || m });
    }
};

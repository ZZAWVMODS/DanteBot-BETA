module.exports = {
    name: "kick",
    aliases: ["sacar", "echar", "ban", "sacar"],
    run: async (socket, m, { args, from, isGroup, isOwner }) => {
        if (!isGroup) return;
        if (!isOwner) return;

        const groupMetadata = await socket.groupMetadata(from);
        const botId = socket.user.id.split(':')[0] + '@s.whatsapp.net';
        const isBotAdmin = groupMetadata.participants.find(p => p.id === botId)?.admin !== null;

        if (!isBotAdmin) {
            return socket.sendMessage(from, { text: "*[!] Error:* Necesito ser administrador para ejecutar esta acción." }, { quoted: m });
        }

        let user = m.message.extendedTextMessage?.contextInfo?.mentionedJid?.[0] || 
                   m.message.extendedTextMessage?.contextInfo?.participant || 
                   (args[0] ? args[0].replace(/[^0-9]/g, '') + '@s.whatsapp.net' : null);

        if (!user || user === botId) return;

        try {
            await socket.groupParticipantsUpdate(from, [user], 'remove');
        } catch (err) {
            console.error(err);
        }
    }
};

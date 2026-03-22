const fs = require('fs');

module.exports = {
    name: "welcome",
    aliases: ["bienvenida", "wel"],
    category: "admin",
    run: async (socket, m, { from, isGroup, isOwner, args, database, prefix }) => {
        if (!isGroup) return;

        const groupMetadata = await socket.groupMetadata(from);
        const participants = groupMetadata.participants;
        const senderItem = participants.find(p => p.id === (m.key.participant || m.key.remoteJid));
        const isAdmin = senderItem?.admin !== null || isOwner;

        if (!isAdmin) {
            return socket.sendMessage(from, { text: "⚠️ *𝐃𝐀𝐍𝐓𝐄 𝐁𝐎𝐓*\n\nEsta función es solo para administradores." }, { quoted: m });
        }

        if (!database.welcome) database.welcome = [];

        if (args[0] === "on") {
            if (database.welcome.includes(from)) return socket.sendMessage(from, { text: "✅ El sistema ya está activo." });
            database.welcome.push(from);
            fs.writeFileSync('./database.json', JSON.stringify(database, null, 2));
            return socket.sendMessage(from, { text: "🔔 *𝐃𝐀𝐍𝐓𝐄 𝐁𝐎𝐓*\n\nSistema de Bienvenida **ACTIVADO**." });
        } else if (args[0] === "off") {
            database.welcome = database.welcome.filter(id => id !== from);
            fs.writeFileSync('./database.json', JSON.stringify(database, null, 2));
            return socket.sendMessage(from, { text: "🔕 *𝐃𝐀𝐍𝐓𝐄 𝐁𝐎𝐓*\n\nSistema de Bienvenida **DESACTIVADO**." });
        } else {
            return socket.sendMessage(from, { text: `❓ Uso: *${prefix}welcome on* o *off*` });
        }
    }
};

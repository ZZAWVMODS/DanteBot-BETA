const fs = require('fs');

module.exports = {
    name: "antilink",
    aliases: ["nolink"],
    run: async (socket, m, { args, from, isGroup, isOwner, database }) => {

        if (!isGroup) return socket.sendMessage(from, { text: "*[!] Solo en grupos.*" }, { quoted: m });
        if (!isOwner) return socket.sendMessage(from, { text: "*[!] Solo el Owner.*" }, { quoted: m });

        const action = args[0]?.toLowerCase();
        const dbPath = './database.json';

        if (action === 'on') {
            if (database.antilink.includes(from)) return socket.sendMessage(from, { text: "_Ya está activo._" }, { quoted: m });
            database.antilink.push(from);
            fs.writeFileSync(dbPath, JSON.stringify(database, null, 2));
            return socket.sendMessage(from, { text: "*ANTILINK ACTIVADO* ✅" }, { quoted: m });
        }

        if (action === 'off') {
            if (!database.antilink.includes(from)) return socket.sendMessage(from, { text: "_No estaba activo._" }, { quoted: m });
            database.antilink = database.antilink.filter(id => id !== from);
            fs.writeFileSync(dbPath, JSON.stringify(database, null, 2));
            return socket.sendMessage(from, { text: "*ANTILINK DESACTIVADO* ❌" }, { quoted: m });
        }

        await socket.sendMessage(from, { text: `Uso: !antilink on/off` }, { quoted: m });
    }
};

module.exports = {
    name: "runtime",
    aliases: ["uptime", "rt"],
    category: "main",
    run: async (socket, m, { from }) => {
        const uptime = process.uptime();
        const hours = Math.floor(uptime / 3600);
        const minutes = Math.floor((uptime % 3600) / 60);
        const seconds = Math.floor(uptime % 60);

        let text = `\`S Y S T E M  U P T IＭＥ\`\n\n` +
                   `*_Tiempo de actividad_*\n` +
                   `\`Activo:\` *${hours}h ${minutes}m ${seconds}s*\n\n` +
                   `> _System remains online._`;

        await socket.sendMessage(from, { text: text }, { quoted: m });
    }
};

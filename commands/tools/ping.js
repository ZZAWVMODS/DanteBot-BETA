module.exports = {
    name: "ping",
    aliases: ["p"],
    run: async (socket, m, { from }) => {
        const start = Date.now();
        
        const { key } = await socket.sendMessage(from, { text: "..." }, { quoted: m });
        
        const latencia = Date.now() - start;

        await socket.sendMessage(from, { 
            text: `*➪ 𝐏𝐎𝐍𝐆:* \`${latencia}ms\``, 
            edit: key 
        });
    }
};

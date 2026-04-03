const fs = require('fs');

module.exports = async (socket, { id, participants, action }) => {
    try {
        
        if (action !== 'add' && action !== 'remove') return;
        
        const dbPath = './database.json';
        if (!fs.existsSync(dbPath)) return;
        
        let database = JSON.parse(fs.readFileSync(dbPath));
        if (!database.welcome || !Array.isArray(database.welcome) || !database.welcome.includes(id)) return;

        const metadata = await socket.groupMetadata(id);
        
        for (let participant of participants) {
            let jid = typeof participant === 'string' ? participant : (participant?.id || null);
            if (!jid) continue;

          
            const participantInGroup = metadata.participants.find(p => p.id === jid);
            
            
            if (action === 'add' && !participantInGroup) continue; 
            if (action === 'remove' && participantInGroup) continue; 
            let profile;
            try {
                profile = await socket.profilePictureUrl(jid, 'image');
            } catch {
                profile = 'https://cdn.russellxz.click/78d24d4b.jpeg'; 
            }

            let welcomeMsg = `\`\`\`☆ W E L C O M E  ☆\`\`\`\n\n` +
                             `◈ 𝗨𝘀𝘂𝗮𝗿𝗶𝗼: @${jid.split('@')[0]}\n` +
                             `◈ 𝗚𝗿𝘂𝗽𝗼: ${metadata.subject}\n\n` +
                             `◈ 𝗗𝗲𝘀𝗰𝗿𝗶𝗽𝗰𝗶ó𝗻:\n` +
                             `\`\`\`${metadata.desc?.toString() || 'Sin descripción'}\`\`\`\n\n` +
                             `*“Bienvenido a la unidad. Mantén un comportamiento adecuado y sigue los protocolos establecidos.”*\n\n` +
                             `\`\`\`Status: Active Member\`\`\``;

            let leaveMsg = `\`\`\`☆ G O O D  B Y E ☆\`\`\`\n\n` +
                           `◈ 𝗨𝘀𝘂𝗮𝗿𝗶𝗼: @${jid.split('@')[0]}\n` +
                           `◈ 𝗚𝗿𝘂𝗽𝗼: ${metadata.subject}\n` +
                           `◈ 𝗘𝘀𝘁𝗮𝗱𝗼: _Desvinculado_\n\n` +
                           `*“El usuario ha sido removido de los registros del grupo.”*\n\n` +
                           `\`\`\`Status: Disconnected\`\`\``;

            const isAdd = action === 'add';
            const caption = isAdd ? welcomeMsg : leaveMsg;

            try {
                await socket.sendMessage(id, {
                    image: { url: profile },
                    caption: caption,
                    mentions: [jid]
                });
            } catch (mediaErr) {
                await socket.sendMessage(id, {
                    text: caption,
                    mentions: [jid]
                });
            }
        }
    } catch (err) {
        console.error("[DEBUG] Error en groupHandler:", err);
    }
};

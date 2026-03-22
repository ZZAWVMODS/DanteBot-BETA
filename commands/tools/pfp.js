const config = require('../../config');

module.exports = {
    name: "pfp",
    aliases: ["foto", "profilepic", "avatar", "fotoperfil"],
    category: "tools",
    description: "Obtiene la foto de perfil de un usuario",

    run: async (socket, m, { args, from, sender, isGroup }) => {
        try {
            // Determinar de quién obtener la foto
            let targetJid = sender;
            
            // Opción 1: Por número en argumentos
            if (args.length > 0) {
                let phoneNumber = args[0].replace(/\D/g, '');
                if (phoneNumber.length >= 10 && phoneNumber.length <= 15) {
                    targetJid = phoneNumber + '@s.whatsapp.net';
                } else {
                    return await socket.sendMessage(from, { 
                        text: `*[!] Número Inválido*\n\n> \`${args[0]}\` no es un número válido.\n> Ejemplo: \`50496228919\``
                    }, { quoted: m });
                }
            }
            
            // Opción 2: Por mención
            const mentioned = m.message?.extendedTextMessage?.contextInfo?.mentionedJid;
            if (mentioned && mentioned.length > 0) {
                targetJid = mentioned[0];
            }
            
            // Opción 3: Por reply
            const replyJid = m.message?.extendedTextMessage?.contextInfo?.participant;
            if (replyJid) {
                targetJid = replyJid;
            }

            await socket.sendMessage(from, { react: { text: "🕑", key: m.key } });

            // Intentar obtener foto de perfil
            let profilePicUrl = null;
            
            try {
                profilePicUrl = await socket.profilePictureUrl(targetJid, 'image');
            } catch (e) {
                // Si falla con el JID original, intentar con número limpio
                try {
                    let phoneNumber = targetJid.split('@')[0];
                    if (phoneNumber.includes(':')) phoneNumber = phoneNumber.split(':')[0];
                    phoneNumber = phoneNumber.replace(/\D/g, '');
                    
                    const cleanJid = phoneNumber + '@s.whatsapp.net';
                    profilePicUrl = await socket.profilePictureUrl(cleanJid, 'image');
                } catch (e2) {
                    profilePicUrl = null;
                }
            }

            if (!profilePicUrl) {
                await socket.sendMessage(from, { react: { text: "✖️", key: m.key } });
                return await socket.sendMessage(from, { 
                    text: `*[!] Sin Foto*\n\n> El usuario no tiene foto de perfil o es privada.`
                }, { quoted: m });
            }

            await socket.sendMessage(from, { react: { text: "✔️", key: m.key } });

            // Enviar SOLO la foto, sin caption ni información
            await socket.sendMessage(from, {
                image: { url: profilePicUrl },
                caption: "" // Vacío para que solo se vea la foto
            }, { quoted: m });

        } catch (error) {
            console.error('Error en comando pfp:', error);
            await socket.sendMessage(from, { 
                text: `*[!] Error*\n\n> No se pudo obtener la foto.`
            }, { quoted: m });
        }
    }
};
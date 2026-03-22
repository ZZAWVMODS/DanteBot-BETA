module.exports = {
    name: "owner",
    aliases: ["creador", "contacto", "dueño"],
    category: "main",
    run: async (socket, m, { from }) => {
        
        const numero = '50496228919';
        const nombre = 'ZzawX';

        // VCard con campo N obligatorio para que aparezca el botón
        const vcard = 'BEGIN:VCARD\n' +
                      'VERSION:3.0\n' +
                      `FN:${nombre}\n` +
                      `N:${nombre};;;\n` + // Campo obligatorio para el botón
                      `TEL;type=CELL;type=VOICE;waid=${numero}:+${numero}\n` +
                      'END:VCARD';

        // Enviamos la tarjeta de contacto
        await socket.sendMessage(from, { 
            contacts: { 
                displayName: nombre, 
                contacts: [{ vcard }] 
            }
        }, { quoted: m });
    }
};
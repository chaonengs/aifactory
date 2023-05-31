import http from 'http';
import * as lark from '@larksuiteoapi/node-sdk';

const eventDispatcher = new lark.EventDispatcher({
    encryptKey: 'encrypt key'
}).register({
    'im.message.receive_v1': async (data) => {
        const chatId = data.message.chat_id;

        const res = await client.im.message.create({
            params: {
                receive_id_type: 'chat_id',
            },
            data: {
                receive_id: chatId,
                content: JSON.stringify({text: 'hello world'}),
                msg_type: 'text'
            },
        });
        return res;
    }
});

const server = http.createServer();
server.on('request', lark.adaptDefault('/webhook/event', eventDispatcher));
server.listen(3000);
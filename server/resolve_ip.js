const dns = require('dns');
const host = 'db.cdiwjdsycvhbhhnqajxj.supabase.co';

dns.setServers(['8.8.8.8', '8.8.4.4']);

dns.resolve4(host, (err, addresses) => {
    if (err) {
        console.error('[ERROR]', err);
    } else {
        console.log('[SUCCESS]', addresses);
    }
});

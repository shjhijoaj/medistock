const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { openInventory, InventoryError } = require('./inventory.cjs');
const root = path.resolve(__dirname, '..');
const inventory = openInventory(process.env.MEDISTOCK_DB || path.join(root, 'data', 'medistock.sqlite'));
const port = Number(process.env.PORT || 4313);
function json(res, status, data) { res.writeHead(status, { 'Content-Type':'application/json; charset=utf-8', 'Cache-Control':'no-store', 'X-Content-Type-Options':'nosniff' }); res.end(JSON.stringify(data)); }
async function body(req) { req.setEncoding('utf8'); let content = ''; for await (const chunk of req) { content += chunk; if (Buffer.byteLength(content,'utf8') > 5 * 1024 * 1024) throw new InventoryError('文件超过 5 MB 限制',413); } try { const value = JSON.parse(content); if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error(); return value; } catch { throw new InventoryError('JSON 必须是有效对象'); } }
const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://127.0.0.1:${port}`);
    if (url.pathname.startsWith('/api')) {
      if (req.method !== 'GET' && req.headers.origin) { const origin = new URL(req.headers.origin); if (!['127.0.0.1','localhost'].includes(origin.hostname) || !['4313','5175',String(port)].includes(origin.port)) throw new InventoryError('仅允许本机工作台请求',403); }
      if (req.method === 'GET' && url.pathname === '/api/snapshot') return json(res,200,inventory.snapshot());
      if (req.method === 'GET' && url.pathname === '/api/backup') return json(res,200,inventory.backup());
      if (req.method === 'POST' && url.pathname === '/api/restore') return json(res,200,inventory.restore(await body(req)));
      if (req.method === 'POST' && /^\/api\/(inbound|outbound)$/.test(url.pathname)) return json(res,200,inventory.submit(url.pathname.slice(5), await body(req)));
      const match = url.pathname.match(/^\/api\/(medicines|suppliers)(?:\/(\d+))?$/);
      if (match) {
        const [,kind,id] = match;
        if (req.method === 'POST' || req.method === 'PUT') return json(res,200,inventory[kind === 'medicines'?'saveMedicine':'saveSupplier'](await body(req),id?Number(id):undefined));
        if (req.method === 'DELETE' && id) return json(res,200,inventory.remove(kind,Number(id)));
      }
      return json(res,404,{error:'接口不存在'});
    }
    if (!['GET','HEAD'].includes(req.method)) return json(res,405,{error:'方法不允许'});
    let relative = decodeURIComponent(url.pathname), filename = path.resolve(root,'dist','.'+relative);
    const dist = path.join(root,'dist');
    if (filename !== dist && !filename.startsWith(dist+path.sep)) return json(res,403,{error:'路径无效'});
    if (relative === '/' || !fs.existsSync(filename)) filename = path.join(dist,'index.html');
    if (!fs.existsSync(filename)) return json(res,503,{error:'请先运行 npm run build'});
    if (!fs.statSync(filename).isFile()) return json(res,404,{error:'文件不存在'});
    const ext = path.extname(filename), mime = {'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.woff':'font/woff','.ttf':'font/ttf','.png':'image/png'};
    res.writeHead(200,{'Content-Type':mime[ext]||'application/octet-stream','X-Content-Type-Options':'nosniff','Cache-Control':ext==='.html'?'no-cache':'public, max-age=3600'});
    if (req.method === 'HEAD') return res.end();
    const stream = fs.createReadStream(filename); stream.on('error',()=>res.destroy()); stream.pipe(res);
  } catch (error) { const duplicate = /UNIQUE constraint failed/.test(error.message); json(res,error.status || (duplicate?409:500),{error:duplicate?'档案名称 / 规格或批号重复':error instanceof InventoryError?error.message:'保存失败，数据未修改，请重试'}); if (!(error instanceof InventoryError) && !duplicate) console.error(error); }
});
server.listen(port,'127.0.0.1',()=>console.log(`MediStock 已启动：http://127.0.0.1:${port}\nSQLite：${process.env.MEDISTOCK_DB || path.join(root,'data','medistock.sqlite')}\nCtrl+C 停止服务`));
process.on('SIGINT',()=>server.close(()=>{inventory.close();process.exit(0)}));
